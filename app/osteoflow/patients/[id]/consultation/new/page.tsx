'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/osteoflow/db'
import { ConsultationForm } from '@/components/osteoflow/consultations/consultation-form'
import { Button } from '@/components/osteoflow/ui/button'
import { Badge } from '@/components/osteoflow/ui/badge'
import { ArrowLeft } from 'lucide-react'

export default function NewConsultationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [practitioner, setPractitioner] = useState<any>(null)
  const [medicalHistoryEntries, setMedicalHistoryEntries] = useState<any[]>([])
  const [pastConsultations, setPastConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const db = createClient()

      const { data: pat, error: patErr } = await db.from('patients').select('*').eq('id', id).single()
      if (patErr || !pat) { router.push('/osteoflow/patients'); return }

      const { data: { user } } = await db.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: pract } = await db.from('practitioners').select('*').eq('user_id', user.id).single()
      if (!pract) { router.push('/auth'); return }

      const [{ data: history }, { data: past }] = await Promise.all([
        db.from('medical_history_entries').select('*').eq('patient_id', id).order('display_order', { ascending: true }),
        db.from('consultations').select('*').eq('patient_id', id).is('archived_at', null).order('date_time', { ascending: false }).limit(20),
      ])

      setPatient(pat)
      setPractitioner(pract)
      setMedicalHistoryEntries(history || [])
      setPastConsultations(past || [])
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading || !patient || !practitioner) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/osteoflow/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle consultation</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Patient:{' '}
            <Badge variant="outline">
              {patient.last_name} {patient.first_name}
            </Badge>
          </p>
        </div>
      </div>

      <ConsultationForm
        patient={patient}
        practitioner={practitioner}
        mode="create"
        medicalHistoryEntries={medicalHistoryEntries}
        pastConsultations={pastConsultations}
      />
    </div>
  )
}
