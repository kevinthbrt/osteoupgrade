'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/osteoflow/db'
import { Button } from '@/components/osteoflow/ui/button'
import { Badge } from '@/components/osteoflow/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/osteoflow/ui/card'
import { Separator } from '@/components/osteoflow/ui/separator'
import { ArrowLeft, Edit, User, FileText, Clock, CheckCircle, AlertCircle, Paperclip, Image as ImageIcon, ClipboardList, Gauge, TrendingDown, Activity } from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/lib/osteoflow/utils'
import { invoiceStatusLabels } from '@/lib/osteoflow/validations/invoice'
import { ConsultationPaymentEditor } from '@/components/osteoflow/consultations/consultation-payment-editor'

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [consultation, setConsultation] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const db = createClient()

      const { data: consult, error } = await db.from('consultations').select('*').eq('id', id).single()
      if (error || !consult) { router.push('/osteoflow/consultations'); return }

      setConsultation(consult)

      const [
        { data: pat },
        { data: inv },
        { data: atts },
        { data: surveyResp },
      ] = await Promise.all([
        db.from('patients').select('*').eq('id', consult.patient_id).single(),
        db.from('invoices').select('*').eq('consultation_id', id).single(),
        db.from('consultation_attachments').select('*').eq('consultation_id', id).order('created_at'),
        db.from('survey_responses').select('*').eq('consultation_id', id).limit(1),
      ])

      setPatient(pat)
      setAttachments(atts || [])
      setSurvey(surveyResp?.[0] || null)

      if (inv) {
        setInvoice(inv)
        const { data: pays } = await db.from('payments').select('*').eq('invoice_id', inv.id)
        setPayments(pays || [])
      }

      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading || !consultation) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  const ratingEmojis = ['', '\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F601}']
  const ratingLabels = ['', 'Tres mal', 'Mal', 'Moyen', 'Bien', 'Tres bien']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={patient ? `/osteoflow/patients/${patient.id}` : '/osteoflow/consultations'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Consultation du {formatDateTime(consultation.date_time)}
            </h1>
            {patient && (
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                <Link href={`/osteoflow/patients/${patient.id}`} className="hover:underline">
                  {patient.last_name} {patient.first_name}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/osteoflow/consultations/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          {invoice && (
            <Button asChild>
              <Link href={`/osteoflow/invoices/${invoice.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Voir la facture
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informations generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                  <p className="font-medium">{formatDateTime(consultation.date_time)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motif</p>
                  <p className="font-medium">{consultation.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu clinique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {consultation.anamnesis && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Anamnese</h4>
                  <p className="text-sm whitespace-pre-wrap">{consultation.anamnesis}</p>
                </div>
              )}
              {consultation.examination && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Examen clinique et manipulations</h4>
                  <p className="text-sm whitespace-pre-wrap">{consultation.examination}</p>
                </div>
              )}
              {consultation.advice && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Conseils donnes</h4>
                  <p className="text-sm whitespace-pre-wrap">{consultation.advice}</p>
                </div>
              )}
              {!consultation.anamnesis && !consultation.examination && !consultation.advice && (
                <p className="text-sm text-muted-foreground italic">Aucun contenu clinique renseigne</p>
              )}
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Pieces jointes ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((att: any) => {
                    const ext = att.original_name.split('.').pop()?.toLowerCase() || ''
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
                    const Icon = isImage ? ImageIcon : FileText
                    const sizeStr = att.file_size
                      ? att.file_size < 1024 * 1024
                        ? `${(att.file_size / 1024).toFixed(1)} Ko`
                        : `${(att.file_size / (1024 * 1024)).toFixed(1)} Mo`
                      : ''
                    return (
                      <div key={att.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate flex-1">{att.original_name}</span>
                        {sizeStr && <span className="text-xs text-muted-foreground flex-shrink-0">{sizeStr}</span>}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suivi</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.follow_up_7d ? (
                <div className="flex items-center gap-2">
                  {consultation.follow_up_sent_at ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-600">Email envoye</p>
                        <p className="text-sm text-muted-foreground">Le {formatDateTime(consultation.follow_up_sent_at)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-600">En attente</p>
                        <p className="text-sm text-muted-foreground">Email prevu J+7</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Pas de suivi J+7 prevu</p>
              )}
            </CardContent>
          </Card>

          {survey && survey.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Reponse questionnaire J+7
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {survey.overall_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Etat general</span>
                    <span className="font-medium">{ratingEmojis[survey.overall_rating]} {ratingLabels[survey.overall_rating]} ({survey.overall_rating}/5)</span>
                  </div>
                )}
                {survey.eva_score !== null && survey.eva_score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> EVA douleur</span>
                    <span className="font-medium">{survey.eva_score}/10</span>
                  </div>
                )}
                {survey.pain_reduction !== null && survey.pain_reduction !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Diminution douleur</span>
                    <Badge variant="outline" className={(survey.pain_reduction === true || survey.pain_reduction === 1) ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}>
                      {(survey.pain_reduction === true || survey.pain_reduction === 1) ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                )}
                {survey.better_mobility !== null && survey.better_mobility !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Meilleure mobilite</span>
                    <Badge variant="outline" className={(survey.better_mobility === true || survey.better_mobility === 1) ? 'text-violet-600 bg-violet-50 border-violet-200' : 'text-amber-600 bg-amber-50 border-amber-200'}>
                      {(survey.better_mobility === true || survey.better_mobility === 1) ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                )}
                {survey.comment && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground italic">&laquo; {survey.comment} &raquo;</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {invoice && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Facture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Numero</span>
                    <span className="font-mono">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Montant</span>
                    <span className="font-bold">{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'cancelled' ? 'destructive' : 'outline'}>
                      {invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels]}
                    </Badge>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/osteoflow/invoices/${invoice.id}`}>Voir la facture</Link>
                  </Button>
                </CardContent>
              </Card>
              <ConsultationPaymentEditor payments={payments} />
            </>
          )}

          {patient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={patient.gender === 'M' ? 'default' : 'secondary'}>
                    {patient.gender === 'M' ? 'H' : 'F'}
                  </Badge>
                  <span className="font-medium">{patient.last_name} {patient.first_name}</span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/osteoflow/patients/${patient.id}`}>Voir le dossier</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
