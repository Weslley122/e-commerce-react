// Conversa com o Supabase (banco do sistema de mesas, ver supabase/mesas.sql).
// Usa fetch direto na API, sem biblioteca, porque o site só chama algumas funções.

// Só aceita HTTPS: com http, tokens e chaves das mesas passariam abertos pela rede.
// A exceção é o próprio computador, para testes.
function origemSegura(endereco) {
  if (!endereco) return undefined
  try {
    const url = new URL(endereco)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol === 'https:' || (local && url.protocol === 'http:')) return url.origin
  } catch {
    // Endereço inválido cai no aviso abaixo
  }
  console.error('VITE_SUPABASE_URL precisa ser um endereço https://. Sistema de mesas desligado.')
  return undefined
}

const URL_SUPABASE = origemSegura(import.meta.env.VITE_SUPABASE_URL)
const CHAVE_PUBLICA = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem .env.local configurado, o site funciona como antes: mesa pelo QR Code, sem trava
export const servidorConfigurado = Boolean(URL_SUPABASE && CHAVE_PUBLICA)

export class ErroServidor extends Error {
  constructor(status, mensagem) {
    super(mensagem ?? `Servidor respondeu ${status}`)
    this.status = status
  }
}

function cabecalhos(tokenAcesso) {
  return {
    apikey: CHAVE_PUBLICA,
    'Content-Type': 'application/json',
    ...(tokenAcesso && { Authorization: `Bearer ${tokenAcesso}` }),
  }
}

async function lerResposta(resp) {
  const texto = await resp.text()
  let corpo = null
  try {
    corpo = texto ? JSON.parse(texto) : null
  } catch {
    // Resposta que não é JSON (página de erro do provedor, por exemplo)
  }
  if (!resp.ok) throw new ErroServidor(resp.status, corpo?.message ?? corpo?.error_description ?? corpo?.msg)
  return corpo
}

// Chama uma função do banco. tokenAcesso só no painel (login da equipe).
// manterViva: a chamada continua mesmo se a página abrir o WhatsApp logo em seguida.
export async function chamar(funcao, argumentos = {}, { tokenAcesso, manterViva = false } = {}) {
  const resp = await fetch(`${URL_SUPABASE}/rest/v1/rpc/${funcao}`, {
    method: 'POST',
    headers: cabecalhos(tokenAcesso),
    body: JSON.stringify(argumentos),
    keepalive: manterViva,
  })
  return lerResposta(resp)
}

// Login da equipe (Supabase Auth): senha e depois o código do app autenticador
async function auth(caminho, { metodo = 'POST', corpo, tokenAcesso } = {}) {
  const resp = await fetch(`${URL_SUPABASE}/auth/v1/${caminho}`, {
    method: metodo,
    headers: cabecalhos(tokenAcesso),
    body: corpo && JSON.stringify(corpo),
  })
  return lerResposta(resp)
}

export const entrarComSenha = (email, senha) => auth('token?grant_type=password', { corpo: { email, password: senha } })

export const renovarLogin = (tokenRenovar) =>
  auth('token?grant_type=refresh_token', { corpo: { refresh_token: tokenRenovar } })

export const buscarUsuario = (tokenAcesso) => auth('user', { metodo: 'GET', tokenAcesso })

export const cadastrarAutenticador = (tokenAcesso) =>
  auth('factors', {
    corpo: { factor_type: 'totp', friendly_name: `Painel da loja ${new Date().toISOString()}` },
    tokenAcesso,
  })

// Cadastro começado e não terminado: apaga para não acumular
export const removerAutenticador = (tokenAcesso, fatorId) =>
  auth(`factors/${fatorId}`, { metodo: 'DELETE', tokenAcesso })

export async function confirmarAutenticador(tokenAcesso, fatorId, codigo) {
  const desafio = await auth(`factors/${fatorId}/challenge`, { tokenAcesso })
  return auth(`factors/${fatorId}/verify`, { corpo: { challenge_id: desafio.id, code: codigo }, tokenAcesso })
}

// Encerra o login também no servidor, não só neste aparelho
export const encerrarLogin = (tokenAcesso) => auth('logout', { tokenAcesso }).catch(() => {})
