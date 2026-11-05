import { useEffect, useMemo, useReducer, useState } from 'react'
import { CarrinhoContext, carregarLinhas, chaveDaLinha, itensPorId, reducer, salvarLinhas } from '../lib/carrinho'

export default function CarrinhoProvider({ children }) {
  const [linhas, dispatch] = useReducer(reducer, undefined, carregarLinhas)
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    salvarLinhas(linhas)
  }, [linhas])

  const valor = useMemo(() => {
    // O preço sempre vem do cardápio atual, nunca do que ficou salvo no navegador
    const detalhadas = linhas.map((l) => {
      const item = itensPorId.get(l.id)
      return { ...l, item, subtotal: item.preco * l.qtd }
    })

    return {
      linhas: detalhadas,
      totalItens: linhas.reduce((soma, l) => soma + l.qtd, 0),
      total: detalhadas.reduce((soma, l) => soma + l.subtotal, 0),
      temAlcool: detalhadas.some((l) => l.item.alcool),
      qtdDe: (id, opcao) => linhas.find((l) => l.chave === chaveDaLinha(id, opcao))?.qtd ?? 0,

      aberta,
      abrir: () => setAberta(true),
      fechar: () => setAberta(false),

      adicionar: (id, opcao) => dispatch({ tipo: 'adicionar', id, opcao }),
      juntar: (novas) => dispatch({ tipo: 'juntar', linhas: novas }),
      mudarQuantidade: (chave, delta) => dispatch({ tipo: 'quantidade', chave, delta }),
      remover: (chave) => dispatch({ tipo: 'remover', chave }),
      limpar: () => dispatch({ tipo: 'limpar' }),
    }
  }, [linhas, aberta])

  return <CarrinhoContext value={valor}>{children}</CarrinhoContext>
}
