import { useEffect, useState } from 'react'
import { Check, CheckCheck, Plus, SendHorizontal, Snowflake } from 'lucide-react'
import { cardapio } from '../data/site'
import { itensPorId } from '../lib/carrinho'
import { preco } from '../lib/formato'
import { mensagemDoPedido } from '../lib/pedido'

// Demonstração do pedido dentro do celular, em quatro cenas que passam sozinhas:
// 0 lê o QR Code, 1 monta a sacola, 2 envia pelo WhatsApp, 3 agradece.
// modo: 'rodando' (anima), 'pausado' (parado no começo, antes de aparecer na tela)
// ou 'estatico' (sem animação, já no fim de cada cena).

const cervejas = cardapio.find((c) => c.categoria === 'Cervejas').itens

// O que a sacola tem depois de cada toque da cena 1
const toques = [{}, { 'cerveja-lata': 1 }, { 'cerveja-lata': 2 }, { 'cerveja-lata': 2, 'balde-long-neck': 1 }]
const sacolaFinal = toques.at(-1)

const linhasFinais = Object.entries(sacolaFinal).map(([id, qtd]) => {
  const item = itensPorId.get(id)
  return { id, item, qtd, opcao: item.opcoes ? item.opcoes[0] : null, subtotal: item.preco * qtd }
})
const totalFinal = linhasFinais.reduce((s, l) => s + l.subtotal, 0)
const mensagem = mensagemDoPedido({ linhas: linhasFinais, total: totalFinal, mesa: '7', nome: 'Carla', observacao: '' })

// Um QR Code de enfeite (não abre nada): os três quadrados de canto e módulos espalhados
const LADO = 21
const qrDesenho = (() => {
  const noCanto = (x, y) => (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)
  let d = ''
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      if (!noCanto(x, y) && (x * 7 + y * 13 + x * y) % 5 < 2) d += `M${x} ${y}h1v1h-1z`
    }
  }
  for (const [x, y] of [[0, 0], [14, 0], [0, 14]]) {
    d += `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`
  }
  return d
})()

// Quando cada etapa acontece, em ms desde que a cena entrou. As cenas duram o que
// está em DURACOES no Passos.jsx; as etapas precisam caber dentro desse tempo.
const TEMPOS_QR = [1500, 2100]
const TEMPOS_SACOLA = [700, 1400, 2200, 3300]
const TEMPOS_ZAP = [900, 1250, 2300, 2900]

function useEtapas(tempos, modo) {
  const [etapa, setEtapa] = useState(modo === 'estatico' ? tempos.length : 0)

  useEffect(() => {
    if (modo !== 'rodando') return
    const ids = tempos.map((t, i) => setTimeout(() => setEtapa(i + 1), t))
    return () => ids.forEach(clearTimeout)
  }, [tempos, modo])

  return etapa
}

function CenaQr({ modo }) {
  const etapa = useEtapas(TEMPOS_QR, modo)

  return (
    <div className="cena cena--qr">
      <p className="cena__dica">Aponte a câmera para o QR Code da mesa</p>
      <div className={`qr-mira ${etapa >= 1 ? 'qr-mira--lido' : ''}`}>
        <svg viewBox={`-2 -2 ${LADO + 4} ${LADO + 4}`} className="qr-mira__codigo">
          <rect x="-2" y="-2" width={LADO + 4} height={LADO + 4} rx="1.5" fill="#fff" />
          <path d={qrDesenho} fill="#111" fillRule="evenodd" />
        </svg>
        <span className="qr-mira__linha" />
      </div>
      <div className={`folha ${etapa >= 2 ? 'folha--aberta' : ''}`}>
        <small>QR Code lido</small>
        <strong>Mesa 07</strong>
        <span className="folha__botao">Confirmar mesa</span>
      </div>
    </div>
  )
}

function CenaSacola({ modo }) {
  const etapa = useEtapas(TEMPOS_SACOLA, modo)
  const sacola = toques[Math.min(etapa, toques.length - 1)]
  const linhas = Object.entries(sacola)
  const qtdTotal = linhas.reduce((s, [, q]) => s + q, 0)
  const total = linhas.reduce((s, [id, q]) => s + itensPorId.get(id).preco * q, 0)

  return (
    <div className="cena tela">
      <div className="tela__topo">
        <div>
          <small>Mesa 07</small>
          <strong>Cardápio</strong>
        </div>
        <span className="tela__chip">Sacola · {qtdTotal}</span>
      </div>
      <div className="tela__abas">
        {cardapio.map((c, i) => (
          <span key={c.categoria} className={i === 0 ? 'ativa' : ''}>
            {c.categoria}
          </span>
        ))}
      </div>
      <ul className="tela__lista">
        {cervejas.map((item, i) => {
          const qtd = sacola[item.id]
          return (
            <li key={item.id}>
              <div>
                <strong>{item.nome}</strong>
                <small>
                  {i === 0 && <Snowflake size={11} />}
                  {item.opcoes?.length <= 2 ? item.opcoes.join(' ou ') : item.descricao}
                </small>
                <span className="tela__preco">{preco(item.preco)}</span>
              </div>
              {/* A chave muda a cada toque para a animação de "apertar" rodar de novo */}
              <span key={qtd ?? 0} className={`tela__mais ${qtd ? 'tela__mais--qtd' : ''}`}>
                {qtd ?? <Plus size={14} />}
              </span>
            </li>
          )
        })}
      </ul>
      <div className={`tela__rodape ${qtdTotal ? 'tela__rodape--visivel' : ''} ${etapa >= 4 ? 'tela__rodape--toque' : ''}`}>
        <span>{qtdTotal === 1 ? '1 item' : `${qtdTotal} itens`}</span>
        <strong>Ver sacola · {preco(total)}</strong>
      </div>
    </div>
  )
}

function CenaWhatsapp({ modo }) {
  const etapa = useEtapas(TEMPOS_ZAP, modo)

  return (
    <div className="cena zap">
      <div className="zap__topo">
        <span className="mini__avatar">E</span>
        <div>
          <strong>Expresso Conveniência</strong>
          <small>{etapa >= 4 ? 'online' : 'WhatsApp da loja'}</small>
        </div>
      </div>
      <div className="zap__conversa">
        {etapa >= 2 && (
          <div className="zap__balao zap__balao--meu">
            {/* Asteriscos viram negrito no WhatsApp; aqui só removemos */}
            <p>{mensagem.replaceAll('*', '')}</p>
            <span>
              21:40 <CheckCheck size={12} className={etapa >= 3 ? 'zap__lido' : ''} />
            </span>
          </div>
        )}
        {etapa >= 4 && (
          <div className="zap__balao zap__balao--loja">
            <p>Recebido, mesa 7. Já vamos preparar!</p>
            <span>21:41</span>
          </div>
        )}
      </div>
      <div className="zap__campo">
        <p className={etapa >= 2 ? 'zap__vazio' : ''}>{etapa >= 2 ? 'Mensagem' :mensagem.replaceAll('*', '').split('\n')[0] + '...'}</p>
        <span className={`zap__enviar ${etapa === 1 ? 'zap__enviar--toque' : ''}`}>
          <SendHorizontal size={13} />
        </span>
      </div>
    </div>
  )
}

function CenaObrigado() {
  return (
    <div className="cena obrigado">
      <div className="obrigado__selo">
        <span className="obrigado__onda" />
        <span className="obrigado__onda" />
        <svg viewBox="0 0 52 52" className="obrigado__circulo">
          <circle cx="26" cy="26" r="24" />
        </svg>
        <Check size={34} strokeWidth={3} className="obrigado__check" />
      </div>
      <strong className="obrigado__titulo">Pedido enviado</strong>
      <p className="obrigado__texto">Obrigado, Carla! A loja já recebeu o pedido da mesa 07 e confirma pelo WhatsApp.</p>
      <p className="obrigado__nota">Pagamento no balcão: Pix, cartão ou dinheiro.</p>
    </div>
  )
}

const cenas = [CenaQr, CenaSacola, CenaWhatsapp, CenaObrigado]
const tons = ['escuro', 'claro', 'zap', 'laranja']

export default function Celular({ cena = 1, modo = 'estatico', rodada = 0, className = '' }) {
  const Cena = cenas[cena]

  return (
    <div className={`celular celular--${modo} ${className}`} aria-hidden="true">
      <div className={`celular__tela celular__tela--${tons[cena]}`}>
        <div className="celular__status">
          <span>21:40</span>
          <span className="celular__notch" />
          <span>Wi-Fi</span>
        </div>
        {/* Chave nova a cada volta: a cena monta de novo e as animações recomeçam */}
        <Cena key={`${rodada}-${cena}`} modo={modo} />
      </div>
    </div>
  )
}
