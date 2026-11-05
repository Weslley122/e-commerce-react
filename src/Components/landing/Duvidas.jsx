import { Plus } from 'lucide-react'
import { duvidas } from '../../data/site'

export default function Duvidas() {
  return (
    <section className="secao secao--alt" id="duvidas">
      <div className="container duvidas">
        <div className="secao__cabeca">
          <h2>Respostas antes de você chegar no balcão.</h2>
          <p>
            Não achou o que procurava? <a href="#a-loja" className="link">Fale com a gente na loja</a>.
          </p>
        </div>

        <div className="duvidas__lista">
          {duvidas.map((d) => (
            <details key={d.pergunta}>
              <summary>
                {d.pergunta}
                <Plus size={18} />
              </summary>
              <p>{d.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
