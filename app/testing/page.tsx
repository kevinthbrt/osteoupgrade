'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment, TransformControls } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

useGLTF.preload('/models/human-skeleton.gltf')

// Types
interface Position { x: number; y: number; z: number }
interface Size { x: number; y: number; z: number }

interface AnatomicalRegion {
  id: string
  name: string
  color: string
  position: Position
  size: Size
  is_symmetric: boolean
  structures: AnatomicalStructure[]
}

interface AnatomicalStructure {
  id: string
  name: string
  position: Position
  pathologies: Pathology[]
}

interface Pathology {
  id: string
  name: string
}

// Zone cliquable avec drag & resize
function ClickableZone({
  region,
  regionKey,
  onClick,
  isHovered,
  onHover,
  side = 'center',
  isAdmin = false,
  onPositionChange,
}: {
  region: any
  regionKey: string
  onClick: (key: string, side: string) => void
  isHovered: boolean
  onHover: (hovered: boolean) => void
  side?: string
  isAdmin?: boolean
  onPositionChange: (key: string, side: string, pos: Position) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  let position = { ...region.position }
  if (region.is_symmetric && side === 'right') {
    position.x = -position.x
  }

  const handleDrag = (e: any) => {
    if (!e || !meshRef.current) return
    const pos = e.object.position
    onPositionChange(regionKey, side, {
      x: side === 'right' ? -pos.x : pos.x,
      y: pos.y,
      z: pos.z,
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
          opacity={isAdmin ? 0.5 : isHovered ? 0.4 : 0}
          wireframe={isHovered || isAdmin}
        />
      </mesh>

      {isAdmin && meshRef.current && (
        <TransformControls object={meshRef.current} mode="translate" onObjectChange={handleDrag} />
      )}

      {(isHovered || isAdmin) && (
        <Html center distanceFactor={8}>
          <div
            className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 whitespace-nowrap pointer-events-none"
            style={{ borderColor: region.color }}
          >
            <p className="font-bold" style={{ color: region.color }}>
              {region.name}
            </p>
            {region.is_symmetric && side !== 'center' && (
              <p className="text-xs text-gray-600">{side === 'left' ? 'Gauche' : 'Droite'}</p>
            )}
          </div>
        </Html>
      )}
    </>
  )
}

// Modèle principal
function RealisticBodyModel({
  onRegionClick,
  hoveredRegion,
  setHoveredRegion,
  modelPath,
  regions,
  isAdmin,
  onPositionChange,
}: any) {
  const gltf = useGLTF(modelPath) as any
  const scene = gltf.scene

  return (
    <group>
      <primitive object={scene} scale={0.2} position={[0, 0.9, 0]} rotation={[0, Math.PI, 0]} />
      {Object.entries(regions).map(([key, region]: [string, any]) => {
        if (region.is_symmetric) {
          return (
            <group key={key}>
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-left`}
                onHover={(h: boolean) => setHoveredRegion(h ? `${key}-left` : null)}
                side="left"
                isAdmin={isAdmin}
                onPositionChange={onPositionChange}
              />
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-right`}
                onHover={(h: boolean) => setHoveredRegion(h ? `${key}-right` : null)}
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
            onHover={(h: boolean) => setHoveredRegion(h ? key : null)}
            isAdmin={isAdmin}
            onPositionChange={onPositionChange}
          />
        )
      })}
    </group>
  )
}

// Vues détaillées (inchangées, juste typées)
function RegionDetailView({ region, onStructureClick, onBack, side, isAdmin, onAddStructure }: any) { /* ... même code ... */ }
function StructureDetailView({ structure, onPathologyClick, onBack, isAdmin, onAddPathology }: any) { /* ... même code ... */ }
function PathologyDetailView({ pathology, tests, onBack, isAdmin, onAddTest }: any) { /* ... même code ... */ }

function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-white text-xl font-bold">Chargement du modèle 3D...</p>
      </div>
    </Html>
  )
}

// COMPOSANT PRINCIPAL – VERSION FINALE
export default function AnatomyViewer3D({
  modelPath = '/models/human-skeleton.gltf',
  isAdmin = false,
  onPathologySelect, // ← Optionnel : pour la page /testing
}: {
  modelPath?: string
  isAdmin?: boolean
  onPathologySelect?: (pathologies: string[], structureName: string) => void
}) {
  const [viewMode, setViewMode] = useState<'global' | 'region' | 'structure' | 'pathology'>('global')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null)
  const [selectedPathology, setSelectedPathology] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [regions, setRegions] = useState<Record<string, AnatomicalRegion>>({})
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const positionChanges = useRef<Record<string, Position>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: regionsData } = await supabase.from('anatomical_regions').select('*')
      const { data: structuresData } = await supabase.from('anatomical_structures').select('*')
      const { data: pathologiesData } = await supabase.from('pathologies').select('*')

      const formatted: Record<string, AnatomicalRegion> = {}

      regionsData?.forEach(r => {
        formatted[r.id] = {
          ...r,
          structures: [],
        } as any
      })

      structuresData?.forEach(s => {
        if (formatted[s.region_id]) {
          formatted[s.region_id].structures.push({ ...s, pathologies: [] })
        }
      })

      pathologiesData?.forEach(p => {
        for (const region of Object.values(formatted)) {
          const struct = region.structures.find((st: any) => st.id === p.structure_id)
          if (struct) struct.pathologies.push(p)
        }
      })

      setRegions(formatted)
    } catch (err) {
      console.error(err)
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
    const structure = regions[selectedRegion!]?.structures.find((s: any) => s.id === structureId)
    if (!structure) return

    // Si on est en mode patient (onPathologySelect existe) → on appelle le callback
    if (onPathologySelect) {
      const pathologyNames = structure.pathologies.map((p: any) => p.name)
      onPathologySelect(pathologyNames, structure.name)
      return
    }

    // Sinon (admin) → on va dans la vue détaillée
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

  const handlePositionChange = (key: string, side: string, pos: Position) => {
    positionChanges.current[key] = pos
  }

  const savePositions = async () => {
    for (const [key, pos] of Object.entries(positionChanges.current)) {
      await supabase.from('anatomical_regions').update({ position: pos }).eq('id', key)
    }
    positionChanges.current = {}
    alert('Positions sauvegardées !')
    fetchData()
  }

  const addStructure = async () => { /* même code prompt → insert → fetchData */ }
  const addPathology = async () => { /* même code */ }
  const addTestToPathology = async () => { /* même code */ }

  if (loading) return <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center text-white">Chargement...</div>

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden relative shadow-2xl">
      <Canvas shadows camera={{ position: [0, 1.6, 6], fov: 40 }}>
        <PerspectiveCamera makeDefault />
        <OrbitControls target={[0, 0.9, 0]} minDistance={2} maxDistance={10} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="studio" />
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
          {/* Les autres vues : region, structure, pathology → inchangées */}
        </Suspense>
      </Canvas>

      {/* UI */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur px-5 py-3 rounded-xl">
        <p className="text-white font-medium">
          {viewMode === 'global' && 'Cliquez sur une zone anatomique'}
          {viewMode === 'region' && 'Sélectionnez une structure'}
          {viewMode === 'structure' && 'Sélectionnez une pathologie'}
          {viewMode === 'pathology' && 'Tests associés'}
        </p>
      </div>

      {isAdmin && (
        <button
          onClick={savePositions}
          className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition"
        >
          Sauvegarder les positions
        </button>
      )}
    </div>
  )
}