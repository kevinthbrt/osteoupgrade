'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Tag,
  AlertCircle
} from 'lucide-react'

export type PracticeCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  order_index: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

type CategoryManagerProps = {
  onCategoryChange?: () => void
}

export default function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<PracticeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PracticeCategory | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    icon: '',
    order_index: 0,
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('practice_categories')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setCategories((data || []) as PracticeCategory[])
    } catch (error) {
      console.error('Erreur de chargement des catégories', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setShowForm(false)
    setForm({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
      icon: '',
      order_index: categories.length,
      is_active: true
    })
  }

  const handleEdit = (category: PracticeCategory) => {
    setEditingCategory(category)
    setShowForm(true)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      icon: category.icon || '',
      order_index: category.order_index,
      is_active: category.is_active
    })
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      alert('Le nom et le slug sont requis')
      return
    }

    setSaving(true)
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('practice_categories')
          .update({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            color: form.color,
            icon: form.icon || null,
            order_index: form.order_index,
            is_active: form.is_active
          })
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('practice_categories')
          .insert({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            color: form.color,
            icon: form.icon || null,
            order_index: form.order_index,
            is_active: form.is_active
          })

        if (error) throw error
      }

      await fetchCategories()
      resetForm()
      onCategoryChange?.()
    } catch (error: any) {
      console.error('Erreur de sauvegarde', error)
      alert(error?.message || 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les vidéos associées ne seront pas supprimées.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('practice_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCategories()
      onCategoryChange?.()
    } catch (error: any) {
      console.error('Erreur de suppression', error)
      alert(error?.message || 'Erreur de suppression')
    }
  }

  const handleToggleActive = async (category: PracticeCategory) => {
    try {
      const { error } = await supabase
        .from('practice_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error
      await fetchCategories()
      onCategoryChange?.()
    } catch (error) {
      console.error('Erreur de mise à jour', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gestion des catégories
          </h2>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Fermer' : 'Nouvelle catégorie'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 space-y-4 border border-pink-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nom *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  const slug = name.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                  setForm((prev) => ({ ...prev, name, slug }))
                }}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                placeholder="HVLA, Mobilisation, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                placeholder="hvla, mobilisation, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Couleur</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-20 rounded-lg border border-gray-200"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Icône (Lucide)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
                placeholder="Zap, Move, Hand, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordre</label>
              <input
                type="number"
                value={form.order_index}
                onChange={(e) => setForm((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="category_is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <label htmlFor="category_is_active" className="text-sm font-medium text-gray-700">
                Catégorie active
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-pink-200 min-h-[80px]"
              placeholder="Description de la catégorie..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingCategory ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucune catégorie. Créez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition"
              style={{ borderColor: category.is_active ? category.color + '40' : '#e5e7eb' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon || category.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(category)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    category.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {category.is_active ? 'Actif' : 'Inactif'}
                </button>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {category.description}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-3 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">
                #{category.order_index}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
