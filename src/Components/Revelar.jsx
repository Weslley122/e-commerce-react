import { useEffect, useRef, useState } from 'react'

// Faz o bloco subir e aparecer de leve quando entra na tela, uma vez só.
// O movimento fica no CSS (.revelar); com "reduzir movimento" ligado, tudo aparece parado.
// atraso: em milissegundos, para escalonar blocos lado a lado.
export default function Revelar({ children, className = '', atraso = 0 }) {
  const ref = useRef(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observador.observe(ref.current)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`revelar ${visivel ? 'revelar--visivel' : ''} ${className}`}
      style={atraso ? { transitionDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </div>
  )
}
