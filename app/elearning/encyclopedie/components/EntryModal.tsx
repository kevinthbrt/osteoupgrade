'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Trash2, Upload, Search, GripVertical, TestTube2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

type EntryImage = { url: string; caption?: string }

type Entry = {
  id: string
  subject_id: string
  parent_id: string | null
  title: string
  content_html: string | null
  vimeo_url: string | null
  images: EntryImage[] | null
  order_index: number
  is_free_access: boolean
}

interface OrthopedicTest {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
}

interface OrthopedicTestCluster {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
}

interface EntryModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  subjectId: string
  parentId: string | null
  entry?: Entry | null
}

export default function EntryModal({ open, onClose, onSaved, subjectId, parentId, entry }: EntryModalProps) {
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [vimeoUrl, setVimeoUrl] = useState('')
  const [images, setImages] = useState<EntryImage[]>([])
  const [isFreeAccess, setIsFreeAccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Tests & clusters
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [selectedClusters, setSelectedClusters] = useState<string[]>([])
  const [availableTests, setAvailableTests] = useState<OrthopedicTest[]>([])
  const [availableClusters, setAvailableClusters] = useState<OrthopedicTestCluster[]>([])
  const [testSearch, setTestSearch] = useState('')
  const [clusterSearch, setClusterSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'tests' | 'clusters'>('tests')

  useEffect(() => {
    if (open) {
      loadTestsAndClusters()
    }
  }, [open])

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setContentHtml(entry.content_html || '')
      setVimeoUrl(entry.vimeo_url || '')
      setImages(entry.images || [])
      setIsFreeAccess(entry.is_free_access)
      if (entry.id) loadExistingAssociations(entry.id)
    } else {
      setTitle('')
      setContentHtml('')
      setVimeoUrl('')
      setImages([])
      setIsFreeAccess(false)
      setSelectedTests([])
      setSelectedClusters([])
    }
  }, [entry, open])

  const loadTestsAndClusters = async () => {
    const [{ data: tests }, { data: clusters }] = await Promise.all([
      supabase.from('orthopedic_tests').select('id, name, description, category, indications').order('name'),
      supabase.from('orthopedic_test_clusters').select('id, name, region, description, indications').order('name'),
    ])
    setAvailableTests(tests || [])
    setAvailableClusters(clusters || [])
  }

  const loadExistingAssociations = async (entryId: string) => {
    const [{ data: testLinks }, { data: clusterLinks }] = await Promise.all([
      supabase.from('encyclopedia_entry_tests').select('test_id').eq('entry_id', entryId).order('order_index'),
      supabase.from('encyclopedia_entry_clusters').select('cluster_id').eq('entry_id', entryId).order('order_index'),
    ])
    setSelectedTests((testLinks || []).map(l => l.test_id))
    setSelectedClusters((clusterLinks || []).map(l => l.cluster_id))
  }

  // Image upload via Vercel Blob
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entryId', entry?.id || `new-${Date.now()}`)

      const res = await fetch('/api/encyclopedia-image-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.url) {
        setImages(prev => [...prev, { url: data.url, caption: '' }])
      }
    } catch (err) {
      console.error('Erreur upload image:', err)
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const updateImageCaption = (index: number, caption: string) => {
    const updated = [...images]
    updated[index] = { ...updated[index], caption }
    setImages(updated)
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    )
  }

  const toggleCluster = (clusterId: string) => {
    setSelectedClusters(prev =>
      prev.includes(clusterId) ? prev.filter(id => id !== clusterId) : [...prev, clusterId]
    )
  }

  const filteredTests = availableTests.filter(t => {
    if (!testSearch) return true
    const q = testSearch.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.indications?.toLowerCase().includes(q)
  })

  const filteredClusters = availableClusters.filter(c => {
    if (!clusterSearch) return true
    const q = clusterSearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.indications?.toLowerCase().includes(q)
  })

  const getTestDetails = (id: string) => availableTests.find(t => t.id === id)
  const getClusterDetails = (id: string) => availableClusters.find(c => c.id === id)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const validImages = images.filter(img => img.url.trim())

      const payload = {
        subject_id: subjectId,
        parent_id: parentId || null,
        title: title.trim(),
        content_html: contentHtml.trim() || null,
        vimeo_url: vimeoUrl.trim() || null,
        images: validImages.length > 0 ? validImages : [],
        is_free_access: isFreeAccess,
        created_by: user.id,
      }

      let entryId = entry?.id

      if (entry) {
        const { error } = await supabase
          .from('encyclopedia_entries')
          .update(payload)
          .eq('id', entry.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('encyclopedia_entries')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        entryId = data.id
      }

      // Save test associations
      if (entryId) {
        // Delete existing, then re-insert
        await supabase.from('encyclopedia_entry_tests').delete().eq('entry_id', entryId)
        if (selectedTests.length > 0) {
          const testLinks = selectedTests.map((test_id, index) => ({
            entry_id: entryId!,
            test_id,
            order_index: index,
          }))
          const { error } = await supabase.from('encyclopedia_entry_tests').insert(testLinks)
          if (error) throw error
        }

        // Delete existing clusters, then re-insert
        await supabase.from('encyclopedia_entry_clusters').delete().eq('entry_id', entryId)
        if (selectedClusters.length > 0) {
          const clusterLinks = selectedClusters.map((cluster_id, index) => ({
            entry_id: entryId!,
            cluster_id,
            order_index: index,
          }))
          const { error } = await supabase.from('encyclopedia_entry_clusters').insert(clusterLinks)
          if (error) throw error
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Erreur sauvegarde entrée:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {entry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chapitre 1 - Sémiologie cervicale"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Content HTML */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contenu (HTML)</label>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={8}
              placeholder="<h3>Titre de section</h3><p>Contenu de la fiche...</p>"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y font-mono text-sm"
            />
          </div>

          {/* Vimeo URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">URL Vimeo (optionnel)</label>
            <input
              type="text"
              value={vimeoUrl}
              onChange={(e) => setVimeoUrl(e.target.value)}
              placeholder="https://vimeo.com/123456789"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Images - Upload via Vercel Blob */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-600" />
                Images
              </label>
            </div>

            {/* Uploaded images list */}
            {images.length > 0 && (
              <div className="space-y-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                      <Image
                        src={img.url}
                        alt={img.caption || `Image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => updateImageCaption(idx, e.target.value)}
                        placeholder="Légende de l'image"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1 truncate">{img.url}</p>
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="encyclopedia-image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="encyclopedia-image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-2" />
                    <span className="text-sm font-medium text-purple-600">Upload en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-700">
                      Cliquez pour ajouter une image
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      PNG, JPG jusqu&apos;à 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Tests & Clusters utiles */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <TestTube2 className="h-4 w-4 text-purple-600" />
              Tests / Clusters utiles
              <span className="text-xs font-normal text-slate-500">
                ({selectedTests.length} tests, {selectedClusters.length} clusters)
              </span>
            </h3>

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  activeTab === 'tests'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tests ({selectedTests.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clusters')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  activeTab === 'clusters'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Clusters ({selectedClusters.length})
              </button>
            </div>

            {activeTab === 'tests' && (
              <>
                {/* Selected tests */}
                {selectedTests.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-purple-900 mb-2">Tests sélectionnés</p>
                    <div className="space-y-1.5">
                      {selectedTests.map((testId, index) => {
                        const test = getTestDetails(testId)
                        if (!test) return null
                        return (
                          <div key={testId} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-200 text-sm">
                            <GripVertical className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{index + 1}. {test.name}</span>
                            <button type="button" onClick={() => toggleTest(testId)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Search tests */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un test..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2">
                  {filteredTests.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">Aucun test trouvé</p>
                  ) : (
                    filteredTests.map(test => (
                      <div
                        key={test.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                          selectedTests.includes(test.id)
                            ? 'bg-purple-50 border-purple-300'
                            : 'hover:bg-slate-50 border-slate-200'
                        }`}
                        onClick={() => toggleTest(test.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedTests.includes(test.id)} readOnly className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{test.name}</p>
                            {test.category && <p className="text-xs text-slate-500">{test.category}</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'clusters' && (
              <>
                {/* Selected clusters */}
                {selectedClusters.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-purple-900 mb-2">Clusters sélectionnés</p>
                    <div className="space-y-1.5">
                      {selectedClusters.map((clusterId, index) => {
                        const cluster = getClusterDetails(clusterId)
                        if (!cluster) return null
                        return (
                          <div key={clusterId} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-200 text-sm">
                            <GripVertical className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{index + 1}. {cluster.name}</span>
                            <button type="button" onClick={() => toggleCluster(clusterId)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Search clusters */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un cluster..."
                    value={clusterSearch}
                    onChange={(e) => setClusterSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2">
                  {filteredClusters.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">Aucun cluster trouvé</p>
                  ) : (
                    filteredClusters.map(cluster => (
                      <div
                        key={cluster.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                          selectedClusters.includes(cluster.id)
                            ? 'bg-purple-50 border-purple-300'
                            : 'hover:bg-slate-50 border-slate-200'
                        }`}
                        onClick={() => toggleCluster(cluster.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedClusters.includes(cluster.id)} readOnly className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{cluster.name}</p>
                            {cluster.region && <p className="text-xs text-slate-500">{cluster.region}</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Free access checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFreeAccess}
              onChange={(e) => setIsFreeAccess(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Accessible aux utilisateurs gratuits</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {entry ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
