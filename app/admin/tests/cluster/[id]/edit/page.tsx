'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Search,
  Layers,
  Info,
  Activity
} from 'lucide-react'

export default function EditClusterPage() {
  const router = useRouter()
  const params = useParams()
  const clusterId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [tests, setTests] = useState<any[]>([])
  const [testSearch, setTestSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    region: '',
    description: '',
    indications: '',
    interest: '',
    sensitivity: '',
    specificity: '',
    rv_positive: '',
    rv_negative: '',
    sources: '',
    selectedTests: [] as string[],
  })

  // Charger cluster + tests
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      // 1. Charger le cluster
      const { data: cluster, error: clusterError } = await supabase
        .from('orthopedic_test_clusters')
        .select('*')
        .eq('id', clusterId)
        .single()

      if (clusterError) throw clusterError

      // 2. Charger tous les tests existants
      const { data: allTests, error: testsError } = await supabase
        .from('orthopedic_tests')
        .select('*')
        .order('name', { ascending: true })

      if (testsError) throw testsError

      setTests(allTests || [])

      // 3. Charger les test_ids associés au cluster
      const { data: items, error: itemsError } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('test_id')
        .eq('cluster_id', clusterId)

      if (itemsError) throw itemsError

      const selected = items?.map((i) => i.test_id) || []

      setForm({
        name: cluster.name || '',
        region: cluster.region || 'Général',
        description: cluster.description || '',
        indications: cluster.indications || '',
        interest: cluster.interest || '',
        sensitivity: cluster.sensitivity != null ? String(cluster.sensitivity) : '',
        specificity: cluster.specificity != null ? String(cluster.specificity) : '',
        rv_positive: cluster.rv_positive != null ? String(cluster.rv_positive) : '',
        rv_negative: cluster.rv_negative != null ? String(cluster.rv_negative) : '',
        sources: cluster.sources || '',
        selectedTests: selected,
      })

    } catch (err) {
      console.error(err)
      alert('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour champ texte
  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Toggle test dans la sélection
  const toggleTest = (testId: string) => {
    setForm((prev) => {
      const exists = prev.selectedTests.includes(testId)
      return {
        ...prev,
        selectedTests: exists
          ? prev.selectedTests.filter((id) => id !== testId)
          : [...prev.selectedTests, testId],
      }
    })
  }

  const saveCluster = async () => {
    setSaving(true)
    try {
      // UPDATE CLUSTER
      const { error: updateError } = await supabase
        .from('orthopedic_test_clusters')
        .update({
          name: form.name,
          region: form.region,
          description: form.description,
          indications: form.indications,
          interest: form.interest,
          sensitivity: form.sensitivity ? Number(form.sensitivity) : null,
          specificity: form.specificity ? Number(form.specificity) : null,
          rv_positive: form.rv_positive ? Number(form.rv_positive) : null,
          rv_negative: form.rv_negative ? Number(form.rv_negative) : null,
          sources: form.sources,
        })
        .eq('id', clusterId)

      if (updateError) throw updateError

      // RESET ITEMS
      await supabase
        .from('orthopedic_test_cluster_items')
        .delete()
        .eq('cluster_id', clusterId)

      // INSERT NEW ITEMS
      const toInsert = form.selectedTests.map((testId) => ({
        cluster_id: clusterId,
        test_id: testId,
      }))

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('orthopedic_test_cluster_items')
          .insert(toInsert)

        if (insertError) throw insertError
      }

      alert('Cluster mis à jour ✔')
      router.push('/tests')

    } catch (error) {
      console.error(error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteCluster = async () => {
    if (!confirm('Supprimer définitivement ce cluster ?')) return

    setDeleting(true)
    try {
      // Supprimer items
      await supabase
        .from('orthopedic_test_cluster_items')
        .delete()
        .eq('cluster_id', clusterId)

      // Supprimer cluster
      await supabase
        .from('orthopedic_test_clusters')
        .delete()
        .eq('id', clusterId)

      alert('Cluster supprimé')
      router.push('/tests')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  // Filtre des tests selon la recherche
  const filteredTests = tests.filter((t) =>
    t.name.toLowerCase().includes(testSearch.toLowerCase())
  )

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-4 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Layers className="h-4 w-4" /> Admin
              </p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                Modifier le cluster
              </h1>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>

        {/* Light body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6 max-w-4xl">

            {/* Informations générales */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-blue-100 flex items-center gap-2">
                <Info className="h-5 w-5 text-purple-500" />
                Informations générales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Nom</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Région</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Indications</label>
                  <textarea
                    rows={2}
                    value={form.indications}
                    onChange={(e) => updateField('indications', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Intérêt clinique</label>
                  <textarea
                    rows={2}
                    value={form.interest}
                    onChange={(e) => updateField('interest', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-blue-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Statistiques du cluster
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Sensibilité (%)</label>
                  <input
                    type="number"
                    value={form.sensitivity}
                    onChange={(e) => updateField('sensitivity', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Spécificité (%)</label>
                  <input
                    type="number"
                    value={form.specificity}
                    onChange={(e) => updateField('specificity', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">RV+</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.rv_positive}
                    onChange={(e) => updateField('rv_positive', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">RV-</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.rv_negative}
                    onChange={(e) => updateField('rv_negative', e.target.value)}
                    className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-blue-100">
                Sources
              </h2>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Références / Sources</label>
                <textarea
                  rows={3}
                  value={form.sources}
                  onChange={(e) => updateField('sources', e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full"
                />
              </div>
            </div>

            {/* Tests inclus */}
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-blue-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                Tests inclus
              </h2>

              {/* Barre de recherche pour les tests */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un test..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none w-full text-sm"
                />
              </div>

              <div className="border border-blue-200/60 rounded-xl max-h-72 overflow-y-auto p-3 space-y-1 bg-white/50">
                {filteredTests.length === 0 && (
                  <p className="text-sm text-slate-500 p-2">
                    Aucun test trouvé avec ce filtre.
                  </p>
                )}

                {filteredTests.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50/60 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedTests.includes(t.id)}
                      onChange={() => toggleTest(t.id)}
                      className="accent-purple-500"
                    />
                    <span className="text-sm text-slate-700">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <button
                onClick={deleteCluster}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-500/10 border border-red-300/30 text-red-600 hover:bg-red-500/20 rounded-xl flex items-center gap-2 disabled:opacity-70 font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 rounded-xl hover:bg-white/90 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveCluster}
                  disabled={saving}
                  className="bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white px-6 py-2.5 rounded-xl hover:bg-purple-600/90 shadow-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4" />}
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
