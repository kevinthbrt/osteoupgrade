'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { normalizeSearchString } from '@/lib/search-utils'
import {
  Search,
  Loader2,
  BookOpen,
  Stethoscope,
  TestTube,
  Map,
  FileQuestion,
  Target,
  ArrowRight,
  X
} from 'lucide-react'

type SearchResult = {
  id: string
  title: string
  description: string
  type: 'cours' | 'pathologie' | 'test' | 'topographie' | 'video' | 'quiz' | 'case'
  href: string
  module: string
  gradient: string
  icon: any
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (q: string) => {
    if (!q.trim()) return

    setLoading(true)
    setSearched(true)
    const allResults: SearchResult[] = []

    try {
      // Normalize search to be case and accent insensitive
      // Note: This removes accents from the search query. For best results,
      // apply the migration in supabase/migrations/20260101_add_unaccent_search.sql
      const searchValue = normalizeSearchString(q)

      // Also keep original for partial matching
      const originalValue = q.trim()

      const [
        formationsResponse,
        chaptersResponse,
        subpartsResponse,
        pathologiesResponse,
        testsResponse,
        zonesResponse,
        videosResponse,
        quizzesResponse,
        casesResponse
      ] = await Promise.all([
        supabase
          .from('elearning_formations')
          .select('id, title, description')
          .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,title.ilike.%${originalValue}%,description.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('elearning_chapters')
          .select('id, title, formation_id')
          .or(`title.ilike.%${searchValue}%,title.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('elearning_subparts')
          .select('id, title, chapter_id')
          .or(`title.ilike.%${searchValue}%,title.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('pathologies')
          .select('id, name, description, region')
          .or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%,name.ilike.%${originalValue}%,description.ilike.%${originalValue}%,region.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('orthopedic_tests')
          .select('id, name, description, category')
          .or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%,category.ilike.%${searchValue}%,name.ilike.%${originalValue}%,description.ilike.%${originalValue}%,category.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('topographic_zones')
          .select('id, name, description, region')
          .or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%,name.ilike.%${originalValue}%,description.ilike.%${originalValue}%,region.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('practice_videos')
          .select('id, title, description, region')
          .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%,title.ilike.%${originalValue}%,description.ilike.%${originalValue}%,region.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('quizzes')
          .select('id, title, description, theme')
          .eq('is_active', true)
          .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,theme.ilike.%${searchValue}%,title.ilike.%${originalValue}%,description.ilike.%${originalValue}%,theme.ilike.%${originalValue}%`)
          .limit(10),
        supabase
          .from('clinical_cases')
          .select('id, title, description, region')
          .eq('is_active', true)
          .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%,title.ilike.%${originalValue}%,description.ilike.%${originalValue}%,region.ilike.%${originalValue}%`)
          .limit(10)
      ])

      const formations = formationsResponse.data || []
      const chapters = chaptersResponse.data || []
      const subparts = subpartsResponse.data || []
      const pathologies = pathologiesResponse.data || []
      const tests = testsResponse.data || []
      const zones = zonesResponse.data || []
      const videos = videosResponse.data || []
      const quizzes = quizzesResponse.data || []
      const cases = casesResponse.data || []

      if (formations.length > 0) {
        formations.forEach((f: { id: string; title: string; description: string | null }) => {
          allResults.push({
            id: f.id,
            title: f.title,
            description: f.description || '',
            type: 'cours',
            href: '/elearning/cours',
            module: 'Cours',
            gradient: 'from-blue-500 to-cyan-600',
            icon: BookOpen
          })
        })
      }

      if (chapters.length > 0) {
        chapters.forEach((chapter: { id: string; title: string; formation_id: string }) => {
          allResults.push({
            id: chapter.id,
            title: chapter.title,
            description: 'Chapitre e-learning',
            type: 'cours',
            href: '/elearning/cours',
            module: 'Cours',
            gradient: 'from-blue-500 to-cyan-600',
            icon: BookOpen
          })
        })
      }

      if (subparts.length > 0) {
        subparts.forEach((subpart: { id: string; title: string; chapter_id: string }) => {
          allResults.push({
            id: subpart.id,
            title: subpart.title,
            description: 'Leçon e-learning',
            type: 'cours',
            href: '/elearning/cours',
            module: 'Cours',
            gradient: 'from-blue-500 to-cyan-600',
            icon: BookOpen
          })
        })
      }

      // Search pathologies
      if (pathologies.length > 0) {
        pathologies.forEach((p: { id: string; name: string; description: string | null; region: string | null }) => {
          allResults.push({
            id: p.id,
            title: p.name,
            description: p.description || `Région: ${p.region}`,
            type: 'pathologie',
            href: '/diagnostics',
            module: 'Diagnostics',
            gradient: 'from-rose-500 to-pink-600',
            icon: Stethoscope
          })
        })
      }

      // Search orthopedic tests
      if (tests.length > 0) {
        tests.forEach((t: { id: string; name: string; description: string | null; category: string | null }) => {
          allResults.push({
            id: t.id,
            title: t.name,
            description: t.description || (t.category ? `Catégorie: ${t.category}` : ''),
            type: 'test',
            href: '/tests',
            module: 'Tests Orthopédiques',
            gradient: 'from-emerald-500 to-teal-600',
            icon: TestTube
          })
        })
      }

      // Search topographic zones
      if (zones.length > 0) {
        zones.forEach((z: { id: string; name: string; description: string | null; region: string | null }) => {
          allResults.push({
            id: z.id,
            title: z.name,
            description: z.description || `Région: ${z.region}`,
            type: 'topographie',
            href: '/topographie',
            module: 'Topographie',
            gradient: 'from-sky-500 to-blue-600',
            icon: Map
          })
        })
      }

      // Search practice videos
      if (videos.length > 0) {
        videos.forEach((v: { id: string; title: string; description: string | null; region: string | null }) => {
          allResults.push({
            id: v.id,
            title: v.title,
            description: v.description || `Région: ${v.region}`,
            type: 'video',
            href: '/pratique',
            module: 'Pratique',
            gradient: 'from-pink-500 to-rose-600',
            icon: Stethoscope
          })
        })
      }

      // Search quizzes
      if (quizzes.length > 0) {
        quizzes.forEach((quiz: { id: string; title: string; description: string | null; theme: string | null }) => {
          allResults.push({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || `Thème: ${quiz.theme}`,
            type: 'quiz',
            href: `/encyclopedia/learning/quizzes/${quiz.id}/take`,
            module: 'Quiz',
            gradient: 'from-purple-500 to-indigo-600',
            icon: FileQuestion
          })
        })
      }

      // Search clinical cases
      if (cases.length > 0) {
        cases.forEach((caseItem: { id: string; title: string; description: string | null; region: string | null }) => {
          allResults.push({
            id: caseItem.id,
            title: caseItem.title,
            description: caseItem.description || `Région: ${caseItem.region}`,
            type: 'case',
            href: `/encyclopedia/learning/cases`,
            module: 'Cas Pratiques',
            gradient: 'from-amber-500 to-orange-600',
            icon: Target
          })
        })
      }

      setResults(allResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setResults([])
    setSearched(false)
    router.push('/search')
  }

  // Group results by module
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.module]) {
      acc[result.module] = []
    }
    acc[result.module].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Search Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            ← Retour au dashboard
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Recherche Globale
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une technique, pathologie, cours, test..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-sm"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-slate-400 animate-spin mb-4" />
            <p className="text-slate-600">Recherche en cours...</p>
          </div>
        )}

        {/* No Query State */}
        {!searched && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Recherchez dans toute la plateforme
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              Trouvez instantanément des cours, pathologies, tests orthopédiques, zones topographiques et techniques pratiques.
            </p>
          </div>
        )}

        {/* No Results State */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Aucun résultat trouvé
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Aucun contenu ne correspond à votre recherche "{query}". Essayez avec des termes différents.
            </p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold transition-colors"
            >
              Nouvelle recherche
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="mb-6">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">{results.length}</span> résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''} pour "{query}"
              </p>
            </div>

            {/* Grouped Results */}
            <div className="space-y-8">
              {Object.entries(groupedResults).map(([module, moduleResults]) => {
                const firstResult = moduleResults[0]
                const Icon = firstResult.icon

                return (
                  <div key={module}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${firstResult.gradient}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{module}</h2>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {moduleResults.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {moduleResults.map((result) => {
                        const ResultIcon = result.icon

                        return (
                          <button
                            key={result.id}
                            onClick={() => router.push(result.href)}
                            className="group relative overflow-hidden rounded-xl bg-white border-2 border-slate-200 hover:border-sky-300 p-5 text-left shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${result.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                            <div className="relative">
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${result.gradient} shadow-sm transform transition-transform group-hover:scale-110`}>
                                  <ResultIcon className="h-6 w-6 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-sky-700 transition-colors">
                                    {result.title}
                                  </h3>
                                  <p className="text-sm text-slate-600 line-clamp-2">
                                    {result.description}
                                  </p>
                                </div>

                                <ArrowRight className="flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
