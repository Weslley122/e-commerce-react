import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from '../Logo'
import BotaoSacola from '../sacola/BotaoSacola'
import { CAMINHO_CARDAPIO, naPaginaDoCardapio } from '../../lib/rota'

// Com "/" na frente, os links também funcionam a partir do cardápio e das páginas legais
const links = [
  { href: '/#como-funciona', texto: 'Como funciona' },
  { href: CAMINHO_CARDAPIO, texto: 'Cardápio' },
  { href: '/#a-loja', texto: 'A loja' },
  { href: '/#duvidas', texto: 'Dúvidas' },
]

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false)

  // Menu aberto no celular: fecha com Esc e trava a rolagem da página por baixo
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('keydown', aoTeclar)
    document.documentElement.classList.add('menu-aberto')
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.documentElement.classList.remove('menu-aberto')
    }
  }, [aberto])

  return (
    <header className="cabecalho">
      {/* Fundo escuro atrás do menu: tocar fora fecha */}
      {aberto && <div className="cabecalho__fundo" onClick={() => setAberto(false)} />}

      <div className="container cabecalho__linha">
        <Logo />

        <nav id="menu-principal" className={`cabecalho__nav ${aberto ? 'aberto' : ''}`} aria-label="Principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={naPaginaDoCardapio && l.href === CAMINHO_CARDAPIO ? 'page' : undefined}
              onClick={() => setAberto(false)}
            >
              {l.texto}
            </a>
          ))}
        </nav>

        <div className="cabecalho__acoes">
          <BotaoSacola />
          {!naPaginaDoCardapio && (
            <a href={CAMINHO_CARDAPIO} className="botao botao--laranja botao--pequeno cabecalho__cta">
              Ver cardápio
            </a>
          )}
          <button
            type="button"
            className="cabecalho__menu"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={aberto}
            aria-controls="menu-principal"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
