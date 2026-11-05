const FUSO = 'America/Belem'

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Valor de um dia em site.horarios para "aberto o dia inteiro"
export const DIA_TODO = '24h'

// Todos os dias da semana abertos 24 horas
export function sempreAberto(horarios) {
  return DIAS.every((_, d) => horarios[d] === DIA_TODO)
}

// Texto do horário de um dia, para tabelas: "16h às 0h", "24 horas" ou "Fechado"
export function textoDia(faixa) {
  if (!faixa) return 'Fechado'
  if (faixa === DIA_TODO) return '24 horas'
  return `${formatarHora(faixa[0])} às ${formatarHora(faixa[1])}`
}

function minutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Dia da semana e minutos desde a meia-noite no horário do Pará,
// independente do fuso do celular de quem abre o site.
function agoraNoPara(data = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)
  const valor = (tipo) => partes.find((p) => p.type === tipo).value
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(valor('weekday'))
  return { dia, min: Number(valor('hour')) * 60 + Number(valor('minute')) }
}

// Converte o horário de um dia em intervalo de minutos.
// Fechamento depois da meia-noite vira valor acima de 1440.
function intervalo(faixa) {
  if (!faixa) return null
  if (faixa === DIA_TODO) return [0, 24 * 60]
  const abre = minutos(faixa[0])
  let fecha = minutos(faixa[1])
  if (fecha <= abre) fecha += 24 * 60
  return [abre, fecha]
}

export function statusAgora(horarios, data) {
  const { dia, min } = agoraNoPara(data)

  const hoje = intervalo(horarios[dia])
  if (hoje && min >= hoje[0] && min < hoje[1]) {
    // Dia inteiro aberto: o fechamento só existe se o dia seguinte não começar à meia-noite
    if (horarios[dia] === DIA_TODO) {
      const amanha = horarios[(dia + 1) % 7]
      const emendaAmanha = amanha === DIA_TODO || amanha?.[0] === '00:00'
      return emendaAmanha ? { aberto: true, diaTodo: true } : { aberto: true, fechaAs: '00:00' }
    }
    return { aberto: true, fechaAs: horarios[dia][1] }
  }

  // Madrugada: ainda dentro do horário que começou ontem
  const ontem = (dia + 6) % 7
  const anterior = intervalo(horarios[ontem])
  if (anterior && min + 24 * 60 < anterior[1]) {
    return { aberto: true, fechaAs: horarios[ontem][1] }
  }

  if (hoje && min < hoje[0]) {
    return { aberto: false, abreAs: horarios[dia][0], quando: 'hoje' }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7
    if (horarios[d]) {
      const abreAs = horarios[d] === DIA_TODO ? '00:00' : horarios[d][0]
      return { aberto: false, abreAs, quando: i === 1 ? 'amanhã' : DIAS[d].toLowerCase() }
    }
  }
  return { aberto: false }
}

export function formatarHora(hhmm) {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

function asHora(hhmm) {
  return hhmm === '00:00' ? 'à meia-noite' : `às ${formatarHora(hhmm)}`
}

export function textoStatus(status) {
  if (status.diaTodo) return 'Aberto agora, 24 horas'
  if (status.aberto) return `Aberto agora, fecha ${asHora(status.fechaAs)}`
  if (status.abreAs) return `Fechado agora, abre ${status.quando} ${asHora(status.abreAs)}`
  return 'Fechado'
}
