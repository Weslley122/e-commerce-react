import { useEffect, useState } from 'react'
import { CircleCheck, LoaderCircle, Lock, QrCode, ShieldAlert, X } from 'lucide-react'
import { site } from '../../data/site'
import { useCarrinho } from '../../lib/carrinho'
import { useMesa } from '../../lib/mesa'
import { CAMINHO_CARDAPIO, naPaginaDoCardapio } from '../../lib/rota'

const ERRO_CONEXAO = 'Não deu para falar com o sistema de mesas. Confira a internet e tente de novo, ou peça no balcão.'

// Janela que aparece ao escanear o QR Code da mesa:
// confirmar   -> "Você está na mesa 7?"
// ocupada     -> a mesa já tem gente: só entra com o código de quem chegou primeiro
// pronto      -> mesa confirmada, mostra o código para passar para o grupo
// escanear    -> aberta sem QR Code (pela sacola ou "Trocar mesa"): explica como confirmar
// qr_invalido -> o QR Code não confere com o da loja (trocado, antigo ou adulterado)
export default function CheckinMesa() {
  const { checkin } = useMesa()
  if (!checkin) return null
  // A chave recomeça a janela do zero sempre que ela é aberta para outra mesa
  return <Janela key={`${checkin.mesa}-${checkin.voltarParaSacola}`} />
}

function Janela() {
  const { checkin, fecharCheckin, ocupar, entrar, sessao } = useMesa()
  const { abrir: abrirSacola } = useCarrinho()
  const { mesa, chave } = checkin

  const [etapa, setEtapa] = useState(mesa && chave ? 'confirmar' : mesa ? 'qr_invalido' : 'escanear')
  const [codigo, setCodigo] = useState('')
  const [entrouNoGrupo, setEntrouNoGrupo] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function fechar() {
    if (carregando) return
    fecharCheckin()
    if (checkin.voltarParaSacola) abrirSacola()
  }

  // A página de trás não rola enquanto a janela está aberta
  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  // Esc fecha (registrado a cada render para enxergar o estado atual de "carregando")
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  })

  async function tentar(acao, aoDarCerto) {
    setCarregando(true)
    setErro('')
    try {
      const r = await acao()
      if (r.status === 'ok') aoDarCerto()
      else if (r.status === 'ocupada') {
        setCodigo('')
        setEtapa('ocupada')
      } else if (r.status === 'livre') {
        // A mesa foi liberada enquanto a pessoa digitava o código: ocupa direto
        const nova = await ocupar(mesa, chave)
        if (nova.status === 'ok') setEtapa('pronto')
        else setErro(ERRO_CONEXAO)
      } else if (r.status === 'qr_invalido') setEtapa('qr_invalido')
      else if (r.status === 'codigo_errado') setErro('Código não confere. Peça de novo para quem está na mesa.')
      else if (r.status === 'bloqueada') setErro('Muitas tentativas com código errado. Chame um atendente para liberar a mesa.')
      else setErro(ERRO_CONEXAO)
    } catch {
      setErro(ERRO_CONEXAO)
    } finally {
      setCarregando(false)
    }
  }

  const confirmarMesa = () => tentar(() => ocupar(mesa, chave), () => setEtapa('pronto'))

  const entrarNoGrupo = (e) => {
    e.preventDefault()
    if (codigo.length !== 4) return setErro('O código tem 4 números.')
    tentar(
      () => entrar(mesa, chave, codigo),
      () => {
        setEntrouNoGrupo(true)
        setEtapa('pronto')
      },
    )
  }

  return (
    <div className="checkin">
      <div className="checkin__fundo" onClick={fechar} />

      <div className="checkin__janela" role="dialog" aria-modal="true" aria-labelledby="checkin-titulo">
        <button type="button" className="icone-botao checkin__fechar" onClick={fechar} aria-label="Fechar">
          <X size={18} />
        </button>

        {etapa === 'confirmar' && (
          <>
            <p className="rotulo">Confirme a sua mesa</p>
            <h2 id="checkin-titulo">
              Você está na <span>mesa {mesa}</span>?
            </h2>
            <p className="checkin__texto">
              Ao confirmar, a mesa fica marcada como ocupada e os pedidos deste celular vão com o número dela. Assim a
              loja não confunde as mesas na hora de entregar.
            </p>
            <div className="checkin__acoes">
              <button type="button" className="botao botao--laranja botao--largo" onClick={confirmarMesa} disabled={carregando}>
                {carregando ? <LoaderCircle size={18} className="girando" /> : `Confirmar, estou na mesa ${mesa}`}
              </button>
              <button type="button" className="botao botao--contorno botao--largo" onClick={() => setEtapa('escanear')} disabled={carregando}>
                Não estou nessa mesa
              </button>
            </div>
          </>
        )}

        {etapa === 'escanear' && (
          <>
            <p className="rotulo">Confirme a sua mesa</p>
            <h2 id="checkin-titulo" className="checkin__titulo-icone">
              <QrCode size={24} /> Escaneie o QR Code da sua mesa.
            </h2>
            <p className="checkin__texto">
              Abra a câmera do celular e aponte para o cartão com o QR Code que está em cima da mesa em que você está
              sentado. A mesa só é confirmada pelo QR Code dela, para ninguém pedir em nome de outra mesa.
            </p>
            <p className="checkin__nota">Sem câmera ou sem conseguir escanear? Faça o pedido no balcão.</p>
            <div className="checkin__acoes">
              <button type="button" className="botao botao--contorno botao--largo" onClick={fechar}>
                Entendi
              </button>
            </div>
          </>
        )}

        {etapa === 'qr_invalido' && (
          <>
            <p className="rotulo">Mesa {mesa}</p>
            <h2 id="checkin-titulo" className="checkin__titulo-icone">
              <ShieldAlert size={24} /> Este QR Code não é válido.
            </h2>
            <p className="checkin__texto">
              Ele pode estar desatualizado ou não ser da loja. Não continue e avise um atendente. O endereço certo é{' '}
              <strong>{site.dominio}</strong>, e o site nunca pede pagamento, cartão ou senha.
            </p>
            <div className="checkin__acoes">
              <button type="button" className="botao botao--contorno botao--largo" onClick={fechar}>
                Fechar
              </button>
            </div>
          </>
        )}

        {etapa === 'ocupada' && (
          <form onSubmit={entrarNoGrupo} noValidate>
            <p className="rotulo">Mesa {mesa}</p>
            <h2 id="checkin-titulo" className="checkin__titulo-icone">
              <Lock size={22} /> Essa mesa já está ocupada.
            </h2>
            <p className="checkin__texto">
              Se você está com quem chegou primeiro, peça o código de 4 números que aparece no celular dessa pessoa e
              digite aqui.
            </p>
            <label className="campo">
              <span>Código da mesa</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="0000"
                className="checkin__codigo-campo"
                value={codigo}
                onChange={(e) => {
                  setErro('')
                  setCodigo(e.target.value.replace(/\D/g, '').slice(0, 4))
                }}
                autoFocus
              />
            </label>
            <div className="checkin__acoes">
              <button type="submit" className="botao botao--laranja botao--largo" disabled={carregando}>
                {carregando ? <LoaderCircle size={18} className="girando" /> : 'Entrar na mesa'}
              </button>
            </div>
            <p className="checkin__nota">Não é o seu grupo? Chame um atendente, ele confere qual é a sua mesa.</p>
          </form>
        )}

        {etapa === 'pronto' && sessao && (
          <div className="checkin__pronto">
            <CircleCheck size={36} strokeWidth={1.5} className="checkin__icone" />
            <h2 id="checkin-titulo">
              {entrouNoGrupo ? `Você entrou na mesa ${sessao.mesa}.` : `Mesa ${sessao.mesa} confirmada.`}
            </h2>
            {entrouNoGrupo ? (
              <p className="checkin__texto">Os pedidos deste celular vão com o número e o código da mesa.</p>
            ) : (
              <>
                <p className="checkin__texto">Este é o código da sua mesa:</p>
                <p className="checkin__codigo" aria-label={`Código ${sessao.codigo.split('').join(' ')}`}>
                  {sessao.codigo.split('').map((n, i) => (
                    <span key={i}>{n}</span>
                  ))}
                </p>
                <p className="checkin__texto">
                  Passe só para quem está com você: com o QR Code da mesa e esse código, a pessoa pede pelo próprio
                  celular. Ele também fica no topo do cardápio e na sacola.
                </p>
              </>
            )}
            <div className="checkin__acoes">
              {checkin.voltarParaSacola ? (
                <button type="button" className="botao botao--laranja botao--largo" onClick={fechar}>
                  Voltar para a sacola
                </button>
              ) : naPaginaDoCardapio ? (
                <button type="button" className="botao botao--laranja botao--largo" onClick={fechar}>
                  Ver cardápio
                </button>
              ) : (
                <a href={CAMINHO_CARDAPIO} className="botao botao--laranja botao--largo">
                  Ver cardápio
                </a>
              )}
            </div>
          </div>
        )}

        {erro && (
          <p className="checkin__erro" role="alert">
            {erro}
          </p>
        )}
      </div>
    </div>
  )
}
