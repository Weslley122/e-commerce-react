import { ListChecks, QrCode, Smartphone, Snowflake, Users, Wallet } from 'lucide-react'

const beneficios = [
  {
    icone: Smartphone,
    titulo: 'Sem aplicativo',
    texto: 'Abre direto no navegador. Não precisa instalar nada, criar conta nem lembrar senha.',
  },
  {
    icone: QrCode,
    titulo: 'Mesa já identificada',
    texto: 'O QR Code leva o número da mesa junto, então ninguém precisa perguntar onde entregar.',
  },
  {
    icone: Snowflake,
    titulo: 'Gelada ou natural',
    texto: 'Você escolhe na hora de adicionar, item por item, sem precisar explicar no balcão.',
  },
  {
    icone: ListChecks,
    titulo: 'Pedido sem erro de anotação',
    texto: 'O pedido chega escrito, com quantidade, opção e observação. Ninguém anota no papel.',
  },
  {
    icone: Users,
    titulo: 'A mesa inteira pede',
    texto: 'Uma pessoa pede para todos, ou cada um monta a própria sacola e coloca o nome.',
  },
  {
    icone: Wallet,
    titulo: 'Pague como preferir',
    texto: 'Pix, cartão ou dinheiro, direto no balcão.',
  },
]

export default function Beneficios() {
  return (
    <section className="secao secao--clara">
      <div className="container">
        <div className="secao__cabeca">
          <h2>Menos fila no balcão, mais tempo na mesa.</h2>
        </div>

        {/* Cartões de tamanhos diferentes: o primeiro em destaque, os outros em larguras alternadas */}
        <div className="beneficios">
          {beneficios.map(({ icone: Icone, titulo, texto }) => (
            <article key={titulo} className="beneficio">
              <Icone size={20} strokeWidth={1.5} />
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
