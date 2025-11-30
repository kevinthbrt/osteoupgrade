'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle,
  AlertCircle,
  Search,
  HelpCircle,
  FileText,
  Target,
  Clipboard,
  Layers
} from 'lucide-react'
import {
  getAllTopographicZones,
  getDecisionTreesByZone,
  getDecisionTree,
  createDecisionTree,
  updateDecisionTree,
  deleteDecisionTree,
  getTreeNodes,
  getDecisionNode,
  createQuestionNode,
  createDiagnosisNode,
  createTestsNode,
  updateDecisionNode,
  deleteDecisionNode,
  getNodeAnswers,
  createDecisionAnswer,
  updateDecisionAnswer,
  deleteDecisionAnswer,
  validateDecisionTree,
  searchPathologies,
  searchTests,
  searchClusters
} from '@/lib/topographic-system-api'
import type {
  TopographicZone,
  DecisionTree,
  DecisionNode,
  DecisionAnswer,
  NodeType
} from '@/lib/types-topographic-system'

const REGIONS = [
  { value: 'cervical', label: 'Cervical', icon: '🔵' },
  { value: 'thoracique', label: 'Thoracique', icon: '🟢' },
  { value: 'lombaire', label: 'Lombaire', icon: '🟠' },
  { value: 'epaule', label: 'Épaule', icon: '🔴' },
  { value: 'coude', label: 'Coude', icon: '🟣' },
  { value: 'poignet', label: 'Poignet', icon: '🟡' },
  { value: 'main', label: 'Main', icon: '✋' },
  { value: 'hanche', label: 'Hanche', icon: '🔶' },
  { value: 'genou', label: 'Genou', icon: '🔷' },
  { value: 'cheville', label: 'Cheville', icon: '🟤' },
  { value: 'pied', label: 'Pied', icon: '👣' }
]

const NODE_TYPE_CONFIG = {
  question: {
    label: 'Question',
    icon: HelpCircle,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700'
  },
  diagnosis: {
    label: 'Diagnostic',
    icon: FileText,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-700'
  },
  tests: {
    label: 'Tests',
    icon: Clipboard,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700'
  }
}

export default function DecisionTreesAdminPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<TopographicZone[]>([])
  const [trees, setTrees] = useState<DecisionTree[]>([])
  const [selectedZone, setSelectedZone] = useState<TopographicZone | null>(null)
  const [selectedTree, setSelectedTree] = useState<DecisionTree | null>(null)
  const [treeNodes, setTreeNodes] = useState<DecisionNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  // Modals
  const [showTreeModal, setShowTreeModal] = useState(false)
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [editingTree, setEditingTree] = useState<DecisionTree | null>(null)
  const [editingNode, setEditingNode] = useState<DecisionNode | null>(null)
  const [editingAnswer, setEditingAnswer] = useState<DecisionAnswer | null>(null)
  const [parentNode, setParentNode] = useState<DecisionNode | null>(null)
  
  // Form states
  const [treeForm, setTreeForm] = useState({
    name: '',
    description: ''
  })
  
  const [nodeForm, setNodeForm] = useState({
    node_type: 'question' as NodeType,
    question_text: '',
    pathology_ids: [] as string[],
    test_ids: [] as string[],
    cluster_ids: [] as string[]
  })
  
  const [answerForm, setAnswerForm] = useState({
    answer_text: '',
    display_order: 0
  })
  
  // Search results
  const [pathologySearch, setPathologySearch] = useState('')
  const [pathologyResults, setPathologyResults] = useState<any[]>([])
  const [testSearch, setTestSearch] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [clusterSearch, setClusterSearch] = useState('')
  const [clusterResults, setClusterResults] = useState<any[]>([])
  
  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadZones()
  }, [])

  useEffect(() => {
    if (selectedZone) {
      loadTreesForZone(selectedZone.id)
    }
  }, [selectedZone])

  useEffect(() => {
    if (selectedTree) {
      loadTreeNodes(selectedTree.id)
    }
  }, [selectedTree])

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
      return
    }
  }

  const loadZones = async () => {
    try {
      const data = await getAllTopographicZones()
      setZones(data)
    } catch (error) {
      console.error('Error loading zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTreesForZone = async (zoneId: string) => {
    try {
      const data = await getDecisionTreesByZone(zoneId)
      setTrees(data)
    } catch (error) {
      console.error('Error loading trees:', error)
    }
  }

  const loadTreeNodes = async (treeId: string) => {
    try {
      const nodes = await getTreeNodes(treeId)
      setTreeNodes(nodes)
    } catch (error) {
      console.error('Error loading nodes:', error)
    }
  }

  const handleValidateTree = async () => {
    if (!selectedTree) return
    
    try {
      const result = await validateDecisionTree(selectedTree.id)
      const errorMessages = result.errors || []
      setValidationErrors(errorMessages)
      
      if (errorMessages.length === 0) {
        alert('✅ Arbre valide ! Aucune erreur détectée.')
      } else {
        alert(`⚠️ ${errorMessages.length} erreur(s) détectée(s). Consultez le panneau de validation.`)
      }
    } catch (error) {
      console.error('Error validating tree:', error)
      alert('❌ Erreur lors de la validation')
    }
  }

  // TREE CRUD
  const openCreateTreeModal = () => {
    if (!selectedZone) {
      alert('⚠️ Veuillez sélectionner une zone topographique')
      return
    }
    
    setEditingTree(null)
    setTreeForm({ name: '', description: '' })
    setShowTreeModal(true)
  }

  const openEditTreeModal = (tree: DecisionTree) => {
    setEditingTree(tree)
    setTreeForm({
      name: tree.name,
      description: tree.description || ''
    })
    setShowTreeModal(true)
  }

  const handleSaveTree = async () => {
    if (!selectedZone || !treeForm.name) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      if (editingTree) {
        await updateDecisionTree(editingTree.id, treeForm)
        alert('✅ Arbre mis à jour')
      } else {
        await createDecisionTree({
          topographic_zone_id: selectedZone.id,
          name: treeForm.name,
          description: treeForm.description
        })
        alert('✅ Arbre créé avec succès')
      }
      
      setShowTreeModal(false)
      loadTreesForZone(selectedZone.id)
    } catch (error) {
      console.error('Error saving tree:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTree = async (tree: DecisionTree) => {
    if (!confirm(`Supprimer l'arbre "${tree.name}" et tous ses nœuds ?`)) {
      return
    }

    try {
      await deleteDecisionTree(tree.id)
      alert('✅ Arbre supprimé')
      setSelectedTree(null)
      setTreeNodes([])
      if (selectedZone) {
        loadTreesForZone(selectedZone.id)
      }
    } catch (error) {
      console.error('Error deleting tree:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  // NODE CRUD
  const openCreateNodeModal = (parent: DecisionNode | null = null) => {
    if (!selectedTree) {
      alert('⚠️ Veuillez sélectionner un arbre')
      return
    }
    
    setEditingNode(null)
    setParentNode(parent)
    setNodeForm({
      node_type: 'question',
      question_text: '',
      pathology_ids: [],
      test_ids: [],
      cluster_ids: []
    })
    setPathologyResults([])
    setTestResults([])
    setClusterResults([])
    setShowNodeModal(true)
  }

  const openEditNodeModal = async (node: DecisionNode) => {
    setEditingNode(node)
    setParentNode(null)
    setNodeForm({
      node_type: node.node_type,
      question_text: node.question_text || '',
      pathology_ids: node.pathology_ids || [],
      test_ids: node.test_ids || [],
      cluster_ids: node.cluster_ids || []
    })
    
    // Load existing entities
    if (node.pathology_ids && node.pathology_ids.length > 0) {
      const results = await searchPathologies('')
      setPathologyResults(results)
    }
    if (node.test_ids && node.test_ids.length > 0) {
      const results = await searchTests('')
      setTestResults(results)
    }
    if (node.cluster_ids && node.cluster_ids.length > 0) {
      const results = await searchClusters('')
      setClusterResults(results)
    }
    
    setShowNodeModal(true)
  }

  const handleSaveNode = async () => {
    if (!selectedTree) return
    
    if (!nodeForm.question_text && nodeForm.node_type === 'question') {
      alert('⚠️ Veuillez saisir une question')
      return
    }
    
    if (nodeForm.node_type === 'diagnosis' && nodeForm.pathology_ids.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins une pathologie')
      return
    }
    
    if (nodeForm.node_type === 'tests' && nodeForm.test_ids.length === 0 && nodeForm.cluster_ids.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un test ou cluster')
      return
    }

    setSaving(true)
    try {
      if (editingNode) {
        await updateDecisionNode(editingNode.id, nodeForm)
        alert('✅ Nœud mis à jour')
      } else {
        const nodeData = {
          tree_id: selectedTree.id,
          parent_node_id: parentNode?.id || undefined,
          ...nodeForm
        }
        
        if (nodeForm.node_type === 'question') {
          await createQuestionNode(nodeData)
        } else if (nodeForm.node_type === 'diagnosis') {
          await createDiagnosisNode(nodeData)
        } else {
          await createTestsNode(nodeData)
        }
        
        alert('✅ Nœud créé avec succès')
      }
      
      setShowNodeModal(false)
      loadTreeNodes(selectedTree.id)
    } catch (error) {
      console.error('Error saving node:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNode = async (node: DecisionNode) => {
    if (!confirm(`Supprimer ce nœud et tous ses enfants ?`)) {
      return
    }

    try {
      await deleteDecisionNode(node.id)
      alert('✅ Nœud supprimé')
      if (selectedTree) {
        loadTreeNodes(selectedTree.id)
      }
    } catch (error) {
      console.error('Error deleting node:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  // ANSWER CRUD
  const openCreateAnswerModal = (node: DecisionNode) => {
    setParentNode(node)
    setEditingAnswer(null)
    setAnswerForm({
      answer_text: '',
      display_order: 0
    })
    setShowAnswerModal(true)
  }

  const openEditAnswerModal = (answer: DecisionAnswer, node: DecisionNode) => {
    setParentNode(node)
    setEditingAnswer(answer)
    setAnswerForm({
      answer_text: answer.answer_text,
      display_order: answer.display_order
    })
    setShowAnswerModal(true)
  }

  const handleSaveAnswer = async () => {
    if (!parentNode || !answerForm.answer_text) {
      alert('⚠️ Veuillez remplir le texte de la réponse')
      return
    }

    setSaving(true)
    try {
      if (editingAnswer) {
        await updateDecisionAnswer(editingAnswer.id, answerForm)
        alert('✅ Réponse mise à jour')
      } else {
        await createDecisionAnswer({
          node_id: parentNode.id,
          answer_text: answerForm.answer_text,
          display_order: answerForm.display_order,
          next_node_id: undefined
        })
        alert('✅ Réponse créée')
      }
      
      setShowAnswerModal(false)
      if (selectedTree) {
        loadTreeNodes(selectedTree.id)
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAnswer = async (answer: DecisionAnswer) => {
    if (!confirm('Supprimer cette réponse ?')) return

    try {
      await deleteDecisionAnswer(answer.id)
      alert('✅ Réponse supprimée')
      if (selectedTree) {
        loadTreeNodes(selectedTree.id)
      }
    } catch (error) {
      console.error('Error deleting answer:', error)
      alert('❌ Erreur')
    }
  }

  // SEARCH HANDLERS
  const handleSearchPathologies = useCallback(async (query: string) => {
    setPathologySearch(query)
    if (query.length >= 2) {
      const results = await searchPathologies(query)
      setPathologyResults(results)
    } else {
      setPathologyResults([])
    }
  }, [])

  const handleSearchTests = useCallback(async (query: string) => {
    setTestSearch(query)
    if (query.length >= 2) {
      const results = await searchTests(query)
      setTestResults(results)
    } else {
      setTestResults([])
    }
  }, [])

  const handleSearchClusters = useCallback(async (query: string) => {
    setClusterSearch(query)
    if (query.length >= 2) {
      const results = await searchClusters(query)
      setClusterResults(results)
    } else {
      setClusterResults([])
    }
  }, [])

  // TREE VISUALIZATION
  const buildTreeHierarchy = (nodes: DecisionNode[]) => {
    type NodeWithChildren = DecisionNode & { children: NodeWithChildren[], answers: DecisionAnswer[] }
    const nodeMap = new Map<string, NodeWithChildren>()
    
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [], answers: [] })
    })
    
    const roots: NodeWithChildren[] = []
    
    nodes.forEach(node => {
      const nodeWithChildren = nodeMap.get(node.id)!
      if (node.parent_node_id) {
        const parent = nodeMap.get(node.parent_node_id)
        if (parent) {
          parent.children.push(nodeWithChildren)
        }
      } else {
        roots.push(nodeWithChildren)
      }
    })
    
    return roots
  }

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const renderTreeNode = (
    node: DecisionNode & { children: any[], answers: DecisionAnswer[] },
    level: number = 0
  ) => {
    const config = NODE_TYPE_CONFIG[node.node_type]
    const Icon = config.icon
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.id} className="mb-2">
        <div 
          className={`flex items-start gap-3 p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={() => toggleNodeExpansion(node.id)}
              className="flex-shrink-0 mt-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}
          
          {/* Icon */}
          <div className={`flex-shrink-0 p-2 rounded-lg bg-white border-2 ${config.borderColor}`}>
            <Icon className={`h-5 w-5 ${config.textColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${config.textColor} uppercase`}>
                    {config.label}
                  </span>
                  {node.node_type === 'question' && hasChildren && (
                    <span className="text-xs text-gray-500">
                      ({node.children.length} réponse{node.children.length > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                
                {node.question_text && (
                  <p className="text-sm font-medium text-gray-900">
                    {node.question_text}
                  </p>
                )}
                
                {/* Pathologies */}
                {node.pathology_ids && node.pathology_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.pathology_ids.map(id => (
                      <span key={id} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Pathologie #{id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Tests */}
                {node.test_ids && node.test_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.test_ids.map(id => (
                      <span key={id} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        Test #{id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Clusters */}
                {node.cluster_ids && node.cluster_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.cluster_ids.map(id => (
                      <span key={id} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        Cluster #{id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                {node.node_type === 'question' && (
                  <button
                    onClick={() => openCreateAnswerModal(node)}
                    className="p-1 hover:bg-white rounded transition-colors"
                    title="Ajouter une réponse"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </button>
                )}
                <button
                  onClick={() => openCreateNodeModal(node)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Ajouter un nœud enfant"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => openEditNodeModal(node)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteNode(node)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Children (expanded) */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const treeHierarchy = buildTreeHierarchy(treeNodes)

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Arbres Décisionnels</h1>
              </div>
              <p className="text-indigo-100">
                Créer des parcours de diagnostic personnalisés
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{trees.length}</p>
              <p className="text-indigo-100">Arbres créés</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Zones & Trees */}
          <div className="col-span-4 space-y-4">
            {/* Zones List */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Zones Topographiques
              </h3>
              
              {zones.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucune zone créée
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {zones.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone)
                        setSelectedTree(null)
                        setTreeNodes([])
                      }}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedZone?.id === zone.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {REGIONS.find(r => r.value === zone.region)?.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {zone.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {REGIONS.find(r => r.value === zone.region)?.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trees List */}
            {selectedZone && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-indigo-600" />
                    Arbres
                  </h3>
                  <button
                    onClick={openCreateTreeModal}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Nouvel arbre"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {trees.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun arbre pour cette zone
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trees.map(tree => (
                      <div
                        key={tree.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTree?.id === tree.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setSelectedTree(tree)}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {tree.name}
                            </p>
                            {tree.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {tree.description}
                              </p>
                            )}
                          </button>
                          
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditTreeModal(tree)}
                              className="p-1 hover:bg-white rounded"
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteTree(tree)}
                              className="p-1 hover:bg-white rounded"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Tree Editor */}
          <div className="col-span-8">
            {!selectedTree ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Sélectionnez une zone et un arbre pour commencer
                </p>
                <p className="text-sm text-gray-500">
                  Ou créez un nouvel arbre décisionnel
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tree Header */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {selectedTree.name}
                      </h2>
                      {selectedTree.description && (
                        <p className="text-sm text-gray-600">
                          {selectedTree.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleValidateTree}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Valider
                      </button>
                      <button
                        onClick={() => openCreateNodeModal(null)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Nœud racine
                      </button>
                    </div>
                  </div>
                  
                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-2">
                            Erreurs de validation ({validationErrors.length})
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            {validationErrors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tree Visualization */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-600" />
                    Structure de l'arbre
                  </h3>
                  
                  {treeHierarchy.length === 0 ? (
                    <div className="text-center py-12">
                      <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">
                        Aucun nœud dans cet arbre
                      </p>
                      <button
                        onClick={() => openCreateNodeModal(null)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Créer le premier nœud
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {treeHierarchy.map(node => renderTreeNode(node))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Create/Edit Tree */}
      {showTreeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingTree ? 'Modifier l\'arbre' : 'Nouvel arbre décisionnel'}
                </h2>
                <button onClick={() => setShowTreeModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'arbre *
                </label>
                <input
                  type="text"
                  value={treeForm.name}
                  onChange={(e) => setTreeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Douleur antérieure épaule"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={treeForm.description}
                  onChange={(e) => setTreeForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowTreeModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTree}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create/Edit Node */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingNode ? 'Modifier le nœud' : 'Nouveau nœud'}
                </h2>
                <button onClick={() => setShowNodeModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Node Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de nœud *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(NODE_TYPE_CONFIG) as NodeType[]).map(type => {
                    const config = NODE_TYPE_CONFIG[type]
                    const Icon = config.icon
                    return (
                      <button
                        key={type}
                        onClick={() => setNodeForm(prev => ({ ...prev, node_type: type }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          nodeForm.node_type === type
                            ? `${config.borderColor} ${config.bgColor}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${config.textColor}`} />
                        <p className="font-medium text-sm">{config.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question Text (for question nodes) */}
              {nodeForm.node_type === 'question' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={nodeForm.question_text}
                    onChange={(e) => setNodeForm(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Ex: Le patient ressent-il une douleur lors de l'élévation du bras ?"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Pathologies (for diagnosis nodes) */}
              {nodeForm.node_type === 'diagnosis' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pathologies * (sélectionner au moins une)
                  </label>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={pathologySearch}
                      onChange={(e) => handleSearchPathologies(e.target.value)}
                      placeholder="Rechercher une pathologie..."
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {pathologyResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-lg mb-3">
                      {pathologyResults.map(pathology => (
                        <button
                          key={pathology.id}
                          onClick={() => {
                            setNodeForm(prev => ({
                              ...prev,
                              pathology_ids: prev.pathology_ids.includes(pathology.id)
                                ? prev.pathology_ids.filter(id => id !== pathology.id)
                                : [...prev.pathology_ids, pathology.id]
                            }))
                          }}
                          className={`w-full p-3 text-left border-b hover:bg-gray-50 ${
                            nodeForm.pathology_ids.includes(pathology.id) ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {nodeForm.pathology_ids.includes(pathology.id) && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{pathology.name}</p>
                              {pathology.region && (
                                <p className="text-xs text-gray-500">{pathology.region}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {nodeForm.pathology_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nodeForm.pathology_ids.map(id => (
                        <span key={id} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                          Pathologie #{id.slice(0, 8)}
                          <button
                            onClick={() => setNodeForm(prev => ({
                              ...prev,
                              pathology_ids: prev.pathology_ids.filter(pid => pid !== id)
                            }))}
                            className="hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tests (for tests nodes) */}
              {nodeForm.node_type === 'tests' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tests orthopédiques
                    </label>
                    
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => handleSearchTests(e.target.value)}
                        placeholder="Rechercher un test..."
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {testResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg mb-3">
                        {testResults.map(test => (
                          <button
                            key={test.id}
                            onClick={() => {
                              setNodeForm(prev => ({
                                ...prev,
                                test_ids: prev.test_ids.includes(test.id)
                                  ? prev.test_ids.filter(id => id !== test.id)
                                  : [...prev.test_ids, test.id]
                              }))
                            }}
                            className={`w-full p-3 text-left border-b hover:bg-gray-50 ${
                              nodeForm.test_ids.includes(test.id) ? 'bg-orange-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {nodeForm.test_ids.includes(test.id) && (
                                <CheckCircle className="h-5 w-5 text-orange-600" />
                              )}
                              <p className="font-medium text-sm">{test.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {nodeForm.test_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nodeForm.test_ids.map(id => (
                          <span key={id} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                            Test #{id.slice(0, 8)}
                            <button
                              onClick={() => setNodeForm(prev => ({
                                ...prev,
                                test_ids: prev.test_ids.filter(tid => tid !== id)
                              }))}
                              className="hover:bg-orange-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clusters de tests
                    </label>
                    
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={clusterSearch}
                        onChange={(e) => handleSearchClusters(e.target.value)}
                        placeholder="Rechercher un cluster..."
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {clusterResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg mb-3">
                        {clusterResults.map(cluster => (
                          <button
                            key={cluster.id}
                            onClick={() => {
                              setNodeForm(prev => ({
                                ...prev,
                                cluster_ids: prev.cluster_ids.includes(cluster.id)
                                  ? prev.cluster_ids.filter(id => id !== cluster.id)
                                  : [...prev.cluster_ids, cluster.id]
                              }))
                            }}
                            className={`w-full p-3 text-left border-b hover:bg-gray-50 ${
                              nodeForm.cluster_ids.includes(cluster.id) ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {nodeForm.cluster_ids.includes(cluster.id) && (
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                              )}
                              <p className="font-medium text-sm">{cluster.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {nodeForm.cluster_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nodeForm.cluster_ids.map(id => (
                          <span key={id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                            Cluster #{id.slice(0, 8)}
                            <button
                              onClick={() => setNodeForm(prev => ({
                                ...prev,
                                cluster_ids: prev.cluster_ids.filter(cid => cid !== id)
                              }))}
                              className="hover:bg-purple-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNodeModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveNode}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create/Edit Answer */}
      {showAnswerModal && parentNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingAnswer ? 'Modifier la réponse' : 'Nouvelle réponse'}
                </h2>
                <button onClick={() => setShowAnswerModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Pour la question : "{parentNode.question_text}"
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte de la réponse *
                </label>
                <input
                  type="text"
                  value={answerForm.answer_text}
                  onChange={(e) => setAnswerForm(prev => ({ ...prev, answer_text: e.target.value }))}
                  placeholder="Ex: Oui, douleur présente"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={answerForm.display_order}
                  onChange={(e) => setAnswerForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-2" />
                  Après avoir créé cette réponse, vous pourrez lui associer un nœud suivant en ajoutant un nœud enfant à la question.
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAnswerModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAnswer}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}