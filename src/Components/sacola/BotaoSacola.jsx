import { ShoppingBag } from 'lucide-react'
import { useCarrinho } from '../../lib/carrinho'

export default function BotaoSacola() {
  const { totalItens, abrir } = useCarrinho()
  const rotulo = totalItens === 1 ? '1 item' : `${totalItens} itens`

  return (
    <button type="button" className="botao-sacola" onClick={abrir} aria-label={`Abrir sacola, ${rotulo}`}>
      <ShoppingBag size={18} />
      <span className="botao-sacola__texto">Sacola</span>
      {totalItens > 0 && <span className="botao-sacola__qtd">{totalItens}</span>}
    </button>
  )
}
