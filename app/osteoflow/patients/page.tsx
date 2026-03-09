'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/osteoflow/db'
import { PatientsTable } from '@/components/osteoflow/patients/patients-table'
import { PatientSearch } from '@/components/osteoflow/patients/patient-search'
import { Button } from '@/components/osteoflow/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/osteoflow/ui/skeleton'

const PAGE_SIZE = 50

export default function PatientsPage() {
  const searchParams = useSearchParams()
  const [patients, setPatients] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const query = searchParams.get('q') || ''
  const includeArchived = searchParams.get('archived') === 'true'
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const loadPatients = useCallback(async () => {
    setLoading(true)
    const db = createClient()
    const offset = (currentPage - 1) * PAGE_SIZE

    let countQuery = db.from('patients').select('*', { count: 'exact', head: true })
    let dbQuery = db.from('patients').select('*').order('updated_at', { ascending: false }).limit(PAGE_SIZE).range(offset, offset + PAGE_SIZE - 1)

    if (!includeArchived) {
      countQuery = countQuery.is('archived_at', null)
      dbQuery = dbQuery.is('archived_at', null)
    }

    if (query) {
      const orFilter = `first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
      countQuery = countQuery.or(orFilter)
      dbQuery = dbQuery.or(orFilter)
    }

    const [{ count }, { data }] = await Promise.all([countQuery, dbQuery])

    setTotalCount(count || 0)
    setPatients(data || [])
    setLoading(false)
  }, [query, includeArchived, currentPage])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Gerez vos patients et leurs informations
          </p>
        </div>
        <Button asChild>
          <Link href="/osteoflow/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau patient
          </Link>
        </Button>
      </div>

      <PatientSearch />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <PatientsTable
          patients={patients}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
