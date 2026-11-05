import { createContext, useContext } from 'react'
import { cardapio } from '../data/site'

export const itensPorId = new Map(
  cardapio.flatMap((c) => c.itens.map((i) => [i.id, { ...i, categoria: c.categoria, alcool: Boolean(c.alcool) }])),
)

const CHAVE_STORAGE = 'expresso:sacola'
const CHAVE_ULTIMO = 'expresso:ultimo-pedido'

// "Pedir de novo" vale por uma noite: depois disso o último pedido é apagado do aparelho
const VALIDADE_ULTIMO = 12 * 60 * 60 * 1000

// Cada combinação de item + opção vira uma linha separada na sacola
export function chaveDaLinha(id, opcao) {
  return opcao ? `${id}|${opcao}` : id
}

// Descarta o que saiu do cardápio ou teve as opções alteradas desde que foi salvo
function linhaValida(l) {
  const item = itensPorId.get(l.id)
  if (!item || !(l.qtd > 0)) return false
  return item.opcoes ? item.opcoes.includes(l.opcao) : !l.opcao
}

export function carregarLinhas() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE))
    return Array.isArray(salvo) ? salvo.filter(linhaValida) : []
  } catch {
    return []
  }
}

// Guarda só item, opção e quantidade. O preço é sempre o do cardápio na hora de pedir de novo.
export function salvarUltimoPedido(linhas) {
  try {
    const resumo = linhas.map(({ id, opcao, qtd }) => ({ id, opcao, qtd }))
    localStorage.setItem(CHAVE_ULTIMO, JSON.stringify({ em: Date.now(), linhas: resumo }))
  } catch {
    // Armazenamento bloqueado: só não aparece o "Pedir de novo"
  }
}

// { em, linhas } do último pedido enviado neste aparelho, ou null se passou da validade
export function carregarUltimoPedido() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_ULTIMO))
    if (!salvo) return null
    const linhas = Array.isArray(salvo.linhas) ? salvo.linhas.filter(linhaValida) : []
    if (!(Date.now() - salvo.em < VALIDADE_ULTIMO) || linhas.length === 0) {
      localStorage.removeItem(CHAVE_ULTIMO)
      return null
    }
    return { em: salvo.em, linhas }
  } catch {
    return null
  }
}

export function esquecerUltimoPedido() {
  try {
    localStorage.removeItem(CHAVE_ULTIMO)
  } catch {
    // Nada a apagar
  }
}

export function salvarLinhas(linhas) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(linhas))
  } catch {
    // Navegação anônima ou armazenamento bloqueado: a sacola só não sobrevive ao recarregar
  }
}

export function reducer(linhas, acao) {
  switch (acao.tipo) {
    case 'adicionar': {
      const chave = chaveDaLinha(acao.id, acao.opcao)
      if (linhas.some((l) => l.chave === chave)) {
        return linhas.map((l) => (l.chave === chave ? { ...l, qtd: l.qtd + 1 } : l))
      }
      return [...linhas, { chave, id: acao.id, opcao: acao.opcao ?? null, qtd: 1 }]
    }
    case 'quantidade':
      return linhas
        .map((l) => (l.chave === acao.chave ? { ...l, qtd: l.qtd + acao.delta } : l))
        .filter((l) => l.qtd > 0)
    // Várias linhas de uma vez ("Pedir de novo"): soma no que já estiver na sacola
    case 'juntar':
      return acao.linhas.reduce((atual, nova) => {
        const chave = chaveDaLinha(nova.id, nova.opcao)
        if (atual.some((l) => l.chave === chave)) {
          return atual.map((l) => (l.chave === chave ? { ...l, qtd: l.qtd + nova.qtd } : l))
        }
        return [...atual, { chave, id: nova.id, opcao: nova.opcao ?? null, qtd: nova.qtd }]
      }, linhas)
    case 'remover':
      return linhas.filter((l) => l.chave !== acao.chave)
    case 'limpar':
      return []
    default:
      return linhas
  }
}

export const CarrinhoContext = createContext(null)

export function useCarrinho() {
  const valor = useContext(CarrinhoContext)
  if (!valor) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>')
  return valor
}
