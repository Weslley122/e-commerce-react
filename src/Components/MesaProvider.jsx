import { useCallback, useEffect, useMemo, useState } from 'react'
import { MesaContext, carregarSessao, salvarSessao } from '../lib/mesa'
import { chaveDaUrl, numeroDaUrl } from '../lib/pedido'
import { chamar, servidorConfigurado } from '../lib/servidor'

// Só existem com o sistema de mesas configurado; sem ele, a Sacola usa a mesa do QR Code direto
const MESA_DO_QR = servidorConfigurado ? numeroDaUrl() : null
const CHAVE_DO_QR = servidorConfigurado ? chaveDaUrl() : null

export default function MesaProvider({ children }) {
  const [sessao, setSessaoEstado] = useState(() => (servidorConfigurado ? carregarSessao() : null))

  // Janela de confirmação: null = fechada. Sem mesa ou sem chave, ela pede para escanear o QR Code.
  // voltarParaSacola: aberta pela sacola, que reabre quando a mesa for confirmada.
  const [checkin, setCheckin] = useState(() => {
    if (!MESA_DO_QR || carregarSessao()?.mesa === MESA_DO_QR) return null
    return { mesa: MESA_DO_QR, chave: CHAVE_DO_QR, voltarParaSacola: false }
  })

  const setSessao = useCallback((nova) => {
    salvarSessao(nova)
    setSessaoEstado(nova)
  }, [])

  // Ao abrir o site: tira a mesa e a chave do endereço (assim elas não ficam no histórico
  // nem vão junto se a pessoa compartilhar o link) e confere se a mesa guardada ainda vale
  useEffect(() => {
    if (!servidorConfigurado) return

    if (MESA_DO_QR || CHAVE_DO_QR) {
      const url = new URL(window.location.href)
      url.searchParams.delete('mesa')
      url.hash = ''
      window.history.replaceState(null, '', url)
    }

    const salva = carregarSessao()
    if (!salva) return
    chamar('conferir_mesa', { p_token: salva.token })
      .then((r) => {
        if (r.status === 'ok') return
        setSessao(null)
        // Escaneou a mesma mesa de antes, mas ela já tinha sido liberada: confirma de novo
        if (MESA_DO_QR === salva.mesa) setCheckin({ mesa: MESA_DO_QR, chave: CHAVE_DO_QR, voltarParaSacola: false })
      })
      .catch(() => {
        // Sem internet agora: mantém a mesa guardada; a sacola confere de novo antes do envio
      })
  }, [setSessao])

  const valor = useMemo(() => {
    async function usarResposta(promessa) {
      const r = await promessa
      if (r.status === 'ok') setSessao({ mesa: r.mesa, codigo: r.codigo, token: r.token })
      return r
    }

    return {
      ativo: servidorConfigurado,
      sessao,
      checkin,

      // Sem mesa e chave, a janela só explica como escanear o QR Code
      abrirCheckin: (voltarParaSacola = false) => setCheckin({ mesa: null, chave: null, voltarParaSacola }),
      fecharCheckin: () => setCheckin(null),

      ocupar: (mesa, chave) => usarResposta(chamar('ocupar_mesa', { p_mesa: mesa, p_chave: chave })),
      entrar: (mesa, chave, codigo) =>
        usarResposta(chamar('entrar_mesa', { p_mesa: mesa, p_chave: chave, p_codigo: codigo })),

      // Esquece a mesa só neste celular; quem mais estiver nela continua
      sair: () => setSessao(null),

      // A loja pode ter liberado a mesa enquanto o cliente olhava o cardápio
      conferir: async () => {
        const atual = carregarSessao()
        if (!atual) return
        try {
          const r = await chamar('conferir_mesa', { p_token: atual.token })
          if (r.status !== 'ok') setSessao(null)
        } catch {
          // Sem internet: deixa como está
        }
      },

      // Adia a liberação automática. Não espera a resposta: o WhatsApp abre na mesma hora.
      registrarPedido: () => {
        if (!sessao) return
        chamar('registrar_pedido', { p_token: sessao.token }, { manterViva: true }).catch(() => {})
      },
    }
  }, [sessao, checkin, setSessao])

  return <MesaContext value={valor}>{children}</MesaContext>
}
