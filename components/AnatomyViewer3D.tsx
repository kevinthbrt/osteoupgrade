'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, Html } from '@react-three/drei'
import { useState, useRef, Suspense } from 'react'
import * as THREE from 'three'

// Définition des régions anatomiques avec leurs structures
const ANATOMICAL_REGIONS = {
  cervical: {
    name: 'Région Cervicale',
    color: '#60a5fa',
    position: [0, 7, 0],
    structures: [
      { id: 'c-vertebrae', name: 'Vertèbres Cervicales', position: [0, 0, 0] },
      { id: 'c-discs', name: 'Disques Intervertébraux', position: [0, -0.3, 0] },
      { id: 'c-facets', name: 'Facettes Articulaires', position: [0.3, 0, 0] },
      { id: 'c-muscles', name: 'Muscles Cervicaux', position: [0.5, 0, 0] },
    ],
    pathologies: {
      'c-vertebrae': ['Fracture vertébrale', 'Spondylose cervicale', 'Sténose'],
      'c-discs': ['Hernie discale', 'Discopathie dégénérative', 'Protrusion'],
      'c-facets': ['Syndrome facettaire', 'Arthrose facettaire'],
      'c-muscles': ['Contracture', 'Trigger points', 'Entorse cervicale'],
    }
  },
  lumbar: {
    name: 'Région Lombaire',
    color: '#f59e0b',
    position: [0, 3, 0],
    structures: [
      { id: 'l-vertebrae', name: 'Vertèbres Lombaires', position: [0, 0, 0] },
      { id: 'l-discs', name: 'Disques L1-S1', position: [0, -0.3, 0] },
      { id: 'l-facets', name: 'Facettes Articulaires', position: [0.3, 0, 0] },
      { id: 'l-muscles', name: 'Muscles Paravertébraux', position: [0.5, 0, 0] },
      { id: 'l-si-joint', name: 'Articulation Sacro-Iliaque', position: [0.4, -0.5, 0] },
    ],
    pathologies: {
      'l-vertebrae': ['Spondylolisthésis', 'Fracture', 'Sténose canalaire'],
      'l-discs': ['Hernie discale L4-L5', 'Hernie L5-S1', 'Discopathie'],
      'l-facets': ['Syndrome facettaire', 'Arthrose facettaire'],
      'l-muscles': ['Lombalgie musculaire', 'Contracture', 'Trigger points'],
      'l-si-joint': ['Dysfonction sacro-iliaque', 'Inflammation SI'],
    }
  },
  shoulder: {
    name: 'Épaule',
    color: '#8b5cf6',
    position: [2.5, 6, 0],
    isSymmetric: true,
    structures: [
      { id: 's-rotator-cuff', name: 'Coiffe des Rotateurs', position: [0, 0, 0] },
      { id: 's-biceps', name: 'Tendon du Long Biceps', position: [0.2, -0.3, 0] },
      { id: 's-ac-joint', name: 'Articulation AC', position: [0.3, 0.2, 0] },
      { id: 's-labrum', name: 'Labrum Glénoïdien', position: [0, 0, -0.2] },
      { id: 's-bursa', name: 'Bourse Sous-Acromiale', position: [0, 0.2, 0] },
    ],
    pathologies: {
      's-rotator-cuff': ['Tendinopathie', 'Rupture partielle', 'Rupture complète', 'Calcification'],
      's-biceps': ['Tendinite bicipitale', 'Rupture', 'SLAP lesion'],
      's-ac-joint': ['Arthrose AC', 'Disjonction AC', 'Ostéolyse clavicule'],
      's-labrum': ['Lésion SLAP', 'Instabilité antérieure', 'Lésion Bankart'],
      's-bursa': ['Bursite sous-acromiale', 'Conflit sous-acromial'],
    }
  },
  knee: {
    name: 'Genou',
    color: '#10b981',
    position: [1, 0.5, 0],
    isSymmetric: true,
    structures: [
      { id: 'k-meniscus', name: 'Ménisques', position: [0, 0, 0] },
      { id: 'k-acl', name: 'LCA', position: [0, 0, -0.1] },
      { id: 'k-pcl', name: 'LCP', position: [0, 0, 0.1] },
      { id: 'k-mcl', name: 'LLI', position: [0.2, 0, 0] },
      { id: 'k-lcl', name: 'LLE', position: [-0.2, 0, 0] },
      { id: 'k-patella', name: 'Rotule / Tendon Rotulien', position: [0, 0.3, 0.2] },
    ],
    pathologies: {
      'k-meniscus': ['Lésion méniscale interne', 'Lésion méniscale externe', 'Kyste méniscal'],
      'k-acl': ['Rupture LCA', 'Entorse LCA', 'Laxité chronique'],
      'k-pcl': ['Rupture LCP', 'Entorse LCP'],
      'k-mcl': ['Entorse LLI grade I-III', 'Laxité LLI'],
      'k-lcl': ['Entorse LLE', 'Rupture LLE'],
      'k-patella': ['Tendinopathie rotulienne', 'Syndrome fémoro-patellaire', 'Chondropathie'],
    }
  },
}

// Composant pour afficher une région anatomique 3D
function AnatomicalRegion({ 
  region, 
  regionKey, 
  onClick, 
  isHovered,
  onHover,
  isSymmetric = false,
  side = 'center'
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  let position = [...region.position]
  if (isSymmetric && side === 'right') {
    position[0] = -position[0]
  }

  return (
    <group position={position as [number, number, number]}>
      <mesh
        ref={meshRef}
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
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color={region.color} 
          opacity={isHovered ? 0.9 : 0.6}
          transparent
          emissive={region.color}
          emissiveIntensity={isHovered ? 0.4 : 0.1}
        />
      </mesh>
      
      {isHovered && (
        <Html center>
          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border-2 border-gray-200 whitespace-nowrap">
            <p className="font-semibold text-gray-900">{region.name}</p>
            {isSymmetric && <p className="text-xs text-gray-600">{side === 'left' ? 'Gauche' : 'Droite'}</p>}
          </div>
        </Html>
      )}
    </group>
  )
}

// Composant pour le corps humain simplifié
function HumanBodyModel({ onRegionClick, hoveredRegion, setHoveredRegion }: any) {
  return (
    <group>
      {/* Tête */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>

      {/* Cou */}
      <mesh position={[0, 7.2, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Torse */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial color="#bfdbfe" />
      </mesh>

      {/* Bassin */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[2.2, 1.5, 1.2]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      {/* Bras gauche */}
      <mesh position={[1.5, 5.5, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.2, 0.18, 2, 16]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Bras droit */}
      <mesh position={[-1.5, 5.5, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.2, 0.18, 2, 16]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Jambe gauche */}
      <mesh position={[0.5, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 4, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      {/* Jambe droite */}
      <mesh position={[-0.5, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 4, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      {/* Régions interactives */}
      {Object.entries(ANATOMICAL_REGIONS).map(([key, region]: [string, any]) => {
        if (region.isSymmetric) {
          return (
            <group key={key}>
              <AnatomicalRegion
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-left`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-left` : null)}
                isSymmetric={true}
                side="left"
              />
              <AnatomicalRegion
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-right`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-right` : null)}
                isSymmetric={true}
                side="right"
              />
            </group>
          )
        }
        
        return (
          <AnatomicalRegion
            key={key}
            region={region}
            regionKey={key}
            onClick={onRegionClick}
            isHovered={hoveredRegion === key}
            onHover={(hovered: boolean) => setHoveredRegion(hovered ? key : null)}
          />
        )
      })}
    </group>
  )
}

// Vue détaillée d'une région avec ses structures
function RegionDetailView({ 
  region, 
  regionKey,
  onStructureClick,
  onBack,
  side 
}: any) {
  const [hoveredStructure, setHoveredStructure] = useState<string | null>(null)

  return (
    <group>
      {/* Titre de la région */}
      <Html position={[0, 3, 0]} center>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
          <h2 className="text-xl font-bold" style={{ color: region.color }}>
            {region.name} {side && `(${side === 'left' ? 'Gauche' : 'Droite'})`}
          </h2>
          <button 
            onClick={onBack}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Retour à la vue globale
          </button>
        </div>
      </Html>

      {/* Structures anatomiques */}
      {region.structures.map((structure: any, index: number) => {
        const angle = (index / region.structures.length) * Math.PI * 2
        const radius = 2
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
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial 
                color={region.color}
                opacity={isHovered ? 1 : 0.7}
                transparent
                emissive={region.color}
                emissiveIntensity={isHovered ? 0.5 : 0.2}
              />
            </mesh>

            <Html center>
              <div 
                className={`px-3 py-2 rounded-lg shadow-md transition-all ${
                  isHovered 
                    ? 'bg-white border-2 scale-110' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
                style={{ 
                  borderColor: isHovered ? region.color : undefined,
                  minWidth: '150px'
                }}
              >
                <p className={`text-sm font-semibold text-center ${
                  isHovered ? 'text-gray-900' : 'text-gray-700'
                }`}>
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

// Composant principal
export default function AnatomyViewer3D({ 
  onPathologySelect 
}: { 
  onPathologySelect: (pathologies: string[], structureName: string) => void 
}) {
  const [viewMode, setViewMode] = useState<'global' | 'region'>('global')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const handleRegionClick = (regionKey: string, side: string = 'center') => {
    setSelectedRegion(regionKey)
    setSelectedSide(side)
    setViewMode('region')
  }

  const handleStructureClick = (structureId: string) => {
    if (selectedRegion) {
      const region = ANATOMICAL_REGIONS[selectedRegion as keyof typeof ANATOMICAL_REGIONS]
      const pathologies = (region.pathologies as Record<string, string[]>)[structureId] || []
      const structure = region.structures.find((s: any) => s.id === structureId)
      onPathologySelect(pathologies, structure?.name || structureId)
    }
  }

  const handleBack = () => {
    setViewMode('global')
    setSelectedRegion(null)
    setSelectedSide('center')
  }

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        {/* Éclairage */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Grille de sol */}
        <gridHelper args={[20, 20, '#e5e7eb', '#f3f4f6']} position={[0, -1, 0]} />

        <Suspense fallback={null}>
          {viewMode === 'global' && (
            <HumanBodyModel 
              onRegionClick={handleRegionClick}
              hoveredRegion={hoveredRegion}
              setHoveredRegion={setHoveredRegion}
            />
          )}

          {viewMode === 'region' && selectedRegion && (
            <RegionDetailView
              region={ANATOMICAL_REGIONS[selectedRegion as keyof typeof ANATOMICAL_REGIONS]}
              regionKey={selectedRegion}
              onStructureClick={handleStructureClick}
              onBack={handleBack}
              side={selectedSide}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900">
          {viewMode === 'global' 
            ? '🖱️ Cliquez sur une région pour zoomer' 
            : '🎯 Cliquez sur une structure pour voir les pathologies'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Utilisez la souris pour pivoter et zoomer
        </p>
      </div>
    </div>
  )
}

// Export des régions pour utilisation externe
export { ANATOMICAL_REGIONS }
