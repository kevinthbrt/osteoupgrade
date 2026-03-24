'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setContentHtml(entry.content_html || '')
      setVimeoUrl(entry.vimeo_url || '')
      setImages(entry.images || [])
      setIsFreeAccess(entry.is_free_access)
    } else {
      setTitle('')
      setContentHtml('')
      setVimeoUrl('')
      setImages([])
      setIsFreeAccess(false)
    }
  }, [entry, open])

  const addImage = () => {
    setImages([...images, { url: '', caption: '' }])
  }

  const updateImage = (index: number, field: keyof EntryImage, value: string) => {
    const updated = [...images]
    updated[index] = { ...updated[index], [field]: value }
    setImages(updated)
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

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

      if (entry) {
        const { error } = await supabase
          .from('encyclopedia_entries')
          .update(payload)
          .eq('id', entry.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('encyclopedia_entries')
          .insert(payload)
        if (error) throw error
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {entry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contenu (HTML)</label>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={10}
              placeholder="<h3>Titre de section</h3><p>Contenu de la fiche...</p>"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y font-mono text-sm"
            />
          </div>

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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Images</label>
              <button
                onClick={addImage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
            {images.map((img, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={img.url}
                  onChange={(e) => updateImage(idx, 'url', e.target.value)}
                  placeholder="URL de l'image"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={(e) => updateImage(idx, 'caption', e.target.value)}
                  placeholder="Légende"
                  className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

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
