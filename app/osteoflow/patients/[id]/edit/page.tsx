'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/osteoflow/db'
import { PatientForm } from '@/components/osteoflow/patients/patient-form'
import { Button } from '@/components/osteoflow/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const db = createClient()
      const { data, error } = await db.from('patients').select('*').eq('id', id).single()
      if (error || !data) {
        router.push('/osteoflow/patients')
        return
      }
      setPatient(data)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/osteoflow/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-muted-foreground">
            Mettez a jour les informations du patient
          </p>
        </div>
      </div>

      <PatientForm patient={patient} mode="edit" />
    </div>
  )
}
