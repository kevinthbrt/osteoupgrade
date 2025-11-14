'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  FileText,
  Clipboard,
  Diamond,
  Circle,
  Check,
  X,
  Download,
  Home
} from 'lucide-react'

interface TreeNode {
  id: string
  tree_id: string
  parent_id: string | null
  node_type: 'question' | 'test' | 'diagnosis'
  content: string
  test_id: string | null
  order_index: number
  responses?: any
  children?: TreeNode[]
}

interface Answer {
  id: string
  label: string
  nextNodeId?: string
}

interface SessionResponse {
  nodeId: string
  question: string
  answer: string
  timestamp: string
}

export default function TreeExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const treeId = params?.id as string

  const [tree, setTree] = useState<any>(null)
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null)
  const [sessionResponses, setSessionResponses] = useState<SessionResponse[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [test, setTest] = useState<any>(null)

  useEffect(() => {
    if (treeId) {
      loadTree()
    }
  }, [treeId])

  const loadTree = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      // Charger l'arbre
      const { data: treeData } = await supabase
        .from('decision_trees')
        .select('*')
        .eq('id', treeId)
        .single()

      if (!treeData) {
        alert('Arbre non trouvé')
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
        .order('order_index', { ascending: true })

      if (nodesData && nodesData.length > 0) {
        // Construire l'arbre hiérarchique
        const nodeMap = new Map<string, TreeNode>()
        const rootNodes: TreeNode[] = []

        // Créer tous les nœuds
        nodesData.forEach(node => {
          const treeNode: TreeNode = {
            ...node,
            children: [],
            responses: node.responses ? JSON.parse(node.responses) : null
          }
          nodeMap.set(node.id, treeNode)
        })

        // Établir les relations parent-enfant
        nodesData.forEach(node => {
          const currentNode = nodeMap.get(node.id)!
          if (node.parent_id) {
            const parent = nodeMap.get(node.parent_id)
            if (parent) {
              if (!parent.children) parent.children = []
              parent.children.push(currentNode)
            }
          } else {
            rootNodes.push(currentNode)
          }
        })

        setNodes(Array.from(nodeMap.values()))
        
        // Définir le nœud racine comme nœud actuel
        if (rootNodes.length > 0) {
          setCurrentNode(rootNodes[0])
        }

        // Créer une nouvelle session
        const { data: sessionData } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            tree_id: treeId,
            responses: {},
            completed: false
          })
          .select()
          .single()

        if (sessionData) {
          setSessionId(sessionData.id)
        }
      }
    } catch (error) {
      console.error('Error loading tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string, nextNodeId?: string) => {
    if (!currentNode || !sessionId) return

    // Enregistrer la réponse
    const newResponse: SessionResponse = {
      nodeId: currentNode.id,
      question: currentNode.content,
      answer: answer,
      timestamp: new Date().toISOString()
    }

    const updatedResponses = [...sessionResponses, newResponse]
    setSessionResponses(updatedResponses)

    // Mettre à jour la session dans la base de données
    await supabase
      .from('user_sessions')
      .update({
        responses: updatedResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    // Trouver le nœud suivant
    let nextNode: TreeNode | null = null

    if (nextNodeId) {
      // Si un ID spécifique est fourni (pour les réponses multiples)
      nextNode = nodes.find(n => n.id === nextNodeId) || null
    } else if (currentNode.children && currentNode.children.length > 0) {
      // Sinon, prendre le premier enfant
      nextNode = currentNode.children[0]
    }

    if (nextNode) {
      setCurrentNode(nextNode)

      // Si c'est un test, charger les détails
      if (nextNode.node_type === 'test' && nextNode.test_id) {
        const { data: testData } = await supabase
          .from('orthopedic_tests')
          .select('*')
          .eq('id', nextNode.test_id)
          .single()
        
        setTest(testData)
      } else {
        setTest(null)
      }

      // Si c'est un diagnostic, terminer la session
      if (nextNode.node_type === 'diagnosis') {
        setDiagnosis(nextNode.content)
        
        await supabase
          .from('user_sessions')
          .update({
            diagnosis: nextNode.content,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
      }
    } else {
      // Plus de nœuds, session terminée
      setDiagnosis('Fin de l\'arbre décisionnel')
      
      await supabase
        .from('user_sessions')
        .update({
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }
  }

  const goBack = () => {
    if (sessionResponses.length > 0) {
      const newResponses = sessionResponses.slice(0, -1)
      setSessionResponses(newResponses)
      
      // Trouver le nœud précédent
      if (newResponses.length > 0) {
        const lastResponse = newResponses[newResponses.length - 1]
        const previousNode = nodes.find(n => n.id === lastResponse.nodeId)
        if (previousNode) {
          setCurrentNode(previousNode)
          setDiagnosis(null)
        }
      } else {
        // Retour au début
        const rootNode = nodes.find(n => !n.parent_id)
        if (rootNode) {
          setCurrentNode(rootNode)
          setDiagnosis(null)
        }
      }
    }
  }

  const restart = () => {
    const rootNode = nodes.find(n => !n.parent_id)
    if (rootNode) {
      setCurrentNode(rootNode)
      setSessionResponses([])
      setDiagnosis(null)
      setTest(null)
    }
  }

  const exportToPDF = () => {
    // Dans une vraie app, on utiliserait une librairie comme jsPDF
    alert('Export PDF en cours de développement')
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

  if (!tree || !currentNode) {
    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Arbre non disponible
            </h2>
            <p className="text-gray-600 mb-6">
              Cet arbre décisionnel n'est pas accessible ou n'existe pas.
            </p>
            <button
              onClick={() => router.push('/trees')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Retour aux arbres
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TreePine className="h-6 w-6 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tree.name}</h1>
                {tree.description && (
                  <p className="text-sm text-gray-600 mt-1">{tree.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/trees')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Retour"
              >
                <Home className="h-5 w-5" />
              </button>
              <button
                onClick={restart}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Recommencer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              {diagnosis && (
                <button
                  onClick={exportToPDF}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exporter PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        {sessionResponses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {sessionResponses.map((response, index) => (
                <div key={index} className="flex items-center">
                  <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm whitespace-nowrap">
                    {response.answer}
                  </div>
                  {index < sessionResponses.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Node */}
        {!diagnosis ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className={`p-2 ${
              currentNode.node_type === 'question' ? 'bg-blue-500' :
              currentNode.node_type === 'test' ? 'bg-green-500' :
              'bg-purple-500'
            }`}>
              <div className="flex items-center justify-center space-x-2 text-white">
                {currentNode.node_type === 'question' && <Circle className="h-5 w-5" />}
                {currentNode.node_type === 'test' && <Clipboard className="h-5 w-5" />}
                {currentNode.node_type === 'diagnosis' && <Diamond className="h-5 w-5" />}
                <span className="font-medium">
                  {currentNode.node_type === 'question' ? 'Question' :
                   currentNode.node_type === 'test' ? 'Test orthopédique' :
                   'Diagnostic'}
                </span>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                {currentNode.content}
              </h2>

              {/* Test details */}
              {currentNode.node_type === 'test' && test && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Description du test
                  </h3>
                  <p className="text-gray-600 mb-4">{test.description}</p>
                  
                  {test.video_url && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Vidéo de démonstration</h4>
                      {test.video_url.includes('youtube.com') || test.video_url.includes('youtu.be') ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            src={test.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={test.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Voir la vidéo →
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {test.sensitivity && (
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-500">Sensibilité</p>
                        <p className="text-lg font-semibold">{test.sensitivity}%</p>
                      </div>
                    )}
                    {test.specificity && (
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-500">Spécificité</p>
                        <p className="text-lg font-semibold">{test.specificity}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Answers */}
              <div className="space-y-3">
                {currentNode.responses && Array.isArray(currentNode.responses) ? (
                  // Réponses multiples
                  currentNode.responses.map((response: any) => {
                    const childNode = currentNode.children?.find((_, index) => index === currentNode.responses.indexOf(response))
                    return (
                      <button
                        key={response.id}
                        onClick={() => handleAnswer(response.label, childNode?.id)}
                        className="w-full p-4 bg-gray-50 hover:bg-primary-50 rounded-lg text-left transition-colors border-2 border-transparent hover:border-primary-300"
                      >
                        <span className="font-medium text-gray-900">
                          {response.label}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  // Réponses binaires (Oui/Non pour les tests)
                  currentNode.node_type === 'test' && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleAnswer('Positif')}
                        className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border-2 border-green-200 hover:border-green-300"
                      >
                        <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <span className="font-medium text-green-900">Test Positif</span>
                      </button>
                      <button
                        onClick={() => handleAnswer('Négatif')}
                        className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border-2 border-red-200 hover:border-red-300"
                      >
                        <X className="h-6 w-6 text-red-600 mx-auto mb-2" />
                        <span className="font-medium text-red-900">Test Négatif</span>
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Navigation */}
              {sessionResponses.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={goBack}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Revenir en arrière</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Diagnosis Result
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-center space-x-2">
                <Diamond className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Diagnostic</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-purple-50 rounded-lg p-6 mb-6">
                <p className="text-lg font-medium text-gray-900 text-center">
                  {diagnosis}
                </p>
              </div>

              {/* Résumé de la session */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Résumé de la session</h3>
                {sessionResponses.map((response, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{response.question}</p>
                      <p className="font-medium text-gray-900">→ {response.answer}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={restart}
                  className="flex-1 bg-white border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Recommencer</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>Exporter en PDF</span>
                </button>
                <button
                  onClick={() => router.push('/trees')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Nouveau diagnostic
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
