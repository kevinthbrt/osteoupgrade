'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  Stethoscope,
  GraduationCap,
  FileQuestion,
  Target,
  Link2,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ModuleType, ModuleReferenceWithTarget, ReferenceType } from '@/types/encyclopedia'

interface ModuleReferencesProps {
  sourceModule: ModuleType
  sourceId: string
  referenceType?: ReferenceType
  showCreateButton?: boolean
}

export default function ModuleReferences({
  sourceModule,
  sourceId,
  referenceType,
  showCreateButton = false
}: ModuleReferencesProps) {
  const router = useRouter()
  const [references, setReferences] = useState<ModuleReferenceWithTarget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReferences()
  }, [sourceModule, sourceId, referenceType])

  const loadReferences = async () => {
    try {
      setLoading(true)

      // Build query
      let query = supabase
        .from('module_references')
        .select('*')
        .eq('source_module', sourceModule)
        .eq('source_id', sourceId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (referenceType) {
        query = query.eq('reference_type', referenceType)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        // Enrich with target details
        const enrichedReferences = await Promise.all(
          data.map(async (ref) => {
            const targetDetails = await getTargetDetails(ref.target_module, ref.target_id)
            return {
              ...ref,
              ...targetDetails
            }
          })
        )

        setReferences(enrichedReferences)
      }
    } catch (error) {
      console.error('Error loading references:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTargetDetails = async (targetModule: ModuleType, targetId: string) => {
    try {
      switch (targetModule) {
        case 'practice': {
          const { data } = await supabase
            .from('practice_videos')
            .select('title, description, region')
            .eq('id', targetId)
            .single()
          return {
            target_title: data?.title,
            target_description: data?.description,
            target_region: data?.region
          }
        }
        case 'diagnostic': {
          const { data } = await supabase
            .from('pathologies')
            .select('name, description, region')
            .eq('id', targetId)
            .single()
          return {
            target_title: data?.name,
            target_description: data?.description,
            target_region: data?.region
          }
        }
        case 'course': {
          const { data } = await supabase
            .from('elearning_formations')
            .select('title, description, category')
            .eq('id', targetId)
            .single()
          return {
            target_title: data?.title,
            target_description: data?.description,
            target_category: data?.category
          }
        }
        case 'quiz': {
          const { data } = await supabase
            .from('quiz')
            .select('title, description, category')
            .eq('id', targetId)
            .single()
          return {
            target_title: data?.title,
            target_description: data?.description,
            target_category: data?.category
          }
        }
        case 'case': {
          const { data } = await supabase
            .from('clinical_cases')
            .select('title, description, category')
            .eq('id', targetId)
            .single()
          return {
            target_title: data?.title,
            target_description: data?.description,
            target_category: data?.category
          }
        }
        default:
          return {}
      }
    } catch (error) {
      console.error('Error loading target details:', error)
      return {}
    }
  }

  const getModuleIcon = (module: ModuleType) => {
    switch (module) {
      case 'practice':
        return <Stethoscope className="h-4 w-4" />
      case 'diagnostic':
        return <BookOpen className="h-4 w-4" />
      case 'course':
        return <GraduationCap className="h-4 w-4" />
      case 'quiz':
        return <FileQuestion className="h-4 w-4" />
      case 'case':
        return <Target className="h-4 w-4" />
      default:
        return <Link2 className="h-4 w-4" />
    }
  }

  const getModuleLabel = (module: ModuleType) => {
    switch (module) {
      case 'practice':
        return 'Pratique'
      case 'diagnostic':
        return 'Diagnostic'
      case 'course':
        return 'Cours'
      case 'quiz':
        return 'Quiz'
      case 'case':
        return 'Cas pratique'
      default:
        return module
    }
  }

  const getModuleColor = (module: ModuleType) => {
    switch (module) {
      case 'practice':
        return 'from-pink-500 to-rose-600'
      case 'diagnostic':
        return 'from-sky-500 to-blue-600'
      case 'course':
        return 'from-emerald-500 to-teal-600'
      case 'quiz':
        return 'from-purple-500 to-indigo-600'
      case 'case':
        return 'from-amber-500 to-orange-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  const getTargetUrl = (targetModule: ModuleType, targetId: string, region?: string) => {
    switch (targetModule) {
      case 'practice':
        return `/encyclopedia/practice/${region}/${targetId}`
      case 'diagnostic':
        return `/encyclopedia/diagnostics/${region}/${targetId}`
      case 'course':
        return `/encyclopedia/learning/courses/${targetId}`
      case 'quiz':
        return `/encyclopedia/learning/quizzes/${targetId}`
      case 'case':
        return `/encyclopedia/learning/cases/${targetId}`
      default:
        return '#'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (references.length === 0) {
    return null
  }

  // Group by reference type
  const groupedReferences = references.reduce((acc, ref) => {
    const type = ref.reference_type || 'related'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(ref)
    return acc
  }, {} as Record<string, ModuleReferenceWithTarget[]>)

  const getReferenceTypeLabel = (type: string) => {
    switch (type) {
      case 'related':
        return '📎 Contenus liés'
      case 'prerequisite':
        return '📚 Prérequis'
      case 'follow_up':
        return '➡️ Suite recommandée'
      case 'practice':
        return '🤲 Application pratique'
      case 'theory':
        return '📖 Base théorique'
      case 'assessment':
        return '✅ Évaluation'
      default:
        return '🔗 Références'
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedReferences).map(([type, refs]) => (
        <div key={type} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {getReferenceTypeLabel(type)}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {refs.map((ref) => (
              <button
                key={ref.id}
                onClick={() => router.push(getTargetUrl(ref.target_module, ref.target_id, ref.target_region))}
                className="group relative overflow-hidden rounded-xl bg-white border-2 border-slate-200 hover:border-sky-300 p-4 text-left shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getModuleColor(ref.target_module)} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className="relative flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getModuleColor(ref.target_module)} shrink-0`}>
                    {getModuleIcon(ref.target_module)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500">
                        {getModuleLabel(ref.target_module)}
                      </span>
                      {ref.target_region && (
                        <span className="text-xs text-slate-400">
                          • {ref.target_region}
                        </span>
                      )}
                      {ref.target_category && (
                        <span className="text-xs text-slate-400">
                          • {ref.target_category}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {ref.display_label || ref.target_title || 'Voir le contenu'}
                    </h4>

                    {ref.target_description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                        {ref.target_description}
                      </p>
                    )}

                    {ref.description && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        {ref.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {showCreateButton && (
        <button
          onClick={() => router.push(`/admin/encyclopedia/references/new?source=${sourceModule}&sourceId=${sourceId}`)}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all font-semibold text-sm"
        >
          + Ajouter une référence
        </button>
      )}
    </div>
  )
}
