import { useEffect } from 'react'
import CarrinhoProvider from './Components/CarrinhoProvider'
import Cabecalho from './Components/landing/Cabecalho'
import Topo from './Components/landing/Topo'
import Vitrine from './Components/landing/Vitrine'
import Passos from './Components/landing/Passos'
import Beneficios from './Components/landing/Beneficios'
import OndeEstamos from './Components/landing/OndeEstamos'
import Duvidas from './Components/landing/Duvidas'
import Rodape from './Components/landing/Rodape'
import PaginaCardapio from './Components/cardapio/PaginaCardapio'
import PaginaLegal from './Components/PaginaLegal'
import MesaProvider from './Components/MesaProvider'
import CheckinMesa from './Components/mesa/CheckinMesa'
import PaginaPainel from './Components/painel/PaginaPainel'
import Sacola from './Components/sacola/Sacola'
import BarraSacola from './Components/sacola/BarraSacola'
import { documentos } from './data/legal'
import { caminho, naPaginaDoCardapio, naPaginaDoPainel } from './lib/rota'

const documento = documentos.find((d) => d.caminho === caminho)

const App = () => {
  // Ao chegar de outra página com âncora (ex.: /#duvidas vindo dos termos), o navegador
  // tenta rolar antes de o React montar a seção. Pula direto para ela depois de montar
  // (sem rolagem suave, que é interrompida enquanto a página ainda carrega).
  useEffect(() => {
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
    }
  }, [])

  // O painel da loja é uma tela à parte, sem cabeçalho, sacola nem rodapé do site
  if (naPaginaDoPainel) return <PaginaPainel />

  let pagina
  if (naPaginaDoCardapio) {
    pagina = <PaginaCardapio />
  } else if (documento) {
    pagina = <PaginaLegal doc={documento} />
  } else {
    pagina = (
      <main>
        <Topo />
        <Vitrine />
        <Passos />
        <Beneficios />
        <OndeEstamos />
        <Duvidas />
      </main>
    )
  }

  return (
    <CarrinhoProvider>
      <MesaProvider>
        <Cabecalho />
        {pagina}
        <Rodape />
        <BarraSacola />
        <Sacola />
        <CheckinMesa />
      </MesaProvider>
    </CarrinhoProvider>
  )
}

export default App
