const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function preco(valor) {
  return brl.format(valor)
}

// '5591999999999' vira '(91) 99999-9999'
export function formatarTelefone(numero) {
  const local = numero.startsWith('55') ? numero.slice(2) : numero
  const ddd = local.slice(0, 2)
  const resto = local.slice(2)
  return `(${ddd}) ${resto.slice(0, -4)}-${resto.slice(-4)}`
}

export function linkWhatsapp(numero, texto) {
  const base = `https://wa.me/${numero}`
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

export function linkMapa(site) {
  if (site.mapa) return site.mapa
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.nome}, ${site.endereco}`)}`
}
