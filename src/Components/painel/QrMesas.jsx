import { useCallback, useEffect, useState } from 'react'
import { Download, LoaderCircle, Printer, X } from 'lucide-react'
import { formatarDiaHora, mensagemDeFalha } from '../../lib/painel'
import { cartaoDoQr } from '../../lib/qr'
import { CAMINHO_CARDAPIO } from '../../lib/rota'

// QR Codes das mesas. Cada QR leva uma chave secreta nova; o banco guarda só o hash,
// então o QR só pode ser visto na hora em que é gerado. Gerar de novo invalida o antigo.
export default function QrMesas({ api }) {
  const [mesas, setMesas] = useState(null)
  const [erro, setErro] = useState('')
  const [armada, setArmada] = useState(null)
  const [gerando, setGerando] = useState(null)
  const [gerado, setGerado] = useState(null)

  const atualizar = useCallback(async () => {
    try {
      setMesas(await api('painel_lista_mesas'))
      setErro('')
    } catch (falha) {
      setErro(mensagemDeFalha(falha))
    }
  }, [api])

  useEffect(() => {
    const primeira = setTimeout(atualizar, 0)
    return () => clearTimeout(primeira)
  }, [atualizar])

  useEffect(() => {
    if (!armada) return
    const id = setTimeout(() => setArmada(null), 4000)
    return () => clearTimeout(id)
  }, [armada])

  async function gerar(mesa) {
    // Trocar um QR que já existe pede confirmação: o cartão impresso para de funcionar
    if (mesa.tem_qr && armada !== mesa.mesa) return setArmada(mesa.mesa)
    setArmada(null)
    setGerando(mesa.mesa)
    try {
      const r = await api('painel_gerar_qr', { p_mesa: mesa.mesa })
      // A chave vai depois do "#": o navegador do cliente não a envia ao servidor do site
      const endereco = `${window.location.origin}${CAMINHO_CARDAPIO}?mesa=${r.mesa}#k=${r.chave}`
      setGerado({ mesa: r.mesa, imagem: await cartaoDoQr({ endereco, mesa: r.mesa }) })
      await atualizar()
    } catch (falha) {
      setErro(mensagemDeFalha(falha))
    } finally {
      setGerando(null)
    }
  }

  return (
    <section className="painel__secao">
      <h2 className="painel__titulo-secao">QR Codes das mesas</h2>
      <p className="painel__resumo">
        Gere e imprima um QR Code por mesa. Por segurança, ele só aparece na hora em que é gerado: baixe ou imprima antes
        de fechar. Se um cartão sumir ou parecer adulterado, gere um novo: o antigo para de funcionar na hora.
      </p>

      {erro && (
        <p className="painel__erro" role="alert">
          {erro}
        </p>
      )}

      {gerado && (
        <div className="qr-gerado">
          <button type="button" className="icone-botao qr-gerado__fechar" onClick={() => setGerado(null)} aria-label="Fechar QR Code">
            <X size={18} />
          </button>
          <img src={gerado.imagem} alt={`QR Code da mesa ${gerado.mesa}`} />
          <div className="qr-gerado__acoes">
            <a className="botao botao--laranja" href={gerado.imagem} download={`mesa-${gerado.mesa}-qr.svg`}>
              <Download size={16} /> Baixar
            </a>
            <button type="button" className="botao botao--contorno" onClick={() => window.print()}>
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      )}

      {mesas?.length === 0 && (
        <p className="painel__vazio">Nenhuma mesa cadastrada. Veja o passo 5 do arquivo supabase/mesas.sql.</p>
      )}

      {mesas?.length > 0 && (
        <ul className="qr-mesas">
          {mesas.map((m) => (
            <li key={m.mesa}>
              <div>
                <strong>Mesa {m.mesa}</strong>
                <small>{m.tem_qr ? `QR de ${formatarDiaHora(m.qr_criado_em)}` : 'Sem QR Code ainda'}</small>
              </div>
              <button
                type="button"
                className={`botao botao--pequeno ${armada === m.mesa ? 'botao--laranja' : 'botao--contorno'}`}
                onClick={() => gerar(m)}
                disabled={gerando !== null}
              >
                {gerando === m.mesa ? (
                  <LoaderCircle size={15} className="girando" />
                ) : armada === m.mesa ? (
                  'Toque de novo: o antigo para'
                ) : m.tem_qr ? (
                  'Gerar novo'
                ) : (
                  'Gerar QR'
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
