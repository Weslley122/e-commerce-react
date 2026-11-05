import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash } from 'lucide-react'
import { chaveDaLinha, useCarrinho } from '../../lib/carrinho'
import { preco } from '../../lib/formato'
import Seletor from './Seletor'

// Lista de opção (já começa na primeira) + botão que vira contador depois do primeiro toque.
// Com mostrarPreco, o preço fica na mesma linha do botão (usado nos cartões do cardápio).
export default function BotoesAdicionar({ item, mostrarPreco = false }) {
  const { adicionar, mudarQuantidade, remover, qtdDe } = useCarrinho()
  const [opcao, setOpcao] = useState(item.opcoes?.[0] ?? null)

  const qtd = qtdDe(item.id, opcao)
  const chave = chaveDaLinha(item.id, opcao)
  const nome = opcao ? `${item.nome}, ${opcao}` : item.nome

  return (
    <div className={`adicionar ${mostrarPreco ? 'adicionar--cartao' : ''}`}>
      {item.opcoes && (
        <Seletor
          opcoes={item.opcoes}
          valor={opcao}
          aoMudar={setOpcao}
          rotulo={`Opções de ${item.nome}`}
          qtdDe={(o) => qtdDe(item.id, o)}
        />
      )}

      <div className="adicionar__acao">
        {mostrarPreco && <strong className="adicionar__preco">{preco(item.preco)}</strong>}

        {qtd === 0 ? (
          <button
            type="button"
            className="adicionar__botao"
            onClick={() => adicionar(item.id, opcao)}
            aria-label={`Adicionar ${nome} à sacola`}
          >
            <ShoppingBag size={16} />
            Adicionar
          </button>
        ) : (
          <div className="qtd" role="group" aria-label={`Quantidade de ${nome}`}>
            <button
              type="button"
              onClick={() => (qtd === 1 ? remover(chave) : mudarQuantidade(chave, -1))}
              aria-label={qtd === 1 ? `Tirar ${nome} da sacola` : `Diminuir ${nome}`}
            >
              {qtd === 1 ? <Trash size={15} /> : <Minus size={15} />}
            </button>
            <span aria-live="polite">{qtd}</span>
            <button type="button" onClick={() => mudarQuantidade(chave, 1)} aria-label={`Aumentar ${nome}`}>
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
