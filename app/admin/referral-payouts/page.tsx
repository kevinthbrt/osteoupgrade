'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  FileText,
  User,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react'

export default function ReferralPayoutsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<any[]>([])
  const [selectedPayout, setSelectedPayout] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadPayouts()
  }, [])

  const loadPayouts = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // Vérifier le rôle admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Charger les payouts
      const response = await fetch('/api/admin/referral-payouts')
      if (response.ok) {
        const data = await response.json()
        setPayouts(data.payouts || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewRIB = (payout: any) => {
    const ribData = payout.payout_details?.rib_file
    if (!ribData) {
      alert('Aucun RIB joint')
      return
    }

    // Ouvrir le RIB dans un nouvel onglet
    const win = window.open()
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>RIB - ${payout.user?.full_name || payout.user?.email}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; }
              img, embed { max-width: 100%; height: auto; display: block; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            ${
              ribData.type === 'application/pdf'
                ? `<embed src="${ribData.data}" type="application/pdf" width="100%" height="800px" />`
                : `<img src="${ribData.data}" alt="RIB" />`
            }
            <p style="text-align: center; margin-top: 20px;">
              <a href="${ribData.data}" download="${ribData.name}">Télécharger le fichier</a>
            </p>
          </body>
        </html>
      `)
    }
  }

  const handleMarkAsCompleted = async () => {
    if (!selectedPayout) return

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/referral-payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: selectedPayout.id,
          status: 'completed',
          notes
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      alert('Paiement marqué comme complété et email envoyé au bénéficiaire !')
      setShowModal(false)
      setSelectedPayout(null)
      setNotes('')
      loadPayouts()
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  const pendingPayouts = payouts.filter((p) => p.payout_status === 'requested')
  const completedPayouts = payouts.filter((p) => p.payout_status === 'completed')
  const otherPayouts = payouts.filter((p) => p.payout_status !== 'requested' && p.payout_status !== 'completed')

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard admin
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Gestion des Paiements de Parrainage</h1>
          <p className="text-blue-100">Gérez les demandes de paiement des commissions de parrainage</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayouts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Complétés</p>
                <p className="text-2xl font-bold text-gray-900">{completedPayouts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total en attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(pendingPayouts.reduce((sum, p) => sum + p.amount, 0) / 100).toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demandes en attente */}
        {pendingPayouts.length > 0 && (
          <div className="bg-white border border-yellow-300 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              Demandes en attente de traitement
            </h2>

            <div className="space-y-4">
              {pendingPayouts.map((payout) => {
                const userInfo = Array.isArray(payout.user) ? payout.user[0] : payout.user
                return (
                  <div key={payout.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <p className="font-semibold text-gray-900">{userInfo?.full_name || userInfo?.email}</p>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {userInfo?.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Demandé le {new Date(payout.requested_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <strong className="text-lg text-gray-900">{(payout.amount / 100).toFixed(2)}€</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRIB(payout)}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          Voir le RIB
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayout(payout)
                            setShowModal(true)
                          }}
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Marquer comme payé
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Historique des paiements */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historique des paiements</h2>

          {completedPayouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéficiaire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demandé le</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé le</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {completedPayouts.map((payout) => {
                    const userInfo = Array.isArray(payout.user) ? payout.user[0] : payout.user
                    return (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">{userInfo?.full_name || userInfo?.email}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {(payout.amount / 100).toFixed(2)}€
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(payout.requested_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {payout.completed_at ? new Date(payout.completed_at).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleViewRIB(payout)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Voir RIB
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucun paiement complété</p>
          )}
        </div>

        {/* Confirmation Modal */}
        {showModal && selectedPayout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirmer le paiement</h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Bénéficiaire :</strong>{' '}
                    {(Array.isArray(selectedPayout.user) ? selectedPayout.user[0] : selectedPayout.user)?.full_name ||
                      (Array.isArray(selectedPayout.user) ? selectedPayout.user[0] : selectedPayout.user)?.email}
                  </p>
                  <p className="text-sm text-blue-900">
                    <strong>Montant :</strong> {(selectedPayout.amount / 100).toFixed(2)}€
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Virement effectué le..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    En confirmant, le bénéficiaire recevra automatiquement un email de confirmation et les transactions
                    seront marquées comme payées.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedPayout(null)
                    setNotes('')
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Confirmer le paiement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
