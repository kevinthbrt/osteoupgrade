'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, ChevronRight, Plus, AlertCircle, TestTube2 } from 'lucide-react'
import Image from 'next/image'

interface Pathology {
  id: string
  name: string
  description: string | null
  region: string
  clinical_signs: string | null
  image_url: string | null
}

interface OrthopedicTest {
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
  created_by: string | null
  created_at: string
  updated_at: string
}

interface OrthopedicTestCluster {
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
}

interface PathologyWithTests extends Pathology {
  tests: OrthopedicTest[]
  clusters: OrthopedicTestCluster[]
}

interface DiagnosticsModalProps {
  region: string
  regionDisplay: string
  isOpen: boolean
  onClose: () => void
  onAddTests: (tests: OrthopedicTest[], diagnosticName: string) => void
}

export default function DiagnosticsModal({
  region,
  regionDisplay,
  isOpen,
  onClose,
  onAddTests
}: DiagnosticsModalProps) {
  const [pathologies, setPathologies] = useState<PathologyWithTests[]>([])
  const [selectedPathology, setSelectedPathology] = useState<PathologyWithTests | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && region) {
      loadPathologies()
    }
  }, [isOpen, region])

  const loadPathologies = async () => {
    setLoading(true)
    try {
      // Normaliser le nom de région pour matcher avec la table pathologies
      // Les zones 3D peuvent avoir des noms comme "Lombaires", "lombaire_basse", etc.
      // mais pathologies utilise "lombaire" (minuscules, singulier)
      let normalizedRegion = region.toLowerCase().trim()

      // Split sur underscore et prendre la première partie (ex: "lombaire_basse" -> "lombaire")
      if (normalizedRegion.includes('_')) {
        normalizedRegion = normalizedRegion.split('_')[0]
      }

      // Retirer le 's' final si présent (lombaires -> lombaire)
      // SAUF si c'est un mot composé avec tiret (sacro-iliaque, etc.)
      if (normalizedRegion.endsWith('s') && !normalizedRegion.includes('-')) {
        normalizedRegion = normalizedRegion.slice(0, -1)
      }

      console.log('🔍 DiagnosticsModal - Recherche diagnostics:', {
        originalRegion: region,
        normalizedRegion: normalizedRegion,
        regionDisplay: regionDisplay
      })

      // Charger les pathologies de la région
      const { data: pathologiesData, error: pathologiesError } = await supabase
        .from('pathologies')
        .select('*')
        .eq('region', normalizedRegion)
        .eq('is_active', true)
        .order('display_order')

      console.log('📊 Résultat de la requête:', {
        found: pathologiesData?.length || 0,
        error: pathologiesError,
        data: pathologiesData
      })

      if (pathologiesError) throw pathologiesError

      if (!pathologiesData || pathologiesData.length === 0) {
        setPathologies([])
        setLoading(false)
        return
      }

      // Charger les tests et clusters associés pour chaque pathologie
      const pathologiesWithTests = await Promise.all(
        pathologiesData.map(async (pathology) => {
          // Charger les tests
          const { data: testLinks } = await supabase
            .from('pathology_tests')
            .select('test_id, order_index')
            .eq('pathology_id', pathology.id)
            .order('order_index')

          const testIds = testLinks?.map(tl => tl.test_id) || []

          let orderedTests: OrthopedicTest[] = []
          if (testIds.length > 0) {
            const { data: tests } = await supabase
              .from('orthopedic_tests')
              .select('*')
              .in('id', testIds)

            // Réorganiser les tests selon l'ordre défini
            orderedTests = testIds
              .map(id => tests?.find(t => t.id === id))
              .filter(Boolean) as OrthopedicTest[]
          }

          // Charger les clusters
          const { data: clusterLinks } = await supabase
            .from('pathology_clusters')
            .select('cluster_id, order_index')
            .eq('pathology_id', pathology.id)
            .order('order_index')

          const clusterIds = clusterLinks?.map(cl => cl.cluster_id) || []

          let orderedClusters: OrthopedicTestCluster[] = []
          if (clusterIds.length > 0) {
            const { data: clusters } = await supabase
              .from('orthopedic_test_clusters')
              .select('*')
              .in('id', clusterIds)

            // Réorganiser les clusters selon l'ordre défini
            orderedClusters = clusterIds
              .map(id => clusters?.find(c => c.id === id))
              .filter(Boolean) as OrthopedicTestCluster[]
          }

          return { ...pathology, tests: orderedTests, clusters: orderedClusters }
        })
      )

      setPathologies(pathologiesWithTests)
    } catch (error) {
      console.error('Error loading pathologies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPathology = (pathology: PathologyWithTests) => {
    setSelectedPathology(pathology)
  }

  const handleBack = () => {
    setSelectedPathology(null)
  }

  const handleAddAllTests = () => {
    if (selectedPathology && selectedPathology.tests.length > 0) {
      onAddTests(selectedPathology.tests, selectedPathology.name)
      onClose()
      setSelectedPathology(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedPathology ? selectedPathology.name : `Diagnostics - ${regionDisplay}`}
              </h2>
              <p className="text-purple-100 mt-1">
                {selectedPathology
                  ? 'Détails du diagnostic'
                  : 'Sélectionnez un diagnostic pour voir les tests associés'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : selectedPathology ? (
            // Vue détails d'un diagnostic
            <div className="space-y-6">
              <button
                onClick={handleBack}
                className="text-purple-600 hover:text-purple-700 flex items-center gap-2 text-sm font-medium"
              >
                ← Retour à la liste
              </button>

              {/* Image */}
              {selectedPathology.image_url && (
                <div className="relative h-64 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedPathology.image_url}
                    alt={selectedPathology.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Description */}
              {selectedPathology.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{selectedPathology.description}</p>
                </div>
              )}

              {/* Signes cliniques */}
              {selectedPathology.clinical_signs && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900 mb-2">
                        Signes cliniques évidents
                      </h3>
                      <p className="text-amber-800 whitespace-pre-line text-sm">
                        {selectedPathology.clinical_signs}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tests associés */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TestTube2 className="h-5 w-5 text-purple-600" />
                  Tests associés ({selectedPathology.tests.length})
                </h3>

                {selectedPathology.tests.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <TestTube2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun test associé à ce diagnostic</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPathology.tests.map((test, index) => (
                      <div
                        key={test.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{test.name}</h4>
                            {test.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {test.description}
                              </p>
                            )}
                            {(test.sensitivity || test.specificity) && (
                              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                {test.sensitivity && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    Se: {test.sensitivity}%
                                  </span>
                                )}
                                {test.specificity && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    Sp: {test.specificity}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clusters de tests associés */}
              {selectedPathology.clusters.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-purple-600" />
                    Clusters de tests ({selectedPathology.clusters.length})
                  </h3>

                  <div className="space-y-3">
                    {selectedPathology.clusters.map((cluster, index) => (
                      <div
                        key={cluster.id}
                        className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{cluster.name}</h4>
                            {cluster.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {cluster.description}
                              </p>
                            )}
                            {(cluster.sensitivity || cluster.specificity) && (
                              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                {cluster.sensitivity && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    Se: {cluster.sensitivity}%
                                  </span>
                                )}
                                {cluster.specificity && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    Sp: {cluster.specificity}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedPathology.tests.length > 0 && (
                <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t">
                  <button
                    onClick={handleAddAllTests}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter tous ces tests à la session ({selectedPathology.tests.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Liste des diagnostics
            <div>
              {pathologies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <AlertCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun diagnostic configuré
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Aucun diagnostic n'a été créé pour la région {regionDisplay}.
                  </p>
                  <p className="text-sm text-gray-500">
                    Les administrateurs peuvent créer des diagnostics dans la section Admin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pathologies.map((pathology) => {
                    // Extraire les bullet points des signes cliniques
                    const clinicalSignsList = pathology.clinical_signs
                      ? pathology.clinical_signs
                          .split('\n')
                          .map(s => s.trim())
                          .filter(s => s.length > 0)
                          .slice(0, 3) // Max 3 lignes
                      : []

                    return (
                      <button
                        key={pathology.id}
                        onClick={() => handleSelectPathology(pathology)}
                        className="group text-left border-2 border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 hover:shadow-lg transition-all"
                      >
                        {/* Image sans overlay */}
                        {pathology.image_url && (
                          <div className="relative h-40 bg-gray-100">
                            <Image
                              src={pathology.image_url}
                              alt={pathology.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="p-4">
                          {/* Titre toujours en dessous de l'image */}
                          <h3 className="font-semibold text-gray-900 text-lg mb-3">
                            {pathology.name}
                          </h3>

                          {/* Signes cliniques sous forme de tirets */}
                          {clinicalSignsList.length > 0 && (
                            <ul className="space-y-1 mb-3">
                              {clinicalSignsList.map((sign, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-purple-600 mt-1">•</span>
                                  <span className="flex-1">{sign}</span>
                                </li>
                              ))}
                              {pathology.clinical_signs && pathology.clinical_signs.split('\n').filter(s => s.trim()).length > 3 && (
                                <li className="text-xs text-gray-500 italic">+ autres signes...</li>
                              )}
                            </ul>
                          )}

                          {/* Indicateurs en bas */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {pathology.tests.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <TestTube2 className="h-3 w-3" />
                                  {pathology.tests.length} test{pathology.tests.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {pathology.clusters.length > 0 && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <TestTube2 className="h-3 w-3" />
                                  {pathology.clusters.length} cluster{pathology.clusters.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
