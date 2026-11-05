import { site } from '../data/site'

// Logotipo da loja: carrinho com linhas de velocidade, EXPRESSO em branco e CONVENIÊNCIA em laranja.
// public/logo.png tem fundo transparente e foi feita para fundo escuro (o branco some no claro).
// Os ícones do navegador (favicon e apple-touch-icon) usam só o carrinho, recortado da mesma arte.
export default function Logo() {
  return (
    <a href="/#topo" className="logo">
      <img src="/logo.png" alt={site.nome} width="720" height="137" decoding="async" />
    </a>
  )
}
