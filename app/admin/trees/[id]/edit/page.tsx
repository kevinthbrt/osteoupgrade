'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  ArrowLeft
} from 'lucide-react'

interface TreeNode {
  id: string
  type: 'question' | 'test' | 'diagnosis'
  content: string
  testId?: string
  answers?: Answer[]
  expanded?: boolean
  dbId?: string // ID dans la base de données
}

interface Answer {
  id: string
  label: string
  nextNode?: TreeNode
}

export default function EditTreePage() {
  const params = useParams()
  const router = useRouter()
  const treeId = params?.id as string

  const [treeName, setTreeName] = useState('')
  const [treeDescription, setTreeDescription] = useState('')
  const [treeCategory, setTreeCategory] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [rootNode, setRootNode] = useState<TreeNode | null>(null)
  const [tests, setTests] = useState<any[]>([])
  const [filteredTests, setFilteredTests] = useState<any[]>([])
  const [testSearch, setTestSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showTestSelector, setShowTestSelector] = useState(false)

  useEffect(() => {
    if (treeId) {
      checkAdminAccess()
      loadTree()
      loadTests()
    }
  }, [treeId])

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

  const loadTree = async () => {
    try {
      // Charger les informations de l'arbre
      const { data: treeData } = await supabase
        .from('decision_trees')
        .select('*')
        .eq('id', treeId)
        .single()

      if (!treeData) {
        alert('Arbre non trouvé')
        router.push('/admin')
        return
      }

      setTreeName(treeData.name)
      setTreeDescription(treeData.description || '')
      setTreeCategory(treeData.category || '')
      setIsFree(treeData.is_free)

      // Charger les nœuds
      const { data: nodesData } = await supabase
        .from('tree_nodes')
        .select('*')
        .eq('tree_id', treeId)
        .order('parent_id', { ascending: true })
        .order('order_index', { ascending: true })

      if (nodesData && nodesData.length > 0) {
        // Reconstruire l'arbre
        const nodeMap = new Map<string, TreeNode>()
        const rootNodes: TreeNode[] = []

        // Créer tous les nœuds
        nodesData.forEach(node => {
          const treeNode: TreeNode = {
            id: node.id,
            dbId: node.id,
            type: node.node_type as 'question' | 'test' | 'diagnosis',
            content: node.content,
            testId: node.test_id,
            answers: node.responses ? JSON.parse(node.responses) : [],
            expanded: true
          }
          nodeMap.set(node.id, treeNode)
        })

        // Établir les relations via les réponses
        nodesData.forEach(node => {
          const currentNode = nodeMap.get(node.id)!
          
          if (!node.parent_id) {
            rootNodes.push(currentNode)
          } else {
            // Trouver le parent et l'ajouter comme nextNode d'une réponse
            const parent = nodeMap.get(node.parent_id)
            if (parent && parent.answers) {
              const answerIndex = node.order_index
              if (parent.answers[answerIndex]) {
                parent.answers[answerIndex].nextNode = currentNode
              }
            }
          }
        })

        // Définir le nœud racine
        if (rootNodes.length > 0) {
          setRootNode(rootNodes[0])
        } else {
          // Créer un nœud racine par défaut si vide
          setRootNode({
            id: 'root',
            type: 'question',
            content: 'Question initiale',
            answers: [],
            expanded: true
          })
        }
      } else {
        // Arbre vide, créer un nœud racine
        setRootNode({
          id: 'root',
          type: 'question',
          content: 'Question initiale',
          answers: [],
          expanded: true
        })
      }
    } catch (error) {
      console.error('Error loading tree:', error)
      alert('Erreur lors du chargement de l\'arbre')
    } finally {
      setLoading(false)
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
      label: `Réponse ${node.answers.length + 1}`
    }
    
    node.answers.push(newAnswer)
    setRootNode({ ...rootNode! })
  }

  const addNodeToAnswer = (answer: Answer, type: 'question' | 'test' | 'diagnosis') => {
    const newNode: TreeNode = {
      id: generateId(),
      type,
      content: type === 'question' ? 'Nouvelle question' :
               type === 'test' ? 'Sélectionner un test' :
               'Diagnostic',
      answers: type === 'diagnosis' ? undefined : [],
      expanded: true
    }

    answer.nextNode = newNode
    setRootNode({ ...rootNode! })
  }

  const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates }
      }
      
      if (node.answers) {
        return {
          ...node,
          answers: node.answers.map(answer => ({
            ...answer,
            nextNode: answer.nextNode ? updateRecursive(answer.nextNode) : undefined
          }))
        }
      }
      
      return node
    }
    
    if (rootNode) {
      setRootNode(updateRecursive(rootNode))
    }
  }

  const updateAnswer = (answerId: string, label: string) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.answers) {
        return {
          ...node,
          answers: node.answers.map(answer => {
            if (answer.id === answerId) {
              return { ...answer, label }
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
    
    if (rootNode) {
      setRootNode(updateRecursive(rootNode))
    }
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
    
    if (rootNode) {
      setRootNode(deleteRecursive(rootNode))
    }
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
    
    if (rootNode) {
      const result = deleteRecursive(rootNode)
      if (result) setRootNode(result)
    }
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
    
    if (rootNode) {
      setRootNode(toggleRecursive(rootNode))
    }
  }

  const saveTree = async () => {
    if (!treeName || !rootNode) {
      alert('Veuillez donner un nom à l\'arbre')
      return
    }

    setSaving(true)
    
    try {
      // Mettre à jour les infos de l'arbre
      const { error: updateError } = await supabase
        .from('decision_trees')
        .update({
          name: treeName,
          description: treeDescription,
          category: treeCategory,
          is_free: isFree,
          updated_at: new Date().toISOString()
        })
        .eq('id', treeId)

      if (updateError) throw updateError

      // Supprimer les anciens nœuds
      const { error: deleteError } = await supabase
        .from('tree_nodes')
        .delete()
        .eq('tree_id', treeId)

      if (deleteError) throw deleteError

      // Sauvegarder les nouveaux nœuds
      const saveNodes = async (node: TreeNode, parentId: string | null = null, index: number = 0) => {
        const nodeData = {
          tree_id: treeId,
          parent_id: parentId,
          node_type: node.type,
          content: node.content,
          test_id: node.testId || null,
          order_index: index,
          responses: node.answers ? JSON.stringify(node.answers.map(a => ({
            id: a.id,
            label: a.label
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

      alert('Arbre mis à jour avec succès!')
      router.push('/trees')
    } catch (error) {
      console.error('Error saving tree:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isEditing = editingNode === node.id
    
    return (
      <div key={node.id} className="ml-4">
        <div className={`flex items-center space-x-2 p-3 rounded-lg mb-2 transition-all ${
          selectedNode?.id === node.id ? 'bg-primary-100 border-2 border-primary-500' : 'bg-white border-2 border-gray-200'
        }`}>
          {node.answers && node.answers.length > 0 && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {node.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          <div className="flex items-center space-x-2">
            {node.type === 'question' && <Circle className="h-5 w-5 text-blue-500" />}
            {node.type === 'test' && <Clipboard className="h-5 w-5 text-green-500" />}
            {node.type === 'diagnosis' && <Diamond className="h-5 w-5 text-purple-500" />}
          </div>

          {isEditing ? (
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
              onClick={() => setSelectedNode(node)}
              onDoubleClick={() => node.type !== 'test' && setEditingNode(node.id)}
            >
              <p className="font-medium text-gray-900">{node.content}</p>
              {node.testId && (
                <p className="text-xs text-gray-500">
                  Test: {tests.find(t => t.id === node.testId)?.name}
                </p>
              )}
              {node.type === 'question' && node.answers && (
                <p className="text-xs text-gray-500">
                  {node.answers.length} réponse(s)
                </p>
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
            
            {node.type === 'question' && (
              <button
                onClick={() => setEditingNode(node.id)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                title="Éditer"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {node.id !== 'root' && node.dbId !== rootNode?.dbId && (
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
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  
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
                      className="bg-gray-100 px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-gray-200"
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
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100"
                      >
                        + Question
                      </button>
                      <button
                        onClick={() => addNodeToAnswer(answer, 'test')}
                        className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"
                      >
                        + Test
                      </button>
                      <button
                        onClick={() => addNodeToAnswer(answer, 'diagnosis')}
                        className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100"
                      >
                        + Diagnostic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Bouton pour ajouter une réponse */}
            <button
              onClick={() => addAnswer(node)}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
            >
              <Plus className="h-3 w-3" />
              <span>Ajouter une réponse</span>
            </button>
          </div>
        )}
      </div>
    )
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

  if (!rootNode) {
    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Arbre non trouvé
            </h2>
            <button
              onClick={() => router.push('/admin')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/trees')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <TreePine className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Éditer l'arbre décisionnel
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

        {/* Tree Editor */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Structure de l'arbre</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Circle className="h-4 w-4 text-blue-500" />
                <span>Question</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clipboard className="h-4 w-4 text-green-500" />
                <span>Test</span>
              </div>
              <div className="flex items-center space-x-1">
                <Diamond className="h-4 w-4 text-purple-500" />
                <span>Diagnostic</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[400px] overflow-auto">
            {renderNode(rootNode)}
          </div>
        </div>
      </div>

      {/* Test Selector Modal */}
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
    </AuthLayout>
  )
}
