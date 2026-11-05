import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Altura aproximada de cada opção, para decidir se a lista abre para cima ou para baixo
const ALTURA_OPCAO = 42
// Espaço da barra "Ver sacola", que fica fixa no pé da tela do celular
const RESERVA_RODAPE = 80

// Lista de opções própria, no lugar do <select> do navegador, para abrir com uma
// transição curta e mostrar quantas unidades de cada opção já estão na sacola.
// Teclado: setas e Home/End andam, Enter ou espaço escolhem, Esc fecha.
export default function Seletor({ opcoes, valor, aoMudar, rotulo, qtdDe }) {
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const [paraCima, setParaCima] = useState(false)
  const raiz = useRef(null)
  const botao = useRef(null)
  const lista = useRef(null)
  const id = useId()

  // Fecha ao tocar fora da lista
  useEffect(() => {
    if (!aberto) return
    const fora = (e) => {
      if (!raiz.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [aberto])

  useEffect(() => {
    if (aberto) lista.current.focus({ preventScroll: true })
  }, [aberto])

  function abrir() {
    const caixa = botao.current.getBoundingClientRect()
    const altura = opcoes.length * ALTURA_OPCAO + 12
    setParaCima(caixa.bottom + altura > window.innerHeight - RESERVA_RODAPE && caixa.top > altura + 80)
    setDestaque(Math.max(0, opcoes.indexOf(valor)))
    setAberto(true)
  }

  function escolher(opcao) {
    aoMudar(opcao)
    setAberto(false)
    botao.current.focus()
  }

  function teclaNoBotao(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      abrir()
    }
  }

  function teclaNaLista(e) {
    const ultimo = opcoes.length - 1
    const mover = {
      ArrowDown: (i) => Math.min(ultimo, i + 1),
      ArrowUp: (i) => Math.max(0, i - 1),
      Home: () => 0,
      End: () => ultimo,
    }[e.key]

    if (mover) {
      e.preventDefault()
      setDestaque(mover)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      escolher(opcoes[destaque])
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setAberto(false)
      botao.current.focus()
    } else if (e.key === 'Tab') {
      setAberto(false)
    }
  }

  return (
    <div className={`seletor ${aberto ? 'seletor--aberto' : ''}`} ref={raiz}>
      <button
        type="button"
        ref={botao}
        className="seletor__botao"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        aria-label={`${rotulo}: ${valor}`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclaNoBotao}
      >
        {/* A chave faz o texto novo entrar com um leve fade ao trocar de opção */}
        <span key={valor} className="seletor__valor">
          {valor}
        </span>
        <ChevronDown size={16} className="seletor__seta" />
      </button>

      {aberto && (
        <ul
          id={id}
          ref={lista}
          role="listbox"
          tabIndex={-1}
          aria-label={rotulo}
          aria-activedescendant={`${id}-${destaque}`}
          className={`seletor__lista ${paraCima ? 'seletor__lista--cima' : ''}`}
          onKeyDown={teclaNaLista}
        >
          {opcoes.map((o, i) => {
            const naSacola = qtdDe(o)
            return (
              <li
                key={o}
                id={`${id}-${i}`}
                role="option"
                aria-selected={o === valor}
                className={i === destaque ? 'destaque' : ''}
                onPointerEnter={() => setDestaque(i)}
                onClick={() => escolher(o)}
              >
                <Check size={15} className="seletor__check" />
                <span>{o}</span>
                {naSacola > 0 && (
                  <span className="seletor__qtd" aria-label={`${naSacola} na sacola`}>
                    {naSacola}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
