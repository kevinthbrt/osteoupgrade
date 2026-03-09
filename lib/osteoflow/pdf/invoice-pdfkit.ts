import { jsPDF } from 'jspdf'
import type { InvoicePDFData } from './invoice-template'

const line = (doc: jsPDF, text: string, x: number, y: number, bold = false) => {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.text(text, x, y)
}

export async function generateInvoicePdf(data: InvoicePDFData): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  line(doc, 'RECU DE CONSULTATION', 20, 20, true)
  line(doc, `Facture: ${data.invoiceNumber}`, 20, 30)
  line(doc, `Date: ${data.invoiceDate}`, 20, 37)

  line(doc, 'Praticien', 20, 50, true)
  line(doc, data.practitionerName, 20, 57)
  line(doc, data.practitionerSpecialty, 20, 64)
  line(doc, data.practitionerAddress, 20, 71)
  line(doc, data.practitionerCityLine, 20, 78)

  line(doc, 'Patient', 20, 92, true)
  line(doc, data.patientName, 20, 99)
  if (data.patientEmail) {
    line(doc, data.patientEmail, 20, 106)
  }

  line(doc, 'Details', 20, 120, true)
  line(doc, `Seance: ${data.sessionTypeLabel}`, 20, 127)
  line(doc, `Montant: ${data.amount}`, 20, 134)
  line(doc, `Paiement: ${data.paymentMethod} (${data.paymentType})`, 20, 141)
  line(doc, `Date de paiement: ${data.paymentDate}`, 20, 148)

  line(doc, data.locationLine, 20, 168)

  return new Uint8Array(doc.output('arraybuffer'))
}
