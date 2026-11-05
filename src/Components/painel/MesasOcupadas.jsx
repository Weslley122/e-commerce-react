import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { formatarHora, haQuanto, mensagemDeFalha } from '../../lib/painel'

const ATUALIZAR_A_CADA = 20_000

export default function MesasOcupadas({ api }) {
  const [mesas, setMesas] = useState(null)
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [erro, setErro] = useState('')
  // Liberar pede dois toques: o primeiro só arma o botão por alguns segundos
  const [armada, setArmada] = useState(null)
  const [liberando, setLiberando] = useState(null)

  const atualizar = useCallback(async () => {
    try {
      setMesas(await api('painel_mesas'))
      setAtualizadoEm(new Date())
      setErro('')
    } catch (falha) {
      setErro(mensagemDeFalha(falha))
    }
  }, [api])

  // Busca a lista ao abrir e de tempos em tempos
  // (os setState de atualizar só acontecem depois da resposta, não durante o efeito)
  useEffect(() => {
    const primeira = setTimeout(atualizar, 0)
    const id = setInterval(atualizar, ATUALIZAR_A_CADA)
    // Ao voltar para a aba (tablet que ficou de lado), atualiza na hora
    const aoVoltar = () => document.visibilityState === 'visible' && atualizar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearTimeout(primeira)
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [atualizar])

  useEffect(() => {
    if (!armada) return
    const id = setTimeout(() => setArmada(null), 4000)
    return () => clearTimeout(id)
  }, [armada])

  async function liberar(id) {
    if (armada !== id) return setArmada(id)
    setArmada(null)
    setLiberando(id)
    try {
      await api('painel_liberar', { p_id: id })
      await atualizar()
    } catch (falha) {
      setErro(mensagemDeFalha(falha))
    } finally {
      setLiberando(null)
    }
  }

  return (
    <section className="painel__secao">
      <div className="painel__cabeca">
        <div>
          <p className="rotulo">Painel da loja</p>
          <h1>Mesas ocupadas</h1>
          <p className="painel__resumo">
            {mesas === null
              ? 'Carregando...'
              : `${mesas.length === 0 ? 'Nenhuma mesa' : mesas.length === 1 ? '1 mesa' : `${mesas.length} mesas`} ocupada${mesas.length === 1 ? '' : 's'}`}
            {atualizadoEm && ` · atualizado às ${formatarHora(atualizadoEm)}`}
          </p>
        </div>
        <button type="button" className="botao botao--contorno botao--pequeno" onClick={atualizar}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {erro && (
        <p className="painel__erro" role="alert">
          {erro}
        </p>
      )}

      {mesas?.length === 0 && (
        <p className="painel__vazio">Quando um cliente confirmar a mesa pelo QR Code, ela aparece aqui.</p>
      )}

      {mesas?.length > 0 && (
        <ul className="painel__mesas">
          {mesas.map((m) => (
            <li key={m.id} className="mesa-cartao">
              <div className="mesa-cartao__topo">
                <strong>Mesa {m.mesa}</strong>
                <span>Código {m.codigo}</span>
              </div>

              {m.bloqueada && (
                <p className="mesa-cartao__alerta">
                  <TriangleAlert size={15} /> Alguém errou o código várias vezes. Confira quem está na mesa.
                </p>
              )}

              <dl>
                <div>
                  <dt>Ocupada</dt>
                  <dd>
                    {formatarHora(m.criada_em)} ({haQuanto(m.criada_em)})
                  </dd>
                </div>
                <div>
                  <dt>Último pedido</dt>
                  <dd>{m.ultimo_uso === m.criada_em ? 'nenhum ainda' : haQuanto(m.ultimo_uso)}</dd>
                </div>
                <div>
                  <dt>Libera sozinha</dt>
                  <dd>às {formatarHora(m.libera_em)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className={`botao botao--largo ${armada === m.id ? 'botao--laranja' : 'botao--contorno'}`}
                onClick={() => liberar(m.id)}
                disabled={liberando === m.id}
              >
                {liberando === m.id ? (
                  <LoaderCircle size={18} className="girando" />
                ) : armada === m.id ? (
                  'Toque de novo para liberar'
                ) : (
                  'Liberar mesa'
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="painel__dica">
        Ao receber um pedido no WhatsApp, confira se o código da mensagem é o mesmo da mesa aqui. Libere a mesa quando o
        cliente for embora.
      </p>
    </section>
  )
}
