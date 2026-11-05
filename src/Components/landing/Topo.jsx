import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { site } from '../../data/site'
import { statusAgora, textoStatus } from '../../lib/horario'
import { CAMINHO_CARDAPIO } from '../../lib/rota'

const fatos = ['QR Code em cada mesa', 'Sem cadastro', 'Gelada ou natural', 'Pix, cartão ou dinheiro']

export default function Topo() {
  const [status, setStatus] = useState(() => statusAgora(site.horarios))

  // Atualiza a cada minuto para não mostrar "aberto" depois de fechar
  useEffect(() => {
    const id = setInterval(() => setStatus(statusAgora(site.horarios)), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="topo" id="topo">
      {/* Só texto, assimétrico: título grande à esquerda; status, texto e botões à direita,
          descendo até a base do título; o aviso do aplicativo fica embaixo do título */}
      <div className="container topo__grade">
        <h1>Peça pelo celular, direto da sua mesa.</h1>

        <div className="topo__lado">
          <p className={`status ${status.aberto ? 'status--aberto' : ''}`}>
            <span className="status__ponto" />
            {textoStatus(status)}
          </p>
          <p className="topo__sub">
            Escaneie o QR Code da mesa, monte o pedido na sacola e envie. Ele chega no WhatsApp da loja com o número da
            sua mesa, sem cadastro e sem baixar aplicativo.
          </p>

          <div className="botoes">
            <a href={CAMINHO_CARDAPIO} className="botao botao--laranja">
              Ver cardápio
            </a>
            <a href="#como-funciona" className="botao botao--contorno">
              Como funciona
            </a>
          </div>
        </div>

        <p className="topo__nota">
          <Info size={16} />
          <span>
            <strong>Ainda não temos aplicativo.</strong> Por enquanto, tudo funciona aqui pelo site, direto no navegador
            do celular. O app está nos nossos planos.
          </span>
        </p>
      </div>

      <div className="topo__fatos">
        <div className="container">
          <span className="topo__fatos-rotulo">
            {site.nome} · {site.cidade}, {site.estado}
          </span>
          <ul>
            {fatos.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
