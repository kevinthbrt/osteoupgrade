'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  ArrowLeft,
  PlayCircle,
  RefreshCw,
  FileText,
  Download,
  Clock,
  Activity,
  Heart,
  Brain,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Home
} from 'lucide-react'

interface TreeNode {
  id: string
  type: 'question' | 'test' | 'diagnosis'
  content: string
  testId?: string
  answers?: Answer[]
  diagnosisType?: 'red_flag' | 'normal' | 'caution' // Nouveau
  recommendations?: string // Nouveau
  urgency?: 'immediate' | 'urgent' | 'routine' // Nouveau
  referral?: string // Nouveau - orientation suggérée
}

interface Answer {
  id: string
  label: string
  nextNode?: TreeNode
  icon?: string // Nouveau - pour des icônes sur les réponses
}

interface HistoryItem {
  node: TreeNode
  answer?: Answer
}

// Icônes pour rendre l'interface plus ludique
const DIAGNOSIS_ICONS = {
  red_flag: AlertTriangle,
  normal: CheckCircle,
  caution: AlertCircle
}

const DIAGNOSIS_COLORS = {
  red_flag: 'from-red-500 to-red-600',
  normal: 'from-green-500 to-green-600',
  caution: 'from-yellow-500 to-yellow-600'
}

const DIAGNOSIS_BG_COLORS = {
  red_flag: 'bg-red-50 border-red-200',
  normal: 'bg-green-50 border-green-200',
  caution: 'bg-yellow-50 border-yellow-200'
}

// Animation de pulsation pour les boutons importants
const pulseAnimation = "animate-pulse"

export default function TreeVisualizerPage() {
  const params = useParams()
  const router = useRouter()
  const treeId = params?.id as string

  const [tree, setTree] = useState<any>(null)
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [testDetails, setTestDetails] = useState<any>(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    mainComplaint: ''
  })
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set())
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (treeId) {
      loadTree()
      setSessionStartTime(new Date())
    }
  }, [treeId])

  const loadTree = async () => {
    try {
      const { data: treeData } = await supabase
        .from('decision_trees')
        .select('*')
        .eq('id', treeId)
        .single()

      if (!treeData) {
        router.push('/trees')
        return
      }

      setTree(treeData)

      // Charger les nœuds
      const { data: nodesData } = await supabase
        .from('tree_nodes')
        .select('*')
        .eq('tree_id', treeId)
        .order('parent_id', { ascending: true })

      if (nodesData && nodesData.length > 0) {
        const nodeMap = new Map<string, TreeNode>()
        const rootNodes: TreeNode[] = []

        // Créer les nœuds avec les nouveaux champs
        nodesData.forEach(node => {
          const nodeContent = typeof node.content === 'string' 
            ? node.content 
            : JSON.parse(node.content || '{}')
            
          const treeNode: TreeNode = {
            id: node.id,
            type: node.node_type as 'question' | 'test' | 'diagnosis',
            content: typeof nodeContent === 'string' ? nodeContent : nodeContent.text || '',
            testId: node.test_id,
            answers: node.responses ? JSON.parse(node.responses) : [],
            diagnosisType: nodeContent.diagnosisType,
            recommendations: nodeContent.recommendations,
            urgency: nodeContent.urgency,
            referral: nodeContent.referral
          }
          nodeMap.set(node.id, treeNode)
        })

        // Établir les relations
        nodesData.forEach(node => {
          const currentNode = nodeMap.get(node.id)!
          
          if (!node.parent_id) {
            rootNodes.push(currentNode)
          } else {
            const parent = nodeMap.get(node.parent_id)
            if (parent && parent.answers) {
              const answerIndex = node.order_index
              if (parent.answers[answerIndex]) {
                parent.answers[answerIndex].nextNode = currentNode
              }
            }
          }
        })

        if (rootNodes.length > 0) {
          setCurrentNode(rootNodes[0])
        }
      }
    } catch (error) {
      console.error('Error loading tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTestDetails = async (testId: string) => {
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .eq('id', testId)
      .single()
    
    setTestDetails(data)
  }

  const handleAnswer = (answer: Answer) => {
    if (!currentNode) return

    // Ajouter à l'historique avec animation
    setHistory([...history, { node: currentNode, answer }])

    // Marquer le test comme complété si c'était un test
    if (currentNode.type === 'test' && currentNode.testId) {
      setCompletedTests(new Set([...completedTests, currentNode.testId]))
    }

    // Passer au nœud suivant
    if (answer.nextNode) {
      setCurrentNode(answer.nextNode)
      
      // Charger les détails du test si nécessaire
      if (answer.nextNode.type === 'test' && answer.nextNode.testId) {
        loadTestDetails(answer.nextNode.testId)
      }
    }
  }

  const goBack = () => {
    if (history.length === 0) return

    const newHistory = [...history]
    newHistory.pop()
    
    if (newHistory.length === 0) {
      // Retour au début
      loadTree()
    } else {
      const lastItem = newHistory[newHistory.length - 1]
      if (lastItem.answer?.nextNode) {
        setCurrentNode(lastItem.answer.nextNode)
      }
    }
    
    setHistory(newHistory)
  }

  const restart = () => {
    setHistory([])
    setCompletedTests(new Set())
    setSessionNotes('')
    setPatientInfo({ name: '', age: '', mainComplaint: '' })
    setShowResults(false)
    loadTree()
  }

  const generateReport = () => {
    // Générer un rapport PDF ou texte
    setShowResults(true)
  }

  const getSessionDuration = () => {
    if (!sessionStartTime) return '0:00'
    const now = new Date()
    const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Fonction pour obtenir l'icône d'une réponse
  const getAnswerIcon = (answer: Answer, node: TreeNode) => {
    if (node.type === 'test') {
      if (answer.label.toLowerCase().includes('positif')) return CheckCircle
      if (answer.label.toLowerCase().includes('négatif')) return XCircle
      if (answer.label.toLowerCase().includes('incertain')) return AlertCircle
    }
    if (answer.label.toLowerCase().includes('oui')) return CheckCircle
    if (answer.label.toLowerCase().includes('non')) return XCircle
    return ChevronRight
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Chargement de l'arbre...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (showResults) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Résumé de la session</h2>
              <button
                onClick={restart}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <RefreshCw className="h-4 w-4" />
                Nouvelle session
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Durée</p>
                <p className="text-xl font-bold">{getSessionDuration()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tests effectués</p>
                <p className="text-xl font-bold">{completedTests.size}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Parcours suivi :</h3>
              {history.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.node.content}</p>
                    {item.answer && (
                      <p className="text-sm text-primary-600 mt-1">
                        → {item.answer.label}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentNode?.type === 'diagnosis' && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${DIAGNOSIS_BG_COLORS[currentNode.diagnosisType || 'normal']}`}>
                <h3 className="font-semibold text-lg mb-2">Diagnostic final :</h3>
                <p className="text-gray-900">{currentNode.content}</p>
                {currentNode.recommendations && (
                  <div className="mt-3">
                    <p className="font-medium">Recommandations :</p>
                    <p className="text-sm">{currentNode.recommendations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header avec infos de session */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/trees')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tree?.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getSessionDuration()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {completedTests.size} tests
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Étape {history.length + 1}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Rapport
              </button>
              <button
                onClick={restart}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                Recommencer
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb visuel */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {history.slice(-3).map((item, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {item.node.type === 'test' ? '🧪' : item.node.type === 'diagnosis' ? '🎯' : '❓'}
                    {' '}
                    {item.answer?.label || item.node.content.substring(0, 30)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {currentNode && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête coloré selon le type */}
            <div className={`p-6 bg-gradient-to-r ${
              currentNode.type === 'question' ? 'from-blue-500 to-blue-600' :
              currentNode.type === 'test' ? 'from-green-500 to-green-600' :
              DIAGNOSIS_COLORS[currentNode.diagnosisType || 'normal']
            } text-white`}>
              <div className="flex items-center gap-3">
                {currentNode.type === 'question' && <Brain className="h-8 w-8" />}
                {currentNode.type === 'test' && <Activity className="h-8 w-8" />}
                {currentNode.type === 'diagnosis' && (
                  React.createElement(DIAGNOSIS_ICONS[currentNode.diagnosisType || 'normal'], {
                    className: "h-8 w-8"
                  })
                )}
                <div>
                  <p className="text-sm opacity-90">
                    {currentNode.type === 'question' ? 'Question' :
                     currentNode.type === 'test' ? 'Test orthopédique' :
                     'Diagnostic'}
                  </p>
                  <h2 className="text-2xl font-bold">{currentNode.content}</h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Détails du test si applicable */}
              {currentNode.type === 'test' && testDetails && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Description du test :</h3>
                  <p className="text-gray-700 mb-3">{testDetails.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {testDetails.sensitivity && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Sensibilité : {testDetails.sensitivity}%</span>
                      </div>
                    )}
                    {testDetails.specificity && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Spécificité : {testDetails.specificity}%</span>
                      </div>
                    )}
                  </div>

                  {testDetails.video_url && (
                    <a
                      href={testDetails.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Voir la vidéo du test
                    </a>
                  )}
                </div>
              )}

              {/* Diagnostic enrichi */}
              {currentNode.type === 'diagnosis' && (
                <div className="space-y-4">
                  {currentNode.diagnosisType === 'red_flag' && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-red-900">⚠️ Drapeau Rouge Identifié</h3>
                          <p className="text-red-700 mt-1">
                            Cette condition nécessite une attention particulière.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentNode.urgency && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Urgence :</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        currentNode.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                        currentNode.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {currentNode.urgency === 'immediate' ? 'Immédiate' :
                         currentNode.urgency === 'urgent' ? 'Urgente' :
                         'Routine'}
                      </span>
                    </div>
                  )}

                  {currentNode.recommendations && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        📋 Recommandations :
                      </h3>
                      <p className="text-gray-700">{currentNode.recommendations}</p>
                    </div>
                  )}

                  {currentNode.referral && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        🏥 Orientation suggérée :
                      </h3>
                      <p className="text-gray-700">{currentNode.referral}</p>
                    </div>
                  )}

                  <button
                    onClick={generateReport}
                    className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Terminer et générer le rapport
                  </button>
                </div>
              )}

              {/* Options de réponse */}
              {currentNode.type !== 'diagnosis' && currentNode.answers && (
                <div className="space-y-3">
                  {currentNode.answers.map((answer) => {
                    const Icon = getAnswerIcon(answer, currentNode)
                    return (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswer(answer)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all hover:scale-[1.02] flex items-center justify-between group"
                      >
                        <span className="text-left font-medium text-gray-900">
                          {answer.label}
                        </span>
                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Zone de notes */}
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notes pour cette étape (optionnel)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ajoutez vos observations..."
                />
              </div>

              {/* Navigation */}
              {history.length > 0 && (
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
