'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  TreePine,
  Plus,
  Trash2,
  Save,
  ChevronRight,
  ChevronDown,
  Circle,
  Diamond,
  AlertCircle,
  X,
  Edit2,
  Clipboard,
  Search,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Building2,
  FileText,
  Target,
  Activity
} from 'lucide-react'

interface TreeNode {
  id: string
  type: 'question' | 'test' | 'diagnosis'
  content: string
  testId?: string
  answers?: Answer[]
  expanded?: boolean
  // Nouveaux champs pour les diagnostics
  diagnosisType?: 'red_flag' | 'normal' | 'caution'
  recommendations?: string
  urgency?: 'immediate' | 'urgent' | 'routine'
  referral?: string
  // Champs pour rendre plus visuel
  icon?: string
  color?: string
}

interface Answer {
  id: string
  label: string
  nextNode?: TreeNode
  icon?: string // Icône pour la réponse
}

const DIAGNOSIS_PRESETS = [
  {
    type: 'red_flag',
    name: '🚨 Drapeau Rouge',
    examples: [
      'Syndrome de la queue de cheval',
      'Fracture suspectée',
      'Infection systémique',
      'Pathologie tumorale'
    ]
  },
  {
    type: 'normal',
    name: '✅ Prise en charge classique',
    examples: [
      'Lombalgie mécanique simple',
      'Cervicalgie non spécifique',
      'Tendinopathie d\'insertion'
    ]
  },
  {
    type: 'caution',
    name: '⚠️ Vigilance particulière',
    examples: [
      'Symptômes mixtes',
      'Évolution atypique',
      'Facteurs de risque présents'
    ]
  }
]

const ANSWER_PRESETS = [
  { label: 'Oui', icon: '✅' },
  { label: 'Non', icon: '❌' },
  { label: 'Positif', icon: '➕' },
  { label: 'Négatif', icon: '➖' },
  { label: 'Incertain', icon: '❓' },
  { label: 'Douleur présente', icon: '😣' },
  { label: 'Pas de douleur', icon: '😊' },
  { label: 'Amélioration', icon: '📈' },
  { label: 'Aggravation', icon: '📉' },
  { label: 'Stable', icon: '➡️' }
]

export default function CreateTreePage() {
  const router = useRouter()
  const [treeName, setTreeName] = useState('')
  const [treeDescription, setTreeDescription] = useState('')
  const [treeCategory, setTreeCategory] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [rootNode, setRootNode] = useState<TreeNode>({
    id: 'root',
    type: 'question',
    content: 'Question initiale',
    answers: [],
    expanded: true
  })
  const [tests, setTests] = useState<any[]>([])
  const [filteredTests, setFilteredTests] = useState<any[]>([])
  const [testSearch, setTestSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showTestSelector, setShowTestSelector] = useState(false)
  const [showDiagnosisEditor, setShowDiagnosisEditor] = useState(false)
  const [showAnswerPresets, setShowAnswerPresets] = useState(false)
  const [currentAnswerNode, setCurrentAnswerNode] = useState<TreeNode | null>(null)

  useEffect(() => {
    checkAdminAccess()
    loadTests()
  }, [])

  useEffect(() => {
    if (testSearch) {
      setFilteredTests(
        tests.filter(test =>
          test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          test.description?.toLowerCase().includes(testSearch.toLowerCase())
        )
      )
    } else {
      setFilteredTests(tests)
    }
  }, [testSearch, tests])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }

  const loadTests = async () => {
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .order('name')
    setTests(data || [])
    setFilteredTests(data || [])
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addAnswer = (node: TreeNode) => {
    if (!node.answers) node.answers = []
    
    const newAnswer: Answer = {
      id: generateId(),
      label: `Réponse ${node.answers.length + 1}`,
      icon: ''
    }
    
    node.answers.push(newAnswer)
    setCurrentAnswerNode(node)
    setShowAnswerPresets(true)
    setRootNode({ ...rootNode })
  }

  const addNodeToAnswer = (answer: Answer, type: 'question' | 'test' | 'diagnosis') => {
    const newNode: TreeNode = {
      id: generateId(),
      type,
      content: type === 'question' ? 'Nouvelle question' :
               type === 'test' ? 'Sélectionner un test' :
               'Diagnostic',
      answers: type === 'diagnosis' ? undefined : [],
      expanded: true,
      diagnosisType: type === 'diagnosis' ? 'normal' : undefined
    }

    answer.nextNode = newNode
    
    if (type === 'diagnosis') {
      setSelectedNode(newNode)
      setShowDiagnosisEditor(true)
    }
    
    setRootNode({ ...rootNode })
  }

  const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
  const updateRecursive = (node: TreeNode): TreeNode => {
    if (node.id === nodeId) {
      return { ...node, ...updates }
    }

    if (!node.answers || node.answers.length === 0) {
      return node
    }

    return {
      ...node,
      answers: node.answers.map(answer => ({
        ...answer,
        nextNode: answer.nextNode ? updateRecursive(answer.nextNode) : undefined
      }))
    }
  }

  // Met à jour l'arbre
  setRootNode(prev => updateRecursive(prev))

  // Et on garde selectedNode en phase
  setSelectedNode(prev => {
    if (!prev) return prev
    if (prev.id !== nodeId) return prev
    return { ...prev, ...updates }
  })
}


  const updateAnswer = (answerId: string, label: string, icon?: string) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.answers) {
        return {
          ...node,
          answers: node.answers.map(answer => {
            if (answer.id === answerId) {
              return { ...answer, label, icon: icon || answer.icon }
            }
            return {
              ...answer,
              nextNode: answer.nextNode ? updateRecursive(answer.nextNode) : undefined
            }
          })
        }
      }
      return node
    }
    
    setRootNode(updateRecursive(rootNode))
  }

  const deleteAnswer = (answerId: string) => {
    const deleteRecursive = (node: TreeNode): TreeNode => {
      if (node.answers) {
        return {
          ...node,
          answers: node.answers
            .filter(answer => answer.id !== answerId)
            .map(answer => ({
              ...answer,
              nextNode: answer.nextNode ? deleteRecursive(answer.nextNode) : undefined
            }))
        }
      }
      return node
    }
    
    setRootNode(deleteRecursive(rootNode))
  }

  const deleteNode = (nodeId: string) => {
    const deleteRecursive = (node: TreeNode): TreeNode | undefined => {
      if (node.id === nodeId) return undefined
      
      if (node.answers) {
        return {
          ...node,
          answers: node.answers.map(answer => ({
            ...answer,
            nextNode: answer.nextNode ? deleteRecursive(answer.nextNode) : undefined
          }))
        }
      }
      return node
    }
    
    const result = deleteRecursive(rootNode)
    if (result) setRootNode(result)
  }

  const toggleExpand = (nodeId: string) => {
    const toggleRecursive = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded }
      }
      
      if (node.answers) {
        return {
          ...node,
          answers: node.answers.map(answer => ({
            ...answer,
            nextNode: answer.nextNode ? toggleRecursive(answer.nextNode) : answer.nextNode
          }))
        }
      }
      
      return node
    }
    
    setRootNode(toggleRecursive(rootNode))
  }

  const saveTree = async () => {
    if (!treeName || !rootNode) {
      alert('Veuillez donner un nom à l\'arbre')
      return
    }

    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Créer l'arbre principal
      const { data: treeData, error: treeError } = await supabase
        .from('decision_trees')
        .insert({
          name: treeName,
          description: treeDescription,
          category: treeCategory,
          is_free: isFree,
          created_by: user?.id
        })
        .select()
        .single()

      if (treeError) throw treeError

      // Sauvegarder les nœuds
      const saveNodes = async (node: TreeNode, parentId: string | null = null, index: number = 0) => {
        // Préparer le contenu avec les nouveaux champs
        const content = node.type === 'diagnosis' 
          ? JSON.stringify({
              text: node.content,
              diagnosisType: node.diagnosisType,
              recommendations: node.recommendations,
              urgency: node.urgency,
              referral: node.referral
            })
          : node.content

        const nodeData = {
          tree_id: treeData.id,
          parent_id: parentId,
          node_type: node.type,
          content: content,
          test_id: node.testId || null,
          order_index: index,
          responses: node.answers ? JSON.stringify(node.answers.map(a => ({
            id: a.id,
            label: a.label,
            icon: a.icon
          }))) : null
        }

        const { data: savedNode, error: nodeError } = await supabase
          .from('tree_nodes')
          .insert(nodeData)
          .select()
          .single()

        if (nodeError) throw nodeError

        // Sauvegarder les nœuds enfants
        if (node.answers) {
          for (const answer of node.answers) {
            if (answer.nextNode) {
              await saveNodes(answer.nextNode, savedNode.id, node.answers.indexOf(answer))
            }
          }
        }
      }

      await saveNodes(rootNode)

      alert('Arbre créé avec succès!')
      router.push('/trees')
    } catch (error) {
      console.error('Error saving tree:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const getNodeIcon = (node: TreeNode) => {
    if (node.type === 'question') return '❓'
    if (node.type === 'test') return '🧪'
    if (node.type === 'diagnosis') {
      if (node.diagnosisType === 'red_flag') return '🚨'
      if (node.diagnosisType === 'caution') return '⚠️'
      return '✅'
    }
    return '📝'
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isEditing = editingNode === node.id
    const nodeIcon = getNodeIcon(node)
    
    return (
      <div key={node.id} className="ml-4">
        <div className={`flex items-center space-x-2 p-3 rounded-lg mb-2 transition-all ${
          selectedNode?.id === node.id ? 'bg-primary-100 border-2 border-primary-500' : 'bg-white border-2 border-gray-200'
        } hover:shadow-md`}>
          {node.answers && node.answers.length > 0 && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {node.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          <div className="text-2xl">{nodeIcon}</div>

          {isEditing && node.type !== 'diagnosis' ? (
            <input
              type="text"
              value={node.content}
              onChange={(e) => updateNode(node.id, { content: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingNode(null)
                if (e.key === 'Escape') setEditingNode(null)
              }}
              onBlur={() => setEditingNode(null)}
              className="flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          ) : (
            <div
              className="flex-1 cursor-pointer"
              onClick={() => {
                setSelectedNode(node)
                if (node.type === 'diagnosis') {
                  setShowDiagnosisEditor(true)
                }
              }}
              onDoubleClick={() => node.type !== 'test' && node.type !== 'diagnosis' && setEditingNode(node.id)}
            >
              <p className="font-medium text-gray-900">{node.content}</p>
              {node.testId && (
                <p className="text-xs text-gray-500">
                  Test: {tests.find(t => t.id === node.testId)?.name}
                </p>
              )}
              {node.type === 'diagnosis' && node.diagnosisType && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    node.diagnosisType === 'red_flag' ? 'bg-red-100 text-red-700' :
                    node.diagnosisType === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {node.diagnosisType === 'red_flag' ? 'Drapeau rouge' :
                     node.diagnosisType === 'caution' ? 'Vigilance' :
                     'Normal'}
                  </span>
                  {node.urgency && (
                    <span className="text-xs text-gray-500">
                      Urgence: {node.urgency}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-1">
            {node.type === 'test' && (
              <button
                onClick={() => {
                  setSelectedNode(node)
                  setShowTestSelector(true)
                }}
                className={`p-1.5 ${node.testId ? 'text-blue-600 hover:bg-blue-50' : 'text-yellow-600 hover:bg-yellow-50'} rounded`}
                title={node.testId ? 'Changer le test' : 'Sélectionner un test'}
              >
                {node.testId ? <Edit2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </button>
            )}
            
            {node.type === 'diagnosis' && (
              <button
                onClick={() => {
                  setSelectedNode(node)
                  setShowDiagnosisEditor(true)
                }}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                title="Éditer le diagnostic"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {node.type === 'question' && (
              <button
                onClick={() => setEditingNode(node.id)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                title="Éditer"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {node.id !== 'root' && (
              <button
                onClick={() => deleteNode(node.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Réponses */}
        {node.expanded && node.answers && node.type !== 'diagnosis' && (
          <div className="ml-8 space-y-2">
            {node.answers.map((answer) => (
              <div key={answer.id} className="relative">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{answer.icon || '➡️'}</span>
                  
                  {editingAnswer === answer.id ? (
                    <input
                      type="text"
                      value={answer.label}
                      onChange={(e) => updateAnswer(answer.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingAnswer(null)
                        if (e.key === 'Escape') setEditingAnswer(null)
                      }}
                      onBlur={() => setEditingAnswer(null)}
                      className="px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1 rounded-lg text-sm cursor-pointer hover:from-gray-100 hover:to-gray-200 shadow-sm"
                      onDoubleClick={() => setEditingAnswer(answer.id)}
                    >
                      {answer.label}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setEditingAnswer(answer.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  
                  <button
                    onClick={() => deleteAnswer(answer.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Nœud suivant */}
                {answer.nextNode ? (
                  <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
                    {renderNode(answer.nextNode, depth + 1)}
                  </div>
                ) : (
                  <div className="ml-6 mt-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addNodeToAnswer(answer, 'question')}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Question
                      </button>
                      <button
                        onClick={() => addNodeToAnswer(answer, 'test')}
                        className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Test
                      </button>
                      <button
                        onClick={() => addNodeToAnswer(answer, 'diagnosis')}
                        className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Diagnostic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Bouton pour ajouter une réponse */}
            <button
              onClick={() => addAnswer(node)}
              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-600 rounded-lg hover:from-primary-100 hover:to-primary-200 text-sm shadow-sm"
            >
              <Plus className="h-3 w-3" />
              <span>Ajouter une réponse</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TreePine className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Créer un arbre décisionnel
              </h1>
            </div>
            <button
              onClick={saveTree}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {saving && <Loader2 className="animate-spin h-4 w-4" />}
              <Save className="h-4 w-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'arbre *
              </label>
              <input
                type="text"
                value={treeName}
                onChange={(e) => setTreeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Diagnostic cervical"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={treeCategory}
                onChange={(e) => setTreeCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Cervical">Cervical</option>
                <option value="Lombaire">Lombaire</option>
                <option value="Épaule">Épaule</option>
                <option value="Genou">Genou</option>
                <option value="Cheville">Cheville</option>
                <option value="Poignet">Poignet</option>
                <option value="Hanche">Hanche</option>
                <option value="Thoracique">Thoracique</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Arbre gratuit
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={treeDescription}
              onChange={(e) => setTreeDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Description de l'arbre décisionnel..."
            />
          </div>
        </div>

        {/* Légende visuelle */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">❓</span>
                <span className="text-gray-600">Question</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🧪</span>
                <span className="text-gray-600">Test</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">✅</span>
                <span className="text-gray-600">Diagnostic normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⚠️</span>
                <span className="text-gray-600">Vigilance</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚨</span>
                <span className="text-gray-600">Drapeau rouge</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Double-cliquez pour éditer • Glissez pour réorganiser
            </div>
          </div>
        </div>

        {/* Tree Editor */}
        <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Structure de l'arbre</h2>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white min-h-[400px] overflow-auto">
            {renderNode(rootNode)}
          </div>
        </div>
      </div>

      {/* Modal d'édition de diagnostic */}
      {showDiagnosisEditor && selectedNode && selectedNode.type === 'diagnosis' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Configurer le diagnostic</h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de diagnostic
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {DIAGNOSIS_PRESETS.map(preset => (
                      <button
                        key={preset.type}
                        onClick={() => updateNode(selectedNode.id, { diagnosisType: preset.type as any })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedNode.diagnosisType === preset.type
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{preset.name.split(' ')[0]}</div>
                        <div className="text-xs font-medium">{preset.name.substring(2)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnostic
                  </label>
                  <textarea
                    value={selectedNode.content}
                    onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Description du diagnostic..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau d'urgence
                  </label>
                  <select
                    value={selectedNode.urgency || 'routine'}
                    onChange={(e) => updateNode(selectedNode.id, { urgency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent (sous 48h)</option>
                    <option value="immediate">Immédiat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommandations de prise en charge
                  </label>
                  <textarea
                    value={selectedNode.recommendations || ''}
                    onChange={(e) => updateNode(selectedNode.id, { recommendations: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Repos, glace, mobilisations douces..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Orientation suggérée (si nécessaire)
                  </label>
                  <input
                    type="text"
                    value={selectedNode.referral || ''}
                    onChange={(e) => updateNode(selectedNode.id, { referral: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Médecin généraliste, Urgences, Rhumatologue..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowDiagnosisEditor(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection de test */}
      {showTestSelector && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sélectionner un test orthopédique</h3>
                <button
                  onClick={() => {
                    setShowTestSelector(false)
                    setTestSearch('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Rechercher un test..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {filteredTests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucun test trouvé
                </p>
              ) : (
                <div className="grid gap-2">
                  {filteredTests.map(test => (
                    <button
                      key={test.id}
                      onClick={() => {
                        updateNode(selectedNode.id, { 
                          testId: test.id,
                          content: test.name
                        })
                        setShowTestSelector(false)
                        setTestSearch('')
                      }}
                      className={`p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedNode.testId === test.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      {test.category && (
                        <p className="text-xs text-primary-600 mt-1">
                          Région: {test.category}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de présets de réponses */}
      {showAnswerPresets && currentAnswerNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Choisir un type de réponse</h3>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {ANSWER_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const lastAnswer = currentAnswerNode.answers?.[currentAnswerNode.answers.length - 1]
                      if (lastAnswer) {
                        updateAnswer(lastAnswer.id, preset.label, preset.icon)
                      }
                      setShowAnswerPresets(false)
                    }}
                    className="p-3 text-left border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-xl">{preset.icon}</span>
                    <span className="font-medium">{preset.label}</span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowAnswerPresets(false)}
                className="w-full mt-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Personnalisé
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}