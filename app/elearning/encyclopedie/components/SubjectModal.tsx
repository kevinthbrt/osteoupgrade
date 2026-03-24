'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  title: string
  description: string | null
  icon: string | null
  color: string | null
  order_index: number
  is_free_access: boolean
}

interface SubjectModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  subject?: Subject | null
}

const COLOR_OPTIONS = [
  { label: 'Bleu', value: 'from-blue-500 to-cyan-600' },
  { label: 'Émeraude', value: 'from-emerald-500 to-teal-600' },
  { label: 'Violet', value: 'from-purple-500 to-indigo-600' },
  { label: 'Rose', value: 'from-rose-500 to-pink-600' },
  { label: 'Orange', value: 'from-orange-500 to-amber-600' },
  { label: 'Cyan', value: 'from-cyan-500 to-blue-600' },
  { label: 'Rouge', value: 'from-red-500 to-rose-600' },
  { label: 'Vert', value: 'from-green-500 to-emerald-600' },
]

export default function SubjectModal({ open, onClose, onSaved, subject }: SubjectModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0].value)
  const [isFreeAccess, setIsFreeAccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (subject) {
      setTitle(subject.title)
      setDescription(subject.description || '')
      setColor(subject.color || COLOR_OPTIONS[0].value)
      setIsFreeAccess(subject.is_free_access)
    } else {
      setTitle('')
      setDescription('')
      setColor(COLOR_OPTIONS[0].value)
      setIsFreeAccess(false)
    }
  }, [subject, open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        color,
        is_free_access: isFreeAccess,
        created_by: user.id,
      }

      if (subject) {
        const { error } = await supabase
          .from('encyclopedia_subjects')
          .update(payload)
          .eq('id', subject.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('encyclopedia_subjects')
          .insert(payload)
        if (error) throw error
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Erreur sauvegarde matière:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {subject ? 'Modifier la matière' : 'Nouvelle matière'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sémiologie, Anatomie..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description de la matière..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Couleur</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  className={`h-10 rounded-lg bg-gradient-to-br ${opt.value} transition-all ${
                    color === opt.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={opt.label}
                />
              ))}
            </div>
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
            {subject ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
