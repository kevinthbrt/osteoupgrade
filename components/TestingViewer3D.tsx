'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, Suspense, useRef } from 'react'
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye } from 'lucide-react'
import * as THREE from 'three'

// Types partagés
interface AnatomicalZone {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_symmetric: boolean
  model_path: string | null
  is_active: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

interface TestingViewer3DProps {
  zones: AnatomicalZone[]
  onZoneClick: (zone: AnatomicalZone) => void
  modelPath?: string
  onSpecialCategoryClick?: (category: string) => void
}

// Zone cliquable avec animations améliorées
function ClickableZone({
  zone,
  onClick,
  isHovered,
  onHover,
  side = 'center'
}: any) {
  let position = [zone.position_x, zone.position_y, zone.position_z]

  if (zone.is_symmetric && side === 'right') {
    position = [-zone.position_x, zone.position_y, zone.position_z]
  }

  const size = [zone.size_x, zone.size_y, zone.size_z]

  return (
    <group position={position as [number, number, number]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick(zone, side)
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
        <boxGeometry args={size as [number, number, number]} />
        <meshStandardMaterial
          color={zone.color}
          transparent
          opacity={isHovered ? 0.5 : 0.2}
          emissive={zone.color}
          emissiveIntensity={isHovered ? 0.5 : 0.1}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>

      {/* Bordure pour l'effet hover */}
      {isHovered && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new (THREE as any).BoxGeometry(...size)]} />
          <lineBasicMaterial attach="material" color={zone.color} linewidth={2} />
        </lineSegments>
      )}
    </group>
  )
}

// Modèle 3D avec zones
function BodyModel({
  zones,
  onZoneClick,
  hoveredZone,
  setHoveredZone,
  modelPath
}: any) {
  const { scene } = useGLTF(modelPath) as any

  return (
    <group>
      <primitive
        object={scene}
        scale={1.4}
        position={[0, -0.5, 0]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
      />

      {zones.map((zone: AnatomicalZone) => {
        if (zone.is_symmetric) {
          return (
            <group key={zone.id}>
              <ClickableZone
                zone={zone}
                onClick={onZoneClick}
                isHovered={hoveredZone === `${zone.id}-left`}
                onHover={(hovered: boolean) => setHoveredZone(hovered ? `${zone.id}-left` : null)}
                side="left"
              />
              <ClickableZone
                zone={zone}
                onClick={onZoneClick}
                isHovered={hoveredZone === `${zone.id}-right`}
                onHover={(hovered: boolean) => setHoveredZone(hovered ? `${zone.id}-right` : null)}
                side="right"
              />
            </group>
          )
        }
        
        return (
          <ClickableZone
            key={zone.id}
            zone={zone}
            onClick={onZoneClick}
            isHovered={hoveredZone === zone.id}
            onHover={(hovered: boolean) => setHoveredZone(hovered ? zone.id : null)}
          />
        )
      })}
    </group>
  )
}

// Loader modernisé
function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-purple-600 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        </div>
        <p className="text-gray-900 text-lg font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Chargement du modèle 3D
        </p>
        <p className="text-sm text-gray-600 font-medium">
          Préparation de l'anatomie interactive...
        </p>
      </div>
    </Html>
  )
}

// Composant principal
export default function TestingViewer3D({
  zones,
  onZoneClick,
  modelPath = '/models/human-skeleton.gltf',
  onSpecialCategoryClick
}: TestingViewer3DProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const [activeView, setActiveView] = useState<string>('default')

  const handleZoneClick = (zone: AnatomicalZone, side: string = 'center') => {
    onZoneClick(zone)
  }

  // Zone survolée
  const hoveredZoneInfo = zones.find(z =>
    hoveredZone === z.id ||
    hoveredZone === `${z.id}-left` ||
    hoveredZone === `${z.id}-right`
  )

  const specialCategories = [
    {
      key: 'neurologique',
      label: 'Tests neurologiques',
      color: 'bg-gradient-to-r from-purple-600 to-purple-500',
      icon: '🧠'
    },
    {
      key: 'vasculaire',
      label: 'Tests vasculaires',
      color: 'bg-gradient-to-r from-red-600 to-red-500',
      icon: '❤️'
    },
    {
      key: 'systemique',
      label: 'Tests systémiques',
      color: 'bg-gradient-to-r from-blue-600 to-blue-500',
      icon: '🔬'
    }
  ]

  // Contrôles de vue
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      setActiveView('default')
    }
  }

  const handleViewChange = (position: [number, number, number], target: [number, number, number], viewName: string) => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object

      camera.position.set(...position)
      controls.target.set(...target)
      controls.update()
      setActiveView(viewName)
    }
  }

  const viewPresets = [
    { name: 'Face', position: [0, 1.6, 6] as [number, number, number], target: [0, 0.9, 0] as [number, number, number], icon: <Eye className="w-4 h-4" /> },
    { name: 'Profil', position: [6, 1.6, 0] as [number, number, number], target: [0, 0.9, 0] as [number, number, number], icon: <Eye className="w-4 h-4" /> },
    { name: 'Dos', position: [0, 1.6, -6] as [number, number, number], target: [0, 0.9, 0] as [number, number, number], icon: <Eye className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Canvas 3D avec fond transparent */}
      <div className="w-full h-[700px] rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-xl">
        <Canvas
          shadows
          gl={{
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
          }}
          className="bg-transparent"
        >
          <PerspectiveCamera
            makeDefault
            position={[0, 1.6, 6]}
            fov={25}
          />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            target={[0, 0.9, 0]}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.8}
            zoomSpeed={0.8}
          />

          {/* Éclairage optimisé pour fond clair */}
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.6} />
          <pointLight position={[0, 4, 0]} intensity={0.5} />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.4}
            castShadow
          />

          <Environment preset="apartment" />

          <Suspense fallback={<LoadingScreen />}>
            <BodyModel
              zones={zones}
              onZoneClick={handleZoneClick}
              hoveredZone={hoveredZone}
              setHoveredZone={setHoveredZone}
              modelPath={modelPath}
            />
          </Suspense>
        </Canvas>

        {/* Contrôles de vue modernes - top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleResetView}
            className="group bg-white/90 hover:bg-white backdrop-blur-lg p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 hover:scale-105"
            title="Réinitialiser la vue"
          >
            <RotateCcw className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>

          <div className="flex flex-col gap-1 bg-white/90 backdrop-blur-lg rounded-xl p-2 shadow-lg border border-gray-200/50">
            {viewPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleViewChange(preset.position, preset.target, preset.name)}
                className={`group p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  activeView === preset.name
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={`Vue ${preset.name}`}
              >
                <div className="flex items-center gap-2">
                  {preset.icon}
                  <span className="text-xs font-medium">{preset.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Encart zone survolée - top left corner avec animation */}
        {hoveredZoneInfo && (
          <div
            className="absolute top-4 left-4 bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl border-l-4 animate-in slide-in-from-left-5 duration-200"
            style={{ borderColor: hoveredZoneInfo.color }}
          >
            <p className="font-bold text-base tracking-tight" style={{ color: hoveredZoneInfo.color }}>
              {hoveredZoneInfo.display_name}
            </p>
            {hoveredZone?.includes('-') && (
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {hoveredZone.includes('left') ? '← Côté gauche' : 'Côté droit →'}
              </p>
            )}
          </div>
        )}

        {/* Instructions modernes */}
        <div className="absolute bottom-4 left-4 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="text-sm font-bold text-white tracking-tight">
              Interaction 3D
            </p>
          </div>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">●</span>
              <span>Clic gauche + glisser pour pivoter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">●</span>
              <span>Molette pour zoomer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">●</span>
              <span>Survolez et cliquez sur une zone</span>
            </div>
          </div>
        </div>

        {/* Message si aucune zone */}
        {zones.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl px-8 py-6 rounded-2xl shadow-2xl border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Maximize2 className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-2">Aucune zone configurée</p>
            <p className="text-sm text-gray-600 max-w-xs">
              Utilisez Anatomy Builder pour créer les zones anatomiques interactives
            </p>
          </div>
        )}
      </div>

      {/* Boutons pour les tests globaux - Design modernisé */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {specialCategories.map((category) => (
          <button
            key={category.key}
            onClick={() => onSpecialCategoryClick?.(category.key)}
            className={`${category.color} text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2`}
          >
            <span className="text-lg">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}