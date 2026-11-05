import { createContext, useContext } from 'react'

// Mesa confirmada neste celular: { mesa, codigo, token }.
// Fica no aparelho até a mesa ser liberada (pela loja ou depois de 3 horas sem pedido);
// quem diz se ela ainda vale é o servidor.
const CHAVE_STORAGE = 'expresso:mesa-confirmada'

// O que vem do armazenamento do navegador pode ter sido alterado à mão:
// só aceita exatamente o formato que o servidor devolve
function sessaoValida(s) {
  return (
    Number.isInteger(s?.mesa) &&
    s.mesa >= 1 &&
    s.mesa <= 999 &&
    /^\d{4}$/.test(s.codigo) &&
    /^[0-9a-f]{32}$/.test(s.token)
  )
}

export function carregarSessao() {
  try {
    const salva = JSON.parse(localStorage.getItem(CHAVE_STORAGE))
    return sessaoValida(salva) ? { mesa: salva.mesa, codigo: salva.codigo, token: salva.token } : null
  } catch {
    return null
  }
}

export function salvarSessao(sessao) {
  try {
    if (sessao && sessaoValida(sessao)) localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao))
    else localStorage.removeItem(CHAVE_STORAGE)
  } catch {
    // Armazenamento bloqueado: a mesa vale até recarregar a página
  }
}

export const MesaContext = createContext(null)

export function useMesa() {
  const valor = useContext(MesaContext)
  if (!valor) throw new Error('useMesa precisa estar dentro de <MesaProvider>')
  return valor
}
