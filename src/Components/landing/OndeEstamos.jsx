import { useState } from 'react'
import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { site } from '../../data/site'
import { DIAS, sempreAberto, statusAgora, textoDia, textoStatus } from '../../lib/horario'
import { linkMapa, linkWhatsapp } from '../../lib/formato'

// Segunda primeiro, domingo por último, como numa placa de horário
const ordem = [1, 2, 3, 4, 5, 6, 0]

export default function OndeEstamos() {
  const [status] = useState(() => statusAgora(site.horarios))

  return (
    <section className="secao" id="a-loja">
      <div className="container">
        <div className="secao__cabeca">
          <h2>Informações extras.</h2>
        </div>

        {/* No computador: horário grande à esquerda, endereço e encomendas empilhados à direita */}
        <div className="loja__cartoes">
          <article className="loja__cartao loja__cartao--endereco">
            <MapPin size={20} strokeWidth={1.5} />
            <h3>Endereço</h3>
            <p>{site.endereco}</p>
            {site.referencia && <p className="mudo">{site.referencia}</p>}
            <a href={linkMapa(site)} target="_blank" rel="noreferrer" className="botao botao--contorno botao--pequeno">
              Abrir no mapa
            </a>
          </article>

          <article className="loja__cartao loja__cartao--destaque">
            <div className="loja__cartao-topo">
              <Clock size={20} strokeWidth={1.5} />
              <span className={`status status--pequeno ${status.aberto ? 'status--aberto' : ''}`}>
                <span className="status__ponto" />
                {status.aberto ? 'Aberto agora' : 'Fechado agora'}
              </span>
            </div>
            <h3>Horário</h3>
            {/* Loja aberta todos os dias o dia inteiro: um número só diz mais que sete linhas iguais */}
            {sempreAberto(site.horarios) ? (
              <p className="horario-24">
                <strong>24h</strong>
                <span>Todos os dias, de segunda a domingo.</span>
              </p>
            ) : (
              <>
                <ul className="horarios">
                  {ordem.map((d) => (
                    <li key={d}>
                      <span>{DIAS[d]}</span>
                      <span>{textoDia(site.horarios[d])}</span>
                    </li>
                  ))}
                </ul>
                <p className="mudo">{textoStatus(status)}.</p>
              </>
            )}
          </article>

          <article className="loja__cartao loja__cartao--encomendas">
            <MessageCircle size={20} strokeWidth={1.5} />
            <h3>Encomendas</h3>
            <p>
              Para aniversário ou festa em casa, encomende bebida e gelo com antecedência e retire no balcão.
            </p>
            {site.whatsapp ? (
              <a
                href={linkWhatsapp(site.whatsapp, 'Olá! Quero fazer uma encomenda.')}
                target="_blank"
                rel="noreferrer"
                className="botao botao--laranja botao--pequeno"
              >
                Falar no WhatsApp
              </a>
            ) : (
              <p className="mudo">Fale com a gente no balcão.</p>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
