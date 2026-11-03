'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useSceneContext, useSceneProgress } from '@/components/three/ThreeCanvas'
import { useCustomCursor } from '@/hooks/useCustomCursor'
import { useSoundManager } from '@/hooks/useSoundManager'

export function AfterimageScene() {
  const { isActive } = useSceneContext()
  const { progress } = useSceneProgress()
  const { targetX, targetY } = useCustomCursor()
  const sound = useSoundManager()

  const prismRef = useRef<THREE.Mesh>(null)
  const distortionRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const lightRaysRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.Camera>()
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget>()

  const prismGeometry = useMemo(() => new THREE.OctahedronGeometry(4, 4), [])

  const prismMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x1a1a2e,
        metalness: 0.8,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 3,
        transmission: 0.95,
        thickness: 1,
        ior: 2.4,
        reflectivity: 1,
        side: THREE.DoubleSide,
      }),
    []
  )

  const distortionGeometry = useMemo(() => new THREE.SphereGeometry(15, 128, 128), [])

  const distortionMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 12000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const types = new Float32Array(count)

    const ivoryColor = new THREE.Color(0xf5f0e8)
    const goldColor = new THREE.Color(0xc9a84c)
    const crimsonColor = new THREE.Color(0x8b1a1a)
    const oxidizedColor = new THREE.Color(0x7a7a8a)

    for (let i = 0; i < count; i++) {
      const type = Math.random()
      types[i] = type

      if (type < 0.3) {
        const radius = 2 + Math.random() * 8
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)
      } else if (type < 0.6) {
        const radius = 10 + Math.random() * 20
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 60
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      }

      sizes[i] = Math.random() * 2 + 0.2
      alphas[i] = Math.random() * 0.5 + 0.05
      phases[i] = Math.random() * Math.PI * 2

      const colorChoice = Math.random()
      if (colorChoice < 0.3) {
        colors[i * 3] = ivoryColor.r
        colors[i * 3 + 1] = ivoryColor.g
        colors[i * 3 + 2] = ivoryColor.b
      } else if (colorChoice < 0.55) {
        colors[i * 3] = goldColor.r
        colors[i * 3 + 1] = goldColor.g
        colors[i * 3 + 2] = goldColor.b
      } else if (colorChoice < 0.75) {
        colors[i * 3] = crimsonColor.r
        colors[i * 3 + 1] = crimsonColor.g
        colors[i * 3 + 2] = crimsonColor.b
      } else {
        colors[i * 3] = oxidizedColor.r
        colors[i * 3 + 1] = oxidizedColor.g
        colors[i * 3 + 2] = oxidizedColor.b
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
    geometry.setAttribute('type', new THREE.BufferAttribute(types, 1))

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

  const lightRayGeometry = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.5, 30, 8, 1, true)
    return geometry
  }, [])

  const lightRayMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useEffect(() => {
    if (isActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true

      animationRef.current = gsap.timeline({ defaults: { ease: 'power2.out' } })

      animationRef.current
        .from(prismRef.current?.scale || { x: 0, y: 0, z: 0 }, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2,
          ease: 'elastic.out(1, 0.4)',
        })
        .from(
          distortionRef.current?.scale || { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, duration: 2.5, ease: 'power2.out' },
          '-=1.5'
        )
        .from(
          particleMaterial,
          { opacity: 0, size: 0, duration: 2 },
          '-=1'
        )
        .from(
          lightRaysRef.current?.children[0]?.scale || { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, duration: 2, stagger: 0.1, ease: 'power2.out' },
          '-=1.5'
        )

      sound.playSequence([87.31, 116.54, 138.59, 174.61], 1200, 'sine', 0.08)
    }
  }, [isActive, sound, particleMaterial])

  useFrame((state, delta) => {
    if (!isActive) return

    const time = state.clock.getElapsedTime()

    if (prismRef.current) {
      prismRef.current.rotation.x += 0.001
      prismRef.current.rotation.y += 0.0015
      prismRef.current.rotation.z += 0.0008

      const mouseX = (targetX - window.innerWidth / 2) / window.innerWidth
      const mouseY = (targetY - window.innerHeight / 2) / window.innerHeight

      prismRef.current.position.x += (mouseX * 2 - prismRef.current.position.x) * 0.01
      prismRef.current.position.y += (-mouseY * 2 - prismRef.current.position.y) * 0.01

      const pos = prismRef.current.geometry.attributes.position
      const originalPos = (prismRef.current.geometry as any).originalPos || pos.array.slice()
      ;(prismRef.current.geometry as any).originalPos = originalPos

      for (let i = 0; i < pos.count; i++) {
        const x = originalPos[i * 3]
        const y = originalPos[i * 3 + 1]
        const z = originalPos[i * 3 + 2]

        const distortion = Math.sin(x * 2 + time * 3) * Math.cos(y * 2 + time * 2.5) * 0.08
        pos.setX(i, x + distortion)
        pos.setY(i, y + distortion)
        pos.setZ(i, z + distortion)
      }

      pos.needsUpdate = true
      prismRef.current.geometry.computeVertexNormals()
    }

    if (distortionRef.current) {
      distortionRef.current.rotation.y += 0.0001

      const pos = distortionRef.current.geometry.attributes.position
      const originalPos = (distortionRef.current.geometry as any).originalPos || pos.array.slice()
      ;(distortionRef.current.geometry as any).originalPos = originalPos

      for (let i = 0; i < pos.count; i++) {
        const x = originalPos[i * 3]
        const y = originalPos[i * 3 + 1]
        const z = originalPos[i * 3 + 2]

        const wave1 = Math.sin(x * 0.3 + time) * 0.5
        const wave2 = Math.cos(y * 0.3 + time * 1.2) * 0.5
        const wave3 = Math.sin(z * 0.3 + time * 0.8) * 0.5

        pos.setX(i, x + wave1)
        pos.setY(i, y + wave2)
        pos.setZ(i, z + wave3)
      }

      pos.needsUpdate = true
      ;(distortionRef.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(time * 2) * 0.03
    }

    if (lightRaysRef.current) {
      lightRaysRef.current.children.forEach((ray, i) => {
        if (ray instanceof THREE.Mesh) {
          ray.rotation.z = Math.sin(time * 0.5 + i) * 0.3
          ray.rotation.x = Math.cos(time * 0.3 + i) * 0.2
          ray.scale.y = 0.5 + Math.sin(time + i) * 0.3
          ;(ray.material as THREE.MeshBasicMaterial).opacity = 0.02 + Math.sin(time * 1.5 + i) * 0.03
        }
      })
      lightRaysRef.current.rotation.y += 0.0002
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array
      const phases = particlesRef.current.geometry.attributes.phase.array as Float32Array
      const types = particlesRef.current.geometry.attributes.type.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        const type = types[i]

        positions[i * 3] += velocities[i * 3] * delta * 60
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60

        if (type < 0.3) {
          positions[i * 3 + 1] += Math.sin(time * 2 + phases[i]) * 0.02
        } else if (type < 0.6) {
          positions[i * 3] += Math.cos(time + phases[i]) * 0.01
          positions[i * 3 + 2] += Math.sin(time * 0.8 + phases[i]) * 0.01
        } else {
          positions[i * 3 + 1] -= 0.01
        }

        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        )

        if (dist > 40 || positions[i * 3 + 1] < -30) {
          const newType = Math.random()
          types[i] = newType

          if (newType < 0.3) {
            const radius = 2 + Math.random() * 8
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)
          } else if (newType < 0.6) {
            const radius = 10 + Math.random() * 20
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)
          } else {
            positions[i * 3] = (Math.random() - 0.5) * 60
            positions[i * 3 + 1] = 30
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60
          }
        }

        alphas[i] = Math.max(0.05, Math.min(0.8, (1 - dist / 40) * 0.8 + Math.sin(time * 3 + phases[i]) * 0.1))
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true
      particlesRef.current.geometry.attributes.type.needsUpdate = true

      particlesRef.current.rotation.y += 0.00001
    }

    if (cameraRef.current && state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera
      camera.position.z = 25 + Math.sin(progress * Math.PI * 4) * 5
      camera.rotation.z = Math.sin(progress * Math.PI * 2) * 0.05
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <>
      <group ref={lightRaysRef}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            geometry={lightRayGeometry}
            material={lightRayMaterial.clone()}
            position={[Math.cos((i / 12) * Math.PI * 2) * 8, 0, Math.sin((i / 12) * Math.PI * 2) * 8]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1}
          />
        ))}
      </group>

      <mesh
        ref={distortionRef}
        geometry={distortionGeometry}
        material={distortionMaterial}
        scale={0.001}
      />

      <mesh
        ref={prismRef}
        geometry={prismGeometry}
        material={prismMaterial}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        scale={0.001}
      >
        <pointLight color={0xc9a84c} intensity={2} distance={30} decay={2} />
        <pointLight color={0x8b1a1a} intensity={1} distance={20} decay={2} position={[5, 5, 5]} />
      </mesh>

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      <Html
        transform
        position={[0, 12, 0]}
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
            filter: 'drop-shadow(0 0 40px rgba(139, 26, 26, 0.5))',
            maxWidth: '80vw',
            padding: '0 2rem',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
          }}
        >
          THE AFTERIMAGE
        </div>
      </Html>

      <Html
        transform
        position={[0, 9, 0]}
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
          A cinematic exploration of memory, light and distorted reality.
        </div>
      </Html>
    </>
  )
}