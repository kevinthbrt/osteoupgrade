'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/osteoflow/db'
import { Dashboard } from '@/components/osteoflow/dashboard/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [practitioner, setPractitioner] = useState<any>(null)
  const [stats, setStats] = useState({ totalPatients: 0, todayConsultations: 0, monthlyRevenue: 0, unreadMessages: 0 })
  const [birthdaysThisWeek, setBirthdaysThisWeek] = useState<any[]>([])
  const [recentConsultations, setRecentConsultations] = useState<any[]>([])
  const [patientsForConsultation, setPatientsForConsultation] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const db = createClient()
      const { data: { user } } = await db.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data: pract } = await db
        .from('practitioners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!pract) {
        router.push('/auth')
        return
      }

      setPractitioner(pract)

      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      const [
        { count: totalPatients },
        { count: todayConsultations },
        { data: monthRevenue },
        { data: upcomingBirthdays },
        { data: recentConsults },
        { count: unreadMessages },
        { data: patientsForConsult },
      ] = await Promise.all([
        db.from('patients').select('*', { count: 'exact', head: true }).is('archived_at', null),
        db.from('consultations').select('*', { count: 'exact', head: true }).gte('date_time', startOfDay).lte('date_time', endOfDay),
        db.from('invoices').select('amount').eq('status', 'paid').gte('paid_at', startOfMonth),
        db.from('patients').select('id, first_name, last_name, birth_date').is('archived_at', null).order('birth_date'),
        db.from('consultations').select('id, date_time, reason').is('archived_at', null).order('date_time', { ascending: false }).limit(5),
        db.from('conversations').select('*', { count: 'exact', head: true }).isNot('patient_id', null).gt('unread_count', 0),
        db.from('patients').select('id, first_name, last_name, email').is('archived_at', null).order('last_name').order('first_name'),
      ])

      const monthlyRevenue = monthRevenue?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0

      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const bdays = (upcomingBirthdays || []).filter((p: any) => {
        if (!p.birth_date) return false
        const bday = new Date(p.birth_date)
        const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
        if (thisYearBday < now) thisYearBday.setFullYear(now.getFullYear() + 1)
        return thisYearBday <= nextWeek
      }).slice(0, 3)

      // For recent consultations, we need to fetch patient info separately
      // since our simple query builder doesn't support joins in the same way
      const formattedConsultations = []
      for (const c of (recentConsults || [])) {
        const { data: patient } = await db
          .from('patients')
          .select('id, first_name, last_name')
          .eq('id', (c as any).patient_id)
          .single()
        formattedConsultations.push({
          id: c.id,
          date_time: c.date_time,
          reason: c.reason,
          patient: patient || null,
        })
      }

      setStats({
        totalPatients: totalPatients || 0,
        todayConsultations: todayConsultations || 0,
        monthlyRevenue,
        unreadMessages: unreadMessages || 0,
      })
      setBirthdaysThisWeek(bdays)
      setRecentConsultations(formattedConsultations)
      setPatientsForConsultation(patientsForConsult || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  return (
    <Dashboard
      practitioner={practitioner}
      stats={stats}
      birthdaysThisWeek={birthdaysThisWeek}
      recentConsultations={recentConsultations}
      patientsForConsultation={patientsForConsultation}
    />
  )
}
