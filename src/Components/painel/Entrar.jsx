import { useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { nivelDoToken, paraLogin } from '../../lib/painel'
import {
  ErroServidor,
  buscarUsuario,
  cadastrarAutenticador,
  confirmarAutenticador,
  entrarComSenha,
  removerAutenticador,
} from '../../lib/servidor'

const ERRO_CONEXAO = 'Não deu para conectar. Confira a internet e tente de novo.'

// Entrar no painel em duas etapas:
// senha     -> e-mail e senha
// codigo    -> código de 6 números do app autenticador já cadastrado
// cadastrar -> primeiro acesso: escanear o QR Code no app autenticador e confirmar um código
// O login só vale (e só é guardado) depois da segunda etapa.
export default function Entrar({ aoEntrar }) {
  const [etapa, setEtapa] = useState('senha')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  // Login só com senha (aal1): fica só na memória, para a segunda etapa
  const [parcial, setParcial] = useState(null)
  const [fator, setFator] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function rodar(acao) {
    setCarregando(true)
    setErro('')
    try {
      await acao()
    } catch (falha) {
      setErro(falha.mensagemTela ?? ERRO_CONEXAO)
    } finally {
      setCarregando(false)
    }
  }

  const comMensagem = (falha, mensagem) => Object.assign(falha, { mensagemTela: mensagem })

  const enviarSenha = (e) => {
    e.preventDefault()
    rodar(async () => {
      let r
      try {
        r = await entrarComSenha(email.trim(), senha)
      } catch (falha) {
        throw falha instanceof ErroServidor && falha.status === 400 ? comMensagem(falha, 'E-mail ou senha incorretos.') : falha
      }
      setSenha('')

      const login = paraLogin(r)
      const usuario = await buscarUsuario(login.tokenAcesso)
      const fatores = (usuario.factors ?? []).filter((f) => f.factor_type === 'totp')
      const pronto = fatores.find((f) => f.status === 'verified')

      setParcial(login)
      setCodigo('')
      if (pronto) {
        setFator({ id: pronto.id })
        setEtapa('codigo')
        return
      }

      // Primeiro acesso: apaga cadastros começados e não terminados e começa um novo
      for (const f of fatores) await removerAutenticador(login.tokenAcesso, f.id).catch(() => {})
      const novo = await cadastrarAutenticador(login.tokenAcesso)
      setFator({ id: novo.id, qr: novo.totp?.qr_code, segredo: novo.totp?.secret })
      setEtapa('cadastrar')
    })
  }

  const enviarCodigo = (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(codigo)) return setErro('O código do app tem 6 números.')
    rodar(async () => {
      let r
      try {
        r = await confirmarAutenticador(parcial.tokenAcesso, fator.id, codigo)
      } catch (falha) {
        setCodigo('')
        throw falha instanceof ErroServidor && falha.status < 500
          ? comMensagem(falha, 'Código incorreto ou vencido. Use o código que aparece agora no app.')
          : falha
      }
      const completo = { ...paraLogin(r), email: parcial.email }
      if (nivelDoToken(completo.tokenAcesso) !== 'aal2') throw new Error('Login sem a segunda etapa')
      setParcial(null)
      aoEntrar(completo)
    })
  }

  return (
    <div className="painel__caixa painel__entrar">
      <p className="rotulo">Painel da loja</p>

      {etapa === 'senha' && (
        <form className="painel__form" onSubmit={enviarSenha}>
          <h1>Entrar</h1>
          <label className="campo">
            <span>E-mail</span>
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="campo">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          <button type="submit" className="botao botao--laranja botao--largo" disabled={carregando}>
            {carregando ? <LoaderCircle size={18} className="girando" /> : 'Continuar'}
          </button>
        </form>
      )}

      {etapa === 'cadastrar' && (
        <form className="painel__form" onSubmit={enviarCodigo}>
          <h1>Proteja o painel</h1>
          <p>
            Abra um app autenticador no celular da loja (Google Authenticator, Microsoft Authenticator ou outro), toque
            em adicionar e escaneie o código abaixo. Depois, digite o número de 6 dígitos que aparecer no app.
          </p>
          {fator.qr && <img className="painel__qr-autenticador" src={fator.qr} alt="QR Code para o app autenticador" />}
          {fator.segredo && (
            <p className="painel__segredo">
              Sem câmera? Digite no app: <code>{fator.segredo}</code>
            </p>
          )}
          <CampoCodigo codigo={codigo} setCodigo={setCodigo} />
          <button type="submit" className="botao botao--laranja botao--largo" disabled={carregando}>
            {carregando ? <LoaderCircle size={18} className="girando" /> : 'Confirmar e entrar'}
          </button>
        </form>
      )}

      {etapa === 'codigo' && (
        <form className="painel__form" onSubmit={enviarCodigo}>
          <h1>Código do app</h1>
          <p>
            <ShieldCheck size={16} className="painel__icone-texto" /> Digite o número de 6 dígitos que aparece agora no
            app autenticador.
          </p>
          <CampoCodigo codigo={codigo} setCodigo={setCodigo} />
          <button type="submit" className="botao botao--laranja botao--largo" disabled={carregando}>
            {carregando ? <LoaderCircle size={18} className="girando" /> : 'Entrar'}
          </button>
        </form>
      )}

      {erro && (
        <p className="painel__erro" role="alert">
          {erro}
        </p>
      )}

      <p className="painel__dica">
        A loja nunca pede essa senha ou o código do app por telefone, WhatsApp ou e-mail. Se alguém pedir, é golpe.
      </p>
    </div>
  )
}

function CampoCodigo({ codigo, setCodigo }) {
  return (
    <label className="campo">
      <span>Código de 6 números</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="checkin__codigo-campo"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus
      />
    </label>
  )
}
