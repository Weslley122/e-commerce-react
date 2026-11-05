import { useEffect, useState } from 'react'
import { CircleCheck, Clock, Info, MessageCircle, Minus, Plus, ShoppingBag, Star, Trash, X } from 'lucide-react'
import { site } from '../../data/site'
import { itensPorId, salvarUltimoPedido, useCarrinho } from '../../lib/carrinho'
import { linkWhatsapp, preco } from '../../lib/formato'
import { statusAgora, textoStatus } from '../../lib/horario'
import { useMesa } from '../../lib/mesa'
import { mensagemDoPedido, mesaDaUrl } from '../../lib/pedido'
import { CAMINHO_CARDAPIO, naPaginaDoCardapio } from '../../lib/rota'
import { servidorConfigurado } from '../../lib/servidor'
import Seletor from './Seletor'

// Sem o sistema de mesas, vale a mesa do QR Code ou a digitada aqui na sacola
const MESA_DO_QR = servidorConfigurado ? '' : mesaDaUrl()

const ID_LONG_NECK = 'long-neck'
const ID_BALDE = 'balde-long-neck'
const NO_BALDE = 6

// Os dados do formulário ficam aqui fora do painel para não se perderem
// quando o cliente fecha a sacola e volta ao cardápio.
export default function Sacola() {
  const { aberta } = useCarrinho()
  const [form, setForm] = useState({ mesa: MESA_DO_QR, nome: '', observacao: '', maior18: false })
  const [enviado, setEnviado] = useState(false)

  if (!aberta) return null
  return <Painel form={form} setForm={setForm} enviado={enviado} setEnviado={setEnviado} />
}

function Painel({ form, setForm, enviado, setEnviado }) {
  const carrinho = useCarrinho()
  const { linhas, totalItens, total, temAlcool, fechar } = carrinho
  const { ativo: mesaComTrava, sessao, conferir, abrirCheckin, sair, registrarPedido } = useMesa()
  const [status] = useState(() => statusAgora(site.horarios))

  // A loja pode ter liberado a mesa enquanto o cliente escolhia
  useEffect(() => {
    conferir()
  }, [conferir])

  // Esc fecha e a página de trás não rola enquanto a sacola está aberta
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', aoTeclar)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflow
    }
  }, [fechar])

  const campo = (nome) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [nome]: valor }))
  }

  const mesa = mesaComTrava ? (sessao ? String(sessao.mesa) : '') : form.mesa.trim()
  const pendencias = []
  if (!mesa) pendencias.push(mesaComTrava ? 'Confirme a sua mesa para enviar.' : 'Informe o número da mesa.')
  if (temAlcool && !form.maior18) pendencias.push('Confirme que tem 18 anos ou mais.')
  if (!site.whatsapp) pendencias.push('O WhatsApp da loja ainda não foi configurado.')

  const link =
    pendencias.length === 0
      ? linkWhatsapp(
          site.whatsapp,
          mensagemDoPedido({
            linhas,
            total,
            mesa,
            codigo: sessao?.codigo,
            nome: form.nome.trim(),
            observacao: form.observacao.trim(),
          }),
        )
      : null

  function novoPedido() {
    carrinho.limpar()
    setForm((f) => ({ ...f, observacao: '', maior18: false }))
    setEnviado(false)
    fechar()
  }

  return (
    <div className="sacola">
      <div className="sacola__fundo" onClick={fechar} />

      <aside className="sacola__painel" role="dialog" aria-modal="true" aria-labelledby="sacola-titulo">
        <header className="sacola__topo">
          <div>
            <h2 id="sacola-titulo">Sua sacola</h2>
            {totalItens > 0 && !enviado && <span>{totalItens === 1 ? '1 item' : `${totalItens} itens`}</span>}
          </div>
          <button type="button" className="icone-botao" onClick={fechar} aria-label="Fechar sacola" autoFocus>
            <X size={20} />
          </button>
        </header>

        {enviado ? (
          <div className="sacola__estado">
            <CircleCheck size={40} strokeWidth={1.5} className="sacola__estado-icone" />
            <h3>Pedido pronto no WhatsApp</h3>
            <p>Confira a mensagem no WhatsApp e toque em enviar. A loja confirma o pedido por lá.</p>
            <div className="sacola__estado-acoes">
              <button type="button" className="botao botao--laranja" onClick={novoPedido}>
                Fazer outro pedido
              </button>
              <a href={link ?? undefined} target="_blank" rel="noreferrer" className="botao botao--contorno">
                Abrir o WhatsApp de novo
              </a>
            </div>

            {site.avaliacaoGoogle && (
              <div className="sacola__avaliar">
                <p>Gostou de pedir pela mesa? Uma avaliação no Google ajuda mais gente a achar a loja.</p>
                <a href={site.avaliacaoGoogle} target="_blank" rel="noreferrer" className="botao botao--contorno">
                  <Star size={16} /> Avaliar no Google
                </a>
              </div>
            )}
          </div>
        ) : linhas.length === 0 ? (
          <div className="sacola__estado">
            <ShoppingBag size={40} strokeWidth={1.5} className="sacola__estado-icone" />
            <h3>Sua sacola está vazia</h3>
            <p>Escolha no cardápio e toque em adicionar.</p>
            {naPaginaDoCardapio ? (
              <button type="button" className="botao botao--laranja" onClick={fechar}>
                Voltar ao cardápio
              </button>
            ) : (
              <a href={CAMINHO_CARDAPIO} className="botao botao--laranja">
                Ver cardápio
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="sacola__corpo">
              <ul className="sacola__linhas">
                {linhas.map((l) => (
                  <Linha key={l.chave} linha={l} />
                ))}
              </ul>

              <SugestaoBalde />

              <div className="sacola__form">
                {mesaComTrava ? (
                  sessao ? (
                    <div className="sacola__mesa">
                      <p>
                        Mesa <strong>{sessao.mesa}</strong>
                      </p>
                      <span>Código {sessao.codigo}</span>
                      {/* Confirmou a mesa errada: esquece neste celular e abre a confirmação de novo,
                          que volta para a sacola quando terminar */}
                      <button
                        type="button"
                        className="sacola__mesa-trocar"
                        onClick={() => {
                          sair()
                          fechar()
                          abrirCheckin(true)
                        }}
                      >
                        Trocar mesa
                      </button>
                    </div>
                  ) : (
                    <div className="sacola__mesa sacola__mesa--pendente">
                      <p>Confirme a sua mesa para a loja saber onde entregar.</p>
                      <button
                        type="button"
                        className="botao botao--contorno botao--pequeno"
                        onClick={() => {
                          fechar()
                          abrirCheckin(true)
                        }}
                      >
                        Confirmar mesa
                      </button>
                    </div>
                  )
                ) : MESA_DO_QR ? (
                  <p className="sacola__mesa">
                    Mesa <strong>{MESA_DO_QR}</strong>
                  </p>
                ) : (
                  <label className="campo">
                    <span>Número da mesa</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      placeholder="Está no cartão da mesa"
                      value={form.mesa}
                      onChange={(e) => setForm((f) => ({ ...f, mesa: e.target.value.replace(/\D/g, '') }))}
                    />
                  </label>
                )}

                <label className="campo">
                  <span>
                    Seu nome <small>(opcional)</small>
                  </span>
                  <input type="text" maxLength={40} placeholder="Para separar a conta" value={form.nome} onChange={campo('nome')} />
                </label>

                <label className="campo">
                  <span>
                    Observação <small>(opcional)</small>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Ex.: caipirinha com pouco açúcar"
                    value={form.observacao}
                    onChange={campo('observacao')}
                  />
                </label>

                {temAlcool && (
                  <label className="checagem">
                    <input type="checkbox" checked={form.maior18} onChange={campo('maior18')} />
                    <span>Tenho 18 anos ou mais. O atendente pode pedir documento na entrega.</span>
                  </label>
                )}

                {!status.aberto && (
                  <p className="sacola__nota sacola__nota--alerta">
                    <Clock size={16} />
                    {textoStatus(status)}.
                  </p>
                )}
              </div>
            </div>

            <footer className="sacola__rodape">
              <div className="sacola__total">
                <span>Total</span>
                <strong>{preco(total)}</strong>
              </div>

              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="botao botao--laranja botao--largo"
                  onClick={() => {
                    registrarPedido()
                    salvarUltimoPedido(linhas)
                    setEnviado(true)
                  }}
                >
                  <MessageCircle size={18} /> Enviar pedido pelo WhatsApp
                </a>
              ) : (
                <button type="button" className="botao botao--laranja botao--largo" disabled>
                  <MessageCircle size={18} /> Enviar pedido pelo WhatsApp
                </button>
              )}

              {pendencias.length > 0 ? (
                <p className="sacola__nota">{pendencias[0]}</p>
              ) : (
                <p className="sacola__nota">
                  <Info size={14} />
                  O pedido abre no WhatsApp da loja já escrito. Só falta tocar em enviar. O pagamento é no balcão: o
                  site nunca pede cartão, Pix ou senha.
                </p>
              )}

              <p className="sacola__nota sacola__legal">
                Ao enviar, você concorda com os{' '}
                <a href="/termos" target="_blank" rel="noreferrer">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" rel="noreferrer">
                  política de privacidade
                </a>
                .
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

// Com 5 ou mais long necks avulsas na sacola, mostra a conta do balde (6 com gelo) usando os
// preços do cardápio e troca na hora. Some se o balde não compensar ou se já estiver na sacola.
function SugestaoBalde() {
  const { linhas, adicionar, mudarQuantidade, qtdDe } = useCarrinho()
  const avulsa = itensPorId.get(ID_LONG_NECK)
  const balde = itensPorId.get(ID_BALDE)
  const [marca, setMarca] = useState(balde?.opcoes?.[0] ?? null)

  if (!avulsa || !balde || linhas.some((l) => l.id === ID_BALDE)) return null

  const avulsas = linhas.filter((l) => l.id === ID_LONG_NECK)
  const qtd = avulsas.reduce((soma, l) => soma + l.qtd, 0)
  if (qtd < NO_BALDE - 1) return null

  // Quanto o cliente paga hoje pelas long necks que vão sair da sacola, e a diferença para o balde
  const trocadas = Math.min(qtd, NO_BALDE)
  const hoje = trocadas * avulsa.preco
  const diferenca = balde.preco - hoje

  let texto
  if (diferenca < 0) {
    texto = `${trocadas} long necks avulsas saem ${preco(hoje)}. O balde traz ${NO_BALDE}, com gelo, por ${preco(balde.preco)}: ${preco(-diferenca)} a menos.`
  } else if (qtd < NO_BALDE && diferenca <= avulsa.preco) {
    texto = `Suas ${qtd} long necks saem ${preco(hoje)}. Por mais ${preco(diferenca)}, o balde traz ${NO_BALDE}, com gelo.`
  } else {
    return null
  }

  function trocar() {
    let falta = trocadas
    for (const l of avulsas) {
      if (falta === 0) break
      const tira = Math.min(l.qtd, falta)
      mudarQuantidade(l.chave, -tira)
      falta -= tira
    }
    adicionar(ID_BALDE, marca)
  }

  return (
    <section className="sugestao" aria-labelledby="sugestao-titulo">
      <h3 id="sugestao-titulo">Leve no balde</h3>
      <p>{texto}</p>
      <div className="sugestao__acao">
        {balde.opcoes && (
          <Seletor
            opcoes={balde.opcoes}
            valor={marca}
            aoMudar={setMarca}
            rotulo="Marca do balde"
            qtdDe={(o) => qtdDe(ID_BALDE, o)}
          />
        )}
        <button type="button" className="botao botao--laranja" onClick={trocar}>
          Trocar pelo balde
        </button>
      </div>
    </section>
  )
}

function Linha({ linha }) {
  const { mudarQuantidade, remover } = useCarrinho()
  const { chave, item, opcao, qtd, subtotal } = linha

  return (
    <li className="linha">
      <div className="linha__info">
        <strong>{item.nome}</strong>
        {opcao && <span className="linha__opcao">{opcao}</span>}
        <small>{preco(item.preco)} cada</small>
      </div>

      <div className="linha__lado">
        <strong>{preco(subtotal)}</strong>
        <div className="contador">
          <button
            type="button"
            onClick={() => (qtd === 1 ? remover(chave) : mudarQuantidade(chave, -1))}
            aria-label={qtd === 1 ? `Remover ${item.nome}` : `Diminuir ${item.nome}`}
          >
            {qtd === 1 ? <Trash size={15} /> : <Minus size={15} />}
          </button>
          <span aria-live="polite">{qtd}</span>
          <button type="button" onClick={() => mudarQuantidade(chave, 1)} aria-label={`Aumentar ${item.nome}`}>
            <Plus size={15} />
          </button>
        </div>
      </div>
    </li>
  )
}
