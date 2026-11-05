import { ShoppingBag } from 'lucide-react'
import { useCarrinho } from '../../lib/carrinho'
import { preco } from '../../lib/formato'

// Atalho fixo no rodapé da tela do celular enquanto a sacola tem itens
export default function BarraSacola() {
  const { totalItens, total, aberta, abrir } = useCarrinho()
  if (totalItens === 0 || aberta) return null

  return (
    <>
      <div className="barra-sacola__espaco" />
      <div className="barra-sacola">
        <button type="button" className="barra-sacola__botao" onClick={abrir}>
          <span>
            <ShoppingBag size={18} />
            Ver sacola
            <small>{totalItens === 1 ? '1 item' : `${totalItens} itens`}</small>
          </span>
          <strong>{preco(total)}</strong>
        </button>
      </div>
    </>
  )
}
