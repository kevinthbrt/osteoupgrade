'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/osteoflow/db'
import { Button } from '@/components/osteoflow/ui/button'
import { Badge } from '@/components/osteoflow/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/osteoflow/ui/card'
import { Separator } from '@/components/osteoflow/ui/separator'
import { ArrowLeft, Edit, Calendar, FileText, Phone, Mail, Briefcase } from 'lucide-react'
import { formatDate, formatPhone, calculateAge } from '@/lib/osteoflow/utils'
import { ConsultationTimeline } from '@/components/osteoflow/consultations/consultation-timeline'
import { MedicalHistorySectionWrapper } from '@/components/osteoflow/patients/medical-history-section-wrapper'

export default function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [consultations, setConsultations] = useState<any[]>([])
  const [medicalHistoryEntries, setMedicalHistoryEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const db = createClient()

      const { data: pat, error } = await db
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !pat) {
        router.push('/osteoflow/patients')
        return
      }

      setPatient(pat)

      const [{ data: consults }, { data: history }] = await Promise.all([
        db.from('consultations').select('*').eq('patient_id', id).order('date_time', { ascending: false }),
        db.from('medical_history_entries').select('*').eq('patient_id', id).order('display_order', { ascending: true }),
      ])

      setConsultations(consults || [])
      setMedicalHistoryEntries(history || [])
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/osteoflow/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {patient.last_name} {patient.first_name}
              </h1>
              <Badge variant={patient.gender === 'M' ? 'default' : 'secondary'}>
                {patient.gender === 'M' ? 'Homme' : 'Femme'}
              </Badge>
              {patient.archived_at && (
                <Badge variant="outline">Archive</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {calculateAge(patient.birth_date)} ans - ne(e) le {formatDate(patient.birth_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/osteoflow/patients/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/osteoflow/patients/${id}/consultation/new`}>
              <Calendar className="mr-2 h-4 w-4" />
              Nouvelle consultation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coordonnees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${patient.phone}`} className="hover:underline">
                  {formatPhone(patient.phone)}
                </a>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${patient.email}`} className="hover:underline">
                    {patient.email}
                  </a>
                </div>
              )}
              {patient.profession && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.profession}</span>
                </div>
              )}
              {patient.sport_activity && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Activite sportive :</span>
                  <span>{patient.sport_activity}</span>
                </div>
              )}
              {patient.primary_physician && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Medecin traitant :</span>
                  <span>{patient.primary_physician}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <MedicalHistorySectionWrapper
            patientId={id}
            initialEntries={medicalHistoryEntries}
          />

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consultations</span>
                <span className="font-medium">{consultations.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cree le</span>
                <span>{formatDate(patient.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Derniere mise a jour</span>
                <span>{formatDate(patient.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultations
              </CardTitle>
              <Button size="sm" asChild>
                <Link href={`/osteoflow/patients/${id}/consultation/new`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nouvelle
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ConsultationTimeline
                consultations={consultations}
                patientId={id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
