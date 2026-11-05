// Rotas simples pelo caminho da URL. Em produção, o servidor precisa
// mandar qualquer caminho para o index.html (ver vercel.json).
export const caminho = window.location.pathname.replace(/\/+$/, '') || '/'

export const CAMINHO_CARDAPIO = '/cardapio'
export const naPaginaDoCardapio = caminho === CAMINHO_CARDAPIO

// Painel da loja para liberar mesas. Não aparece em nenhum link do site.
export const CAMINHO_PAINEL = '/painel'
export const naPaginaDoPainel = caminho === CAMINHO_PAINEL
