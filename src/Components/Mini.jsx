import { CheckCheck, MessageCircle, Plus, ShoppingBag } from 'lucide-react'
import { site } from '../data/site'
import { itensPorId } from '../lib/carrinho'
import { preco } from '../lib/formato'
import { mensagemDoPedido } from '../lib/pedido'

// Pedaços de tela usados na vitrine. São ilustrações em HTML, montadas
// com os itens reais do cardápio para os preços baterem com o site.

const exemplo = [
  { id: 'cerveja-lata', opcao: 'Gelada', qtd: 2 },
  { id: 'caipirinha', opcao: 'Limão', qtd: 1 },
].map((l) => {
  const item = itensPorId.get(l.id)
  return { ...l, item, subtotal: item.preco * l.qtd }
})
const totalExemplo = exemplo.reduce((s, l) => s + l.subtotal, 0)

export function MiniCardapio() {
  const itens = ['cerveja-lata', 'balde-long-neck', 'caipirinha'].map((id) => itensPorId.get(id))
  return (
    <div className="mini" aria-hidden="true">
      <div className="mini__topo">
        <span>Mesa 07</span>
        <strong>Cardápio</strong>
      </div>
      <ul className="mini__lista">
        {itens.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.nome}</strong>
              {/* Até duas opções cabem na linha ("Gelada ou Natural"); com mais, vale a descrição */}
              <small>{item.opcoes?.length <= 2 ? item.opcoes.join(' ou ') : item.descricao}</small>
            </div>
            <span className="mini__preco">{preco(item.preco)}</span>
            <span className="mini__mais">
              <Plus size={13} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MiniSacola() {
  return (
    <div className="mini" aria-hidden="true">
      <div className="mini__topo">
        <span>
          <ShoppingBag size={12} /> 3 itens
        </span>
        <strong>Sua sacola</strong>
      </div>
      <ul className="mini__lista">
        {exemplo.map((l) => (
          <li key={l.id}>
            <div>
              <strong>
                {l.qtd}x {l.item.nome}
              </strong>
              {l.opcao && <small className="mini__opcao">{l.opcao}</small>}
            </div>
            <span className="mini__preco">{preco(l.subtotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mini__total">
        <span>Total</span>
        <strong>{preco(totalExemplo)}</strong>
      </div>
      <div className="mini__botao">
        <MessageCircle size={13} /> Enviar pelo WhatsApp
      </div>
    </div>
  )
}

export function MiniWhatsapp() {
  const texto = mensagemDoPedido({ linhas: exemplo, total: totalExemplo, mesa: '7', nome: 'Carla', observacao: '' })
  return (
    <div className="mini mini--zap" aria-hidden="true">
      <div className="mini__zap-topo">
        <span className="mini__avatar">E</span>
        <div>
          <strong>{site.nome}</strong>
          <small>WhatsApp da loja</small>
        </div>
      </div>
      <div className="mini__conversa">
        <div className="mini__balao">
          {/* Asteriscos viram negrito no WhatsApp; aqui só removemos */}
          <p>{texto.replaceAll('*', '')}</p>
          <span>
            21:40 <CheckCheck size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}
