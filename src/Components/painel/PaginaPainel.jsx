import { useCallback, useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { site } from '../../data/site'
import { carregarLogin, salvarLogin, usePainelApi } from '../../lib/painel'
import { encerrarLogin, servidorConfigurado } from '../../lib/servidor'
import Logo from '../Logo'
import Alertas from './Alertas'
import Entrar from './Entrar'
import MesasOcupadas from './MesasOcupadas'
import QrMesas from './QrMesas'

// Painel da loja em /painel: mesas ocupadas, alertas de segurança e QR Codes das mesas.
// Entrar pede senha e o código do app autenticador (ver supabase/mesas.sql).
export default function PaginaPainel() {
  const [login, setLoginEstado] = useState(carregarLogin)

  const setLogin = useCallback((novo) => {
    salvarLogin(novo)
    setLoginEstado(novo)
  }, [])

  // Título da aba e fora dos buscadores
  useEffect(() => {
    document.title = `Painel de mesas | ${site.nome}`
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.append(robots)
    return () => robots.remove()
  }, [])

  function sair() {
    encerrarLogin(login.tokenAcesso)
    setLogin(null)
  }

  return (
    <div className="painel">
      <header className="painel__barra">
        <div className="container painel__barra-linha">
          <Logo />
          {login && (
            <div className="painel__conta">
              <span>{login.email}</span>
              <button type="button" className="icone-botao" onClick={sair} aria-label="Sair do painel">
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container painel__conteudo">
        {!servidorConfigurado ? (
          <div className="painel__caixa">
            <h1>Sistema de mesas não configurado</h1>
            <p>
              Siga os passos no começo do arquivo <code>supabase/mesas.sql</code> e preencha o <code>.env.local</code>{' '}
              com a URL e a chave do projeto (veja <code>.env.example</code>).
            </p>
          </div>
        ) : login ? (
          <Logado login={login} setLogin={setLogin} />
        ) : (
          <Entrar aoEntrar={setLogin} />
        )}
      </main>
    </div>
  )
}

function Logado({ login, setLogin }) {
  const api = usePainelApi(login, setLogin)

  return (
    <>
      <MesasOcupadas api={api} />
      <Alertas api={api} />
      <QrMesas api={api} />
    </>
  )
}
