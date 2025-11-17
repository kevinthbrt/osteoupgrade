'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, useRef, Suspense } from 'react'
import * as THREE from 'three'

// Définition des régions anatomiques (identique au précédent)
const ANATOMICAL_REGIONS = {
  cervical: {
    name: 'Région Cervicale',
    color: '#60a5fa',
    position: [0, 1.6, 0] as [number, number, number],
    size: [0.15, 0.25, 0.15] as [number, number, number],
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
    position: [0, 0.5, 0] as [number, number, number],
    size: [0.2, 0.3, 0.15] as [number, number, number],
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
    position: [0.35, 1.3, 0] as [number, number, number],
    size: [0.12, 0.15, 0.12] as [number, number, number],
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
    position: [0.12, -0.4, 0] as [number, number, number],
    size: [0.12, 0.2, 0.12] as [number, number, number],
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

// Zone cliquable invisible superposée au modèle
function ClickableZone({ 
  region, 
  regionKey, 
  onClick, 
  isHovered,
  onHover,
  side = 'center'
}: any) {
  let position = [...region.position]
  if (region.isSymmetric && side === 'right') {
    position[0] = -position[0]
  }

  return (
    <group position={position as [number, number, number]}>
      {/* Zone invisible mais cliquable */}
      <mesh
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
        <boxGeometry args={region.size} />
        <meshBasicMaterial 
          color={region.color}
          transparent
          opacity={isHovered ? 0.3 : 0}
          wireframe={isHovered}
        />
      </mesh>
      
      {/* Label qui apparaît au survol */}
      {isHovered && (
        <Html center distanceFactor={8}>
          <div className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 whitespace-nowrap pointer-events-none"
            style={{ borderColor: region.color }}>
            <p className="font-bold text-gray-900" style={{ color: region.color }}>
              {region.name}
            </p>
            {region.isSymmetric && (
              <p className="text-xs text-gray-600">
                {side === 'left' ? 'Gauche' : 'Droite'}
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Modèle 3D réaliste chargé depuis un fichier GLTF
// Modèle 3D réaliste chargé depuis un fichier GLTF
function RealisticBodyModel({ 
  onRegionClick, 
  hoveredRegion, 
  setHoveredRegion,
  modelPath 
}: any) {
  // ✅ on caste pour éviter l’erreur de type
  const { scene } = useGLTF(modelPath) as any
  
  return (
    <group>
      {/* Le modèle 3D réaliste */}
      <primitive 
        object={scene} 
        scale={0.15}              // squelette 2x plus petit
        position={[0, 0.7, 0]}    // léger recentrage vertical
        rotation={[0, Math.PI, 0]}
      />



      {/* Zones cliquables invisibles superposées */}
      {Object.entries(ANATOMICAL_REGIONS).map(([key, region]: [string, any]) => {
        if (region.isSymmetric) {
          return (
            <group key={key}>
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-left`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-left` : null)}
                side="left"
              />
              <ClickableZone
                region={region}
                regionKey={key}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${key}-right`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${key}-right` : null)}
                side="right"
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
          />
        )
      })}
    </group>
  )
}

        

// Vue détaillée d'une région (identique à la version précédente)
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
      <Html position={[0, 2, 0]} center>
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

// Loader pendant le chargement du modèle 3D
function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">
          Chargement du modèle anatomique 3D...
        </p>
      </div>
    </Html>
  )
}

// Composant principal
export default function AnatomyViewer3DRealistic({ 
  onPathologySelect,
  modelPath = '/models/human-skeleton.gltf' // Chemin vers ton modèle 3D
}: { 
  onPathologySelect: (pathologies: string[], structureName: string) => void
  modelPath?: string
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
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.6, 6]}   // caméra plus loin
          fov={40}                  // champ un peu plus large
        />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={8}
          target={[0, 0.9, 0]}      // vise le centre du bassin
        />

        
        {/* Éclairage optimisé pour modèle réaliste */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.3} />
        
        {/* Environnement HDRI pour reflets réalistes */}
        <Environment preset="studio" />

        {/* Sol avec reflets */}
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

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-white">
          {viewMode === 'global' 
            ? '🖱️ Survolez et cliquez sur une région anatomique' 
            : '🎯 Cliquez sur une structure pour voir les pathologies'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Glissez pour pivoter • Molette pour zoomer
        </p>
      </div>
    </div>
  )
}

// Preload du modèle pour performance
useGLTF.preload('/models/human-skeleton.gltf')

export { ANATOMICAL_REGIONS }
