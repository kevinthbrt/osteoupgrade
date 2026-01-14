'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { generateConsultationPDF } from '@/utils/generateConsultationPDF'
import {
  Activity,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Map,
  Filter,
  Save,
  Download,
  Info,
  Clock,
  MapPin,
  Target,
  Stethoscope,
  HelpCircle,
  FileText,
  Clipboard
} from 'lucide-react'
import {
  getTopographicZonesByRegion,
  getDecisionTreesByZone,
  getTreeRootNode,
  getNodeWithRelations,
  getNodeAnswers,
  createConsultation
} from '@/lib/topographic-system-api'
import type {
  TopographicZone,
  DecisionTree,
  DecisionNode,
  DecisionAnswer
} from '@/lib/types-topographic-system'

const REGIONS = [
  { value: 'cervical', label: 'Cervical', icon: '🔵', description: 'Rachis cervical' },
  { value: 'thoracique', label: 'Thoracique', icon: '🟢', description: 'Rachis thoracique' },
  { value: 'lombaire', label: 'Lombaire', icon: '🟠', description: 'Rachis lombaire' },
  { value: 'epaule', label: 'Épaule', icon: '🔴', description: 'Complexe de l\'épaule' },
  { value: 'coude', label: 'Coude', icon: '🟣', description: 'Articulation du coude' },
  { value: 'poignet', label: 'Poignet + main', icon: '🟡', description: 'Poignet, main et doigts' },
  { value: 'hanche', label: 'Hanche', icon: '🔶', description: 'Articulation de la hanche' },
  { value: 'genou', label: 'Genou', icon: '🔷', description: 'Articulation du genou' },
  { value: 'cheville', label: 'Cheville', icon: '🟤', description: 'Cheville et pied' },
  { value: 'pied', label: 'Pied', icon: '👣', description: 'Pied et orteils' }
]

interface NavigationStep {
  nodeId: string
  node: DecisionNode
  answerId?: string
  answerText?: string
}

interface ConsultationData {
  patientName: string
  patientAge: string
  consultationDate: string
  notes: string
}

export default function ConsultationV3Page() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // Steps: region → zone → tree → navigation → tests → summary
  const [currentStep, setCurrentStep] = useState<'region' | 'zone' | 'tree' | 'navigation' | 'tests' | 'summary'>('region')
  
  // Selected data
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [zones, setZones] = useState<TopographicZone[]>([])
  const [selectedZone, setSelectedZone] = useState<TopographicZone | null>(null)
  const [trees, setTrees] = useState<DecisionTree[]>([])
  const [selectedTree, setSelectedTree] = useState<DecisionTree | null>(null)
  
  // Navigation state
  const [navigationHistory, setNavigationHistory] = useState<NavigationStep[]>([])
  const [currentNode, setCurrentNode] = useState<DecisionNode | null>(null)
  const [currentAnswers, setCurrentAnswers] = useState<DecisionAnswer[]>([])
  const [loadingNode, setLoadingNode] = useState(false)
  
  // Results
  const [pathologies, setPathologies] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [testResults, setTestResults] = useState<Record<string, 'positive' | 'negative' | 'uncertain'>>({})
  
  // Consultation data
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    patientName: '',
    patientAge: '',
    consultationDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      loadZones(selectedRegion)
    }
  }, [selectedRegion])

  useEffect(() => {
    if (selectedZone) {
      loadTrees(selectedZone.id)
    }
  }, [selectedZone])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData?.role !== 'admin') {
      alert('Consultation guidée est en pré-lancement et réservée aux administrateurs')
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  const loadZones = async (region: string) => {
    try {
      const data = await getTopographicZonesByRegion(region as any)
      setZones(data)
    } catch (error) {
      console.error('Error loading zones:', error)
    }
  }

  const loadTrees = async (zoneId: string) => {
    try {
      const data = await getDecisionTreesByZone(zoneId)
      setTrees(data)
    } catch (error) {
      console.error('Error loading trees:', error)
    }
  }

  const startTreeNavigation = async (tree: DecisionTree) => {
    setSelectedTree(tree)
    setLoadingNode(true)
    
    try {
      const rootNode = await getTreeRootNode(tree.id)
      
      if (!rootNode) {
        alert('⚠️ Aucun nœud racine trouvé pour cet arbre')
        return
      }
      
      const nodeWithData = await getNodeWithRelations(rootNode.id)
      setCurrentNode(nodeWithData)
      
      if (nodeWithData.node_type === 'question') {
        const answers = await getNodeAnswers(nodeWithData.id)
        setCurrentAnswers(answers)
      } else {
        setCurrentAnswers([])
      }
      
      setNavigationHistory([{
        nodeId: nodeWithData.id,
        node: nodeWithData
      }])
      
      setCurrentStep('navigation')
    } catch (error) {
      console.error('Error starting navigation:', error)
      alert('❌ Erreur lors du chargement de l\'arbre')
    } finally {
      setLoadingNode(false)
    }
  }

  const handleAnswerClick = async (answer: DecisionAnswer) => {
    if (!answer.next_node_id) {
      alert('⚠️ Cette réponse n\'est pas encore liée à un nœud suivant')
      return
    }
    
    setLoadingNode(true)
    
    try {
      const nextNode = await getNodeWithRelations(answer.next_node_id)
      setCurrentNode(nextNode)
      
      // Add to history
      setNavigationHistory(prev => [...prev, {
        nodeId: nextNode.id,
        node: nextNode,
        answerId: answer.id,
        answerText: answer.answer_text
      }])
      
      // Load answers if question node
      if (nextNode.node_type === 'question') {
        const answers = await getNodeAnswers(nextNode.id)
        setCurrentAnswers(answers)
      } else {
        setCurrentAnswers([])
      }
      
      // If diagnosis node, load pathologies
      if (nextNode.node_type === 'diagnosis' && nextNode.pathology_ids) {
        const pathologyData = await Promise.all(
          nextNode.pathology_ids.map(id => 
            supabase.from('pathologies').select('*').eq('id', id).single()
          )
        )
        const loadedPathologies = pathologyData.map(r => r.data).filter(Boolean)
        setPathologies(loadedPathologies)
      }
      
      // If tests node, load tests and clusters
      if (nextNode.node_type === 'tests') {
        let loadedTests: any[] = []
        let loadedClusters: any[] = []
        
        if (nextNode.test_ids && nextNode.test_ids.length > 0) {
          const testData = await Promise.all(
            nextNode.test_ids.map(id => 
              supabase.from('orthopedic_tests').select('*').eq('id', id).single()
            )
          )
          loadedTests = testData.map(r => r.data).filter(Boolean)
        }
        
        if (nextNode.cluster_ids && nextNode.cluster_ids.length > 0) {
          const clusterData = await Promise.all(
            nextNode.cluster_ids.map(async id => {
              const { data: cluster } = await supabase
                .from('orthopedic_test_clusters')
                .select('*')
                .eq('id', id)
                .single()
              
              const { data: items } = await supabase
                .from('orthopedic_test_cluster_items')
                .select('*, test:orthopedic_tests(*)')
                .eq('cluster_id', id)
                .order('order_index')
              
              return {
                ...cluster,
                tests: items?.map(item => item.test) || []
              }
            })
          )
          loadedClusters = clusterData.filter(Boolean)
        }
        
        setTests(loadedTests)
        setClusters(loadedClusters)
        setCurrentStep('tests')
      }
    } catch (error) {
      console.error('Error navigating to next node:', error)
      alert('❌ Erreur lors de la navigation')
    } finally {
      setLoadingNode(false)
    }
  }

  const handleGoBack = () => {
    if (navigationHistory.length <= 1) return
    
    const newHistory = navigationHistory.slice(0, -1)
    setNavigationHistory(newHistory)
    
    const previousStep = newHistory[newHistory.length - 1]
    setCurrentNode(previousStep.node)
    
    if (previousStep.node.node_type === 'question') {
      getNodeAnswers(previousStep.node.id).then(setCurrentAnswers)
    } else {
      setCurrentAnswers([])
    }
  }

  const handleTestResult = (testId: string, result: 'positive' | 'negative' | 'uncertain') => {
    setTestResults(prev => ({
      ...prev,
      [testId]: result
    }))
  }

  const handleFinishTests = () => {
    setCurrentStep('summary')
  }

  const saveConsultation = async () => {
    if (!consultationData.patientName) {
      alert('⚠️ Veuillez saisir le nom du patient')
      return
    }
    
    if (!selectedZone || !selectedTree) {
      alert('⚠️ Données de consultation incomplètes')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Build decision path for notes
      const decisionPathSummary = navigationHistory
        .map((step, idx) => `${idx + 1}. ${step.answerText || 'Début'}`)
        .join('\n')
      
      // Build test results summary
      const testResultsSummary = Object.entries(testResults).length > 0
        ? '\n\n=== RÉSULTATS DES TESTS ===\n' + 
          Object.entries(testResults)
            .map(([testId, result]) => {
              const test = [...tests, ...clusters.flatMap(c => c.tests || [])].find(t => t.id === testId)
              return `${test?.name || testId}: ${result}`
            })
            .join('\n')
        : ''
      
      // Build diagnosis summary
      const diagnosisSummary = pathologies.length > 0
        ? '\n\n=== DIAGNOSTIC(S) SUGGÉRÉ(S) ===\n' + 
          pathologies.map(p => `- ${p.name}`).join('\n')
        : ''
      
      const fullNotes = `=== PARCOURS DE CONSULTATION ===
${decisionPathSummary}${testResultsSummary}${diagnosisSummary}

=== NOTES ===
${consultationData.notes}`
      
      // Create consultation
      await createConsultation({
        patient_name: consultationData.patientName,
        consultation_date: consultationData.consultationDate,
        region: selectedRegion as any,
        topographic_zone_id: selectedZone.id,
        decision_tree_id: selectedTree.id,
        notes: fullNotes
      })
      
      alert('✅ Consultation sauvegardée avec succès')
      
      // Reset
      resetConsultation()
      
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const resetConsultation = () => {
    setCurrentStep('region')
    setSelectedRegion('')
    setSelectedZone(null)
    setSelectedTree(null)
    setNavigationHistory([])
    setCurrentNode(null)
    setPathologies([])
    setTests([])
    setClusters([])
    setTestResults({})
    setConsultationData({
      patientName: '',
      patientAge: '',
      consultationDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const generatePDF = async () => {
    if (!consultationData.patientName) {
      alert('⚠️ Veuillez saisir le nom du patient')
      return
    }
    
    // Build PDF data - adapter au format attendu
    const episodes = [{
      region: selectedRegion,
      triageAnswers: {
        // Résumé du parcours dans l'arbre
        region: selectedRegion,
        zone: selectedZone?.name || '',
        tree: selectedTree?.name || '',
        path: navigationHistory.map(s => s.answerText || 'Début').join(' → ')
      },
      filteredPathologies: pathologies.map(p => ({
        pathology: p,
        matchScore: 100,
        matchedCriteria: [],
        tests: [],
        clusters: []
      })),
      selectedPathology: pathologies[0] || null,
      testResults: Object.entries(testResults).map(([testId, result]) => ({
        testId,
        result
      }))
    }]
    
    await generateConsultationPDF({
      patientName: consultationData.patientName,
      patientAge: consultationData.patientAge,
      consultationDate: consultationData.consultationDate,
      notes: consultationData.notes,
      episodes
    })
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec progression */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="h-7 w-7 text-primary-600" />
                Consultation Guidée V3
              </h1>
              <p className="text-gray-600 mt-1">
                Navigation par zones topographiques et arbres décisionnels
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full"></div>
            <div 
              className="absolute left-0 top-5 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{
                width: 
                  currentStep === 'region' ? '16%' : 
                  currentStep === 'zone' ? '33%' :
                  currentStep === 'tree' ? '50%' :
                  currentStep === 'navigation' ? '66%' :
                  currentStep === 'tests' ? '83%' : '100%'
              }}
            />
            
            {['Région', 'Zone', 'Arbre', 'Navigation', 'Tests', 'Résumé'].map((step, index) => {
              const stepValues = ['region', 'zone', 'tree', 'navigation', 'tests', 'summary']
              const currentIndex = stepValues.indexOf(currentStep)
              const isActive = index === currentIndex
              const isCompleted = index < currentIndex

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                    ${isActive ? 'bg-primary-600 text-white shadow-lg scale-110' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-white border-2 border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-primary-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ÉTAPE 1: Sélection Région */}
        {currentStep === 'region' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Map className="h-6 w-6 text-primary-600" />
              Sélectionner la région anatomique
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {REGIONS.map(region => (
                <button
                  key={region.value}
                  onClick={() => {
                    setSelectedRegion(region.value)
                    setCurrentStep('zone')
                  }}
                  className="group relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="text-4xl mb-3">{region.icon}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 mb-1">
                    {region.label}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {region.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Sélection Zone */}
        {currentStep === 'zone' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary-600" />
                  Sélectionner la zone topographique
                </h2>
                <p className="text-gray-600 mt-1">
                  Région : {REGIONS.find(r => r.value === selectedRegion)?.label}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentStep('region')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" />
                Retour
              </button>
            </div>
            
            {zones.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Aucune zone topographique configurée pour cette région
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setSelectedZone(zone)
                      setCurrentStep('tree')
                    }}
                    className="group text-left bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-lg overflow-hidden"
                  >
                    {zone.image_url ? (
                      <div className="h-48 overflow-hidden bg-white border-b-2 border-gray-200">
                        <img
                          src={zone.image_url}
                          alt={zone.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-b-2 border-gray-300">
                        <MapPin className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-700 mb-2">
                        {zone.name}
                      </h3>
                      
                      {zone.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {zone.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 3: Sélection Arbre */}
        {currentStep === 'tree' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary-600" />
                  Sélectionner l'arbre décisionnel
                </h2>
                <p className="text-gray-600 mt-1">
                  Zone : {selectedZone?.name}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentStep('zone')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" />
                Retour
              </button>
            </div>
            
            {trees.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Aucun arbre décisionnel configuré pour cette zone
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trees.map(tree => (
                  <button
                    key={tree.id}
                    onClick={() => startTreeNavigation(tree)}
                    className="group text-left p-6 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 bg-white rounded-lg border-2 border-indigo-300">
                        <Target className="h-8 w-8 text-indigo-600" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700 mb-2">
                          {tree.name}
                        </h3>
                        
                        {tree.description && (
                          <p className="text-sm text-gray-700 mb-4">
                            {tree.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-indigo-600 group-hover:text-indigo-700 font-medium">
                          Démarrer la consultation
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 4: Navigation dans l'arbre */}
        {currentStep === 'navigation' && currentNode && (
          <div className="space-y-6">
            {/* Header Navigation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedTree?.name}
                  </h2>
                  <p className="text-gray-600">
                    {selectedZone?.name} - {REGIONS.find(r => r.value === selectedRegion)?.label}
                  </p>
                </div>
                
                {navigationHistory.length > 1 && (
                  <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Précédent
                  </button>
                )}
              </div>
              
              {/* Breadcrumb */}
              {navigationHistory.length > 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto pb-2">
                  {navigationHistory.map((step, index) => (
                    <div key={step.nodeId} className="flex items-center gap-2">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                        {step.node.node_type === 'question' && <HelpCircle className="h-3 w-3" />}
                        {step.node.node_type === 'diagnosis' && <FileText className="h-3 w-3" />}
                        {step.node.node_type === 'tests' && <Clipboard className="h-3 w-3" />}
                        <span className="font-medium">
                          {step.answerText || 'Début'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Node */}
            {loadingNode ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Question Node */}
                {currentNode.node_type === 'question' && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <HelpCircle className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-blue-600 uppercase">
                            Question
                          </h3>
                          <p className="text-sm text-gray-600">
                            Étape {navigationHistory.length}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-2xl font-bold text-gray-900">
                        {currentNode.question_text}
                      </p>
                    </div>
                    
                    {currentAnswers.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                          Aucune réponse configurée pour cette question
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentAnswers.map(answer => (
                          <button
                            key={answer.id}
                            onClick={() => handleAnswerClick(answer)}
                            disabled={!answer.next_node_id}
                            className={`p-6 rounded-xl border-2 text-left transition-all ${
                              answer.next_node_id
                                ? 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 hover:shadow-lg'
                                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {answer.next_node_id ? (
                                  <CheckCircle className="h-6 w-6 text-blue-600" />
                                ) : (
                                  <AlertCircle className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">
                                  {answer.answer_text}
                                </p>
                                {!answer.next_node_id && (
                                  <p className="text-xs text-gray-500">
                                    Pas de suite configurée
                                  </p>
                                )}
                              </div>
                              {answer.next_node_id && (
                                <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Diagnosis Node */}
                {currentNode.node_type === 'diagnosis' && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-600 uppercase">
                            Diagnostic
                          </h3>
                          <p className="text-sm text-gray-600">
                            Pathologies identifiées
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {pathologies.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                          Aucune pathologie trouvée
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pathologies.map((pathology, index) => (
                          <div 
                            key={pathology.id}
                            className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
                          >
                            <div className="flex items-start gap-4">
                              {pathology.topographic_image_url && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={pathology.topographic_image_url}
                                    alt={pathology.name}
                                    className="h-24 w-24 object-contain bg-white rounded-lg border-2 border-green-200 p-2"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                  {index + 1}. {pathology.name}
                                </h3>
                                
                                {pathology.description && (
                                  <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {pathology.description}
                                    </p>
                                  </div>
                                )}
                                
                                {pathology.recommendations && (
                                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                    <div className="flex items-start gap-2">
                                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">
                                          Recommandations
                                        </h4>
                                        <p className="text-sm text-blue-800">
                                          {pathology.recommendations}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setCurrentStep('summary')}
                        className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
                      >
                        Terminer la consultation
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ÉTAPE 5: Tests (comme testing-v2) */}
        {currentStep === 'tests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clipboard className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-600 uppercase">
                    Tests Orthopédiques
                  </h3>
                  <p className="text-sm text-gray-600">
                    Évaluer les tests suivants
                  </p>
                </div>
              </div>
              
              {/* Individual Tests */}
              {tests.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Tests individuels</h4>
                  <div className="space-y-4">
                    {tests.map(test => (
                      <div 
                        key={test.id}
                        className="p-6 bg-orange-50 border-2 border-orange-200 rounded-xl"
                      >
                        <div className="mb-4">
                          <h5 className="font-bold text-gray-900 mb-2">{test.name}</h5>
                          {test.description && (
                            <p className="text-sm text-gray-700">{test.description}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTestResult(test.id, 'positive')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              testResults[test.id] === 'positive'
                                ? 'bg-green-600 text-white shadow-lg scale-105'
                                : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                          >
                            ✅ Positif
                          </button>
                          <button
                            onClick={() => handleTestResult(test.id, 'negative')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              testResults[test.id] === 'negative'
                                ? 'bg-red-600 text-white shadow-lg scale-105'
                                : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            ❌ Négatif
                          </button>
                          <button
                            onClick={() => handleTestResult(test.id, 'uncertain')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              testResults[test.id] === 'uncertain'
                                ? 'bg-gray-600 text-white shadow-lg scale-105'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            ❓ Incertain
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Clusters */}
              {clusters.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Clusters de tests</h4>
                  <div className="space-y-6">
                    {clusters.map(cluster => (
                      <div 
                        key={cluster.id}
                        className="p-6 bg-purple-50 border-2 border-purple-300 rounded-xl"
                      >
                        <h5 className="font-bold text-gray-900 mb-4">{cluster.name}</h5>
                        
                        {cluster.tests && cluster.tests.length > 0 && (
                          <div className="space-y-3">
                            {cluster.tests.map((test: any) => (
                              <div 
                                key={test.id}
                                className="p-4 bg-white rounded-lg border border-purple-200"
                              >
                                <div className="mb-3">
                                  <h6 className="font-medium text-gray-900">{test.name}</h6>
                                  {test.description && (
                                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleTestResult(test.id, 'positive')}
                                    className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                      testResults[test.id] === 'positive'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
                                    }`}
                                  >
                                    ✅
                                  </button>
                                  <button
                                    onClick={() => handleTestResult(test.id, 'negative')}
                                    className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                      testResults[test.id] === 'negative'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                                    }`}
                                  >
                                    ❌
                                  </button>
                                  <button
                                    onClick={() => handleTestResult(test.id, 'uncertain')}
                                    className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                      testResults[test.id] === 'uncertain'
                                        ? 'bg-gray-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    ❓
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleFinishTests}
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg"
                >
                  Terminer les tests
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 6: Résumé */}
        {currentStep === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="h-7 w-7 text-green-600" />
                Résumé de la consultation
              </h2>
              
              {/* Patient Info */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du patient *
                  </label>
                  <input
                    type="text"
                    value={consultationData.patientName}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Nom complet"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de consultation
                  </label>
                  <input
                    type="date"
                    value={consultationData.consultationDate}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, consultationDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              {/* Consultation Path */}
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Parcours de consultation</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Région :</span>
                    <span className="text-gray-900">
                      {REGIONS.find(r => r.value === selectedRegion)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Zone :</span>
                    <span className="text-gray-900">{selectedZone?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Arbre :</span>
                    <span className="text-gray-900">{selectedTree?.name}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="text-sm font-medium text-gray-700 mb-2">Chemin parcouru :</p>
                  <div className="space-y-1">
                    {navigationHistory.map((step, index) => (
                      <div key={step.nodeId} className="text-sm text-gray-600">
                        {index + 1}. {step.answerText || 'Début'} 
                        {step.node.node_type === 'diagnosis' && ' → Diagnostic'}
                        {step.node.node_type === 'tests' && ' → Tests'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Pathologies */}
              {pathologies.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Pathologies identifiées ({pathologies.length})
                  </h3>
                  <div className="space-y-2">
                    {pathologies.map(p => (
                      <div key={p.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-gray-900">{p.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Test Results */}
              {Object.keys(testResults).length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Résultats des tests ({Object.keys(testResults).length})
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([testId, result]) => {
                      const test = [...tests, ...clusters.flatMap(c => c.tests || [])].find(t => t.id === testId)
                      return (
                        <div key={testId} className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                          <p className="font-medium text-gray-900">{test?.name || `Test #${testId.slice(0, 8)}`}</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            result === 'positive' ? 'bg-green-600 text-white' :
                            result === 'negative' ? 'bg-red-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {result === 'positive' ? '✅ Positif' :
                             result === 'negative' ? '❌ Négatif' :
                             '❓ Incertain'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de consultation
                </label>
                <textarea
                  value={consultationData.notes}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={6}
                  placeholder="Observations, recommandations, notes diverses..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={saveConsultation}
                  disabled={saving || !consultationData.patientName}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder la consultation'}
                </button>
                
                <button
                  onClick={generatePDF}
                  disabled={!consultationData.patientName}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  Exporter en PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}