'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useSceneContext, useSceneProgress } from '@/components/three/ThreeCanvas'
import { useCustomCursor } from '@/hooks/useCustomCursor'
import { useSoundManager } from '@/hooks/useSoundManager'

export function OracleScene() {
  const { isActive } = useSceneContext()
  const { progress } = useSceneProgress()
  const { targetX, targetY, addMagneticElement } = useCustomCursor()
  const sound = useSoundManager()

  const sculptureRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.Camera>()
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)
  const mouseInfluenceRef = useRef({ x: 0, y: 0 })

  const sculptureGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(3, 8)
    const pos = geometry.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const dist = Math.sqrt(x * x + y * y + z * z)
      const noise = Math.sin(x * 5) * Math.cos(y * 5) * Math.sin(z * 5) * 0.15
      const normalized = noise / dist

      pos.setX(i, x + x * normalized)
      pos.setY(i, y + y * normalized)
      pos.setZ(i, z + z * normalized)
    }

    geometry.computeVertexNormals()
    return geometry
  }, [])

  const sculptureMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xf5f0e8,
        metalness: 0.2,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 2,
        reflectivity: 0.5,
        transmission: 0.1,
        thickness: 0.5,
      }),
    []
  )

  const ringGeometry = useMemo(() => new THREE.RingGeometry(4, 4.2, 64), [])
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 10000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const orbits = new Float32Array(count * 3)

    const ivoryColor = new THREE.Color(0xf5f0e8)
    const goldColor = new THREE.Color(0xc9a84c)
    const oxidizedColor = new THREE.Color(0x7a7a8a)

    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 20
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      orbits[i * 3] = radius
      orbits[i * 3 + 1] = theta
      orbits[i * 3 + 2] = phi

      sizes[i] = Math.random() * 1.5 + 0.3
      alphas[i] = Math.random() * 0.4 + 0.1
      phases[i] = Math.random() * Math.PI * 2

      const colorChoice = Math.random()
      if (colorChoice < 0.5) {
        colors[i * 3] = ivoryColor.r
        colors[i * 3 + 1] = ivoryColor.g
        colors[i * 3 + 2] = ivoryColor.b
      } else if (colorChoice < 0.8) {
        colors[i * 3] = goldColor.r
        colors[i * 3 + 1] = goldColor.g
        colors[i * 3 + 2] = goldColor.b
      } else {
        colors[i * 3] = oxidizedColor.r
        colors[i * 3 + 1] = oxidizedColor.g
        colors[i * 3 + 2] = oxidizedColor.b
      }

      velocities[i * 3] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('orbit', new THREE.BufferAttribute(orbits, 3))

    return geometry
  }, [])

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.5,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
      }),
    []
  )

  useEffect(() => {
    if (isActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true

      animationRef.current = gsap.timeline({ defaults: { ease: 'power2.out' } })

      animationRef.current
        .from(sculptureRef.current?.scale || { x: 0, y: 0, z: 0 }, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2.5,
          ease: 'elastic.out(1, 0.3)',
        })
        .from(
          ringsRef.current?.children[0]?.scale || { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, duration: 2, stagger: 0.2, ease: 'power2.out' },
          '-=1.5'
        )
        .from(
          particleMaterial,
          { opacity: 0, size: 0, duration: 2 },
          '-=1'
        )

      sound.playSequence([73.42, 98.00, 123.47, 146.83], 1500, 'sine', 0.08)
    }
  }, [isActive, sound, particleMaterial])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseInfluenceRef.current.x = (e.clientX - window.innerWidth / 2) / window.innerWidth
      mouseInfluenceRef.current.y = (e.clientY - window.innerHeight / 2) / window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    if (!isActive) return

    const time = state.clock.getElapsedTime()

    if (sculptureRef.current) {
      sculptureRef.current.rotation.y += 0.0003
      sculptureRef.current.rotation.x += 0.0002

      const targetRotY = mouseInfluenceRef.current.x * 0.3
      const targetRotX = -mouseInfluenceRef.current.y * 0.3

      sculptureRef.current.rotation.y += (targetRotY - sculptureRef.current.rotation.y) * 0.01
      sculptureRef.current.rotation.x += (targetRotX - sculptureRef.current.rotation.x) * 0.01

      const pos = sculptureRef.current.geometry.attributes.position
      const originalPos = (sculptureRef.current.geometry as any).originalPos || pos.array.slice()
      ;(sculptureRef.current.geometry as any).originalPos = originalPos

      for (let i = 0; i < pos.count; i++) {
        const x = originalPos[i * 3]
        const y = originalPos[i * 3 + 1]
        const z = originalPos[i * 3 + 2]

        const wave = Math.sin(x * 3 + time) * Math.cos(y * 3 + time * 1.3) * 0.05
        pos.setX(i, x + wave)
        pos.setY(i, y + wave)
        pos.setZ(i, z + wave)
      }

      pos.needsUpdate = true
      sculptureRef.current.geometry.computeVertexNormals()
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        if (ring instanceof THREE.Mesh) {
          ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.5 + i) * 0.2
          ring.rotation.z = Math.cos(time * 0.3 + i) * 0.1
          ring.scale.setScalar(1 + Math.sin(time + i) * 0.05)
          ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2 + i) * 0.1
        }
      })

      ringsRef.current.rotation.y += 0.0002
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const orbits = particlesRef.current.geometry.attributes.orbit.array as Float32Array
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array
      const phases = particlesRef.current.geometry.attributes.phase.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        const radius = orbits[i * 3]
        const theta = orbits[i * 3 + 1] + time * 0.0005 + velocities[i * 3] * delta * 60
        const phi = orbits[i * 3 + 2] + Math.sin(time + phases[i]) * 0.01

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + Math.sin(time * 0.5 + phases[i]) * 0.5
        positions[i * 3 + 2] = radius * Math.cos(phi)

        orbits[i * 3 + 1] = theta

        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        )

        alphas[i] = Math.max(0.1, Math.min(0.6, (1 - dist / 30) * 0.6 + Math.sin(time * 3 + phases[i]) * 0.1))
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true
      particlesRef.current.geometry.attributes.orbit.needsUpdate = true

      particlesRef.current.rotation.y += 0.00002
    }

    if (state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera
      camera.position.z = 20 + Math.sin(progress * Math.PI * 2) * 5
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <>
      <group ref={ringsRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            geometry={ringGeometry}
            material={ringMaterial.clone()}
            scale={4 + i * 1.5}
            rotation={[Math.PI / 2, 0, 0]}
          />
        ))}
      </group>

      <mesh
        ref={sculptureRef}
        geometry={sculptureGeometry}
        material={sculptureMaterial}
        castShadow
        receiveShadow
        scale={0.001}
      >
        <pointLight color={0xf5f0e8} intensity={1} distance={20} decay={2} />
      </mesh>

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      <Html
        transform
        position={[0, 10, 0]}
        sprite
        distanceFactor={5}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-editorial text-display-md text-ivory text-center leading-tight tracking-tight pointer-events-none"
          style={{
            opacity: isActive ? 1 : 0,
            transform: 'translateY(40px)',
            filter: 'drop-shadow(0 0 40px rgba(245, 240, 232, 0.5))',
            maxWidth: '80vw',
            padding: '0 2rem',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
          }}
        >
          THE ORACLE
        </div>
      </Html>

      <Html
        transform
        position={[0, 7, 0]}
        sprite
        distanceFactor={5}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-sans text-body-sm text-oxidized-light text-center pointer-events-none max-w-md mx-auto leading-relaxed"
          style={{
            opacity: isActive ? 0.7 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 1.5s ease 0.5s, transform 1.5s ease 0.5s',
          }}
        >
          An interactive digital installation featuring a floating marble sculpture suspended in an infinite black environment.
        </div>
      </Html>
    </>
  )
}