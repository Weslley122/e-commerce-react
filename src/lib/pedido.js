import { preco } from './formato'

const CHAVE_MESA = 'expresso:mesa'

// Número da mesa que veio no QR Code: https://dominio/cardapio?mesa=7#k=<chave>
export function numeroDaUrl() {
  const valor = new URLSearchParams(window.location.search).get('mesa')
  return valor && /^\d{1,3}$/.test(valor) && Number(valor) > 0 ? Number(valor) : null
}

// Chave secreta da mesa, que só existe no QR Code impresso. Vai depois do "#" de propósito:
// essa parte do endereço nunca é enviada ao servidor do site, então não aparece em logs
// de acesso nem é repassada a outros sites.
export function chaveDaUrl() {
  const valor = new URLSearchParams(window.location.hash.slice(1)).get('k')
  return valor && /^[0-9a-f]{32}$/.test(valor) ? valor : null
}

// Sem o sistema de mesas configurado: a mesa do QR Code fica guardada na aba do
// navegador para não se perder quando o cliente passa do cardápio para a página
// inicial e volta.
export function mesaDaUrl() {
  const numero = numeroDaUrl()
  if (numero) {
    try {
      sessionStorage.setItem(CHAVE_MESA, String(numero))
    } catch {
      // Navegador sem armazenamento: a mesa vale só nesta página
    }
    return String(numero)
  }

  try {
    return sessionStorage.getItem(CHAVE_MESA) ?? ''
  } catch {
    return ''
  }
}

// Texto que vai pronto para o WhatsApp da loja. Os asteriscos viram negrito lá.
// codigo: código da mesa confirmada, para a loja conferir no painel.
export function mensagemDoPedido({ linhas, total, mesa, codigo, nome, observacao }) {
  const partes = [`*Pedido da mesa ${mesa}*`]
  if (codigo) partes.push(`Código da mesa: ${codigo}`)
  if (nome) partes.push(`Nome: ${nome}`)
  partes.push('')

  for (const l of linhas) {
    const opcao = l.opcao ? ` (${l.opcao})` : ''
    partes.push(`${l.qtd}x ${l.item.nome}${opcao}: ${preco(l.subtotal)}`)
  }

  partes.push('', `*Total: ${preco(total)}*`)
  if (observacao) partes.push('', `Observação: ${observacao}`)

  return partes.join('\n')
}
