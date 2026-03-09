import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { generateInvoicePdf } = await import('@/lib/osteoflow/pdf/invoice-pdfkit')
    const { createClient } = await import('@/lib/osteoflow/db/server')
    const { buildInvoicePDFData } = await import('@/lib/osteoflow/pdf/invoice-template')

    const { id } = await params
    const db = await createClient()

    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: practitioner, error: practitionerError } = await db.from('practitioners').select('*').eq('user_id', user.id).single()
    if (practitionerError || !practitioner) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    const { data: invoice, error: invoiceError } = await db.from('invoices')
      .select(`*, consultation:consultations (*, patient:patients (*), session_type:session_types (*)), payments (*)`)
      .eq('id', id).single()

    if (invoiceError || !invoice) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })

    const consultation = invoice.consultation as typeof invoice.consultation & { patient: { practitioner_id: string } }
    if (consultation.patient.practitioner_id !== practitioner.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    let pdfData = buildInvoicePDFData({ invoice, consultation: invoice.consultation, patient: invoice.consultation.patient, practitioner, payments: invoice.payments || [] })
    if (pdfData.stampUrl && pdfData.stampUrl.startsWith('/')) {
      pdfData = { ...pdfData, stampUrl: new URL(pdfData.stampUrl, request.nextUrl.origin).toString() }
    }
    const pdfBuffer = await generateInvoicePdf(pdfData)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF', details: errorMessage }, { status: 500 })
  }
}
