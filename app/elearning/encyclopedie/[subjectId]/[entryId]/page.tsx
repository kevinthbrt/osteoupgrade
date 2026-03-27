'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import FreeContentGate from '@/components/FreeContentGate'
import { extractVimeoId } from '@/lib/vimeo'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Play,
  TestTube2,
  Layers,
  X,
  Info,
  TrendingUp,
  FileText,
} from 'lucide-react'
import TestDetailModal from '@/components/TestDetailModal'

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

type OrthopedicTest = {
  id: string
  name: string
  category: string
}

type OrthopedicTestCluster = {
  id: string
  name: string
  region: string
}

type FullTest = {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
  video_url: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  interest: string | null
  sources: string | null
}

type FullCluster = {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
  interest: string | null
  sources: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  tests: { id: string; name: string; category: string }[]
}

type Subject = {
  id: string
  title: string
  color: string | null
  is_free_access: boolean
}

type BreadcrumbItem = {
  id: string
  title: string
}

export default function EntryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params?.subjectId as string
  const entryId = params?.entryId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [siblings, setSiblings] = useState<Entry[]>([])
  const [associatedTests, setAssociatedTests] = useState<OrthopedicTest[]>([])
  const [associatedClusters, setAssociatedClusters] = useState<OrthopedicTestCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('free')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for resize messages from the iframe (sent by ResizeObserver inside)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-resize' && iframeRef.current) {
        iframeRef.current.style.height = e.data.height + 'px'
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Inject prose styles + anchor fix + ResizeObserver into the srcDoc HTML
  const buildSrcDoc = (html: string) => {
    const injection = `<style>
html,body{height:auto!important;overflow:visible!important}
body{font-family:system-ui,sans-serif;color:#334155;line-height:1.75;font-size:1.125rem;margin:0;padding:0}
h1,h2,h3,h4,h5,h6{color:#0f172a;font-weight:700;margin-top:1.5rem;margin-bottom:.75rem}
h2{font-size:1.5rem;padding-bottom:.5rem;border-bottom:2px solid #a855f7;margin-bottom:1rem}
h3{font-size:1.25rem;color:#3b0764}
p{color:#475569;line-height:1.75;margin:.75rem 0}
strong{color:#0f172a}
ul,ol{padding-left:1.5rem;margin:.5rem 0}
li{color:#475569;margin:.25rem 0}
a{color:#9333ea;text-decoration:none}
a:hover{text-decoration:underline}
blockquote{border-left:4px solid #a855f7;background:#faf5ff;border-radius:.75rem;padding:.25rem 1rem;margin:1rem 0}
table{border-radius:.75rem;overflow:hidden;width:100%;border-collapse:collapse;margin:1rem 0}
th{background:#f3e8ff;color:#581c87;padding:.75rem;text-align:left}
td{border:1px solid #e2e8f0;padding:.75rem}
img{max-width:100%;height:auto;border-radius:.5rem}
/* Sticky headers inside iframe stick to the iframe top, not the page — disable */
.site-header{position:relative!important;top:auto!important}
</style><script>
document.addEventListener('click', function(e) {
  var a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  var id = a.getAttribute('href').slice(1);
  var el = id ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: 'smooth' });
});
function sendHeight() {
  var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
}
new ResizeObserver(sendHeight).observe(document.documentElement);
<\/script>`
    return html.includes('<head>')
      ? html.replace('<head>', '<head>' + injection)
      : injection + html
  }

  // Modal states
  const [selectedTest, setSelectedTest] = useState<FullTest | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<FullCluster | null>(null)
  const [showClusterModal, setShowClusterModal] = useState(false)

  const openTestModal = async (testId: string) => {
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .eq('id', testId)
      .single()
    if (data) {
      setSelectedTest(data)
      setShowTestModal(true)
    }
  }

  const openClusterModal = async (clusterId: string) => {
    const { data: cluster } = await supabase
      .from('orthopedic_test_clusters')
      .select('*')
      .eq('id', clusterId)
      .single()
    if (cluster) {
      // Load tests in this cluster
      const { data: items } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('test_id, order_index')
        .eq('cluster_id', clusterId)
        .order('order_index')

      let clusterTests: { id: string; name: string; category: string }[] = []
      if (items && items.length > 0) {
        const testIds = items.map(i => i.test_id)
        const { data: tests } = await supabase
          .from('orthopedic_tests')
          .select('id, name, category')
          .in('id', testIds)
        clusterTests = testIds
          .map(id => tests?.find(t => t.id === id))
          .filter(Boolean) as { id: string; name: string; category: string }[]
      }

      setSelectedCluster({ ...cluster, tests: clusterTests })
      setShowClusterModal(true)
    }
  }

  const getYoutubeId = (url: string | null) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]*)/)
    return match ? match[1] : null
  }

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileData) setUserRole(profileData.role)

      // Load subject
      const { data: subjectData } = await supabase
        .from('encyclopedia_subjects')
        .select('id, title, color, is_free_access')
        .eq('id', subjectId)
        .single()

      if (!subjectData) { router.push('/elearning/encyclopedie'); return }
      setSubject(subjectData)

      // Load entry
      const { data: entryData } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (!entryData) { router.push(`/elearning/encyclopedie/${subjectId}`); return }
      setEntry(entryData)

      // Load associated tests & clusters
      const [{ data: testLinks }, { data: clusterLinks }] = await Promise.all([
        supabase
          .from('encyclopedia_entry_tests')
          .select('test_id, order_index')
          .eq('entry_id', entryId)
          .order('order_index'),
        supabase
          .from('encyclopedia_entry_clusters')
          .select('cluster_id, order_index')
          .eq('entry_id', entryId)
          .order('order_index'),
      ])

      if (testLinks && testLinks.length > 0) {
        const testIds = testLinks.map(l => l.test_id)
        const { data: tests } = await supabase
          .from('orthopedic_tests')
          .select('id, name, category')
          .in('id', testIds)
        // Preserve order
        const orderedTests = testIds
          .map(id => tests?.find(t => t.id === id))
          .filter(Boolean) as OrthopedicTest[]
        setAssociatedTests(orderedTests)
      } else {
        setAssociatedTests([])
      }

      if (clusterLinks && clusterLinks.length > 0) {
        const clusterIds = clusterLinks.map(l => l.cluster_id)
        const { data: clusters } = await supabase
          .from('orthopedic_test_clusters')
          .select('id, name, region')
          .in('id', clusterIds)
        const orderedClusters = clusterIds
          .map(id => clusters?.find(c => c.id === id))
          .filter(Boolean) as OrthopedicTestCluster[]
        setAssociatedClusters(orderedClusters)
      } else {
        setAssociatedClusters([])
      }

      // Build breadcrumb by walking up parent_id chain
      const crumbs: BreadcrumbItem[] = []
      let currentParentId = entryData.parent_id

      while (currentParentId) {
        const { data: parentData } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, parent_id')
          .eq('id', currentParentId)
          .single()

        if (parentData) {
          crumbs.unshift({ id: parentData.id, title: parentData.title })
          currentParentId = parentData.parent_id
        } else {
          break
        }
      }

      setBreadcrumb(crumbs)

      // Load siblings for prev/next navigation
      const { data: siblingsData } = await supabase
        .from('encyclopedia_entries')
        .select('id, title, order_index, parent_id')
        .eq('subject_id', subjectId)
        .eq('parent_id', entryData.parent_id ?? '')
        .order('order_index', { ascending: true })

      // If parent_id is null, we need a different query
      if (entryData.parent_id === null) {
        const { data: rootSiblings } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, order_index, parent_id')
          .eq('subject_id', subjectId)
          .is('parent_id', null)
          .order('order_index', { ascending: true })
        setSiblings((rootSiblings || []) as Entry[])
      } else {
        setSiblings((siblingsData || []) as Entry[])
      }
    } catch (err) {
      console.error('Erreur chargement fiche:', err)
    } finally {
      setLoading(false)
    }
  }, [subjectId, entryId, router])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!subject || !entry) return null

  const gradient = subject.color || 'from-purple-500 to-indigo-600'
  const vimeoId = extractVimeoId(entry.vimeo_url)
  const isFreeUser = userRole === 'free'
  const locked = isFreeUser && !entry.is_free_access

  // Prev/next navigation
  const currentIndex = siblings.findIndex(s => s.id === entry.id)
  const prevEntry = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextEntry = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {subject.title}
        </button>

        <FreeContentGate isLocked={locked}>
          {/* Fiche Card */}
          <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6 border-b-4 border-black/10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookMarked className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
                    Encyclopédie OsteoUpgrade
                  </h1>
                  <p className="text-white/80 text-sm font-medium">
                    {subject.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
              <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="hover:text-purple-600 transition font-medium"
                >
                  {subject.title}
                </button>
                {breadcrumb.map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-400">{crumb.title}</span>
                  </span>
                ))}
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-800">{entry.title}</span>
              </nav>
            </div>

            {/* Title section */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {entry.title}
              </h2>
            </div>

            {/* Vimeo Video */}
            {vimeoId && (
              <div className="px-8 py-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900 aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={entry.title}
                  />
                </div>
              </div>
            )}

            {/* Rich text content */}
            {entry.content_html && (
              <div className="px-8 py-6">
                <iframe
                  ref={iframeRef}
                  srcDoc={buildSrcDoc(entry.content_html)}
                  sandbox="allow-scripts"
                  className="w-full border-0"
                  style={{ minHeight: '200px' }}
                  title="Contenu"
                />
              </div>
            )}

            {/* Images */}
            {entry.images && entry.images.length > 0 && (
              <div className="px-8 py-4">
                <div className="space-y-6">
                  {entry.images.map((img, idx) => (
                    <figure key={idx} className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
                      <img
                        src={img.url}
                        alt={img.caption || entry.title}
                        className="w-full h-auto object-cover"
                      />
                      {img.caption && (
                        <figcaption className="px-4 py-3 bg-slate-50 text-sm text-slate-600 italic border-t border-slate-200">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Tests & Clusters utiles */}
            {(associatedTests.length > 0 || associatedClusters.length > 0) && (
              <div className="px-8 py-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <TestTube2 className="h-5 w-5 text-purple-600" />
                  Tests / Clusters utiles
                </h3>

                {associatedTests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Tests individuels</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {associatedTests.map((test) => (
                        <button
                          key={test.id}
                          onClick={() => openTestModal(test.id)}
                          className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-left"
                        >
                          <TestTube2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{test.name}</p>
                            {test.category && (
                              <p className="text-xs text-slate-500">{test.category}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {associatedClusters.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Clusters de tests</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {associatedClusters.map((cluster) => (
                        <button
                          key={cluster.id}
                          onClick={() => openClusterModal(cluster.id)}
                          className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition text-left"
                        >
                          <Layers className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{cluster.name}</p>
                            {cluster.region && (
                              <p className="text-xs text-slate-500">{cluster.region}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prev/Next Navigation */}
            {(prevEntry || nextEntry) && (
              <div className="px-8 py-6 border-t border-slate-200">
                <div className="flex justify-between gap-4">
                  {prevEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${prevEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-left flex-1 max-w-xs"
                    >
                      <ArrowLeft className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">Précédent</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{prevEntry.title}</div>
                      </div>
                    </button>
                  ) : <div />}

                  {nextEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${nextEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-right flex-1 max-w-xs ml-auto"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500">Suivant</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{nextEntry.title}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.svg"
                    alt="Ostéo-Upgrade"
                    className="h-10 w-10 rounded-lg bg-white p-1.5"
                  />
                  <div>
                    <p className="text-white font-bold">Encyclopédie OsteoUpgrade</p>
                    <p className="text-white/70 text-sm">{subject.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition border border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </div>
            </div>
          </article>
        </FreeContentGate>
      </div>

      {/* Test Detail Modal */}
      <TestDetailModal
        test={selectedTest}
        isOpen={showTestModal}
        onClose={() => { setShowTestModal(false); setSelectedTest(null) }}
      />

      {/* Cluster Detail Modal */}
      {showClusterModal && selectedCluster && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">{selectedCluster.name}</h2>
                  </div>
                  {selectedCluster.region && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                      Région : {selectedCluster.region}
                    </span>
                  )}
                  {selectedCluster.indications && (
                    <p className="mt-2 text-white/80 text-sm">{selectedCluster.indications}</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowClusterModal(false); setSelectedCluster(null) }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              {selectedCluster.description && (
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Description</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedCluster.description}
                  </p>
                </div>
              )}

              {/* Tests in cluster */}
              {selectedCluster.tests && selectedCluster.tests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-purple-600" />
                    Tests du cluster ({selectedCluster.tests.length})
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedCluster.tests.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setShowClusterModal(false)
                          setSelectedCluster(null)
                          openTestModal(t.id)
                        }}
                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-left"
                      >
                        <TestTube2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                          {t.category && <p className="text-xs text-gray-500">{t.category}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {(selectedCluster.sensitivity !== null || selectedCluster.specificity !== null) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedCluster.sensitivity !== null && selectedCluster.sensitivity !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 font-medium mb-1">Sensibilité</div>
                      <div className="text-2xl font-bold text-green-700">{selectedCluster.sensitivity}%</div>
                    </div>
                  )}
                  {selectedCluster.specificity !== null && selectedCluster.specificity !== undefined && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-medium mb-1">Spécificité</div>
                      <div className="text-2xl font-bold text-blue-700">{selectedCluster.specificity}%</div>
                    </div>
                  )}
                  {selectedCluster.rv_positive !== null && selectedCluster.rv_positive !== undefined && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs text-purple-600 font-medium mb-1">RV+</div>
                      <div className="text-2xl font-bold text-purple-700">{selectedCluster.rv_positive}</div>
                    </div>
                  )}
                  {selectedCluster.rv_negative !== null && selectedCluster.rv_negative !== undefined && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-xs text-orange-600 font-medium mb-1">RV-</div>
                      <div className="text-2xl font-bold text-orange-700">{selectedCluster.rv_negative}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Interest */}
              {selectedCluster.interest && (
                <div className="bg-purple-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Intérêt clinique</h3>
                  </div>
                  <p className="text-purple-800 whitespace-pre-line leading-relaxed">
                    {selectedCluster.interest}
                  </p>
                </div>
              )}

              {/* Sources */}
              {selectedCluster.sources && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Sources</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {selectedCluster.sources}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
