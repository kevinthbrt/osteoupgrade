import { jsPDF } from 'jspdf'

export interface AccountingRecapRow {
  date: string
  count: number
  total: string
  byMethod: Record<string, { count: number; amount: string }>
  checkNumbers?: string[]
}

export interface AccountingPdfData {
  practitionerName: string
  periodLabel: string
  generatedAt: string
  totalRevenue: string
  totalConsultations: number
  revenueByMethod: Record<string, string>
  dailyRecaps: AccountingRecapRow[]
  checkNumbers?: string[]
}

const addLine = (doc: jsPDF, text: string, x: number, y: number, bold = false) => {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.text(text, x, y)
}

export async function generateAccountingPdf(data: AccountingPdfData): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 20

  addLine(doc, 'RECAPITULATIF COMPTABLE', 15, y, true)
  y += 8
  addLine(doc, data.practitionerName, 15, y)
  y += 6
  addLine(doc, data.periodLabel, 15, y)
  y += 6
  addLine(doc, `Genere le ${data.generatedAt}`, 15, y)
  y += 10

  addLine(doc, `Chiffre d'affaires: ${data.totalRevenue}`, 15, y, true)
  y += 6
  addLine(doc, `Consultations: ${data.totalConsultations}`, 15, y)
  y += 10

  addLine(doc, 'Par mode de paiement:', 15, y, true)
  y += 6
  Object.entries(data.revenueByMethod).forEach(([method, amount]) => {
    addLine(doc, `- ${method}: ${amount}`, 20, y)
    y += 6
  })

  y += 4
  addLine(doc, 'Detail journalier:', 15, y, true)
  y += 8

  for (const recap of data.dailyRecaps) {
    if (y > 280) {
      doc.addPage()
      y = 20
    }

    const card = recap.byMethod['card']?.amount || '0'
    const cash = recap.byMethod['cash']?.amount || '0'
    const check = recap.byMethod['check']?.amount || '0'
    const transfer = recap.byMethod['transfer']?.amount || '0'

    addLine(
      doc,
      `${recap.date} | consult: ${recap.count} | total: ${recap.total} | CB: ${card} | Especes: ${cash} | Cheque: ${check} | Virement: ${transfer}`,
      15,
      y
    )
    y += 6
  }

  return new Uint8Array(doc.output('arraybuffer'))
}
