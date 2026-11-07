'use client'

// Scène 3D schématique du segment L5-S1 pour le Lumbar Roll.
// Les os sont des volumes simplifiés (pas un modèle anatomique) : l’objectif
// est de rendre lisibles les axes, les verrouillages et le bâillement facettaire.
//
// Repère anatomique : Y crânial, Z antérieur, X gauche du patient.
// Le patient est couché sur le côté gauche, le côté droit (X négatif) est en haut.

import { useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Pose } from './technique'

export type GapReadout = {
  /** Bâillement de la facette du dessus, de 0 (contact) à 1 (maximum affiché). */
  upper: number
  /** Compression de la facette du dessous, de 0 à 1. */
  lower: number
  /** Rotation relative L5 / S1 en degrés (schématique). */
  relative: number
}

type Props = {
  pose: Pose
  /** Incrémenté pour déclencher une impulsion. */
  thrustKey: number
  thrustAmplitude: number
  slowMotion: boolean
  patientView: boolean
  arrows: { trunk?: boolean; pelvis?: boolean }
  readout: MutableRefObject<GapReadout>
}

const DEG = Math.PI / 180
const BONE = '#efe6d2'
const TARGET = '#e4dbff'
const FACET_REST = new THREE.Color('#c4b5fd')
const FACET_GAP = new THREE.Color('#10b981')
const FACET_PRESS = new THREE.Color('#ef4444')

// Facettes L5-S1 : orientées à 45° entre plan frontal et plan sagittal.
const FACET_ANGLE = 45 * DEG
const FACET_Y = 0.2
const FACET_Z = -3.25
const FACET_X = 2.0
const FACET_HALF_GAP = 0.12
const MAX_GAP_DELTA = 1.2
const MAX_RELATIVE = 22

/** Normale de la facette supérieure de S1 (tournée en arrière et en dedans). */
const s1FacetNormal = (side: 1 | -1) =>
  new THREE.Vector3(-side * Math.sin(FACET_ANGLE), 0, -Math.cos(FACET_ANGLE)).normalize()

const facetCenter = (side: 1 | -1) => new THREE.Vector3(side * FACET_X, FACET_Y, FACET_Z)

// Pivot des rotations : la facette comprimée (côté gauche, en dessous).
// Une fois les surfaces en appui, l’axe de rotation se déplace vers la
// facette impactée : c’est elle qui sert de charnière, l’autre bâille.
const PIVOT = facetCenter(1)

/* ───────────────────────── Primitives ───────────────────────── */

function boneMaterial(color: string, ghost?: boolean) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.65}
      metalness={0.02}
      transparent={ghost}
      opacity={ghost ? 0.35 : 1}
      depthWrite={!ghost}
    />
  )
}

/** Cylindre tendu entre deux points. */
function Stem({ from, to, radius, color, ghost }: {
  from: THREE.Vector3
  to: THREE.Vector3
  radius: number
  color: string
  ghost?: boolean
}) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from)
    const len = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { position: from.clone().add(to).multiplyScalar(0.5), quaternion: q, length: len }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius * 0.85, length, 16]} />
      {boneMaterial(color, ghost)}
    </mesh>
  )
}

/** Vertèbre lombaire schématique, origine au centre du corps vertébral. */
function Vertebra({ y, color = BONE, ghost, label }: {
  y: number
  color?: string
  ghost?: boolean
  label?: string
}) {
  return (
    <group position={[0, y, 0]}>
      {/* Corps */}
      <mesh scale={[2.5, 1, 1.8]}>
        <cylinderGeometry args={[1, 1, 2.4, 40]} />
        {boneMaterial(color, ghost)}
      </mesh>
      {/* Pédicules */}
      {[1, -1].map((s) => (
        <mesh key={`p${s}`} position={[s * 1.3, 0.2, -2.2]}>
          <boxGeometry args={[0.7, 1.0, 1.2]} />
          {boneMaterial(color, ghost)}
        </mesh>
      ))}
      {/* Lame */}
      <mesh position={[0, -0.1, -3.3]}>
        <boxGeometry args={[2.4, 1.3, 0.6]} />
        {boneMaterial(color, ghost)}
      </mesh>
      {/* Épineuse */}
      <mesh position={[0, -0.5, -4.9]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.6, 1.7, 2.6]} />
        {boneMaterial(color, ghost)}
      </mesh>
      {/* Transverses */}
      {[1, -1].map((s) => (
        <mesh key={`t${s}`} position={[s * 2.9, 0.2, -2.5]} rotation={[0, 0, s * 0.15]}>
          <boxGeometry args={[2.6, 0.6, 0.7]} />
          {boneMaterial(color, ghost)}
        </mesh>
      ))}
      {/* Processus articulaires supérieurs */}
      {[1, -1].map((s) => (
        <mesh key={`s${s}`} position={[s * 2.1, 1.3, -3.0]}>
          <cylinderGeometry args={[0.38, 0.45, 1.2, 14]} />
          {boneMaterial(color, ghost)}
        </mesh>
      ))}
      {label && (
        <Html position={[-3.4, 0.6, 0.4]} center distanceFactor={11} zIndexRange={[10, 0]}>
          <span className="pointer-events-none select-none whitespace-nowrap rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {label}
          </span>
        </Html>
      )}
    </group>
  )
}

function Disc({ y, height, opacity = 0.35 }: { y: number; height: number; opacity?: number }) {
  return (
    <mesh position={[0, y, 0]} scale={[2.45, 1, 1.75]}>
      <cylinderGeometry args={[1, 1, height, 40]} />
      <meshStandardMaterial color="#a78bfa" transparent opacity={opacity} roughness={0.4} depthWrite={false} />
    </mesh>
  )
}

/** Surface articulaire : disque mince orienté selon une normale. */
function FacetSurface({ position, normal, materialRef }: {
  position: THREE.Vector3
  normal: THREE.Vector3
  materialRef: MutableRefObject<THREE.MeshStandardMaterial | null>
}) {
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [normal]
  )
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.8, 0.8, 0.14, 32]} />
      <meshStandardMaterial ref={materialRef} color={FACET_REST} roughness={0.3} emissive={FACET_REST} emissiveIntensity={0.15} />
    </mesh>
  )
}

/** Flèche courbe autour de l’axe crânio-caudal. */
function CurvedArrow({ y, radius, from, to, color, visible }: {
  y: number
  radius: number
  from: number
  to: number
  color: string
  visible: boolean
}) {
  const { tube, headPos, headQuat } = useMemo(() => {
    const point = (a: number) => new THREE.Vector3(radius * Math.sin(a), y, -1 + radius * Math.cos(a))
    const pts = Array.from({ length: 33 }, (_, i) => point(from + ((to - from) * i) / 32))
    const curve = new THREE.CatmullRomCurve3(pts)
    const end = point(to)
    const tangent = new THREE.Vector3().subVectors(end, point(to - (to - from) * 0.02)).normalize()
    return {
      tube: new THREE.TubeGeometry(curve, 48, 0.12, 10, false),
      headPos: end,
      headQuat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent),
    }
  }, [y, radius, from, to])
  if (!visible) return null
  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={headPos} quaternion={headQuat}>
        <coneGeometry args={[0.38, 0.9, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

/* ───────────────────────── Segment animé ───────────────────────── */

function thrustProfile(u: number) {
  if (u <= 0) return 0
  if (u >= 1) return 0.4
  // Montée très rapide, puis léger retour élastique.
  if (u < 0.3) return Math.sin((u / 0.3) * (Math.PI / 2))
  const v = (u - 0.3) / 0.7
  return 1 - 0.6 * (v * v * (3 - 2 * v))
}

function Segment({ pose, thrustKey, thrustAmplitude, slowMotion, arrows, readout }: Omit<Props, 'patientView'>) {
  const trunkRef = useRef<THREE.Group>(null)
  const pelvisRef = useRef<THREE.Group>(null)
  const current = useRef({ trunk: 0, pelvis: 0, flexion: 0 })
  const thrust = useRef({ key: 0, start: -1, value: 0 })

  const upperL5 = useRef<THREE.Mesh>(null)
  const upperS1 = useRef<THREE.Mesh>(null)
  const upperL5Mat = useRef<THREE.MeshStandardMaterial | null>(null)
  const upperS1Mat = useRef<THREE.MeshStandardMaterial | null>(null)
  const lowerL5Mat = useRef<THREE.MeshStandardMaterial | null>(null)
  const lowerS1Mat = useRef<THREE.MeshStandardMaterial | null>(null)

  const geo = useMemo(() => {
    const sides = { upper: -1 as const, lower: 1 as const }
    const make = (side: 1 | -1) => {
      const c = facetCenter(side)
      const n = s1FacetNormal(side)
      return {
        n,
        s1: c.clone().addScaledVector(n, -FACET_HALF_GAP),
        l5: c.clone().addScaledVector(n, FACET_HALF_GAP),
        // Processus articulaires : de l’arc postérieur jusqu’à la facette.
        l5StemFrom: new THREE.Vector3(side * 1.2, 1.5, -3.4),
        l5StemTo: c.clone().addScaledVector(n, FACET_HALF_GAP + 0.15),
        s1StemFrom: new THREE.Vector3(side * 2.1, -1.6, -2.0),
        s1StemTo: c.clone().addScaledVector(n, -FACET_HALF_GAP - 0.15),
      }
    }
    return { upper: make(sides.upper), lower: make(sides.lower) }
  }, [])

  const sacrumGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-2.6, 0)
    shape.lineTo(2.6, 0)
    shape.lineTo(0.8, -6.5)
    shape.lineTo(-0.8, -6.5)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 3 })
    g.translate(0, 0, -2.2)
    return g
  }, [])

  const tmpA = useMemo(() => new THREE.Vector3(), [])
  const tmpB = useMemo(() => new THREE.Vector3(), [])
  const tmpN = useMemo(() => new THREE.Vector3(), [])
  const tmpQ = useMemo(() => new THREE.Quaternion(), [])
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime
    if (thrust.current.key !== thrustKey) {
      thrust.current = { key: thrustKey, start: now, value: 0 }
    }
    const duration = slowMotion ? 1.6 : 0.15
    if (thrust.current.start >= 0) {
      thrust.current.value = thrustProfile((now - thrust.current.start) / duration)
    }

    const c = current.current
    const speed = 3.2
    c.trunk = THREE.MathUtils.damp(c.trunk, pose.trunkRotation, speed, delta)
    c.pelvis = THREE.MathUtils.damp(c.pelvis, pose.pelvisRotation, speed, delta)
    c.flexion = THREE.MathUtils.damp(c.flexion, pose.flexion, speed, delta)
    const pelvisTotal = c.pelvis + thrust.current.value * thrustAmplitude

    if (trunkRef.current) trunkRef.current.rotation.set(c.flexion * DEG, -c.trunk * DEG, 0, 'YXZ')
    if (pelvisRef.current) pelvisRef.current.rotation.set(0, pelvisTotal * DEG, 0, 'YXZ')

    // Bâillement mesuré sur la géométrie : distance entre les deux surfaces
    // de la facette du dessus, le long de la normale de S1.
    let upper = 0
    if (upperL5.current && upperS1.current) {
      upperL5.current.getWorldPosition(tmpA)
      upperS1.current.getWorldPosition(tmpB)
      // Normale exprimée dans le repère monde (inclut la rotation de la vue patient).
      upperS1.current.parent?.getWorldQuaternion(tmpQ)
      tmpN.copy(geo.upper.n).applyQuaternion(tmpQ)
      const gap = tmpA.sub(tmpB).dot(tmpN) - FACET_HALF_GAP * 2
      upper = THREE.MathUtils.clamp(gap / MAX_GAP_DELTA, 0, 1)
    }
    const relative = c.trunk + pelvisTotal
    const lower = THREE.MathUtils.clamp(relative / MAX_RELATIVE, 0, 1)
    readout.current = { upper, lower, relative }

    tmpColor.copy(FACET_REST).lerp(FACET_GAP, upper)
    for (const m of [upperL5Mat.current, upperS1Mat.current]) {
      if (!m) continue
      m.color.copy(tmpColor)
      m.emissive.copy(tmpColor)
      m.emissiveIntensity = 0.15 + upper * 0.6
    }
    tmpColor.copy(FACET_REST).lerp(FACET_PRESS, lower)
    for (const m of [lowerL5Mat.current, lowerS1Mat.current]) {
      if (!m) continue
      m.color.copy(tmpColor)
      m.emissive.copy(tmpColor)
      m.emissiveIntensity = 0.15 + lower * 0.6
    }
  })

  const pivot: [number, number, number] = [PIVOT.x, PIVOT.y, PIVOT.z]
  const unpivot: [number, number, number] = [-PIVOT.x, -PIVOT.y, -PIVOT.z]
  const upperNormal = geo.upper.n
  const lowerNormal = geo.lower.n

  return (
    <group>
      {/* Bloc sus-jacent verrouillé : L3, L4, L5 */}
      <group position={pivot}>
        <group ref={trunkRef}>
          <group position={unpivot}>
            <Vertebra y={8.7} ghost />
            <Disc y={7.0} height={1.1} opacity={0.18} />
            <Vertebra y={5.3} label="L4" />
            <Disc y={3.55} height={1.1} />
            <Vertebra y={1.8} color={TARGET} label="L5" />
            {/* Processus articulaires inférieurs de L5 et leurs surfaces */}
            <Stem from={geo.upper.l5StemFrom} to={geo.upper.l5StemTo} radius={0.36} color={TARGET} />
            <Stem from={geo.lower.l5StemFrom} to={geo.lower.l5StemTo} radius={0.36} color={TARGET} />
            <mesh ref={upperL5} position={geo.upper.l5}>
              <sphereGeometry args={[0.01]} />
            </mesh>
            <FacetSurface position={geo.upper.l5} normal={upperNormal.clone().negate()} materialRef={upperL5Mat} />
            <FacetSurface position={geo.lower.l5} normal={lowerNormal.clone().negate()} materialRef={lowerL5Mat} />
          </group>
        </group>
      </group>

      {/* Disque L5-S1 */}
      <Disc y={0} height={1.2} />

      {/* Bassin : sacrum et ilia */}
      <group position={pivot}>
        <group ref={pelvisRef}>
          <group position={unpivot}>
            <mesh position={[0, -1.3, 0]} scale={[2.4, 1, 1.7]}>
              <cylinderGeometry args={[1, 1, 1.4, 40]} />
              {boneMaterial(TARGET)}
            </mesh>
            <group position={[0, -1.4, 0]} rotation={[0.45, 0, 0]}>
              <mesh geometry={sacrumGeometry}>{boneMaterial(BONE)}</mesh>
            </group>
            {[1, -1].map((s) => (
              <mesh
                key={`ilium${s}`}
                position={[s * 5.0, -2.8, -1.2]}
                rotation={[0.2, s * 0.35, s * 0.3]}
                scale={[0.55, 3.2, 3.6]}
              >
                <sphereGeometry args={[1, 32, 24]} />
                {boneMaterial(BONE, true)}
              </mesh>
            ))}
            <Stem from={geo.upper.s1StemFrom} to={geo.upper.s1StemTo} radius={0.4} color={TARGET} />
            <Stem from={geo.lower.s1StemFrom} to={geo.lower.s1StemTo} radius={0.4} color={TARGET} />
            <mesh ref={upperS1} position={geo.upper.s1}>
              <sphereGeometry args={[0.01]} />
            </mesh>
            <FacetSurface position={geo.upper.s1} normal={upperNormal} materialRef={upperS1Mat} />
            <FacetSurface position={geo.lower.s1} normal={lowerNormal} materialRef={lowerS1Mat} />
            <Html position={[-3.6, -1.4, 0.4]} center distanceFactor={11} zIndexRange={[10, 0]}>
              <span className="pointer-events-none select-none whitespace-nowrap rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                S1
              </span>
            </Html>
            <Html position={[-5.6, -6.6, -1.2]} center distanceFactor={11} zIndexRange={[10, 0]}>
              <span className="pointer-events-none select-none whitespace-nowrap rounded bg-amber-500/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Ilium du dessus
              </span>
            </Html>
          </group>
        </group>
      </group>

      <Html position={[-FACET_X - 1.6, FACET_Y - 0.3, FACET_Z - 1.4]} center distanceFactor={11} zIndexRange={[10, 0]}>
        <span className="pointer-events-none select-none whitespace-nowrap rounded bg-emerald-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          Facette du dessus
        </span>
      </Html>
      <Html position={[FACET_X + 1.6, FACET_Y - 0.3, FACET_Z - 1.4]} center distanceFactor={11} zIndexRange={[10, 0]}>
        <span className="pointer-events-none select-none whitespace-nowrap rounded bg-rose-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          Facette du dessous
        </span>
      </Html>

      {/* Rotation du tronc (vers la droite : la face postérieure part vers la gauche) */}
      <CurvedArrow y={6.2} radius={5.8} from={Math.PI + 0.7} to={Math.PI - 0.7} color="#3b82f6" visible={!!arrows.trunk} />
      {/* Rotation du bassin (vers la gauche) */}
      <CurvedArrow y={-4.2} radius={7.2} from={Math.PI - 0.7} to={Math.PI + 0.7} color="#f59e0b" visible={!!arrows.pelvis} />
    </group>
  )
}

export default function SpineScene(props: Props) {
  const { patientView, ...rest } = props
  return (
    <Canvas camera={{ position: [8, 11, -23], fov: 36 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 14, -10]} intensity={1.6} />
      <directionalLight position={[-10, -4, 8]} intensity={0.5} />
      <group rotation={[0, 0, patientView ? -Math.PI / 2 : 0]}>
        <Segment {...rest} />
      </group>
      <OrbitControls target={[0.5, 0, -2.5]} enablePan={false} minDistance={9} maxDistance={40} />
    </Canvas>
  )
}
