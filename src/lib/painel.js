import { useCallback, useEffect, useRef } from 'react'
import { ErroServidor, chamar, renovarLogin } from './servidor'

// Login da equipe no painel. Só é guardado depois do código do app autenticador (aal2):
// um login só com senha nunca fica salvo no aparelho.
const CHAVE_STORAGE = 'expresso:painel'

// Nível do login, lido do próprio token: aal1 = só senha; aal2 = senha + app autenticador.
// É só para a tela decidir o que mostrar; quem barra de verdade é o banco (_da_equipe).
export function nivelDoToken(token) {
  try {
    const parte = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(parte)).aal ?? null
  } catch {
    return null
  }
}

export function carregarLogin() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE))
    return salvo?.tokenAcesso && nivelDoToken(salvo.tokenAcesso) === 'aal2' ? salvo : null
  } catch {
    return null
  }
}

export function salvarLogin(login) {
  try {
    if (login && nivelDoToken(login.tokenAcesso) === 'aal2') localStorage.setItem(CHAVE_STORAGE, JSON.stringify(login))
    else localStorage.removeItem(CHAVE_STORAGE)
  } catch {
    // Armazenamento bloqueado: o login vale até fechar a página
  }
}

// Resposta do Supabase Auth -> o que o painel guarda
export const paraLogin = (r) => ({
  tokenAcesso: r.access_token,
  tokenRenovar: r.refresh_token,
  expiraEm: Date.now() + r.expires_in * 1000,
  email: r.user?.email ?? '',
})

// Chama as funções do painel com o login atual, renovando o token quando ele está para vencer.
// Várias partes do painel chamam ao mesmo tempo: uma renovação só serve para todas.
export function usePainelApi(login, setLogin) {
  const atual = useRef(login)
  const renovando = useRef(null)

  useEffect(() => {
    atual.current = login
  }, [login])

  return useCallback(
    async (funcao, argumentos = {}) => {
      if (atual.current.expiraEm - 60_000 <= Date.now()) {
        renovando.current ??= renovarLogin(atual.current.tokenRenovar)
          .then((r) => {
            const novo = paraLogin(r)
            atual.current = novo
            setLogin(novo)
          })
          .catch((falha) => {
            setLogin(null)
            throw falha
          })
          .finally(() => {
            renovando.current = null
          })
        await renovando.current
      }

      try {
        return await chamar(funcao, argumentos, { tokenAcesso: atual.current.tokenAcesso })
      } catch (falha) {
        // Login vencido ou revogado no servidor: volta para a tela de entrar
        if (falha instanceof ErroServidor && falha.status === 401) setLogin(null)
        throw falha
      }
    },
    [setLogin],
  )
}

export function mensagemDeFalha(falha) {
  if (falha instanceof ErroServidor && falha.status === 403) {
    return 'Este login não tem acesso ao painel. Veja o passo 5 do arquivo supabase/mesas.sql.'
  }
  return 'Sem conexão com o servidor. Tentando de novo...'
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const diaHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Belem',
})

export const formatarHora = (data) => hora.format(new Date(data))
export const formatarDiaHora = (data) => diaHora.format(new Date(data))

export function haQuanto(data) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(data)) / 60_000))
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `há ${horas} h ${resto} min` : `há ${horas} h`
}
