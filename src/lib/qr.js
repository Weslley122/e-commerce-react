import { site } from '../data/site'

// Cartão do QR Code de uma mesa, em SVG, pronto para imprimir.
// O domínio vai escrito embaixo: o cliente confere o endereço antes de abrir, e fica
// mais fácil perceber um adesivo falso colado por cima (golpe do QR Code trocado).
// A biblioteca só é baixada quando a loja gera um QR, não pesa no site do cliente.

const MODULO = 10
const MARGEM = 4 * MODULO

export async function cartaoDoQr({ endereco, mesa }) {
  const { default: qrcode } = await import('qrcode-generator')
  const qr = qrcode(0, 'M')
  qr.addData(endereco)
  qr.make()

  const n = qr.getModuleCount()
  const lado = n * MODULO + MARGEM * 2
  const altura = lado + 110

  let caminho = ''
  for (let linha = 0; linha < n; linha++) {
    for (let coluna = 0; coluna < n; coluna++) {
      if (qr.isDark(linha, coluna)) {
        caminho += `M${MARGEM + coluna * MODULO} ${MARGEM + linha * MODULO}h${MODULO}v${MODULO}h-${MODULO}z`
      }
    }
  }

  // Número e domínio vêm do próprio site (nada digitado por alguém), mas o número é
  // convertido para inteiro mesmo assim antes de entrar no SVG
  const numero = Number.parseInt(mesa, 10)
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${altura}" width="${lado}" height="${altura}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<path d="${caminho}" fill="#000000"/>`,
    `<text x="${lado / 2}" y="${lado + 34}" font-family="Arial, sans-serif" font-size="34" font-weight="700" text-anchor="middle">Mesa ${numero}</text>`,
    `<text x="${lado / 2}" y="${lado + 72}" font-family="Arial, sans-serif" font-size="19" text-anchor="middle">Escaneie para pedir</text>`,
    `<text x="${lado / 2}" y="${lado + 98}" font-family="Arial, sans-serif" font-size="17" text-anchor="middle" fill="#555555">${site.dominio}</text>`,
    `</svg>`,
  ].join('')

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
