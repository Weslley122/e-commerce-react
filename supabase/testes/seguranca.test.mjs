// Testes do sistema de mesas: o funcionamento normal e os ataques que ele precisa aguentar.
// Rodar: npm run test:sql
import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'
import { comoPapel, criarBanco, rpc } from './banco.mjs'

let db, idLoja, idIntruso
const chaves = {}
const loja = () => ({ papel: 'authenticated', usuario: idLoja, aal: 'aal2' })
const outroCodigo = (codigo) => (codigo === '0000' ? '1111' : '0000')

async function erroDe(promessa) {
  try {
    await promessa
  } catch (e) {
    return e.code
  }
  return null
}

before(async () => {
  ;({ db, idLoja, idIntruso } = await criarBanco())
  for (let m = 1; m <= 12; m++) chaves[m] = (await rpc(db, 'painel_gerar_qr', { p_mesa: m }, loja())).chave
})

describe('funcionamento', () => {
  test('primeiro celular ocupa a mesa e recebe código e token', async () => {
    const r = await rpc(db, 'ocupar_mesa', { p_mesa: 1, p_chave: chaves[1] })
    assert.equal(r.status, 'ok')
    assert.match(r.codigo, /^\d{4}$/)
    assert.match(r.token, /^[0-9a-f]{32}$/)
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 1, p_chave: chaves[1] })).status, 'ocupada')
  })

  test('amigo entra com o código, cada celular com o próprio token', async () => {
    const dono = await rpc(db, 'ocupar_mesa', { p_mesa: 2, p_chave: chaves[2] })
    const errado = await rpc(db, 'entrar_mesa', { p_mesa: 2, p_chave: chaves[2], p_codigo: outroCodigo(dono.codigo) })
    assert.equal(errado.status, 'codigo_errado')
    const amigo = await rpc(db, 'entrar_mesa', { p_mesa: 2, p_chave: chaves[2], p_codigo: dono.codigo })
    assert.equal(amigo.status, 'ok')
    assert.notEqual(amigo.token, dono.token)
    for (const t of [dono.token, amigo.token]) {
      assert.equal((await rpc(db, 'conferir_mesa', { p_token: t })).status, 'ok')
      assert.equal((await rpc(db, 'registrar_pedido', { p_token: t })).status, 'ok')
    }
  })

  test('loja vê e libera a mesa; os celulares dela perdem o acesso', async () => {
    const dono = await rpc(db, 'ocupar_mesa', { p_mesa: 3, p_chave: chaves[3] })
    const lista = await rpc(db, 'painel_mesas', {}, loja())
    const mesa3 = lista.find((m) => m.mesa === 3)
    assert.equal(mesa3.codigo, dono.codigo)
    await rpc(db, 'painel_liberar', { p_id: mesa3.id }, loja())
    assert.equal((await rpc(db, 'conferir_mesa', { p_token: dono.token })).status, 'encerrada')
    assert.equal((await rpc(db, 'registrar_pedido', { p_token: dono.token })).status, 'encerrada')
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 3, p_chave: chaves[3] })).status, 'ok')
  })

  test('mesa parada há mais de 3 horas fica livre sozinha', async () => {
    await rpc(db, 'ocupar_mesa', { p_mesa: 4, p_chave: chaves[4] })
    await db.exec(`update public.ocupacoes set ultimo_uso = now() - interval '4 hours' where mesa = 4 and liberada_em is null`)
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 4, p_chave: chaves[4] })).status, 'ok')
  })

  test('8 códigos errados travam a mesa e geram alerta no painel', async () => {
    const dono = await rpc(db, 'ocupar_mesa', { p_mesa: 5, p_chave: chaves[5] })
    for (let i = 0; i < 8; i++) {
      await rpc(db, 'entrar_mesa', { p_mesa: 5, p_chave: chaves[5], p_codigo: outroCodigo(dono.codigo) })
    }
    const certo = await rpc(db, 'entrar_mesa', { p_mesa: 5, p_chave: chaves[5], p_codigo: dono.codigo })
    assert.equal(certo.status, 'bloqueada')
    assert.equal((await rpc(db, 'painel_mesas', {}, loja())).find((m) => m.mesa === 5).bloqueada, true)
    const eventos = await rpc(db, 'painel_eventos', {}, loja())
    assert.ok(eventos.resumo.mesa_travada >= 1)
  })

  test('gerar QR novo invalida o antigo', async () => {
    const antiga = chaves[6]
    chaves[6] = (await rpc(db, 'painel_gerar_qr', { p_mesa: 6 }, loja())).chave
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 6, p_chave: antiga })).status, 'qr_invalido')
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 6, p_chave: chaves[6] })).status, 'ok')
  })

  test('histórico com mais de 30 dias é apagado', async () => {
    await db.exec(`update public.ocupacoes set liberada_em = now() - interval '31 days' where liberada_em is not null`)
    await db.exec(`update public.eventos set criado_em = now() - interval '31 days' where tipo = 'ocupou'`)
    await rpc(db, 'conferir_mesa', { p_token: '0'.repeat(32) })
    const sobra = await db.query(
      `select (select count(*) from public.ocupacoes where liberada_em is not null)::int o,
              (select count(*) from public.eventos where tipo = 'ocupou')::int e`,
    )
    assert.deepEqual(sobra.rows[0], { o: 0, e: 0 })
  })
})

describe('ataques', () => {
  test('ocupar mesas em massa sem o QR Code: nenhuma ocupada', async () => {
    let ocupadas = 0
    for (let m = 1; m <= 60; m++) {
      for (const chave of [null, '', 'a'.repeat(32), '0'.repeat(32)]) {
        if ((await rpc(db, 'ocupar_mesa', { p_mesa: m, p_chave: chave })).status === 'ok') ocupadas++
      }
    }
    assert.equal(ocupadas, 0)
  })

  test('chave de uma mesa não abre outra', async () => {
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 7, p_chave: chaves[8] })).status, 'qr_invalido')
  })

  test('força bruta na chave do QR: 500 chaves aleatórias, nenhuma passa', async () => {
    for (let i = 0; i < 500; i++) {
      const chave = crypto.randomUUID().replaceAll('-', '')
      assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 9, p_chave: chave })).status, 'qr_invalido')
    }
  })

  test('travar a mesa de outro grupo de longe (sem QR): não conta tentativa', async () => {
    const dono = await rpc(db, 'ocupar_mesa', { p_mesa: 10, p_chave: chaves[10] })
    for (let i = 0; i < 20; i++) {
      const r = await rpc(db, 'entrar_mesa', { p_mesa: 10, p_chave: 'f'.repeat(32), p_codigo: '0000' })
      assert.equal(r.status, 'qr_invalido')
    }
    const amigo = await rpc(db, 'entrar_mesa', { p_mesa: 10, p_chave: chaves[10], p_codigo: dono.codigo })
    assert.equal(amigo.status, 'ok')
  })

  test('SQL injection em todos os parâmetros de texto', async () => {
    const cargas = [
      "' or '1'='1",
      "'; drop table public.ocupacoes; --",
      "0000' union select codigo from public.ocupacoes --",
      "x'); delete from public.sessoes; --",
      '$$; drop table public.eventos; $$',
    ]
    const antes = (await db.query('select count(*)::int n from public.ocupacoes')).rows[0].n
    for (const c of cargas) {
      assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 11, p_chave: c })).status, 'qr_invalido')
      assert.notEqual((await rpc(db, 'entrar_mesa', { p_mesa: 1, p_chave: chaves[1], p_codigo: c })).status, 'ok')
      assert.equal((await rpc(db, 'conferir_mesa', { p_token: c })).status, 'encerrada')
      assert.equal((await rpc(db, 'registrar_pedido', { p_token: c })).status, 'encerrada')
    }
    // Número da mesa com texto nem chega à função: o tipo int recusa
    assert.equal(await erroDe(rpc(db, 'ocupar_mesa', { p_mesa: '1 or 1=1', p_chave: chaves[1] })), '22P02')
    assert.equal((await db.query('select count(*)::int n from public.ocupacoes')).rows[0].n, antes)
  })

  test('entrada gigante (5 MB) é recusada pelo formato, sem travar o banco', async () => {
    const gigante = 'a'.repeat(5_000_000)
    assert.equal((await rpc(db, 'ocupar_mesa', { p_mesa: 1, p_chave: gigante })).status, 'qr_invalido')
    assert.equal((await rpc(db, 'conferir_mesa', { p_token: gigante })).status, 'encerrada')
  })

  test('backup vazado: nenhuma chave ou token aparece em texto puro no banco', async () => {
    const dono = await rpc(db, 'ocupar_mesa', { p_mesa: 12, p_chave: chaves[12] })
    const tudo = await db.query(`
      select string_agg(t::text, ' ') as texto from (
        select row_to_json(m) t from public.mesas m
        union all select row_to_json(o) from public.ocupacoes o
        union all select row_to_json(s) from public.sessoes s
        union all select row_to_json(e) from public.eventos e
      ) x`)
    for (const segredo of [dono.token, ...Object.values(chaves)]) {
      assert.ok(!tudo.rows[0].texto.includes(segredo), 'segredo em texto puro no banco')
    }
  })

  test('acesso direto às tabelas pela API: negado para visitante e para logado', async () => {
    for (const [papel, usuario] of [['anon', null], ['authenticated', idIntruso]]) {
      for (const tabela of ['mesas', 'ocupacoes', 'sessoes', 'eventos', 'equipe']) {
        assert.equal(await erroDe(comoPapel(db, papel, `select * from public.${tabela}`, usuario)), '42501', `${papel} leu ${tabela}`)
        assert.equal(await erroDe(comoPapel(db, papel, `delete from public.${tabela}`, usuario)), '42501', `${papel} apagou ${tabela}`)
      }
      const virarEquipe = comoPapel(db, papel, `insert into public.equipe (user_id) values ('${idIntruso}')`, usuario)
      assert.equal(await erroDe(virarEquipe), '42501', `${papel} se colocou na equipe`)
    }
  })

  test('escalação de privilégio: funções internas fechadas para visitante e logado', async () => {
    const internas = [
      ['_liberar_vencidas', {}],
      ['_da_equipe', {}],
      ['_usuario', {}],
      ['_segredo', {}],
      ['_novo_codigo', {}],
      ['_exigir_equipe', {}],
      ['_registrar', { p_tipo: 'falso' }],
      ['_nova_sessao', { p_ocupacao: crypto.randomUUID() }],
      ['_ocupacao_do_token', { p_token: 'x' }],
      ['_chave_valida', { p_mesa: 1, p_chave: 'x' }],
    ]
    for (const opcoes of [{}, { papel: 'authenticated', usuario: idIntruso, aal: 'aal2' }, loja()]) {
      for (const [fn, args] of internas) {
        assert.equal(await erroDe(rpc(db, fn, args, opcoes)), '42501', `${opcoes.papel ?? 'anon'} chamou ${fn}`)
      }
    }
  })

  test('painel: fechado para visitante, para quem não é da equipe e para a loja sem o app autenticador', async () => {
    const painel = [
      ['painel_mesas', {}],
      ['painel_lista_mesas', {}],
      ['painel_eventos', {}],
      ['painel_gerar_qr', { p_mesa: 1 }],
      ['painel_liberar', { p_id: crypto.randomUUID() }],
    ]
    const quem = {
      visitante: {},
      'logado fora da equipe': { papel: 'authenticated', usuario: idIntruso, aal: 'aal2' },
      'loja só com senha (aal1)': { papel: 'authenticated', usuario: idLoja, aal: 'aal1' },
    }
    for (const [nome, opcoes] of Object.entries(quem)) {
      for (const [fn, args] of painel) {
        assert.equal(await erroDe(rpc(db, fn, args, opcoes)), '42501', `${nome} usou ${fn}`)
      }
    }
  })

  test('menor privilégio: as funções rodam como mesas_sistema, que não lê a equipe', async () => {
    const papel = (await db.query(`select rolsuper, rolbypassrls, rolcanlogin from pg_roles where rolname = 'mesas_sistema'`)).rows[0]
    assert.deepEqual(papel, { rolsuper: false, rolbypassrls: false, rolcanlogin: false })

    const donos = (
      await db.query(`
        select proname, pg_get_userbyid(proowner) dono from pg_proc
        where prosecdef and pronamespace = 'public'::regnamespace`)
    ).rows
    for (const f of donos) {
      const esperado = ['_usuario', '_da_equipe'].includes(f.proname) ? 'dono_supabase' : 'mesas_sistema'
      assert.equal(f.dono, esperado, `${f.proname} roda como ${f.dono}`)
    }
    assert.equal(await erroDe(comoPapel(db, 'mesas_sistema', 'select * from public.equipe')), '42501')
  })

  test('search_path vazio em todas as funções', async () => {
    const funcoes = (await db.query(`select proname, proconfig from pg_proc where pronamespace = 'public'::regnamespace`)).rows
    for (const f of funcoes) assert.deepEqual(f.proconfig, ['search_path=""'], f.proname)
  })

  test('código da mesa vem do gerador criptográfico e cobre os 4 dígitos', async () => {
    const fontes = (await db.query(`select string_agg(prosrc, ' ') s from pg_proc where pronamespace = 'public'::regnamespace`)).rows[0].s
    assert.ok(!/\brandom\(\)/.test(fontes), 'random() em uso')
    const { rows } = await comoPapel(db, 'mesas_sistema', 'select public._novo_codigo() c from generate_series(1, 3000)')
    assert.ok(rows.every((r) => /^\d{4}$/.test(r.c)))
    assert.ok(new Set(rows.map((r) => r.c)).size > 2500, 'códigos repetidos demais')
  })

  test('enxurrada de tentativas inválidas não enche o banco de registros', async () => {
    for (let i = 0; i < 300; i++) await rpc(db, 'ocupar_mesa', { p_mesa: 1, p_chave: 'b'.repeat(32) })
    const { rows } = await db.query(
      `select count(*)::int n from public.eventos where tipo = 'qr_invalido' and criado_em > now() - interval '10 minutes'`,
    )
    assert.ok(rows[0].n <= 200, `${rows[0].n} registros`)
  })
})
