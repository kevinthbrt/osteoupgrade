'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { TransformControls } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { supabase } from '@/lib/supabase' // Assure-toi que c'est importé correctement



// Zone cliquable
function ClickableZone({
  region,
  regionKey,
  onClick,
  isHovered,
  onHover,
  side = 'center',
  isAdmin = false,
  onPositionChange,
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  let position = { ...region.position }
  if (region.is_symmetric && side === 'right') {
    position.x = -position.x
  }

  // Mise à jour auto de la position quand on drag en mode admin
  const handleDrag = (e: any) => {
    if (!e) return
    const newPos = e.object.position
    onPositionChange(regionKey, side, {
      x: side === 'right' ? -newPos.x : newPos.x,
      y: newPos.y,
      z: newPos.z,
    })
  }

  return (
    <>
      <mesh
        ref={meshRef}
        position={[position.x, position.y, position.z]}
        onClick={(e) => {
          e.stopPropagation()
          onClick(regionKey, side)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[region.size.x, region.size.y, region.size.z]} />
        <meshBasicMaterial
          color={region.color}
          transparent
          opacity={isAdmin ? 0.4 : isHovered ? 0.3 : 0}
          wireframe={isHovered || isAdmin}
        />
      </mesh>

      {/* TransformControls = drag + resize en mode admin */}
      {isAdmin && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode="translate"
          onObjectChange={handleDrag}
        />
      )}

      {/* Label au survol */}
      {(isHovered || isAdmin) && (
        <Html center distanceFactor={8}>
          <div
            className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 whitespace-nowrap pointer-events-none"
            style={{ borderColor: region.color }}
          >
            <p className="font-bold text-gray-900" style={{ color: region.color }}>
              {region.name}
            </p>
            {region.is_symmetric && (
              <p className="text-xs text-gray-600">
                {side === 'left' ? 'Gauche' : 'Droite'}
              </p>
            )}
          </div>
        </Html>
      )}
    </>
  )
}

// Modèle 3D
function RealisticBodyModel({
  onRegionClick,
  hoveredRegion,
  setHoveredRegion,
  modelPath,
  regions,
  isAdmin,
  onPositionChange,
}: any) {
  const { scene } = useGLTF(modelPath) as any

  return (
    <group>
      <primitive
        object={scene}
        scale={0.2}
        position={[0, 0.9, 0]}
        rotation={[0, Math.PI, 0]}
      />
      {Object.entries(regions).map(([key, region]: [string, any]) => {
        if (region.is_symmetric) {
          return (
            <group key={key}>
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-left`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-left` : null)}
                side="left"
                isAdmin={isAdmin}
                onPositionChange={onPositionChange}
              />
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-right`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-right` : null)}
                side="right"
                isAdmin={isAdmin}
                onPositionChange={onPositionChange}
              />
            </group>
          )
        }
        return (
          <ClickableZone
            key={key}
            region={region}
            regionKey={key}
            onClick={onRegionClick}
            isHovered={hoveredRegion === key}
            onHover={(hovered: boolean) => setHoveredRegion(hovered ? key : null)}
            isAdmin={isAdmin}
            onPositionChange={onPositionChange}
          />
        )
      })}
    </group>
  )
}

// Vue détail région (structures)
function RegionDetailView({
  region,
  regionKey,
  onStructureClick,
  onBack,
  side,
  isAdmin,
  onAddStructure,
}: any) {
  const [hoveredStructure, setHoveredStructure] = useState<string | null>(null)

  return (
    <group>
      <Html position={[0, 2, 0]} center>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
          <h2 className="text-xl font-bold" style={{ color: region.color }}>
            {region.name} {side && `(${side === 'left' ? 'Gauche' : 'Droite'})`}
          </h2>
          <button
            onClick={onBack}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Retour
          </button>
          {isAdmin && (
            <button
              onClick={onAddStructure}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              + Ajouter structure
            </button>
          )}
        </div>
      </Html>
      {region.structures.map((structure: any, index: number) => {
        const angle = (index / region.structures.length) * Math.PI * 2
        const radius = 1.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const isHovered = hoveredStructure === structure.id
        return (
          <group key={structure.id} position={[x, 0, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onStructureClick(structure.id)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredStructure(structure.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHoveredStructure(null)
                document.body.style.cursor = 'auto'
              }}
            >
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial
                color={region.color}
                opacity={isHovered ? 1 : 0.7}
                transparent
                emissive={region.color}
                emissiveIntensity={isHovered ? 0.5 : 0.2}
              />
            </mesh>
            <Html center distanceFactor={6}>
              <div
                className={`px-3 py-2 rounded-lg shadow-md transition-all ${
                  isHovered ? 'bg-white border-2 scale-110' : 'bg-gray-50 border border-gray-200'
                }`}
                style={{
                  borderColor: isHovered ? region.color : undefined,
                  minWidth: '150px'
                }}
              >
                <p className={`text-sm font-semibold text-center ${isHovered ? 'text-gray-900' : 'text-gray-700'}`}>
                  {structure.name}
                </p>
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// Nouvelle vue pour détail structure (pathologies)
function StructureDetailView({
  structure,
  onPathologyClick,
  onBack,
  isAdmin,
  onAddPathology,
}: any) {
  const [hoveredPathology, setHoveredPathology] = useState<string | null>(null)

  return (
    <group>
      <Html position={[0, 2, 0]} center>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
          <h2 className="text-xl font-bold text-gray-900">
            {structure.name}
          </h2>
          <button
            onClick={onBack}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Retour à la région
          </button>
          {isAdmin && (
            <button
              onClick={onAddPathology}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              + Ajouter pathologie
            </button>
          )}
        </div>
      </Html>
      {structure.pathologies.map((patho: any, index: number) => {
        const angle = (index / structure.pathologies.length) * Math.PI * 2
        const radius = 1.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const isHovered = hoveredPathology === patho.id
        return (
          <group key={patho.id} position={[x, 0, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onPathologyClick(patho.id)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredPathology(patho.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHoveredPathology(null)
                document.body.style.cursor = 'auto'
              }}
            >
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial
                color="#ef4444"
                opacity={isHovered ? 1 : 0.7}
                transparent
                emissive="#ef4444"
                emissiveIntensity={isHovered ? 0.5 : 0.2}
              />
            </mesh>
            <Html center distanceFactor={6}>
              <div
                className={`px-3 py-2 rounded-lg shadow-md transition-all ${
                  isHovered ? 'bg-white border-2 scale-110' : 'bg-gray-50 border border-gray-200'
                }`}
                style={{
                  borderColor: isHovered ? '#ef4444' : undefined,
                  minWidth: '150px'
                }}
              >
                <p className={`text-sm font-semibold text-center ${isHovered ? 'text-gray-900' : 'text-gray-700'}`}>
                  {patho.name}
                </p>
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// Nouvelle vue pour détail pathologie (tests liés)
function PathologyDetailView({
  pathology,
  tests,
  onBack,
  isAdmin,
  onAddTest,
}: any) {
  return (
    <group>
      <Html position={[0, 2, 0]} center>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
          <h2 className="text-xl font-bold text-red-600">
            {pathology.name}
          </h2>
          <button
            onClick={onBack}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Retour à la structure
          </button>
          {isAdmin && (
            <button
              onClick={onAddTest}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              + Associer un test
            </button>
          )}
        </div>
      </Html>
      <Html position={[0, 0, 0]} center distanceFactor={10}>
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Tests orthopédiques associés</h3>
          {tests.length > 0 ? (
            <ul className="space-y-2">
              {tests.map((test: any) => (
                <li key={test.id} className="p-2 bg-gray-50 rounded border">
                  <p className="font-medium">{test.name}</p>
                  <p className="text-sm text-gray-600">{test.description}</p>
                  {test.video_url && <a href={test.video_url} target="_blank" className="text-blue-600 text-xs">Vidéo</a>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Aucun test associé pour l'instant.</p>
          )}
        </div>
      </Html>
    </group>
  )
}

// Loader
function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">
          Chargement...
        </p>
      </div>
    </Html>
  )
}

// Composant principal
export default function AnatomyViewer3DRealistic({
  modelPath = '/models/human-skeleton.gltf',
  isAdmin = false,
}: {
  modelPath?: string
  isAdmin?: boolean
}) {
  const [viewMode, setViewMode] = useState<'global' | 'region' | 'structure' | 'pathology'>('global')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null)
  const [selectedPathology, setSelectedPathology] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [regions, setRegions] = useState<Record<string, any>>({})
  const [tests, setTests] = useState<any[]>([]) // Tests pour la patho sélectionnée
  const [loading, setLoading] = useState(true)
  const positionChanges = useRef<Record<string, any>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: regionsData } = await supabase.from('anatomical_regions').select('*')
      const formattedRegions: Record<string, any> = {}
      regionsData?.forEach(r => {
        formattedRegions[r.id] = {
          ...r,
          position: r.position, // json {x,y,z}
          size: r.size,
          is_symmetric: r.is_symmetric,
          structures: [],
          pathologies: {}, // temp, on remplit après
        }
      })

      const { data: structuresData } = await supabase.from('anatomical_structures').select('*')
      structuresData?.forEach(s => {
        if (formattedRegions[s.region_id]) {
          formattedRegions[s.region_id].structures.push({
            ...s,
            position: s.position,
            pathologies: [],
          })
        }
      })

      const { data: pathologiesData } = await supabase.from('pathologies').select('*')
      pathologiesData?.forEach(p => {
        for (const region of Object.values(formattedRegions)) {
          const struct = region.structures.find((s: any) => s.id === p.structure_id)
          if (struct) {
            struct.pathologies.push(p)
          }
        }
      })

      setRegions(formattedRegions)
    } catch (error) {
      console.error('Erreur fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegionClick = (regionKey: string, side: string = 'center') => {
    setSelectedRegion(regionKey)
    setSelectedSide(side)
    setViewMode('region')
  }

  const handleStructureClick = (structureId: string) => {
    setSelectedStructure(structureId)
    setViewMode('structure')
  }

  const handlePathologyClick = async (pathologyId: string) => {
    setSelectedPathology(pathologyId)
    const { data } = await supabase
      .from('pathology_tests')
      .select('*, orthopedic_tests(*)')
      .eq('pathology_id', pathologyId)
    setTests(data?.map(d => d.orthopedic_tests) || [])
    setViewMode('pathology')
  }

  const handleBackFromRegion = () => {
    setViewMode('global')
    setSelectedRegion(null)
    setSelectedSide('center')
  }

  const handleBackFromStructure = () => {
    setViewMode('region')
    setSelectedStructure(null)
  }

  const handleBackFromPathology = () => {
    setViewMode('structure')
    setSelectedPathology(null)
    setTests([])
  }

  const handlePositionChange = (regionKey: string, side: string, newPos: any) => {
    if (side === 'right') {
      newPos.x = -newPos.x // Symétrie
    }
    positionChanges.current[regionKey] = newPos
  }

  const savePositions = async () => {
    for (const [key, pos] of Object.entries(positionChanges.current)) {
      await supabase
        .from('anatomical_regions')
        .update({ position: pos })
        .eq('id', key)
    }
    positionChanges.current = {}
    alert('Positions sauvegardées !')
    fetchData() // Refresh
  }

  const addStructure = () => {
    const name = prompt('Nom de la nouvelle structure:')
    if (name && selectedRegion) {
      const add = async () => {
        const { data } = await supabase
          .from('anatomical_structures')
          .insert({ region_id: selectedRegion, name, position: {x:0, y:0, z:0} })
          .select()
        if (data) {
          fetchData()
        }
      }
      add()
    }
  }

  const addPathology = () => {
    const name = prompt('Nom de la nouvelle pathologie:')
    if (name && selectedStructure) {
      const add = async () => {
        const { data } = await supabase
          .from('pathologies')
          .insert({ structure_id: selectedStructure, name })
          .select()
        if (data) {
          fetchData()
        }
      }
      add()
    }
  }

  const addTestToPathology = () => {
    // Pour simplifier, prompt l'ID du test (tu peux remplacer par un select modal avec fetch des tests)
    const testId = prompt('ID du test à associer (de orthopedic_tests):')
    if (testId && selectedPathology) {
      const add = async () => {
        await supabase
          .from('pathology_tests')
          .insert({ pathology_id: selectedPathology, test_id: testId })
        handlePathologyClick(selectedPathology) // Refresh tests
      }
      add()
    }
  }

  if (loading) return <div>Chargement des données...</div>

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.6, 6]} fov={40} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={8} target={[0, 0.9, 0]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.3} />
        <Environment preset="studio" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
        </mesh>
        <Suspense fallback={<LoadingScreen />}>
          {viewMode === 'global' && (
            <RealisticBodyModel
              onRegionClick={handleRegionClick}
              hoveredRegion={hoveredRegion}
              setHoveredRegion={setHoveredRegion}
              modelPath={modelPath}
              regions={regions}
              isAdmin={isAdmin}
              onPositionChange={handlePositionChange}
            />
          )}
          {viewMode === 'region' && selectedRegion && (
            <RegionDetailView
              region={regions[selectedRegion]}
              regionKey={selectedRegion}
              onStructureClick={handleStructureClick}
              onBack={handleBackFromRegion}
              side={selectedSide}
              isAdmin={isAdmin}
              onAddStructure={addStructure}
            />
          )}
          {viewMode === 'structure' && selectedStructure && (
            <StructureDetailView
              structure={regions[selectedRegion!].structures.find((s: any) => s.id === selectedStructure)}
              onPathologyClick={handlePathologyClick}
              onBack={handleBackFromStructure}
              isAdmin={isAdmin}
              onAddPathology={addPathology}
            />
          )}
          {viewMode === 'pathology' && selectedPathology && (
            <PathologyDetailView
              pathology={regions[selectedRegion!].structures
                .find((s: any) => s.id === selectedStructure)!.pathologies
                .find((p: any) => p.id === selectedPathology)}
              tests={tests}
              onBack={handleBackFromPathology}
              isAdmin={isAdmin}
              onAddTest={addTestToPathology}
            />
          )}
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-white">
          {viewMode === 'global' ? 'Survolez/cliquez une région' : viewMode === 'region' ? 'Cliquez une structure' : viewMode === 'structure' ? 'Cliquez une pathologie' : 'Vue tests'}
        </p>
        <p className="text-xs text-gray-300 mt-1">Glissez pour pivoter • Molette zoom</p>
      </div>
      {isAdmin && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={savePositions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Sauvegarder positions
          </button>
        </div>
      )}
    </div>
  )
}

useGLTF.preload('/models/human-skeleton.gltf')