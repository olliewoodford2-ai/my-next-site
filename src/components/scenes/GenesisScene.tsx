'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { gsap } from 'gsap'
import { useSceneContext, useSceneProgress } from '@/components/three/ThreeCanvas'
import { useCustomCursor } from '@/hooks/useCustomCursor'
import { useSoundManager } from '@/hooks/useSoundManager'

export function GenesisScene() {
  const { isActive } = useSceneContext()
  const { progress } = useSceneProgress()
  const { targetX, targetY } = useCustomCursor()
  const sound = useSoundManager()

  const architectureRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const cameraRef = useRef<THREE.Camera>()
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)

  const architectureGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    for (let i = 0; i < 15; i++) {
      const height = 5 + Math.random() * 20
      const width = 1 + Math.random() * 3
      const depth = 1 + Math.random() * 3

      const geo = new THREE.BoxGeometry(width, height, depth, 4, 16, 4)
      const pos = geo.attributes.position

      for (let j = 0; j < pos.count; j++) {
        const y = pos.getY(j)
        const displacement = Math.sin(y * 0.5 + i) * 0.3 * Math.random()
        pos.setX(j, pos.getX(j) + displacement)
        pos.setZ(j, pos.getZ(j) + displacement)
      }

      geo.translate(
        (Math.random() - 0.5) * 40,
        height / 2 - 5,
        (Math.random() - 0.5) * 40
      )

      geometries.push(geo)

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0, 0, 0.15 + Math.random() * 0.1),
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 2,
      })
      materials.push(mat)
    }

    const merged = mergeGeometries(geometries, false)
    return { geometry: merged!, materials }
  }, [])

  const liquidGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(8, 128, 128)
    const pos = geometry.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const noise = Math.sin(x * 2) * Math.cos(y * 2) * Math.sin(z * 2) * 0.5
      pos.setX(i, x + noise)
      pos.setY(i, y + noise)
      pos.setZ(i, z + noise)
    }

    return geometry
  }, [])

  const liquidMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x7a7a8a,
        metalness: 1,
        roughness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0,
        envMapIntensity: 3,
        transmission: 0.9,
        thickness: 2,
        ior: 1.33,
        reflectivity: 1,
        side: THREE.DoubleSide,
      }),
    []
  )

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 8000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    const chromeColor = new THREE.Color(0x7a7a8a)
    const goldColor = new THREE.Color(0xc9a84c)
    const silverColor = new THREE.Color(0xb0b0c0)

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 30
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 3 + 0.5
      alphas[i] = Math.random() * 0.5 + 0.1
      phases[i] = Math.random() * Math.PI * 2

      const colorChoice = Math.random()
      if (colorChoice < 0.4) {
        colors[i * 3] = chromeColor.r
        colors[i * 3 + 1] = chromeColor.g
        colors[i * 3 + 2] = chromeColor.b
      } else if (colorChoice < 0.7) {
        colors[i * 3] = goldColor.r
        colors[i * 3 + 1] = goldColor.g
        colors[i * 3 + 2] = goldColor.b
      } else {
        colors[i * 3] = silverColor.r
        colors[i * 3 + 1] = silverColor.g
        colors[i * 3 + 2] = silverColor.b
      }

      velocities[i * 3] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

    return geometry
  }, [])

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2,
        transparent: true,
        opacity: 0.7,
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
        .from(architectureRef.current?.children[0]?.scale || { x: 0, y: 0, z: 0 }, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2,
          stagger: 0.1,
          ease: 'elastic.out(1, 0.5)',
        })
        .from(
          liquidRef.current?.scale || { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, duration: 3, ease: 'power2.out' },
          '-=1.5'
        )
        .from(
          particleMaterial,
          { opacity: 0, size: 0, duration: 2 },
          '-=1'
        )

      sound.playSequence([130.81, 174.61, 196.00, 261.63], 1000, 'triangle', 0.1)
    }
  }, [isActive, sound, particleMaterial])

  useFrame((state, delta) => {
    if (!isActive) return

    const time = state.clock.getElapsedTime()

    if (architectureRef.current) {
      architectureRef.current.rotation.y += 0.0001
      architectureRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.y = Math.sin(time * 0.2 + i) * 0.02
        }
      })
    }

    if (liquidRef.current) {
      liquidRef.current.rotation.y += 0.0005
      liquidRef.current.rotation.x += 0.0003

      const pos = liquidRef.current.geometry.attributes.position
      const originalPos = (liquidRef.current.geometry as any).originalPos || pos.array.slice()
      ;(liquidRef.current.geometry as any).originalPos = originalPos

      for (let i = 0; i < pos.count; i++) {
        const x = originalPos[i * 3]
        const y = originalPos[i * 3 + 1]
        const z = originalPos[i * 3 + 2]

        const wave1 = Math.sin(x * 0.5 + time * 2) * 0.3
        const wave2 = Math.cos(y * 0.5 + time * 1.5) * 0.2
        const wave3 = Math.sin(z * 0.5 + time * 1.8) * 0.25

        pos.setX(i, x + wave1 + wave2)
        pos.setY(i, y + wave2 + wave3)
        pos.setZ(i, z + wave3 + wave1)
      }

      pos.needsUpdate = true
      liquidRef.current.geometry.computeVertexNormals()
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array
      const phases = particlesRef.current.geometry.attributes.phase.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * delta * 60
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60 + Math.sin(time + phases[i]) * 0.01
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60

        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        )

        if (dist > 40) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const radius = 5 + Math.random() * 10

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
          positions[i * 3 + 2] = radius * Math.cos(phi)
        }

        alphas[i] = Math.max(0.1, Math.min(0.8, (1 - dist / 40) * 0.8 + Math.sin(time * 2 + phases[i]) * 0.1))
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true

      particlesRef.current.rotation.y += 0.00003
    }

    if (cameraRef.current && state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera
      camera.position.y = 5 + Math.sin(progress * Math.PI * 2) * 3
      camera.position.z = 25 - progress * 10
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <>
      <group ref={architectureRef}>
        {architectureGeometry.materials.map((material, i) => (
          <mesh
            key={i}
            geometry={architectureGeometry.geometry}
            material={material}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      <mesh
        ref={liquidRef}
        geometry={liquidGeometry}
        material={liquidMaterial}
        castShadow
        receiveShadow
        position={[0, 2, 0]}
        scale={0.001}
      />

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      <Html
        transform
        position={[0, 15, 0]}
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
            filter: 'drop-shadow(0 0 40px rgba(122, 122, 138, 0.5))',
            maxWidth: '80vw',
            padding: '0 2rem',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
          }}
        >
          THE GENESIS
        </div>
      </Html>

      <Html
        transform
        position={[0, 12, 0]}
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
          A surreal fashion film featuring liquid chrome, monumental architecture and impossible landscapes.
        </div>
      </Html>
    </>
  )
}