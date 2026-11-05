// Todas as informações da loja ficam aqui. Troque os valores marcados com TODO
// pelos dados reais antes de publicar.

export const site = {
  nome: 'Expresso Conveniência',
  cidade: 'Afuá',
  estado: 'PA',

  // TODO: confirmar disponibilidade em registro.br antes de usar
  dominio: 'expressoconveniencia.com.br',

  // TODO: endereço de exemplo. Trocar pelo endereço do Perfil da Empresa no Google.
  endereco: 'Rua Exemplo, 100, Centro, Afuá, PA',
  referencia: null,

  // Somente números, com DDI e DDD. Ex.: '5591999999999'. Null esconde os botões.
  // TODO: colocar o WhatsApp da loja antes de publicar.
  whatsapp: null,
  instagram: null, // Só o nome de usuário, sem @. Null esconde o link.
  email: null, // Ex.: 'contato@expressoconveniencia.com.br'

  // TODO: dados da empresa, aparecem na política de privacidade e nos termos
  razaoSocial: null,
  cnpj: null,

  // Link do Google Maps. Null monta uma busca pelo endereço.
  // Prefira o link com place_id (https://www.google.com/maps/place/?q=place_id:SEU_PLACE_ID):
  // ele identifica a loja no Google e não muda se o nome ou o endereço do perfil mudarem.
  mapa: null,

  // Link que abre direto a tela de escrever avaliação da loja no Google (pede login na conta
  // Google, como qualquer avaliação). Null esconde o convite que aparece na sacola depois do pedido.
  // Formato: 'https://search.google.com/local/writereview?placeid=SEU_PLACE_ID'
  avaliacaoGoogle: null,

  // Horário por dia da semana (0 = domingo), igual ao do Perfil da Empresa no Google.
  // '24h' = aberta o dia inteiro. ['17:00', '02:00'] = abre e fecha nesses horários
  // (fechar antes de abrir passa da meia-noite). Null = fechada.
  // Mudou o horário? Troque aqui e no Google ao mesmo tempo.
  horarios: {
    0: '24h',
    1: '24h',
    2: '24h',
    3: '24h',
    4: '24h',
    5: '24h',
    6: '24h',
  },
}

// Fotos da loja. Coloque os arquivos em /public/fotos e preencha o caminho.
// Enquanto estiver null, aparece um espaço reservado com a descrição.
export const fotos = {
  // TODO: foto própria da fachada, tirada na horizontal, com pelo menos 1600px de largura.
  fachada: { src: null, descricao: 'Fachada da Expresso Conveniência em Afuá' },
  salao: { src: null, descricao: 'Mesas e área de consumo' },
  balcao: { src: null, descricao: 'Balcão e freezers' },
}

// TODO: preços de exemplo, trocar pelos reais
// id: identificador fixo do item (não mude depois de publicar, a sacola usa ele)
// opcoes: variações que o cliente escolhe ao adicionar (gelada/natural, sabor...)
// alcool: categoria com bebida alcoólica, exige confirmação de 18 anos na sacola
// texto: aparece embaixo do nome da categoria na página do cardápio
// foto: caminho da foto do item em /public/fotos (quadrada, 300x300 basta). Null = espaço reservado
export const cardapio = [
  {
    categoria: 'Cervejas',
    alcool: true,
    texto: 'Lata, long neck, garrafa e balde com gelo. Escolha gelada ou natural em cada item.',
    itens: [
      { id: 'cerveja-lata', nome: 'Cerveja lata 350ml', descricao: 'Consulte as marcas do dia', preco: 6, opcoes: ['Gelada', 'Natural'], foto: null },
      { id: 'long-neck', nome: 'Long neck', descricao: 'Consulte as marcas do dia', preco: 9, opcoes: ['Gelada', 'Natural'], foto: null },
      // TODO: conferir com a loja as marcas de long neck que ela tem para o balde
      { id: 'balde-long-neck', nome: 'Balde com 6 long necks', descricao: 'Com gelo, escolha a marca', preco: 50, opcoes: ['Heineken', 'Budweiser', 'Stella Artois', 'Corona', 'Spaten', 'Amstel'], foto: null, destaque: true },
      { id: 'garrafa-600', nome: 'Garrafa 600ml', descricao: 'Retornável', preco: 12, opcoes: ['Gelada', 'Natural'], foto: null },
    ],
  },
  {
    categoria: 'Drinks',
    alcool: true,
    texto: 'Feitos na hora, com frutas da região.',
    itens: [
      { id: 'caipirinha', nome: 'Caipirinha', descricao: 'Feita na hora', preco: 15, opcoes: ['Limão', 'Maracujá', 'Cupuaçu'], foto: null, destaque: true },
      { id: 'dose-jambu', nome: 'Dose de cachaça de jambu', descricao: 'Produzida no Pará', preco: 8, foto: null },
    ],
  },
  {
    categoria: 'Sem álcool',
    texto: 'Refrigerante, energético, água e suco natural.',
    itens: [
      { id: 'refri-lata', nome: 'Refrigerante lata', descricao: 'Consulte os sabores', preco: 6, opcoes: ['Gelado', 'Natural'], foto: null },
      // TODO: conferir com a loja os sabores que ela tem de cada energético
      { id: 'red-bull', nome: 'Red Bull', descricao: 'Lata 250ml, gelada', preco: 12, opcoes: ['Tradicional', 'Tropical', 'Melancia', 'Coco e Açaí', 'Pitaya'], foto: null },
      { id: 'red-bull-zero', nome: 'Red Bull Zero', descricao: 'Sem açúcar, lata 250ml, gelada', preco: 12, opcoes: ['Tradicional', 'Tropical', 'Melancia', 'Pitaya', 'Frutas Vermelhas'], foto: null },
      { id: 'monster', nome: 'Monster', descricao: 'Lata 473ml, gelada', preco: 13, opcoes: ['Tradicional', 'Mango Loco', 'Pipeline Punch', 'Pacific Punch', 'Khaotic'], foto: null },
      { id: 'monster-zero', nome: 'Monster Zero', descricao: 'Linha Ultra, sem açúcar, lata 473ml, gelada', preco: 13, opcoes: ['Ultra White', 'Ultra Paradise', 'Ultra Violet', 'Ultra Fiesta', 'Ultra Watermelon'], foto: null },
      { id: 'agua-500', nome: 'Água mineral 500ml', descricao: 'Gelada', preco: 4, opcoes: ['Sem gás', 'Com gás'], foto: null },
      { id: 'suco', nome: 'Suco da fruta', descricao: 'Copo de 400ml', preco: 10, opcoes: ['Cupuaçu', 'Maracujá', 'Acerola'], foto: null },
    ],
  },
]

export const duvidas = [
  {
    pergunta: 'Preciso baixar algum aplicativo?',
    resposta:
      'Não. Ainda não temos aplicativo, ele está nos nossos planos. Por enquanto tudo funciona aqui pelo site: a câmera do celular lê o QR Code da mesa e o cardápio abre no navegador, sem cadastro e sem senha.',
  },
  {
    pergunta: 'Preciso ter WhatsApp?',
    resposta:
      'Para enviar pelo site, sim: o pedido sai pronto no WhatsApp da loja e você só toca em enviar. Sem WhatsApp, é só pedir direto no balcão.',
  },
  {
    pergunta: 'Dá para pedir de casa pelo link?',
    resposta:
      'O pedido pelo site é para quem está na loja: ele vai com o número da mesa e a loja confere antes de preparar. Para festa em casa, faça uma encomenda pelo WhatsApp e retire no balcão.',
  },
  {
    pergunta: 'Por que preciso confirmar a mesa?',
    resposta:
      'Para a loja não confundir as mesas. O primeiro a escanear confirma a mesa e recebe um código de 4 números. Quem está junto escaneia o mesmo QR Code e digita esse código para pedir pelo próprio celular. Se a mesa aparecer ocupada e não for o seu grupo, chame um atendente.',
  },
  {
    pergunta: 'Como sei que o QR Code é mesmo da loja?',
    resposta: `O endereço que abre tem que ser ${site.dominio}, o mesmo impresso embaixo do QR Code. O site nunca pede pagamento, cartão, Pix ou senha: o pagamento é sempre no balcão. Se aparecer outro endereço ou um pedido de pagamento, não continue e avise um atendente.`,
  },
  {
    pergunta: 'Cada pessoa da mesa precisa pedir?',
    resposta:
      'Não. Uma pessoa pode pedir para a mesa toda. Se preferir separar, cada um monta a própria sacola no celular e coloca o nome no pedido.',
  },
  {
    pergunta: 'Como funciona o pagamento?',
    // TODO: confirmar com a loja as formas de pagamento aceitas
    resposta: 'O pagamento é feito no balcão, por Pix, cartão ou dinheiro.',
  },
  {
    pergunta: 'Estou sem internet ou sem bateria. E agora?',
    resposta:
      'Use o Wi-Fi da loja, com a senha que está no cartão da mesa, ou faça o pedido direto no balcão.',
  },
]
