import { useEffect, useRef, useState } from 'react'
import Celular from '../Celular'

const passos = [
  {
    titulo: 'Escaneie o QR Code',
    texto: 'Aponte a câmera para o QR Code da mesa e confirme que está nela. Quem chega com você entra com o código da mesa.',
  },
  {
    titulo: 'Monte a sacola',
    texto: 'Escolha os itens, gelada ou natural, e ajuste as quantidades. Dá para colocar seu nome e uma observação.',
  },
  {
    titulo: 'Envie pelo WhatsApp',
    texto: 'O pedido abre no WhatsApp da loja já escrito. Você toca em enviar e a loja confirma por lá.',
  },
]

// Quanto tempo cada cena do celular fica na tela, em ms: os três passos e o agradecimento no fim
const DURACOES = [3200, 4400, 3900, 3800]

// O celular mostra os passos em sequência e volta ao começo. Só roda enquanto está
// na tela; cada vez que reaparece, recomeça do passo 1. Com "reduzir movimento"
// ligado, fica parado na tela do cardápio.
function useDemonstracao() {
  const palco = useRef(null)
  const [estado, setEstado] = useState(() => {
    const estatico = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return { cena: estatico ? 1 : 0, rodada: 0, rodando: false, estatico }
  })

  useEffect(() => {
    if (estado.estatico) return

    const observador = new IntersectionObserver(
      ([entrada]) => {
        setEstado((e) => {
          if (entrada.isIntersecting) return e.rodando ? e : { ...e, cena: 0, rodada: e.rodada + 1, rodando: true }
          return { ...e, rodando: false }
        })
      },
      { threshold: 0.3 },
    )
    observador.observe(palco.current)
    return () => observador.disconnect()
  }, [estado.estatico])

  useEffect(() => {
    if (!estado.rodando) return
    const id = setTimeout(
      () => setEstado((e) => ({ ...e, cena: (e.cena + 1) % DURACOES.length })),
      DURACOES[estado.cena],
    )
    return () => clearTimeout(id)
  }, [estado.rodando, estado.cena, estado.rodada])

  let modo = 'pausado'
  if (estado.estatico) modo = 'estatico'
  else if (estado.rodando) modo = 'rodando'

  return { palco, modo, ...estado }
}

export default function Passos() {
  const { palco, modo, cena, rodada, estatico } = useDemonstracao()

  return (
    <section className="secao">
      {/* No computador: título e passos à esquerda, celular à direita */}
      <div className="container passos__grade">
        <div className="secao__cabeca passos__cabeca">
          <h2>Três passos, do QR Code ao pedido na mesa.</h2>
        </div>

        <div className="passos__palco" ref={palco}>
          <Celular cena={cena} modo={modo} rodada={rodada} />
        </div>

        {/* O passo que está no celular fica aceso, com uma barra marcando o tempo da cena
            na linha embaixo dele */}
        <ol className={`passos ${estatico ? '' : 'passos--demo'}`}>
          {passos.map((p, i) => {
            let estadoPasso = ''
            if (!estatico && i === cena) estadoPasso = 'passos__item--ativo'
            else if (!estatico && i < cena) estadoPasso = 'passos__item--feito'

            return (
              <li key={p.titulo} className={estadoPasso}>
                <span className="passos__numero">{i + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
                {i === cena && modo === 'rodando' && (
                  <span
                    key={`${rodada}-${cena}`}
                    className="passos__barra"
                    style={{ animationDuration: `${DURACOES[cena]}ms` }}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
