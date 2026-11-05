import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { carregarUltimoPedido, esquecerUltimoPedido, itensPorId, useCarrinho } from '../../lib/carrinho'
import { preco } from '../../lib/formato'

// "Mais uma rodada?": repete o último pedido enviado deste aparelho com um toque.
// Os preços são os do cardápio de agora, não os do pedido antigo.
// oculta: some sem desmontar (durante a busca), para não esquecer que já foi repetido ou dispensado
export default function UltimaRodada({ oculta = false }) {
  const { juntar, abrir } = useCarrinho()
  // Pedido escondido nesta visita (já repetido ou dispensado), pela hora em que foi enviado
  const [escondido, setEscondido] = useState(null)

  // Lido a cada atualização da sacola (é uma leitura pequena do aparelho): assim, quem acabou
  // de enviar um pedido vê esse pedido aqui assim que fecha a sacola
  const ultimo = carregarUltimoPedido()

  if (oculta || !ultimo || ultimo.em === escondido) return null

  const linhas = ultimo.linhas.map((l) => ({ ...l, item: itensPorId.get(l.id) }))
  const total = linhas.reduce((soma, l) => soma + l.item.preco * l.qtd, 0)

  function pedirDeNovo() {
    juntar(ultimo.linhas)
    setEscondido(ultimo.em)
    abrir()
  }

  function dispensar() {
    esquecerUltimoPedido()
    setEscondido(ultimo.em)
  }

  return (
    <section className="rodada" aria-labelledby="rodada-titulo">
      <div className="rodada__texto">
        <h2 id="rodada-titulo">Mais uma rodada?</h2>
        <p>O seu último pedido, com os preços de agora.</p>
        <ul className="rodada__itens">
          {linhas.map((l) => (
            <li key={`${l.id}|${l.opcao}`}>
              <strong>{l.qtd}x</strong> {l.item.nome}
              {/* O espaço separa nome e opção também para leitores de tela */}
              {l.opcao && <span className="rodada__opcao"> {l.opcao}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="rodada__acao">
        <strong className="rodada__total">{preco(total)}</strong>
        <button type="button" className="botao botao--laranja" onClick={pedirDeNovo}>
          <RotateCcw size={16} /> Pedir de novo
        </button>
      </div>

      <button type="button" className="icone-botao rodada__fechar" onClick={dispensar} aria-label="Esquecer o último pedido">
        <X size={18} />
      </button>
    </section>
  )
}
