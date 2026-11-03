'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useSceneContext, useSceneProgress } from '@/components/three/ThreeCanvas'
import { useCustomCursor } from '@/hooks/useCustomCursor'
import { useSoundManager } from '@/hooks/useSoundManager'

export function HeroScene() {
  const { isActive } = useSceneContext()
  const { progress, globalProgress } = useSceneProgress()
  const { targetX, targetY } = useCustomCursor()
  const sound = useSoundManager()

  const pearRef = useRef<THREE.Group>(null)
  const pearlGroupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const volumeLightRef = useRef<THREE.Mesh>(null)
  const cameraRef = useRef<THREE.Camera>()
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)

  const pearGeometry = useMemo(() => new THREE.SphereGeometry(2, 128, 128), [])
  const pearMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a84c,
        metalness: 0.7,
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        iridescence: 0.3,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [100, 400],
        reflectivity: 1,
        envMapIntensity: 2,
        transmission: 0.1,
        thickness: 0.5,
      }),
    []
  )

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 5000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    const goldColor = new THREE.Color(0xc9a84c)
    const lightGoldColor = new THREE.Color(0xe8d4a0)
    const shimmerColor = new THREE.Color(0xffd700)

    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 2 + 0.5
      alphas[i] = Math.random() * 0.4 + 0.05

      const colorChoice = Math.random()
      if (colorChoice < 0.4) {
        colors[i * 3] = goldColor.r
        colors[i * 3 + 1] = goldColor.g
        colors[i * 3 + 2] = goldColor.b
      } else if (colorChoice < 0.7) {
        colors[i * 3] = lightGoldColor.r
        colors[i * 3 + 1] = lightGoldColor.g
        colors[i * 3 + 2] = lightGoldColor.b
      } else {
        colors[i * 3] = shimmerColor.r
        colors[i * 3 + 1] = shimmerColor.g
        colors[i * 3 + 2] = shimmerColor.b
      }

      velocities[i * 3] = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    return geometry
  }, [])

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
      }),
    []
  )

  const volumeGeometry = useMemo(() => new THREE.SphereGeometry(8, 64, 64), [])
  const volumeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.02,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  )

  useEffect(() => {
    if (isActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true

      animationRef.current = gsap.timeline({ defaults: { ease: 'power2.out' } })

      animationRef.current
        .from(pearRef.current?.scale || { x: 0, y: 0, z: 0 }, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2,
          ease: 'elastic.out(1, 0.5)',
        })
        .from(
          volumeLightRef.current?.scale || { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.out' },
          '-=1.5'
        )
        .from(
          particleMaterial,
          { opacity: 0, size: 0, duration: 2 },
          '-=1.5'
        )

      sound.playSequence([110.00, 146.83, 164.81, 220.00], 1000, 'sine', 0.08)
    }
  }, [isActive, sound, particleMaterial])

  useFrame((state, delta) => {
    if (!isActive && globalProgress < 0.15) return

    const time = state.clock.getElapsedTime()
    const sceneProgress = progress

    if (pearRef.current) {
      const mouseX = (targetX - window.innerWidth / 2) / window.innerWidth
      const mouseY = (targetY - window.innerHeight / 2) / window.innerHeight

      pearRef.current.position.x += (mouseX * 1 - pearRef.current.position.x) * 0.01
      pearRef.current.position.y += (-mouseY * 1 - pearRef.current.position.y) * 0.01

      pearRef.current.rotation.x += 0.0005
      pearRef.current.rotation.y += 0.001
      pearRef.current.rotation.z += 0.0003
    }

    if (pearlGroupRef.current) {
      pearlGroupRef.current.rotation.y = sceneProgress * Math.PI * 2
    }

    if (volumeLightRef.current) {
      volumeLightRef.current.scale.setScalar(1 + Math.sin(time * 0.3) * 0.1)
      volumeLightRef.current.rotation.y += 0.0002
      volumeLightRef.current.rotation.x += 0.0001
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * delta * 60
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60

        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        )

        if (dist > 20) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const radius = 3 + Math.random() * 5

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
          positions[i * 3 + 2] = radius * Math.cos(phi)
        }

        alphas[i] = Math.max(0.05, Math.min(0.6, (1 - dist / 20) * 0.6))
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true

      particlesRef.current.rotation.y += 0.00005
    }

    if (state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera
      camera.position.z = 15 - sceneProgress * 5
      camera.position.y = Math.sin(sceneProgress * Math.PI) * 2
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <>
      <group ref={pearlGroupRef}>
        <mesh
          ref={volumeLightRef}
          geometry={volumeGeometry}
          material={volumeMaterial}
        />

        <group ref={pearRef} scale={0.001}>
          <mesh
            geometry={pearGeometry}
            material={pearMaterial}
            castShadow
            receiveShadow
          />

          <pointLight
            color={0xc9a84c}
            intensity={2}
            distance={30}
            decay={2}
            position={[0, 0, 0]}
          />

          <pointLight
            color={0xffd700}
            intensity={1}
            distance={20}
            decay={2}
            position={[3, 3, 3]}
          />
        </group>

        <points
          ref={particlesRef}
          geometry={particleGeometry}
          material={particleMaterial}
        />
      </group>

      <Html
        transform
        position={[0, 5, 0]}
        sprite
        distanceFactor={5}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-editorial text-display-lg text-ivory text-center leading-tight tracking-tight pointer-events-none gold-gradient-text"
          style={{
            opacity: isActive ? 1 : 0,
            transform: 'translateY(40px)',
            filter: 'drop-shadow(0 0 60px rgba(201, 168, 76, 0.5))',
            maxWidth: '90vw',
            padding: '0 2rem',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
          }}
        >
          DIVINUM
        </div>
      </Html>

      <Html
        transform
        position={[0, -5.5, 0]}
        sprite
        distanceFactor={5}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-sans text-caption text-oxidized-light text-center pointer-events-none"
          style={{
            opacity: isActive ? 0.7 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 1.5s ease 0.5s, transform 1.5s ease 0.5s',
            letterSpacing: '0.3em',
          }}
        >
          Independent Creative Studio
        </div>
      </Html>
    </>
  )
}