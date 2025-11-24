'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2
} from 'lucide-react'

export default function EditClusterPage() {
  const router = useRouter()
  const params = useParams()
  const clusterId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [tests, setTests] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    region: '',
    description: '',
    indications: '',
    interest: '',
    sensitivity: '',
    specificity: '',
    sources: '',
    selectedTests: [] as string[],
  })

  // Charger cluster + tests
  useEffect(() => {
    loadData()
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
        sensitivity: cluster.sensitivity || '',
        specificity: cluster.specificity || '',
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
      router.push('/admin/tests')

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
      router.push('/admin/tests')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Modifier le cluster
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">

        {/* NOM */}
        <div>
          <label className="text-sm font-medium">Nom</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* REGION */}
        <div>
          <label className="text-sm font-medium">Région</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => updateField('region', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* INDICATIONS */}
        <div>
          <label className="text-sm font-medium">Indications</label>
          <textarea
            rows={2}
            value={form.indications}
            onChange={(e) => updateField('indications', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* INTEREST */}
        <div>
          <label className="text-sm font-medium">Intérêt clinique</label>
          <textarea
            rows={2}
            value={form.interest}
            onChange={(e) => updateField('interest', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* SENSIBILITY */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Sensibilité (%)</label>
            <input
              type="number"
              value={form.sensitivity}
              onChange={(e) => updateField('sensitivity', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Spécificité (%)</label>
            <input
              type="number"
              value={form.specificity}
              onChange={(e) => updateField('specificity', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* SOURCES */}
        <div>
          <label className="text-sm font-medium">Sources</label>
          <textarea
            rows={3}
            value={form.sources}
            onChange={(e) => updateField('sources', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* TESTS INCLUS */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Tests inclus</h3>
          <div className="border rounded-lg max-h-72 overflow-y-auto p-3 space-y-2">
            {tests.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.selectedTests.includes(t.id)}
                  onChange={() => toggleTest(t.id)}
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={deleteCluster}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>

          <button
            onClick={saveCluster}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

      </div>
    </div>
  )
}
