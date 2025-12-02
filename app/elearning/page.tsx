'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { BookOpen, Hammer } from 'lucide-react'

export default function ElearningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setLoading(false)
    }

    ensureAuthenticated()
  }, [router])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary-50 text-primary-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-700">E-Learning</p>
            <h1 className="text-2xl font-bold text-gray-900">En cours de construction</h1>
            <p className="text-gray-600 mt-1">Nous préparons une nouvelle expérience de formation topographique.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-600">
            <Hammer className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Patience, ça arrive bientôt !</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Les guides topographiques et contenus de formation seront bientôt disponibles. Nous travaillons à vous proposer des
            parcours cliniques complets et interactifs.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            Retourner au tableau de bord
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
