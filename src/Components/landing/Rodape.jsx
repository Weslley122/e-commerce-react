import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { site } from '../../data/site'
import { documentos } from '../../data/legal'
import { linkMapa, linkWhatsapp } from '../../lib/formato'
import { statusAgora, textoStatus } from '../../lib/horario'
import { CAMINHO_CARDAPIO } from '../../lib/rota'
import Logo from '../Logo'

const ano = new Date().getFullYear()

export default function Rodape() {
  const [status] = useState(() => statusAgora(site.horarios))

  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__grade">
          <div className="rodape__marca">
            <Logo />
            <p>
              Loja de conveniência em {site.cidade}, {site.estado}. Pedido pela mesa com QR Code, direto no navegador.
            </p>
          </div>

          <div>
            <h4>Página</h4>
            <ul>
              <li><a href="/#como-funciona">Como funciona</a></li>
              <li><a href={CAMINHO_CARDAPIO}>Cardápio</a></li>
              <li><a href="/#a-loja">A loja</a></li>
              <li><a href="/#duvidas">Dúvidas</a></li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              {documentos.map((d) => (
                <li key={d.caminho}>
                  <a href={d.caminho}>{d.titulo}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Contato</h4>
            <ul>
              {site.whatsapp && (
                <li>
                  <a href={linkWhatsapp(site.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a>
                </li>
              )}
              {site.instagram && (
                <li>
                  <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer">
                    Instagram @{site.instagram}
                  </a>
                </li>
              )}
              <li>
                <a href={linkMapa(site)} target="_blank" rel="noreferrer" className="rodape__endereco">
                  {site.endereco}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="rodape__base">
          <p>
            © {ano} {site.nome}
            {site.cnpj && ` · CNPJ ${site.cnpj}`}
          </p>
          <p>Venda de bebidas alcoólicas proibida para menores de 18 anos.</p>
          <p className={`status status--pequeno ${status.aberto ? 'status--aberto' : ''}`}>
            <span className="status__ponto" />
            {textoStatus(status)}
          </p>
          {/* "#top" sobe para o começo de qualquer página, sem sair dela */}
          <a href="#top" className="rodape__topo">
            Voltar ao topo <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  )
}
