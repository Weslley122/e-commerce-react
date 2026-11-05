import { MiniCardapio, MiniSacola, MiniWhatsapp } from '../Mini'
import Revelar from '../Revelar'

const cartoes = [
  {
    Mini: MiniCardapio,
    titulo: 'Cardápio com preço',
    texto: 'Tudo o que a loja tem, com preço à vista e a opção de gelada ou natural em cada bebida.',
  },
  {
    Mini: MiniSacola,
    titulo: 'Sacola da mesa',
    texto: 'Junte os itens, ajuste as quantidades e veja o total antes de enviar.',
  },
  {
    Mini: MiniWhatsapp,
    titulo: 'Pedido no WhatsApp',
    texto: 'O pedido chega escrito para a loja, com a mesa, os itens e a sua observação.',
  },
]

// No computador: o primeiro cartão ocupa a altura dos outros dois, empilhados ao lado
export default function Vitrine() {
  return (
    <section className="secao secao--alt" id="como-funciona">
      <div className="container">
        <div className="secao__cabeca">
          <h2>Tudo o que você precisa para pedir, sem instalar nada.</h2>
        </div>

        <div className="vitrine">
          {cartoes.map(({ Mini, titulo, texto }, i) => (
            <article key={titulo} className="vitrine__cartao">
              <Revelar className="vitrine__palco" atraso={i * 120}>
                <Mini />
              </Revelar>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
