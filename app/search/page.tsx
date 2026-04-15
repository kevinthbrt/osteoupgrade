'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Loader2,
  BookOpen,
  Stethoscope,
  TestTube,
  ArrowRight,
  X
} from 'lucide-react'

type SearchResult = {
  id: string
  title: string
  description: string
  type: 'cours' | 'pathologie' | 'test' | 'video'
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
      // Search term - we'll use this with both RPC functions and fallback queries
      const searchValue = q.trim()

      // Try to use RPC functions with unaccent first (requires migration to be applied)
      // If they don't exist, fall back to regular ilike search with normalized query
      const [
        formationsResponse,
        pathologiesResponse,
        testsResponse,
        videosResponse,
        chaptersResponse,
        subpartsResponse
      ] = await Promise.all([
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_elearning_formations', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('elearning_formations')
              .select('id, title, description')
              .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%`)
              .limit(10)
            : res
          ),
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_pathologies', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('pathologies')
              .select('id, name, description, region')
              .or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%`)
              .limit(10)
            : res
          ),
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_orthopedic_tests', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('orthopedic_tests')
              .select('id, name, description, category')
              .or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%,category.ilike.%${searchValue}%`)
              .limit(10)
            : res
          ),
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_practice_videos', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('practice_videos')
              .select('id, title, description, region')
              .or(`title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,region.ilike.%${searchValue}%`)
              .limit(10)
            : res
          ),
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_elearning_chapters', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('elearning_chapters')
              .select('id, title, formation_id')
              .ilike('title', `%${searchValue}%`)
              .limit(10)
            : res
          ),
        // Try RPC function first, fallback to regular query
        supabase.rpc('search_elearning_subparts', { search_term: searchValue })
          .then(res => res.error ?
            supabase.from('elearning_subparts')
              .select('id, title, chapter_id')
              .ilike('title', `%${searchValue}%`)
              .limit(10)
            : res
          ),
      ])

      const formations = formationsResponse.data || []
      const chapters = chaptersResponse.data || []
      const subparts = subpartsResponse.data || []
      const pathologies = pathologiesResponse.data || []
      const tests = testsResponse.data || []
      const videos = videosResponse.data || []

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
      <div className="min-h-screen -m-6 md:-m-8">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Search className="h-4 w-4" /> Recherche
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Recherche Globale
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Trouvez instantanément des cours, pathologies, tests et techniques pratiques
              </p>

              {/* Search Form inside header */}
              <form onSubmit={handleSearch} className="relative mt-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/70 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une technique, pathologie, cours, test..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/70 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* BODY */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-8">

            {/* Loading State */}
            {loading && (
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-12 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Recherche en cours...</p>
              </div>
            )}

            {/* No Query State */}
            {!searched && !loading && (
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-12 flex flex-col items-center justify-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 mb-4 shadow-lg">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Recherchez dans toute la plateforme
                </h2>
                <p className="text-slate-500 max-w-md">
                  Trouvez instantanément des cours, pathologies, tests orthopédiques, zones topographiques et techniques pratiques.
                </p>
              </div>
            )}

            {/* No Results State */}
            {searched && !loading && results.length === 0 && (
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-12 flex flex-col items-center justify-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 mb-4 shadow-lg">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Aucun résultat trouvé
                </h2>
                <p className="text-slate-500 max-w-md mb-6">
                  Aucun contenu ne correspond à votre recherche "{query}". Essayez avec des termes différents.
                </p>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all"
                >
                  Nouvelle recherche
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                  <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                    <span className="text-blue-600">{results.length}</span> résultat{results.length > 1 ? 's' : ''} pour "{query}"
                  </h2>
                </div>

                {Object.entries(groupedResults).map(([module, moduleResults]) => {
                  const firstResult = moduleResults[0]
                  const Icon = firstResult.icon

                  return (
                    <div key={module}>
                      {/* Module heading */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${firstResult.gradient} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">{module}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
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
                              className="group rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5 text-left hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${result.gradient} shadow-sm transform transition-transform group-hover:scale-110`}>
                                  <ResultIcon className="h-5 w-5 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-sky-700 transition-colors">
                                    {result.title}
                                  </h4>
                                  <p className="text-sm text-slate-500 line-clamp-2">
                                    {result.description}
                                  </p>
                                </div>

                                <ArrowRight className="flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="min-h-screen -m-6 md:-m-8 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <Loader2 className="h-12 w-12 text-sky-400 animate-spin" />
        </div>
      </AuthLayout>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
