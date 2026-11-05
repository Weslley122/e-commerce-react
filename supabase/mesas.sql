-- Sistema de mesas da Expresso Conveniência
--
-- Como instalar (uma vez só):
--   1. Crie um projeto grátis em https://supabase.com
--   2. Em "Authentication" > "Sign In / Providers", desligue "Allow new users to sign up"
--      (assim ninguém de fora cria conta para tentar entrar no painel)
--   3. Em "Authentication" > "Users", clique em "Add user" e crie o login da loja.
--      Use uma senha longa (16 caracteres ou mais) que não seja usada em nenhum outro lugar.
--   4. Abra "SQL Editor", cole este arquivo inteiro e clique em "Run"
--   5. Ainda no "SQL Editor", rode (trocando o e-mail e o número de mesas):
--        insert into public.equipe (user_id)
--        select id from auth.users where email = 'loja@exemplo.com';
--
--        insert into public.mesas (numero)
--        select generate_series(1, 12) on conflict do nothing;
--   6. Em "Project Settings" > "API Keys", copie a URL do projeto e a chave pública
--      (publishable ou anon) para o arquivo .env.local do site (veja .env.example)
--   7. Entre no /painel do site LOGO EM SEGUIDA: o primeiro login pede para cadastrar
--      um app autenticador (Google Authenticator, Microsoft Authenticator...).
--      Não deixe para depois: quem entrar primeiro com a senha cadastra o próprio celular.
--   8. No painel, em "QR Codes das mesas", gere e imprima o QR Code de cada mesa.
--
-- Como funciona:
--   - Cada mesa tem uma chave secreta que só existe no QR Code impresso. Sem ela, ninguém
--     ocupa a mesa: quem está fora da loja não consegue travar as mesas.
--   - O primeiro celular que confirma a mesa ocupa a mesa e recebe um código de 4 números.
--     Quem chegar depois na mesma mesa só entra no grupo digitando esse código.
--   - A mesa volta a ficar livre quando a loja libera no painel (/painel) ou sozinha,
--     depois de 3 horas sem pedido.
--   - O site nunca lê as tabelas direto: tudo passa pelas funções abaixo, que rodam com
--     um papel próprio (mesas_sistema) que só mexe nas tabelas do sistema de mesas.
--   - Chaves das mesas e tokens dos celulares ficam guardados só como hash (SHA-256):
--     um backup vazado não permite ocupar mesas nem se passar por um cliente.
--   - Os eventos de segurança (QR inválido, código errado, mesa travada...) ficam
--     registrados por 30 dias e aparecem em "Alertas" no painel.
--
-- Pode rodar este arquivo de novo depois de mudar algo: ele não apaga as mesas cadastradas.
-- Testes automáticos de segurança: npm run test:sql (supabase/testes/seguranca.test.mjs)


-- Tabelas ------------------------------------------------------------------

-- Mesas da loja. chave_hash: hash da chave secreta que vai no QR Code.
create table if not exists public.mesas (
  numero int primary key check (numero between 1 and 999),
  chave_hash text,
  chave_criada_em timestamptz
);

create table if not exists public.ocupacoes (
  id uuid primary key default gen_random_uuid(),
  mesa int not null check (mesa between 1 and 999),
  codigo text not null check (codigo ~ '^[0-9]{4}$'),
  -- Códigos errados digitados; passou do limite, só a loja libera
  tentativas int not null default 0,
  criada_em timestamptz not null default now(),
  ultimo_uso timestamptz not null default now(),
  liberada_em timestamptz
);

-- Versão anterior guardava o token em texto puro na própria ocupação
alter table public.ocupacoes drop column if exists token;

-- Uma mesa só pode ter uma ocupação ativa por vez
create unique index if not exists ocupacoes_uma_por_mesa
  on public.ocupacoes (mesa) where liberada_em is null;

-- Cada celular que confirmou a mesa recebe um token próprio; aqui fica só o hash dele
create table if not exists public.sessoes (
  token_hash text primary key,
  ocupacao_id uuid not null references public.ocupacoes (id) on delete cascade,
  criada_em timestamptz not null default now()
);

create index if not exists sessoes_ocupacao on public.sessoes (ocupacao_id);

-- Registro de segurança (sem dados pessoais): o que aconteceu, em qual mesa e quando
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  tipo text not null,
  mesa int,
  usuario uuid,
  criado_em timestamptz not null default now()
);

create index if not exists eventos_criado_em on public.eventos (criado_em);
create index if not exists eventos_tipo_criado_em on public.eventos (tipo, criado_em);

-- Quem pode usar o painel
create table if not exists public.equipe (
  user_id uuid primary key references auth.users on delete cascade
);

-- Nenhum visitante, logado ou não, acessa as tabelas direto pela API
alter table public.mesas enable row level security;
alter table public.ocupacoes enable row level security;
alter table public.sessoes enable row level security;
alter table public.eventos enable row level security;
alter table public.equipe enable row level security;

revoke all on public.mesas, public.ocupacoes, public.sessoes, public.eventos, public.equipe
  from public, anon, authenticated;
revoke all on sequence public.eventos_id_seq from public, anon, authenticated;


-- Papel com o mínimo de acesso para as funções do sistema ----------------
-- As funções rodam como mesas_sistema, e não como o dono do banco: mesmo com um erro
-- numa função, o estrago fica limitado às tabelas do sistema de mesas.

do $$
begin
  if not exists (select from pg_roles where rolname = 'mesas_sistema') then
    create role mesas_sistema nologin;
  end if;
end $$;

-- Necessário para passar as funções para esse papel
grant mesas_sistema to current_user;
grant usage, create on schema public to mesas_sistema;

grant select, update on public.mesas to mesas_sistema;
grant select, insert, update, delete on public.ocupacoes to mesas_sistema;
grant select, insert, delete on public.sessoes to mesas_sistema;
grant select, insert, delete on public.eventos to mesas_sistema;
grant usage on sequence public.eventos_id_seq to mesas_sistema;

drop policy if exists sistema on public.mesas;
create policy sistema on public.mesas for all to mesas_sistema using (true) with check (true);
drop policy if exists sistema on public.ocupacoes;
create policy sistema on public.ocupacoes for all to mesas_sistema using (true) with check (true);
drop policy if exists sistema on public.sessoes;
create policy sistema on public.sessoes for all to mesas_sistema using (true) with check (true);
drop policy if exists sistema on public.eventos;
create policy sistema on public.eventos for all to mesas_sistema using (true) with check (true);


-- Regras internas ------------------------------------------------------------
-- search_path vazio e nomes completos (public.x) em tudo: ninguém consegue trocar uma
-- tabela ou função por outra de mesmo nome

-- Tempo sem pedido até a mesa se liberar sozinha
create or replace function public._tempo_livre() returns interval
language sql immutable set search_path = '' as $$ select interval '3 hours' $$;

-- Erros de código permitidos antes de travar a mesa
create or replace function public._max_tentativas() returns int
language sql immutable set search_path = '' as $$ select 8 $$;

create or replace function public._hash(p_texto text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_texto, 'UTF8')), 'hex');
$$;

-- 32 caracteres hexadecimais do gerador criptográfico do Postgres (gen_random_uuid)
create or replace function public._segredo() returns text
language sql volatile set search_path = '' as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- Código de 4 números, também do gerador criptográfico (random() é previsível)
create or replace function public._novo_codigo() returns text
language sql volatile set search_path = '' as $$
  select lpad(((('x' || left(replace(gen_random_uuid()::text, '-', ''), 8))::bit(32)::bigint % 10000))::text, 4, '0');
$$;

create or replace function public._formato_segredo(p_texto text) returns boolean
language sql immutable set search_path = '' as $$
  select p_texto is not null and p_texto ~ '^[0-9a-f]{32}$';
$$;

-- Usuário logado e nível do login (aal2 = senha + app autenticador).
-- Ficam com o dono do banco porque leem o schema auth do Supabase.
create or replace function public._usuario() returns uuid
language sql stable security definer set search_path = '' as $$
  select auth.uid();
$$;

create or replace function public._da_equipe() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.equipe where user_id = auth.uid());
$$;

-- Registra um evento de segurança. Tentativas inválidas em excesso deixam de ser gravadas
-- (sem isso, um ataque encheria o banco só com registros)
create or replace function public._registrar(p_tipo text, p_mesa int default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_tipo in ('qr_invalido', 'codigo_errado') and (
    select count(*) from public.eventos
    where tipo = p_tipo and criado_em > now() - interval '10 minutes'
  ) >= 200 then
    return;
  end if;

  insert into public.eventos (tipo, mesa, usuario)
  values (p_tipo, case when p_mesa between 1 and 999 then p_mesa end, public._usuario());
end $$;

-- Libera as mesas paradas e apaga o histórico com mais de 30 dias
-- (a política de privacidade do site promete esse prazo)
create or replace function public._liberar_vencidas() returns void
language plpgsql security definer set search_path = '' as $$
begin
  with vencidas as (
    update public.ocupacoes set liberada_em = now()
    where liberada_em is null and ultimo_uso < now() - public._tempo_livre()
    returning mesa
  )
  insert into public.eventos (tipo, mesa) select 'liberada_auto', mesa from vencidas;

  delete from public.ocupacoes where liberada_em < now() - interval '30 days';
  delete from public.eventos where criado_em < now() - interval '30 days';
end $$;

create or replace function public._chave_valida(p_mesa int, p_chave text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public._formato_segredo(p_chave) and exists (
    select 1 from public.mesas
    where numero = p_mesa and chave_hash is not null and chave_hash = public._hash(p_chave)
  );
$$;

-- Cria o token de um celular para uma ocupação e devolve o token (só desta vez)
create or replace function public._nova_sessao(p_ocupacao uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_token text := public._segredo();
begin
  insert into public.sessoes (token_hash, ocupacao_id) values (public._hash(v_token), p_ocupacao);
  return v_token;
end $$;

-- Ocupação ativa do token de um celular
create or replace function public._ocupacao_do_token(p_token text) returns uuid
language sql stable security definer set search_path = '' as $$
  select o.id
  from public.sessoes s
  join public.ocupacoes o on o.id = s.ocupacao_id
  where public._formato_segredo(p_token)
    and s.token_hash = public._hash(p_token)
    and o.liberada_em is null;
$$;


-- Funções do cliente -------------------------------------------------------

-- Confirma a mesa com a chave do QR Code. Livre: ocupa e devolve o código. Já ocupada: avisa.
create or replace function public.ocupar_mesa(p_mesa int, p_chave text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_codigo text := public._novo_codigo();
begin
  if not public._chave_valida(p_mesa, p_chave) then
    perform public._registrar('qr_invalido', p_mesa);
    return json_build_object('status', 'qr_invalido');
  end if;

  perform public._liberar_vencidas();

  begin
    insert into public.ocupacoes (mesa, codigo) values (p_mesa, v_codigo) returning id into v_id;
  exception when unique_violation then
    return json_build_object('status', 'ocupada');
  end;

  perform public._registrar('ocupou', p_mesa);
  return json_build_object('status', 'ok', 'mesa', p_mesa, 'codigo', v_codigo, 'token', public._nova_sessao(v_id));
end $$;

-- Entra numa mesa já ocupada, com a chave do QR Code e o código de quem chegou primeiro
create or replace function public.entrar_mesa(p_mesa int, p_chave text, p_codigo text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v public.ocupacoes;
begin
  if not public._chave_valida(p_mesa, p_chave) then
    perform public._registrar('qr_invalido', p_mesa);
    return json_build_object('status', 'qr_invalido');
  end if;

  perform public._liberar_vencidas();

  select * into v from public.ocupacoes
  where mesa = p_mesa and liberada_em is null
  for update;

  if not found then
    return json_build_object('status', 'livre');
  end if;

  if v.tentativas >= public._max_tentativas() then
    return json_build_object('status', 'bloqueada');
  end if;

  if p_codigo is null or p_codigo !~ '^[0-9]{4}$' or v.codigo <> p_codigo then
    update public.ocupacoes set tentativas = tentativas + 1 where id = v.id;
    perform public._registrar('codigo_errado', p_mesa);
    if v.tentativas + 1 >= public._max_tentativas() then
      perform public._registrar('mesa_travada', p_mesa);
    end if;
    return json_build_object('status', 'codigo_errado');
  end if;

  perform public._registrar('entrou', p_mesa);
  return json_build_object('status', 'ok', 'mesa', v.mesa, 'codigo', v.codigo, 'token', public._nova_sessao(v.id));
end $$;

-- Confere se a mesa deste celular continua ocupada (a loja pode ter liberado)
create or replace function public.conferir_mesa(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v public.ocupacoes;
begin
  perform public._liberar_vencidas();

  select * into v from public.ocupacoes where id = public._ocupacao_do_token(p_token);
  if not found then
    return json_build_object('status', 'encerrada');
  end if;

  return json_build_object('status', 'ok', 'mesa', v.mesa, 'codigo', v.codigo);
end $$;

-- Marca que a mesa fez um pedido, o que adia a liberação automática
create or replace function public.registrar_pedido(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  perform public._liberar_vencidas();

  v_id := public._ocupacao_do_token(p_token);
  if v_id is null then
    return json_build_object('status', 'encerrada');
  end if;

  update public.ocupacoes set ultimo_uso = now() where id = v_id;
  return json_build_object('status', 'ok');
end $$;


-- Funções do painel da loja (equipe logada com senha + app autenticador) --

create or replace function public._exigir_equipe() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public._da_equipe() then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
end $$;

create or replace function public.painel_mesas() returns json
language plpgsql security definer set search_path = '' as $$
begin
  perform public._exigir_equipe();
  perform public._liberar_vencidas();

  return coalesce(
    (
      select json_agg(
        json_build_object(
          'id', id,
          'mesa', mesa,
          'codigo', codigo,
          'criada_em', criada_em,
          'ultimo_uso', ultimo_uso,
          'libera_em', ultimo_uso + public._tempo_livre(),
          'bloqueada', tentativas >= public._max_tentativas()
        )
        order by mesa
      )
      from public.ocupacoes
      where liberada_em is null
    ),
    '[]'::json
  );
end $$;

create or replace function public.painel_liberar(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mesa int;
begin
  perform public._exigir_equipe();

  update public.ocupacoes set liberada_em = now()
  where id = p_id and liberada_em is null
  returning mesa into v_mesa;

  if v_mesa is not null then
    perform public._registrar('liberada_painel', v_mesa);
  end if;
end $$;

-- Mesas cadastradas e se já têm QR Code gerado
create or replace function public.painel_lista_mesas() returns json
language plpgsql security definer set search_path = '' as $$
begin
  perform public._exigir_equipe();

  return coalesce(
    (
      select json_agg(
        json_build_object('mesa', numero, 'tem_qr', chave_hash is not null, 'qr_criado_em', chave_criada_em)
        order by numero
      )
      from public.mesas
    ),
    '[]'::json
  );
end $$;

-- Gera uma chave nova para o QR Code da mesa. A chave só aparece nesta resposta:
-- o banco guarda o hash. O QR Code antigo da mesa para de funcionar.
create or replace function public.painel_gerar_qr(p_mesa int) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_chave text := public._segredo();
begin
  perform public._exigir_equipe();

  update public.mesas
  set chave_hash = public._hash(v_chave), chave_criada_em = now()
  where numero = p_mesa;

  if not found then
    raise exception 'Mesa não cadastrada' using errcode = 'P0002';
  end if;

  perform public._registrar('qr_gerado', p_mesa);
  return json_build_object('mesa', p_mesa, 'chave', v_chave);
end $$;

-- Resumo das últimas 24 horas e últimos eventos, para os alertas do painel
create or replace function public.painel_eventos() returns json
language plpgsql security definer set search_path = '' as $$
begin
  perform public._exigir_equipe();

  return json_build_object(
    'resumo', (
      select coalesce(json_object_agg(tipo, total), '{}'::json)
      from (
        select tipo, count(*) as total from public.eventos
        where criado_em > now() - interval '24 hours'
        group by tipo
      ) s
    ),
    'recentes', (
      select coalesce(json_agg(json_build_object('tipo', tipo, 'mesa', mesa, 'criado_em', criado_em) order by criado_em desc), '[]'::json)
      from (select tipo, mesa, criado_em from public.eventos order by criado_em desc limit 30) e
    )
  );
end $$;


-- Dono das funções -----------------------------------------------------------
-- _usuario e _da_equipe continuam com o dono do banco (leem o schema auth);
-- todas as outras com security definer rodam como mesas_sistema.

alter function public._registrar(text, int) owner to mesas_sistema;
alter function public._liberar_vencidas() owner to mesas_sistema;
alter function public._chave_valida(int, text) owner to mesas_sistema;
alter function public._nova_sessao(uuid) owner to mesas_sistema;
alter function public._ocupacao_do_token(text) owner to mesas_sistema;
alter function public._exigir_equipe() owner to mesas_sistema;
alter function public.ocupar_mesa(int, text) owner to mesas_sistema;
alter function public.entrar_mesa(int, text, text) owner to mesas_sistema;
alter function public.conferir_mesa(text) owner to mesas_sistema;
alter function public.registrar_pedido(text) owner to mesas_sistema;
alter function public.painel_mesas() owner to mesas_sistema;
alter function public.painel_liberar(uuid) owner to mesas_sistema;
alter function public.painel_lista_mesas() owner to mesas_sistema;
alter function public.painel_gerar_qr(int) owner to mesas_sistema;
alter function public.painel_eventos() owner to mesas_sistema;


-- Quem pode chamar o quê ---------------------------------------------------

-- Versão anterior: funções com outros parâmetros, que não existem mais
drop function if exists public.ocupar_mesa(int);
drop function if exists public.entrar_mesa(int, text);
drop function if exists public.conferir_mesa(uuid);
drop function if exists public.registrar_pedido(uuid);

-- O Supabase libera toda função nova para qualquer visitante; aqui isso é desfeito
-- e cada função é liberada só para quem precisa dela
revoke execute on function
  public._tempo_livre(),
  public._max_tentativas(),
  public._hash(text),
  public._segredo(),
  public._novo_codigo(),
  public._formato_segredo(text),
  public._usuario(),
  public._da_equipe(),
  public._registrar(text, int),
  public._liberar_vencidas(),
  public._chave_valida(int, text),
  public._nova_sessao(uuid),
  public._ocupacao_do_token(text),
  public._exigir_equipe(),
  public.ocupar_mesa(int, text),
  public.entrar_mesa(int, text, text),
  public.conferir_mesa(text),
  public.registrar_pedido(text),
  public.painel_mesas(),
  public.painel_liberar(uuid),
  public.painel_lista_mesas(),
  public.painel_gerar_qr(int),
  public.painel_eventos()
from public, anon, authenticated;

grant execute on function
  public._tempo_livre(),
  public._max_tentativas(),
  public._hash(text),
  public._segredo(),
  public._novo_codigo(),
  public._formato_segredo(text),
  public._usuario(),
  public._da_equipe(),
  public._registrar(text, int),
  public._liberar_vencidas(),
  public._chave_valida(int, text),
  public._nova_sessao(uuid),
  public._ocupacao_do_token(text),
  public._exigir_equipe()
to mesas_sistema;

grant execute on function
  public.ocupar_mesa(int, text),
  public.entrar_mesa(int, text, text),
  public.conferir_mesa(text),
  public.registrar_pedido(text)
to anon, authenticated;

grant execute on function
  public.painel_mesas(),
  public.painel_liberar(uuid),
  public.painel_lista_mesas(),
  public.painel_gerar_qr(int),
  public.painel_eventos()
to authenticated;
