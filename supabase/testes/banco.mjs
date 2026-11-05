// Postgres local (PGlite) montado como o Supabase, para testar supabase/mesas.sql sem internet.
// Imita o que importa para a segurança: papéis anon/authenticated, permissões padrão que o
// Supabase dá a eles, o token de login (request.jwt.claims) e o "postgres" do Supabase,
// que não é superusuário.
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const SQL = readFileSync(new URL('../mesas.sql', import.meta.url), 'utf8')

export async function criarBanco() {
  const db = new PGlite()
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text);
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;

    create role anon;
    create role authenticated;
    -- Faz o papel do "postgres" do Supabase: cria tabelas e papéis, mas não é superusuário
    create role dono_supabase createrole;

    grant usage on schema auth to anon, authenticated, dono_supabase;
    grant select, references on auth.users to dono_supabase;
    -- No Supabase o "postgres" é dono do banco e, por isso, do schema public
    alter schema public owner to dono_supabase;
    grant usage on schema public to anon, authenticated;

    -- Igual ao Supabase: o que o dono criar no public já nasce liberado para anon/authenticated
    alter default privileges for role dono_supabase in schema public grant all on tables to anon, authenticated;
    alter default privileges for role dono_supabase in schema public grant all on functions to anon, authenticated;
    alter default privileges for role dono_supabase in schema public grant all on sequences to anon, authenticated;
  `)

  // O arquivo promete que pode rodar mais de uma vez
  await db.exec('set role dono_supabase')
  await db.exec(SQL)
  await db.exec(SQL)
  await db.exec('reset role')

  const usuario = async (email) =>
    (await db.query('insert into auth.users (email) values ($1) returning id', [email])).rows[0].id
  const idLoja = await usuario('loja@teste.com')
  const idIntruso = await usuario('intruso@teste.com')

  await db.exec('set role dono_supabase')
  await db.query('insert into public.equipe (user_id) values ($1)', [idLoja])
  await db.exec('insert into public.mesas (numero) select generate_series(1, 12) on conflict do nothing')
  await db.exec('reset role')

  return { db, idLoja, idIntruso }
}

// Chama uma função como o PostgREST do Supabase: troca de papel e passa o login
// aal: 'aal1' = só senha; 'aal2' = senha + app autenticador
export async function rpc(db, funcao, args = {}, { papel = 'anon', usuario = null, aal = 'aal1' } = {}) {
  const nomes = Object.keys(args)
  const lista = nomes.map((n, i) => `${n} => $${i + 1}`).join(', ')
  const claims = JSON.stringify(usuario ? { sub: usuario, role: papel, aal } : { role: papel })
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${papel}`)
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims])
    const { rows } = await tx.query(`select public.${funcao}(${lista}) as r`, nomes.map((n) => args[n]))
    return rows[0].r
  })
}

// Roda um SQL qualquer como um papel (para tentar acessar as tabelas direto)
export async function comoPapel(db, papel, sql, usuario = null) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${papel}`)
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(usuario ? { sub: usuario } : {})])
    return tx.query(sql)
  })
}
