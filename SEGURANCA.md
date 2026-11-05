# Segurança do site da Expresso Conveniência

Revisão de segurança feita em 26/10/2026. Cobre o site (React na Vercel), o banco de mesas (Supabase) e o painel da loja. Cada item abaixo diz o que foi verificado, o que estava errado, o que foi corrigido e como isso é testado.

O teste de invasão foi feito em duas fases:

1. **Fase 1.** O sistema de mesas, como estava, foi atacado num Postgres local que imita o Supabase.
2. **Fase 2.** Depois das correções, o ataque foi repetido de ponta a ponta. Os ataques do banco viraram testes automáticos (`npm run test:sql`), que rodam a cada mudança.

## Resultado do teste de invasão

| Gravidade | Achado na fase 1 | Correção | Fase 2 |
|---|---|---|---|
| Alto | Um anônimo, de casa, ocupou 59 de 59 mesas em segundos (negação de serviço) | Chave secreta por mesa dentro do QR Code; sem ela, ninguém ocupa nem entra na mesa | 240 tentativas sem chave e 500 chaves aleatórias: nenhuma passou |
| Médio | De longe, dava para travar a mesa de outro grupo errando o código 8 vezes | Tentativas de código também exigem a chave do QR | 20 tentativas sem chave não contaram; o amigo com o código certo entrou |
| Médio | Token do celular guardado em texto puro: um backup vazado daria acesso às mesas | Tokens e chaves guardados só como hash SHA-256; cada celular tem o próprio token | Varredura do banco inteiro não achou nenhum segredo em texto |
| Médio | Painel protegido só por senha | Segunda etapa obrigatória com app autenticador (TOTP); o banco recusa login sem ela | Senha certa sem o app: HTTP 403 |
| Médio | Site podia ser aberto dentro de outro site (clickjacking) e não tinha CSP | Cabeçalhos de segurança no `vercel.json` | Iframes bloqueados; CSP sem nenhuma violação no uso normal |
| Baixo | Código da mesa gerado com `random()`, que não é criptográfico | Gerador criptográfico (`gen_random_uuid`) | 3.000 códigos gerados, sem `random()` no banco |
| Baixo | Entrada sem limite de tamanho (5 MB aceitos) | Formato conferido antes de qualquer consulta | Entrada de 5 MB recusada na hora |
| Baixo | `search_path` das funções não estava vazio | `search_path = ''` e nomes completos em tudo | Conferido em todas as funções |
| Baixo | Funções rodavam como dono do banco (privilégio demais) | Papel próprio `mesas_sistema`, que não é superusuário e não lê a tabela da equipe | Conferido o dono de cada função |
| Baixo | Chave da mesa iria no endereço normal e ficaria nos logs de acesso | Chave vai depois do `#`, que o navegador nunca envia ao servidor | Chave some do endereço ao abrir a página |

O que já resistia na fase 1: as 4 injeções de SQL, o acesso direto às tabelas (10 tentativas) e as tentativas de escalação de privilégio. Continuam testados.

## Os 20 itens

**1. SQL injection.** O site nunca monta SQL. Ele chama funções do banco com parâmetros tipados, e as funções não usam SQL dinâmico (`execute`). Testado com 5 cargas em todos os parâmetros de texto, e um número de mesa com texto é recusado pelo próprio tipo. Nenhuma passou e as tabelas ficaram intactas.

**2. XSS.** O React escapa tudo o que mostra. O site não usa `innerHTML`, `dangerouslySetInnerHTML` nem `eval`, e a CSP só aceita scripts do próprio domínio, sem `unsafe-inline`. O número da mesa e a chave que vêm do endereço só valem se tiverem o formato exato. O que fica salvo no celular (mesa, sacola e login do painel) é conferido ao ler, porque pode ter sido alterado à mão. Testado:
- injeção pelo endereço;
- mesa e sacola adulteradas no aparelho;
- login falso salvo no aparelho.

Nada foi executado.

**3. CSRF.** Não se aplica. O site não usa cookies de login: o painel manda o token num cabeçalho (`Authorization`), que outro site não consegue enviar no lugar da pessoa. O `form-action 'self'` da CSP impede formulários de enviarem dados para fora.

**4. Autenticação e autorização.** Os clientes não têm conta: a prova de que estão na mesa é a chave do QR mais o token do celular. A equipe entra com senha e app autenticador. Cada função do painel confere, no banco, se o usuário está na tabela `equipe` e se o login tem as duas etapas (`aal2`). O cadastro público fica desligado no Supabase. Ao sair do painel, o login é encerrado também no servidor.

**5. Criptografia simétrica.** Está no HTTPS (AES-GCM ou ChaCha20, negociados pelo TLS) e no disco do Supabase (AES-256). A assinatura dos tokens de login usa HMAC, uma chave secreta que só o Supabase tem. Um token forjado foi recusado com HTTP 401.

**6. Criptografia assimétrica.** Está no TLS: o certificado e a troca de chaves (ECDHE) garantem que o site é ele mesmo. Os certificados são da Vercel e do Supabase, renovados automaticamente.

**7. Hash e salt.**
- **Senha da equipe:** o Supabase guarda só como bcrypt, que já usa salt.
- **Chaves do QR e tokens dos celulares:** ficam como SHA-256. Eles não precisam de salt porque são aleatórios e longos (122 bits): não existe tabela pronta nem dicionário para eles.
- **Código de 4 números:** fica em texto, de propósito, porque a equipe precisa vê-lo no painel para conferir os pedidos. Ele só vale junto com a chave da mesa e trava depois de 8 erros.

**8. HTTPS e TLS.**
- **Site:** a Vercel serve tudo em HTTPS, e o `Strict-Transport-Security` (HSTS, 2 anos) obriga o navegador a nunca usar http.
- **Banco:** o site se recusa a ligar o sistema de mesas se a URL do Supabase não for `https://`.

**9. OWASP Top 10.**
- **A01 (controle de acesso):** RLS, `revoke` e o papel `mesas_sistema`.
- **A02 (falhas de criptografia):** itens 5 a 8.
- **A03 (injeção):** itens 1 e 2.
- **A04 (design inseguro):** a chave do QR e o limite de tentativas.
- **A05 (configuração):** cabeçalhos e passos de instalação.
- **A06 (componentes vulneráveis):** item 16.
- **A07 (autenticação):** item 4.
- **A08 (integridade):** `npm ci` com lockfile e hashes, e nenhum script de CDN.
- **A09 (registro e monitoramento):** item 19.
- **A10 (SSRF):** não se aplica, porque o servidor nunca busca endereços informados por alguém.

**10. Pentest.** São duas camadas:
- **Banco:** `supabase/testes/seguranca.test.mjs` tem 21 testes, 14 deles de ataque. Para confirmar que os testes pegam falhas reais, foram plantadas 3 falhas no SQL de propósito: anon lendo a tabela, painel sem o app autenticador e chave do QR ignorada. Os testes pegaram as 3.
- **Site:** os ataques no navegador (XSS, adulteração, token forjado e clickjacking) foram feitos à mão. Para repetir, veja "Antes de publicar".

**11. Engenharia social.** O alvo mais provável é a equipe, não o código. Regras para a loja:
- **Senha e código do app:** ninguém da loja, nem "o suporte do site", pede a senha ou o código do app por telefone, WhatsApp ou e-mail. O painel avisa isso na tela de entrar.
- **Código da mesa:** não diga o código de uma mesa para quem perguntar. Quem está na mesa vê o código no próprio celular.
- **Liberar mesa:** só libere uma mesa olhando para ela.

**12. Phishing.** O golpe mais comum em cardápio por QR é colar um QR falso por cima do verdadeiro, levando para um site que pede pagamento. Proteções:
- o cartão impresso mostra o domínio embaixo do QR;
- o site avisa, na sacola, nas dúvidas e na política, que nunca pede pagamento, cartão, Pix ou senha;
- um QR falso ou antigo cai na tela "Este QR Code não é válido";
- muitos QR inválidos seguidos aparecem nos alertas do painel.

A equipe deve conferir os cartões das mesas todo dia.

**13. Zero trust.** Nada que vem do celular é aceito sem conferência:
- o banco confere a chave, o token e o login a cada chamada;
- a sacola confere se a mesa ainda está ocupada antes de enviar;
- o que fica salvo no aparelho é validado ao ler;
- o painel não confia no que o próprio navegador diz sobre o login. Quem decide é o banco.

**14. Menor privilégio.**
- **Visitante:** só executa 4 funções.
- **Equipe:** só executa mais 5.
- **Tabelas:** ninguém lê nem escreve direto.
- **Funções:** rodam como `mesas_sistema`, que não é superusuário, não ignora o RLS, não faz login e não lê a tabela da equipe.
- **Site:** só pode falar com o próprio domínio e com o Supabase (CSP), e o navegador nega câmera, microfone, localização e pagamento (`Permissions-Policy`).
- **Pipeline automático:** só tem permissão de leitura do repositório.

**15. Escalação de privilégio.** Testado:
- visitante e logado chamando as 10 funções internas;
- logado de fora da equipe usando o painel;
- equipe só com senha usando o painel;
- qualquer um se inserindo na tabela `equipe`.

Tudo foi negado. As funções com `security definer` têm `search_path` vazio, então ninguém consegue trocar uma tabela por outra de mesmo nome.

**16. Vulnerabilidades e CVEs.** O `npm audit` encontrou 0 vulnerabilidades. As dependências estão com versão fixa (`package-lock.json` com hash de cada pacote), e todas vêm do registro oficial do npm. O pipeline roda o `npm audit` a cada mudança e toda segunda-feira, e o Dependabot abre pedidos de atualização quando sai correção.

**17. Análise de malware.** O site não recebe arquivos, então o risco de malware está nas dependências. Verificado:
- **Lockfile:** dos 68 pacotes, só o `fsevents` (do macOS, usado pelo Vite) roda script na instalação.
- **Bundle final:** só se comunica com os domínios esperados.
- **`qrcode-generator`, adicionado agora:** foi lido antes de entrar. Não tem dependências, não acessa a rede, não usa `eval` e não lê armazenamento. Ele só é baixado no painel, quando a loja gera um QR.

**18. Segurança de APIs.**
- **Superfície:** são só as funções do Supabase, e todas conferem o formato da entrada.
- **Erros:** as funções respondem com status simples, sem detalhes internos.
- **Chave pública:** é feita para ficar no site e não dá acesso a nada além dessas funções. A chave secreta (`service_role`) nunca entra no site.
- **Ataque em massa:** sem a chave do QR, não adianta. As tentativas inválidas ficam registradas, até 200 a cada 10 minutos, para um ataque não encher o banco de registros.

**19. SIEM.** O tamanho da loja não justifica um SIEM pago. No lugar dele:
- a tabela `eventos` registra, sem dados pessoais, QR inválido, código errado, mesa travada, mesa liberada e QR gerado;
- os registros ficam 30 dias;
- o painel mostra os alertas das últimas 24 horas.

Se a loja crescer, o Supabase envia os logs para um SIEM nos planos pagos (log drains).

**20. DevSecOps.** O arquivo `.github/workflows/seguranca.yml` roda, a cada push e toda segunda:
- `npm ci`;
- `npm audit`;
- lint;
- os ataques automáticos ao banco;
- o build.

Localmente, `npm run seguranca` faz o mesmo. Se algo falhar, não publique.

## Antes de publicar

- [ ] Supabase: cadastro público desligado; usuário da loja com senha de 16+ caracteres; entrar no `/painel` logo depois para cadastrar o app autenticador
- [ ] Supabase, em Authentication: baixar a validade do token (JWT expiry) para 900 segundos. Ao sair do painel, o login é encerrado no servidor, mas um token já emitido continua válido até vencer.
- [ ] Gerar e imprimir os QR Codes pelo painel; conferir o domínio impresso no cartão
- [ ] Na Vercel: domínio próprio com HTTPS; variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` cadastradas
- [ ] Se o Supabase usar domínio próprio (não `*.supabase.co`), acrescentar esse domínio em `connect-src` no `vercel.json`
- [ ] Depois de publicar, conferir os cabeçalhos em securityheaders.com
- [ ] Colocar o projeto no GitHub para o pipeline e o Dependabot começarem a rodar

## Riscos que continuam (aceitos)

- **Foto do QR Code:** quem fotografar o QR de uma mesa consegue ocupá-la de fora da loja, até alguém da loja liberar. Mitigações: alertas no painel, liberação em um toque e "Gerar novo" QR, que invalida o antigo na hora.
- **Mensagem do pedido:** o cliente pode editar o texto no WhatsApp antes de enviar, inclusive os preços. Quem atende confere o código da mesa no painel e cobra pelos preços do cardápio, não pelos da mensagem.
- **Ações do GitHub:** o pipeline usa as versões `@v4` das ações oficiais. Para travar de vez, troque pela versão com o hash do commit.
- **Login do painel:** fica salvo no navegador do aparelho da loja. Um aparelho emprestado precisa sair do painel antes.

## Se algo acontecer

1. **Golpe ou mesas ocupadas sem ninguém:** libere as mesas no painel e gere QR novos para as mesas afetadas.
2. **Senha do painel vazou:** troque a senha no Supabase (Authentication > Users). Em seguida, remova e cadastre de novo o app autenticador.
3. **Suspeita de acesso ao banco:** troque as chaves em Project Settings > API Keys, atualize as variáveis na Vercel e gere QR novos para todas as mesas.
4. **Dados pessoais vazaram:** a LGPD exige avisar a ANPD e os afetados (art. 48). O sistema de mesas não guarda dados pessoais; a conversa do WhatsApp fica no celular da loja.
