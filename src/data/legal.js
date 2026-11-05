import { site } from './site'
import { formatarTelefone } from '../lib/formato'

// Textos da política de privacidade e dos termos de uso.
// Escritos para o que o site faz hoje: sacola e último pedido salvos no navegador, mesa confirmada no
// servidor (Supabase, sem dados pessoais), pedido enviado pelo WhatsApp, sem cadastro,
// sem pagamento online e sem ferramentas de rastreamento.
// Se o site passar a coletar mais dados (login, analytics, pagamento), atualize aqui.
// TODO: pedir para um advogado revisar antes de publicar.

const ATUALIZADO = '27 de outubro de 2026'

const empresa = [
  site.razaoSocial ?? site.nome,
  site.cnpj && `CNPJ ${site.cnpj}`,
  `${site.endereco}`,
]
  .filter(Boolean)
  .join(', ')

const canais = [
  'no balcão da loja',
  site.whatsapp && `pelo WhatsApp ${formatarTelefone(site.whatsapp)}`,
  site.email && `pelo e-mail ${site.email}`,
].filter(Boolean)

const contato = canais.length > 1 ? `${canais.slice(0, -1).join(', ')} ou ${canais.at(-1)}` : canais[0]

export const privacidade = {
  caminho: '/privacidade',
  titulo: 'Política de privacidade',
  atualizado: ATUALIZADO,
  resumo: [
    'O site não tem cadastro, login nem pagamento online.',
    'A sacola e o seu último pedido ficam salvos só no seu celular. A gente só recebe o pedido quando você envia pelo WhatsApp.',
    'Ao confirmar a mesa, o servidor guarda só o número da mesa, um código e os horários. Nada de nome ou telefone.',
    'Nome e observação são opcionais. A confirmação de 18 anos não é guardada.',
    'Não usamos cookies de publicidade nem ferramentas de rastreamento, e não vendemos dados.',
  ],
  secoes: [
    {
      id: 'quem-somos',
      titulo: 'Quem somos',
      paragrafos: [
        `Este site pertence à ${empresa}. Somos a responsável (controladora) pelos dados pessoais tratados por meio dele, nos termos da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, a LGPD).`,
        'Esta política explica quais dados o site usa, para quê, com quem eles são compartilhados e como você pode exercer os seus direitos.',
      ],
    },
    {
      id: 'dados',
      titulo: 'Quais dados o site usa',
      lista: [
        'Itens da sacola: ficam salvos apenas no navegador do seu aparelho (armazenamento local), para a sacola não se perder se a página recarregar. Essa informação não é enviada para a loja até você mandar o pedido.',
        'Último pedido: depois que você envia um pedido, os itens, as opções e as quantidades dele ficam salvos no navegador do seu aparelho, para o botão "Pedir de novo" do cardápio. Não ficam salvos nome, mesa, observação nem preços, e essa informação não é enviada para a loja.',
        'Confirmação de mesa: ao confirmar a mesa, o nosso servidor registra o número da mesa, um código de 4 números gerado na hora e os horários da confirmação e do último pedido. O seu celular guarda um identificador aleatório que mostra que você está nessa mesa. Esse registro não tem nome, telefone nem os itens do pedido, e serve para a mesa não ser confundida com outra. O servidor guarda o identificador do celular só embaralhado (hash), nunca em texto.',
        'Registros de segurança: tentativas com QR Code inválido, códigos de mesa errados e liberações de mesa ficam registrados com o número da mesa e o horário, sem dados pessoais, para a loja perceber golpes e abusos.',
        'Nome e observação: você preenche na sacola. O nome e a observação são opcionais. Esses dados entram no texto do pedido e só chegam até a loja quando você envia a mensagem pelo WhatsApp.',
        'Número de WhatsApp: quando você envia o pedido, a loja passa a ver o seu número e o seu nome de perfil no WhatsApp, como em qualquer conversa.',
        'Confirmação de idade: a caixa "Tenho 18 anos ou mais" serve apenas para liberar o envio de pedidos com bebida alcoólica. Ela não é salva nem enviada.',
        'Dados técnicos de acesso: como em qualquer site, o serviço de hospedagem registra informações como endereço IP, data e hora do acesso e tipo de navegador, para manter o site funcionando e seguro.',
      ],
    },
    {
      id: 'nao-fazemos',
      titulo: 'O que o site não faz',
      paragrafos: [
        'O site não tem cadastro nem login, não pede CPF, endereço ou dados de cartão, não usa cookies de publicidade e não tem ferramentas de rastreamento ou estatísticas de visitas.',
        'Não vendemos, alugamos nem cedemos dados pessoais para ninguém.',
      ],
    },
    {
      id: 'finalidades',
      titulo: 'Para que usamos os dados',
      lista: [
        'Preparar o seu pedido e entregá-lo na mesa certa (base legal: execução de contrato, art. 7º, V, da LGPD).',
        'Falar com você sobre o pedido pelo WhatsApp, por exemplo para avisar que um item acabou (execução de contrato).',
        'Cumprir obrigações legais, como não vender bebida alcoólica para menores de 18 anos (cumprimento de obrigação legal, art. 7º, II).',
        'Manter o site seguro e funcionando, com os registros técnicos de acesso (legítimo interesse, art. 7º, IX).',
      ],
    },
    {
      id: 'terceiros',
      titulo: 'Serviços de terceiros',
      paragrafos: [
        'Alguns serviços externos fazem parte do funcionamento do site. Cada um tem a sua própria política de privacidade:',
      ],
      lista: [
        'WhatsApp (Meta): é por onde o pedido é enviado. A conversa segue as regras do próprio WhatsApp.',
        'Supabase: guarda o registro de mesas ocupadas descrito acima.',
        'Google Fonts (Google): fornece as fontes do site. Ao carregar a página, o seu navegador se conecta aos servidores do Google, que podem receber o seu endereço IP.',
        'Google Maps e avaliações (Google): usados apenas quando você toca em "Abrir no mapa" ou em "Avaliar no Google".',
        'Hospedagem: a empresa que mantém o site no ar recebe os registros técnicos de acesso descritos acima.',
      ],
    },
    {
      id: 'retencao',
      titulo: 'Por quanto tempo os dados ficam guardados',
      lista: [
        'Sacola: fica no seu navegador até você esvaziá-la, começar um novo pedido ou limpar os dados do navegador.',
        'Último pedido: apagado do seu navegador 12 horas depois do envio, ou antes, quando você toca no X do cartão "Mais uma rodada?" ou limpa os dados do navegador.',
        'Registro da mesa: vale enquanto a mesa está ocupada e termina quando a loja libera a mesa ou depois de 3 horas sem pedido. Depois disso, é apagado automaticamente em até 30 dias.',
        'Registros de segurança: apagados automaticamente depois de 30 dias.',
        'Conversa do pedido: fica no WhatsApp da loja pelo tempo necessário para o atendimento e para resolver dúvidas sobre o pedido. Você pode pedir a exclusão a qualquer momento.',
        'Registros técnicos de acesso: pelo prazo definido pelo serviço de hospedagem, respeitando o mínimo de 6 meses exigido pelo Marco Civil da Internet (Lei nº 12.965/2014, art. 15).',
      ],
    },
    {
      id: 'direitos',
      titulo: 'Os seus direitos',
      paragrafos: ['Pela LGPD (art. 18), você pode pedir a qualquer momento:'],
      lista: [
        'confirmação de que tratamos dados seus e acesso a eles;',
        'correção de dados incompletos, inexatos ou desatualizados;',
        'exclusão dos dados, inclusive da conversa do pedido;',
        'informação sobre com quem os dados foram compartilhados;',
        'revogação do consentimento, quando ele for a base do tratamento.',
      ],
      depois: [
        `Para fazer um pedido desses, fale com a gente ${contato}. Se não ficar satisfeito com a resposta, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
      ],
    },
    {
      id: 'menores',
      titulo: 'Menores de idade',
      paragrafos: [
        'A venda de bebidas alcoólicas é proibida para menores de 18 anos. O site pede essa confirmação antes do envio, e o atendente pode pedir um documento com foto na entrega. Pedidos sem bebida alcoólica podem ser feitos por qualquer pessoa.',
      ],
    },
    {
      id: 'seguranca',
      titulo: 'Segurança',
      paragrafos: [
        'O site funciona com conexão criptografada (HTTPS) e foi feito para usar o mínimo de dados possível: sem cadastro, sem senha e sem dados de pagamento, não há esse tipo de informação para vazar.',
        'Cada mesa só é confirmada pelo QR Code dela, que tem uma chave secreta. O painel da loja exige senha e um código de um app autenticador, e só a equipe da loja tem acesso a ele.',
        'O site nunca pede pagamento, cartão, Pix ou senha. Se uma página aberta por um QR Code pedir isso, ela não é nossa: não continue e avise um atendente.',
      ],
    },
    {
      id: 'mudancas',
      titulo: 'Mudanças nesta política',
      paragrafos: [
        'Se o site mudar a forma de usar dados, esta página será atualizada e a data no topo vai mudar. Mudanças importantes também serão avisadas no próprio site.',
      ],
    },
    {
      id: 'contato',
      titulo: 'Contato',
      paragrafos: [`Dúvidas sobre esta política ou sobre os seus dados: fale com a gente ${contato}.`],
    },
  ],
}

export const termos = {
  caminho: '/termos',
  titulo: 'Termos de uso',
  atualizado: ATUALIZADO,
  resumo: [
    'O site mostra o cardápio e monta o pedido. O pedido só vale depois que a loja confirmar.',
    'Preços e itens podem mudar. Vale o preço confirmado pela loja no momento do pedido.',
    'Bebida alcoólica só para maiores de 18 anos, com documento se o atendente pedir.',
    'O pagamento é feito no balcão. O site não cobra nada.',
  ],
  secoes: [
    {
      id: 'sobre',
      titulo: 'Sobre estes termos',
      paragrafos: [
        `Estes termos valem para o uso do site da ${empresa}. Ao usar o site para ver o cardápio ou enviar um pedido, você concorda com eles. Se não concordar, você pode fazer o pedido direto no balcão.`,
      ],
    },
    {
      id: 'o-site',
      titulo: 'O que o site faz',
      paragrafos: [
        'O site é um cardápio digital. Ele permite ver os produtos e preços, confirmar a mesa em que você está, montar uma sacola e enviar o pedido para a loja pelo WhatsApp, com o número e o código da mesa.',
        'O site não processa pagamentos, não tem cadastro e, por enquanto, não tem aplicativo. Ele funciona direto no navegador.',
      ],
    },
    {
      id: 'precos',
      titulo: 'Preços, fotos e disponibilidade',
      lista: [
        'Os preços estão em reais e podem mudar sem aviso prévio. Vale o preço do cardápio no momento em que a loja confirma o pedido.',
        'Se houver um erro evidente de preço no site, a loja avisa antes de preparar o pedido, e você decide se mantém ou cancela.',
        'As fotos são ilustrativas. Marcas, embalagens e apresentação podem variar.',
        'Os itens dependem do estoque. Se algo acabar, a loja avisa pelo WhatsApp ou na mesa e você pode trocar ou retirar o item.',
      ],
    },
    {
      id: 'pedido',
      titulo: 'Como o pedido é confirmado',
      lista: [
        'Enviar a mensagem pelo WhatsApp não garante o pedido. Ele só está confirmado quando a loja responde ou o atendente confirma na mesa.',
        'O pedido pelo site é para consumo na loja. Confirme apenas a mesa em que você está sentado. Se ela já estiver ocupada, você só entra nela com o código de quem chegou primeiro.',
        'Pedidos com mesa errada ou com código que não confere podem atrasar ou não ser atendidos. A loja pode liberar uma mesa a qualquer momento, por exemplo quando o grupo vai embora.',
        'A loja pode recusar pedidos fora do horário de funcionamento, pedidos que não consegue identificar e pedidos que pareçam falsos.',
      ],
    },
    {
      id: 'alcool',
      titulo: 'Bebidas alcoólicas',
      paragrafos: [
        'É proibido vender, fornecer ou entregar bebida alcoólica a menores de 18 anos (Estatuto da Criança e do Adolescente, Lei nº 8.069/1990, art. 243). Ao marcar a confirmação de idade, você declara ter 18 anos ou mais.',
        'O atendente pode pedir um documento oficial com foto na entrega e deve recusar a entrega se a idade não for comprovada. Nesse caso, os itens com álcool são retirados do pedido.',
      ],
    },
    {
      id: 'pagamento',
      titulo: 'Pagamento',
      // TODO: confirmar com a loja as formas de pagamento aceitas
      paragrafos: [
        'O pagamento é feito no balcão da loja, por Pix, cartão ou dinheiro. O site não cobra nenhuma taxa pelo uso.',
      ],
    },
    {
      id: 'cancelamento',
      titulo: 'Cancelamento e problemas com o pedido',
      lista: [
        'Você pode cancelar um item ou o pedido inteiro enquanto ele ainda não foi preparado, falando com o atendente ou respondendo no WhatsApp.',
        'Se algum item chegar errado ou com problema, avise na hora para a loja trocar ou corrigir.',
        'Nada nestes termos limita os seus direitos como consumidor pelo Código de Defesa do Consumidor (Lei nº 8.078/1990).',
      ],
    },
    {
      id: 'encomendas',
      titulo: 'Encomendas',
      paragrafos: [
        'Encomendas para festas e eventos são combinadas diretamente com a loja. Prazo, retirada e eventual pagamento antecipado são acertados na conversa e valem como o combinado entre as partes.',
      ],
    },
    {
      id: 'uso',
      titulo: 'Uso correto do site',
      paragrafos: ['Ao usar o site, você se compromete a não:'],
      lista: [
        'enviar pedidos falsos, trotes ou pedidos em nome de outra pessoa sem autorização;',
        'informar idade falsa para comprar bebida alcoólica;',
        'ocupar uma mesa em que não está ou tentar adivinhar o código de outra mesa;',
        'colar, trocar, copiar ou adulterar os QR Codes das mesas;',
        'tentar invadir, sobrecarregar ou alterar o funcionamento do site.',
      ],
    },
    {
      id: 'disponibilidade',
      titulo: 'Disponibilidade do site',
      paragrafos: [
        'O site pode ficar fora do ar por falta de internet, manutenção ou problemas do serviço de hospedagem ou do WhatsApp. Nesses casos, o atendimento continua normalmente no balcão.',
      ],
    },
    {
      id: 'propriedade',
      titulo: 'Marca e conteúdo',
      paragrafos: [
        `O nome ${site.nome}, a marca, as fotos e os textos do site pertencem à loja ou são usados com autorização. Não é permitido copiar esse conteúdo para uso comercial sem autorização.`,
      ],
    },
    {
      id: 'mudancas',
      titulo: 'Mudanças nestes termos',
      paragrafos: [
        'Estes termos podem ser atualizados. A versão em vigor é sempre a publicada nesta página, com a data de atualização no topo. Pedidos já confirmados seguem os termos da época em que foram feitos.',
      ],
    },
    {
      id: 'lei',
      titulo: 'Lei aplicável e foro',
      paragrafos: [
        `Estes termos seguem as leis do Brasil. Fica eleito o foro da comarca de ${site.cidade}, ${site.estado}, sem prejuízo do direito do consumidor de entrar com ação no foro do seu próprio domicílio.`,
      ],
    },
    {
      id: 'contato',
      titulo: 'Contato',
      paragrafos: [`Dúvidas sobre estes termos: fale com a gente ${contato}.`],
    },
  ],
}

export const documentos = [privacidade, termos]
