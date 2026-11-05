import { Camera } from 'lucide-react'

// Mostra a foto real quando existir. Sem foto, ocupa o mesmo espaço
// com a descrição do que deve entrar ali.
// prioridade: carrega na hora e antes das outras (foto do topo). As outras só carregam ao rolar a página.
// A proporção fica reservada desde o começo, então a página não pula quando a foto chega.
export default function Foto({ src, descricao, proporcao = '4 / 3', className = '', prioridade = false }) {
  if (src) {
    return (
      <img
        className={`foto ${className}`}
        src={src}
        alt={descricao}
        style={{ aspectRatio: proporcao }}
        loading={prioridade ? 'eager' : 'lazy'}
        fetchPriority={prioridade ? 'high' : 'auto'}
        decoding="async"
      />
    )
  }

  return (
    <div className={`foto foto--vazia ${className}`} style={{ aspectRatio: proporcao }} role="img" aria-label={descricao}>
      <Camera size={20} strokeWidth={1.5} />
      <span>{descricao}</span>
    </div>
  )
}
