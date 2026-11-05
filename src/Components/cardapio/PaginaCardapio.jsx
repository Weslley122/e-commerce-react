import { useEffect, useRef, useState } from 'react'
import { BellRing, Search, X } from 'lucide-react'
import { cardapio, site } from '../../data/site'
import { linkWhatsapp } from '../../lib/formato'
import { useMesa } from '../../lib/mesa'
import { mesaDaUrl } from '../../lib/pedido'
import { servidorConfigurado } from '../../lib/servidor'
import Foto from '../Foto'
import Revelar from '../Revelar'
import BotoesAdicionar from '../sacola/BotoesAdicionar'
import UltimaRodada from './UltimaRodada'

// Sem o sistema de mesas, vale a mesa do QR Code (guardada na aba do navegador)
const MESA_DO_QR = servidorConfigurado ? '' : mesaDaUrl()

// Chama alguém da loja até a mesa pelo WhatsApp, com o número da mesa já escrito.
// Só aparece quando a mesa é conhecida (QR Code lido ou mesa confirmada).
function ChamarAtendente() {
  const { ativo, sessao } = useMesa()
  const mesa = ativo ? sessao?.mesa : MESA_DO_QR
  if (!site.whatsapp || !mesa) return null

  return (
    <a
      href={linkWhatsapp(site.whatsapp, `Mesa ${mesa}: pode vir até a mesa, por favor?`)}
      target="_blank"
      rel="noreferrer"
      className="botao botao--contorno cardapio__chamar"
      aria-label={`Chamar atendente na mesa ${mesa} pelo WhatsApp`}
    >
      <BellRing size={18} />
      <span>Chamar atendente</span>
    </a>
  )
}

// Busca sem diferenciar acento nem maiúscula: "agua" acha "Água"
const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// "Sem álcool" vira "sem-alcool", usado na âncora de cada categoria
const slug = (texto) =>
  normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const categorias = cardapio.map((c) => ({ ...c, id: slug(c.categoria) }))

function filtrar(busca) {
  const termo = normalizar(busca.trim())
  if (!termo) return categorias

  return categorias
    .map((c) => ({
      ...c,
      // Busca também nas opções: "maracuja" acha o suco e a caipirinha
      itens: c.itens.filter((i) =>
        normalizar(`${c.categoria} ${i.nome} ${i.descricao} ${(i.opcoes ?? []).join(' ')}`).includes(termo),
      ),
    }))
    .filter((c) => c.itens.length > 0)
}

// Marca na barra a categoria que está passando na tela.
// É a última cujo topo já passou logo abaixo do cabeçalho e da barra de categorias.
function useCategoriaAtiva(ids) {
  const [ativa, setAtiva] = useState(ids[0])
  const chave = ids.join('|')

  useEffect(() => {
    const lista = chave.split('|')

    const atualizar = () => {
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let atual = lista[0]
      for (const id of lista) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) atual = id
      }
      // A última categoria pode ser curta demais para chegar ao topo
      setAtiva(noFim ? lista[lista.length - 1] : atual)
    }

    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    window.addEventListener('resize', atualizar)
    return () => {
      window.removeEventListener('scroll', atualizar)
      window.removeEventListener('resize', atualizar)
    }
  }, [chave])

  return ativa
}

export default function PaginaCardapio() {
  const [busca, setBusca] = useState('')
  const visiveis = filtrar(busca)
  const ativa = useCategoriaAtiva(visiveis.map((c) => c.id))
  const barra = useRef(null)

  useEffect(() => {
    document.title = `Cardápio | ${site.nome}`
  }, [])

  // No celular a barra rola para o lado: mantém a categoria ativa à vista
  useEffect(() => {
    const nav = barra.current
    const link = nav?.querySelector(`[data-id="${ativa}"]`)
    if (!link || nav.scrollWidth <= nav.clientWidth) return
    nav.scrollTo({ left: link.offsetLeft - 20 })
  }, [ativa])

  return (
    <main className="cardapio" id="topo">
      <div className="container">
        {/* A página começa direto na busca; o título fica só para leitores de tela */}
        <h1 className="so-leitor">Cardápio</h1>

        {/* Busca à esquerda; à direita, chamar alguém da loja até a mesa */}
        <div className="cardapio__barra">
          <label className="cardapio__busca">
            <Search size={18} />
            <input
              type="text"
              enterKeyHint="search"
              placeholder="Buscar no cardápio"
              aria-label="Buscar no cardápio"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                <X size={16} />
              </button>
            )}
          </label>
          <ChamarAtendente />
        </div>

        {/* Durante a busca, só os resultados */}
        <UltimaRodada oculta={Boolean(busca)} />

        <div className="cardapio__grade">
          <nav className="cardapio__nav" aria-label="Categorias" ref={barra}>
            {visiveis.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                data-id={c.id}
                className={c.id === ativa ? 'ativa' : ''}
                aria-current={c.id === ativa ? 'true' : undefined}
              >
                {c.categoria}
                <span>{c.itens.length}</span>
              </a>
            ))}
          </nav>

          <div>
            {visiveis.length === 0 ? (
              <div className="cardapio__vazio">
                <p>Nada encontrado para “{busca.trim()}”.</p>
                <button type="button" className="botao botao--contorno botao--pequeno" onClick={() => setBusca('')}>
                  Limpar busca
                </button>
              </div>
            ) : (
              visiveis.map((c) => (
                <section key={c.id} id={c.id} className="categoria" aria-labelledby={`${c.id}-titulo`}>
                  <div className="categoria__cabeca">
                    <h2 id={`${c.id}-titulo`}>{c.categoria}</h2>
                    <p>{c.texto}</p>
                    {c.alcool && <p className="categoria__aviso">Venda proibida para menores de 18 anos.</p>}
                  </div>

                  {/* Itens em destaque ocupam a linha inteira, com foto maior; os outros dividem a linha.
                      Com só dois itens, ficam lado a lado, um de cada metade, sem destaque. */}
                  <ul className={`categoria__itens ${c.itens.length === 2 ? 'categoria__itens--dupla' : ''}`}>
                    {c.itens.map((item) => (
                      <li
                        key={item.id}
                        className={`produto ${item.destaque && c.itens.length !== 2 ? 'produto--destaque' : ''}`}
                      >
                        <div className="produto__topo">
                          <Revelar className="produto__foto revelar--foto">
                            <Foto src={item.foto} descricao={item.nome} proporcao="1 / 1" />
                          </Revelar>
                          <div className="produto__info">
                            <h3>{item.nome}</h3>
                            <p>{item.descricao}</p>
                          </div>
                        </div>
                        <BotoesAdicionar item={item} mostrarPreco />
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
