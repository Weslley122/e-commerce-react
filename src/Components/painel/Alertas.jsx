import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { formatarDiaHora, mensagemDeFalha } from '../../lib/painel'

const ATUALIZAR_A_CADA = 60_000

// O que cada evento do banco significa para quem está no balcão
const NOMES = {
  ocupou: 'Mesa confirmada',
  entrou: 'Entrou no grupo da mesa',
  codigo_errado: 'Código da mesa errado',
  mesa_travada: 'Mesa travada por códigos errados',
  qr_invalido: 'QR Code inválido',
  qr_gerado: 'QR Code novo gerado',
  liberada_painel: 'Liberada no painel',
  liberada_auto: 'Liberada sozinha (3 h sem pedido)',
}

// Os que pedem atenção: nesses, o contador fica em destaque quando passa de zero
const SUSPEITOS = [
  ['qr_invalido', 'QR Code inválido', 'QR antigo, falso ou alguém tentando adivinhar a chave.'],
  ['codigo_errado', 'Códigos errados', 'Alguém tentou entrar numa mesa sem o código certo.'],
  ['mesa_travada', 'Mesas travadas', 'Confira a mesa e libere se for o caso.'],
]

// Alertas de segurança: resumo das últimas 24 horas e os eventos mais recentes
export default function Alertas({ api }) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  const atualizar = useCallback(async () => {
    try {
      setDados(await api('painel_eventos'))
      setErro('')
    } catch (falha) {
      setErro(mensagemDeFalha(falha))
    }
  }, [api])

  useEffect(() => {
    const primeira = setTimeout(atualizar, 0)
    const id = setInterval(atualizar, ATUALIZAR_A_CADA)
    return () => {
      clearTimeout(primeira)
      clearInterval(id)
    }
  }, [atualizar])

  const total = (tipo) => dados?.resumo?.[tipo] ?? 0
  const tudoCalmo = dados && SUSPEITOS.every(([tipo]) => total(tipo) === 0)

  return (
    <section className="painel__secao">
      <h2 className="painel__titulo-secao">Alertas de segurança</h2>
      <p className="painel__resumo">Últimas 24 horas</p>

      {erro && (
        <p className="painel__erro" role="alert">
          {erro}
        </p>
      )}

      {dados && (
        <>
          <ul className="alertas">
            {SUSPEITOS.map(([tipo, nome, explicacao]) => (
              <li key={tipo} className={`alerta ${total(tipo) > 0 ? 'alerta--ativo' : ''}`}>
                <strong>{total(tipo)}</strong>
                <span>{nome}</span>
                <small>{explicacao}</small>
              </li>
            ))}
          </ul>

          <p className="painel__calmo">
            {tudoCalmo ? (
              <>
                <ShieldCheck size={16} /> Nada suspeito nas últimas 24 horas.
              </>
            ) : (
              <>
                <ShieldAlert size={16} /> Muitos QR Codes inválidos seguidos podem ser um QR falso colado numa mesa:
                confira os cartões.
              </>
            )}
          </p>

          {dados.recentes.length > 0 && (
            <details className="eventos">
              <summary>Últimos eventos</summary>
              <ul>
                {dados.recentes.map((e, i) => (
                  <li key={i} className={SUSPEITOS.some(([t]) => t === e.tipo) ? 'eventos__suspeito' : ''}>
                    <time>{formatarDiaHora(e.criado_em)}</time>
                    <span>{NOMES[e.tipo] ?? e.tipo}</span>
                    <span>{e.mesa ? `Mesa ${e.mesa}` : ''}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  )
}
