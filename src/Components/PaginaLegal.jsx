import { useEffect } from 'react'
import { site } from '../data/site'
import { documentos } from '../data/legal'

export default function PaginaLegal({ doc }) {
  const outros = documentos.filter((d) => d !== doc)

  useEffect(() => {
    document.title = `${doc.titulo} | ${site.nome}`
  }, [doc])

  return (
    <main className="legal">
      <div className="container legal__grade">
        <aside className="legal__indice" aria-label="Nesta página">
          <p className="rotulo">Nesta página</p>
          <ol>
            {doc.secoes.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.titulo}</a>
              </li>
            ))}
          </ol>
          {outros.map((d) => (
            <a key={d.caminho} href={d.caminho} className="legal__outro">
              {d.titulo}
            </a>
          ))}
        </aside>

        <article className="legal__texto">
          <p className="rotulo">{site.nome}</p>
          <h1>{doc.titulo}</h1>
          <p className="legal__data">Última atualização: {doc.atualizado}</p>

          <div className="legal__resumo">
            <h2>Em resumo</h2>
            <ul>
              {doc.resumo.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          {doc.secoes.map((s, i) => (
            <section key={s.id} id={s.id}>
              <h2>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s.titulo}
              </h2>
              {s.paragrafos?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.lista && (
                <ul>
                  {s.lista.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {s.depois?.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
