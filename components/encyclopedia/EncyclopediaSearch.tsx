'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, FileText, BookOpen, Stethoscope, GraduationCap, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EncyclopediaSearchResult, ModuleType } from '@/types/encyclopedia'

interface EncyclopediaSearchProps {
  initialQuery?: string
  onResultClick?: (result: EncyclopediaSearchResult) => void
  showFilters?: boolean
}

export default function EncyclopediaSearch({
  initialQuery = '',
  onResultClick,
  showFilters = true
}: EncyclopediaSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<EncyclopediaSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState<ModuleType | 'all'>('all')

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
    }
  }, [query, selectedModule])

  const performSearch = async () => {
    setLoading(true)
    try {
      const searchResults: EncyclopediaSearchResult[] = []

      // Search in practice videos (techniques)
      if (selectedModule === 'all' || selectedModule === 'practice') {
        const { data: practiceData } = await supabase
          .from('practice_videos')
          .select('id, title, description, region')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)

        if (practiceData) {
          searchResults.push(
            ...practiceData.map(item => ({
              module: 'practice' as ModuleType,
              id: item.id,
              title: item.title,
              description: item.description,
              region: item.region,
              url: `/encyclopedia/practice/${item.region}/${item.id}`
            }))
          )
        }
      }

      // Search in pathologies (diagnostics)
      if (selectedModule === 'all' || selectedModule === 'diagnostic') {
        const { data: diagnosticsData } = await supabase
          .from('pathologies')
          .select('id, name, description, region')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)

        if (diagnosticsData) {
          searchResults.push(
            ...diagnosticsData.map(item => ({
              module: 'diagnostic' as ModuleType,
              id: item.id,
              title: item.name,
              description: item.description || '',
              region: item.region,
              url: `/encyclopedia/diagnostics/${item.region}/${item.id}`
            }))
          )
        }
      }

      // Search in e-learning formations (courses)
      if (selectedModule === 'all' || selectedModule === 'course') {
        const { data: coursesData } = await supabase
          .from('elearning_formations')
          .select('id, title, description, category')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)

        if (coursesData) {
          searchResults.push(
            ...coursesData.map(item => ({
              module: 'course' as ModuleType,
              id: item.id,
              title: item.title,
              description: item.description || '',
              category: item.category,
              url: `/encyclopedia/learning/courses/${item.id}`
            }))
          )
        }
      }

      // Search in quiz (if table exists)
      if (selectedModule === 'all' || selectedModule === 'quiz') {
        const { data: quizData } = await supabase
          .from('quiz')
          .select('id, title, description, category, difficulty')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)

        if (quizData) {
          searchResults.push(
            ...quizData.map(item => ({
              module: 'quiz' as ModuleType,
              id: item.id,
              title: item.title,
              description: item.description || '',
              category: item.category,
              difficulty: item.difficulty,
              url: `/encyclopedia/learning/quizzes/${item.id}`
            }))
          )
        }
      }

      // Search in clinical cases (if table exists)
      if (selectedModule === 'all' || selectedModule === 'case') {
        const { data: casesData } = await supabase
          .from('clinical_cases')
          .select('id, title, description, category, difficulty')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,patient_context.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)

        if (casesData) {
          searchResults.push(
            ...casesData.map(item => ({
              module: 'case' as ModuleType,
              id: item.id,
              title: item.title,
              description: item.description || '',
              category: item.category,
              difficulty: item.difficulty,
              url: `/encyclopedia/learning/cases/${item.id}`
            }))
          )
        }
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getModuleIcon = (module: ModuleType) => {
    switch (module) {
      case 'practice':
        return <Stethoscope className="h-4 w-4" />
      case 'diagnostic':
        return <BookOpen className="h-4 w-4" />
      case 'course':
      case 'quiz':
      case 'case':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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
        return 'bg-pink-100 text-pink-700'
      case 'diagnostic':
        return 'bg-sky-100 text-sky-700'
      case 'course':
      case 'quiz':
      case 'case':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleResultClick = (result: EncyclopediaSearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      router.push(result.url)
    }
  }

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans l'encyclopédie..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {['all', 'practice', 'diagnostic', 'course', 'quiz', 'case'].map((module) => (
            <button
              key={module}
              onClick={() => setSelectedModule(module as ModuleType | 'all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                selectedModule === module
                  ? 'bg-sky-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {module === 'all' ? 'Tout' : getModuleLabel(module as ModuleType)}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.module}-${result.id}-${index}`}
              onClick={() => handleResultClick(result)}
              className="w-full text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getModuleColor(result.module)}`}>
                  {getModuleIcon(result.module)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                      {result.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getModuleColor(result.module)}`}>
                      {getModuleLabel(result.module)}
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  {(result.region || result.category || result.difficulty) && (
                    <div className="flex gap-2 mt-2">
                      {result.region && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Target className="h-3 w-3" />
                          {result.region}
                        </span>
                      )}
                      {result.category && (
                        <span className="text-xs text-slate-500">
                          {result.category}
                        </span>
                      )}
                      {result.difficulty && (
                        <span className="text-xs text-slate-500">
                          {result.difficulty}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="mt-4 p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
          <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucun résultat trouvé</p>
          <p className="text-sm text-slate-500 mt-1">
            Essayez avec d'autres mots-clés
          </p>
        </div>
      )}
    </div>
  )
}
