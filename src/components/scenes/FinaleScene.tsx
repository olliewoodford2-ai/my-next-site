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

export function FinaleScene() {
  const { isActive } = useSceneContext()
  const { progress } = useSceneProgress()
  const { targetX, targetY } = useCustomCursor()
  const sound = useSoundManager()

  const structureRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const goldenParticlesRef = useRef<THREE.Points>(null)
  const cameraRef = useRef<THREE.Camera>()
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)
  const isFracturingRef = useRef(false)

  const structureGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    for (let i = 0; i < 20; i++) {
      const height = 3 + Math.random() * 10
      const width = 1.5 + Math.random() * 2
      const depth = 1.5 + Math.random() * 2

      const geo = new THREE.BoxGeometry(width, height, depth, 4, 8, 4)
      const pos = geo.attributes.position

      for (let j = 0; j < pos.count; j++) {
        const y = pos.getY(j)
        const displacement = Math.sin(y * 0.3 + i) * 0.2
        pos.setX(j, pos.getX(j) + displacement)
        pos.setZ(j, pos.getZ(j) + displacement)
      }

      geo.translate(
        (Math.random() - 0.5) * 20,
        height / 2,
        (Math.random() - 0.5) * 20
      )

      geometries.push(geo)

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0, 0, 0.08 + Math.random() * 0.05),
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
      })
      materials.push(mat)
    }

    const merged = mergeGeometries(geometries, false)
    return { geometry: merged!, materials }
  }, [])

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 15000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const originalPositions = new Float32Array(count * 3)

    const obsidianColor = new THREE.Color(0x0a0a0a)
    const oxidizedColor = new THREE.Color(0x7a7a8a)

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      originalPositions[i * 3] = positions[i * 3]
      originalPositions[i * 3 + 1] = positions[i * 3 + 1]
      originalPositions[i * 3 + 2] = positions[i * 3 + 2]

      sizes[i] = Math.random() * 2 + 0.5
      alphas[i] = Math.random() * 0.5 + 0.1
      phases[i] = Math.random() * Math.PI * 2

      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        colors[i * 3] = obsidianColor.r
        colors[i * 3 + 1] = obsidianColor.g
        colors[i * 3 + 2] = obsidianColor.b
      } else {
        colors[i * 3] = oxidizedColor.r
        colors[i * 3 + 1] = oxidizedColor.g
        colors[i * 3 + 2] = oxidizedColor.b
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
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3))

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

  const goldenParticleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 20000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const life = new Float32Array(count)
    const maxLife = new Float32Array(count)

    const goldColor = new THREE.Color(0xc9a84c)
    const lightGoldColor = new THREE.Color(0xe8d4a0)
    const shimmerColor = new THREE.Color(0xffd700)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      sizes[i] = Math.random() * 3 + 1
      alphas[i] = 0
      life[i] = 0
      maxLife[i] = 2 + Math.random() * 4

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

      velocities[i * 3] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = Math.random() * 0.5 + 0.2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('life', new THREE.BufferAttribute(life, 1))
    geometry.setAttribute('maxLife', new THREE.BufferAttribute(maxLife, 1))

    return geometry
  }, [])

  const goldenParticleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 3,
        transparent: true,
        opacity: 1,
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
        .from(structureRef.current?.children[0]?.scale || { x: 0, y: 0, z: 0 }, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2,
          stagger: 0.05,
          ease: 'elastic.out(1, 0.5)',
        })
        .from(
          particleMaterial,
          { opacity: 0, size: 0, duration: 2 },
          '-=1.5'
        )
        .to({}, {
          duration: 1,
          onComplete: () => {
            isFracturingRef.current = true
            sound.playSequence([146.83, 196.00, 220.00, 293.66], 500, 'triangle', 0.15)
          }
        })

      sound.playSequence([146.83, 196.00, 220.00, 293.66], 1000, 'triangle', 0.1)
    }
  }, [isActive, sound, particleMaterial])

  useFrame((state, delta) => {
    if (!isActive) return

    const time = state.clock.getElapsedTime()
    const fracturing = isFracturingRef.current

    if (structureRef.current && fracturing) {
      structureRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.position.y += delta * 10 * (i % 3 + 1)
          child.rotation.x += delta * (Math.random() - 0.5) * 2
          child.rotation.y += delta * (Math.random() - 0.5) * 2
          child.rotation.z += delta * (Math.random() - 0.5) * 2
          child.scale.multiplyScalar(0.99)

          if (child.position.y > 50) {
            child.visible = false
          }
        }
      })
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
      const alphas = particlesRef.current.geometry.attributes.alpha.array as Float32Array
      const phases = particlesRef.current.geometry.attributes.phase.array as Float32Array
      const originalPositions = particlesRef.current.geometry.attributes.originalPosition.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        if (fracturing) {
          positions[i * 3] += velocities[i * 3] * delta * 60 * 5
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60 * 5
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60 * 5

          positions[i * 3 + 1] += Math.sin(time * 3 + phases[i]) * 0.1
        } else {
          positions[i * 3] += velocities[i * 3] * delta * 60
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60 + Math.sin(time + phases[i]) * 0.02
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60

          const distToOriginal = Math.sqrt(
            (positions[i * 3] - originalPositions[i * 3]) ** 2 +
            (positions[i * 3 + 1] - originalPositions[i * 3 + 1]) ** 2 +
            (positions[i * 3 + 2] - originalPositions[i * 3 + 2]) ** 2
          )

          if (distToOriginal > 5) {
            positions[i * 3] += (originalPositions[i * 3] - positions[i * 3]) * 0.01
            positions[i * 3 + 1] += (originalPositions[i * 3 + 1] - positions[i * 3 + 1]) * 0.01
            positions[i * 3 + 2] += (originalPositions[i * 3 + 2] - positions[i * 3 + 2]) * 0.01
          }
        }

        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        )

        if (fracturing) {
          alphas[i] = Math.max(0, alphas[i] - delta * 0.5)
        } else {
          alphas[i] = Math.max(0.1, Math.min(0.8, (1 - dist / 40) * 0.8))
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true

      particlesRef.current.rotation.y += 0.00001
    }

    if (goldenParticlesRef.current && fracturing) {
      const positions = goldenParticlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = goldenParticlesRef.current.geometry.attributes.velocity.array as Float32Array
      const alphas = goldenParticlesRef.current.geometry.attributes.alpha.array as Float32Array
      const life = goldenParticlesRef.current.geometry.attributes.life.array as Float32Array
      const maxLife = goldenParticlesRef.current.geometry.attributes.maxLife.array as Float32Array
      const sizes = goldenParticlesRef.current.geometry.attributes.size.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        if (life[i] > 0) {
          positions[i * 3] += velocities[i * 3] * delta * 60
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60 - 0.5 * delta * 60
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60

          velocities[i * 3 + 1] -= 0.01 * delta * 60

          life[i] -= delta

          const lifeRatio = life[i] / maxLife[i]
          alphas[i] = lifeRatio * 0.8
          sizes[i] = sizes[i] * (0.5 + lifeRatio * 0.5)

          if (life[i] <= 0) {
            alphas[i] = 0
            positions[i * 3] = (Math.random() - 0.5) * 10
            positions[i * 3 + 1] = 0
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10
            velocities[i * 3] = (Math.random() - 0.5) * 0.5
            velocities[i * 3 + 1] = Math.random() * 0.5 + 0.2
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
            life[i] = maxLife[i]
          }
        } else if (Math.random() < 0.01) {
          life[i] = maxLife[i]
          positions[i * 3] = (Math.random() - 0.5) * 10
          positions[i * 3 + 1] = 0
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10
        }
      }

      goldenParticlesRef.current.geometry.attributes.position.needsUpdate = true
      goldenParticlesRef.current.geometry.attributes.alpha.needsUpdate = true
      goldenParticlesRef.current.geometry.attributes.size.needsUpdate = true
      goldenParticlesRef.current.geometry.attributes.life.needsUpdate = true
    }

    if (cameraRef.current && state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera
      camera.position.z = 30 + progress * 20
      camera.position.y = Math.sin(progress * Math.PI * 2) * 5
      camera.lookAt(0, 10, 0)
    }
  })

  return (
    <>
      <group ref={structureRef}>
        {structureGeometry.materials.map((material, i) => (
          <mesh
            key={i}
            geometry={structureGeometry.geometry}
            material={material}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      <points
        ref={goldenParticlesRef}
        geometry={goldenParticleGeometry}
        material={goldenParticleMaterial}
      />

      <Html
        transform
        position={[0, 25, 0]}
        sprite
        distanceFactor={3}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-editorial text-display-lg text-ivory text-center leading-tight tracking-tight pointer-events-none gold-gradient-text"
          style={{
            opacity: isActive && isFracturingRef.current ? 1 : 0,
            transform: 'translateY(40px)',
            filter: 'drop-shadow(0 0 80px rgba(201, 168, 76, 0.8))',
            maxWidth: '90vw',
            padding: '0 2rem',
            transition: 'opacity 2s ease, transform 2s ease',
          }}
        >
          MAKE SOMETHING THAT SHOULD NOT EXIST.
        </div>
      </Html>

      <Html
        transform
        position={[0, 18, 0]}
        sprite
        distanceFactor={3}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-editorial text-display-sm text-ivory text-center leading-snug tracking-tight pointer-events-none"
          style={{
            opacity: isActive && isFracturingRef.current ? 0.9 : 0,
            transform: 'translateY(30px)',
            transition: 'opacity 2s ease 0.5s, transform 2s ease 0.5s',
          }}
        >
          DIVINUM®
        </div>
      </Html>

      <Html
        transform
        position={[0, 14, 0]}
        sprite
        distanceFactor={3}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-sans text-caption text-oxidized-light text-center pointer-events-none"
          style={{
            opacity: isActive && isFracturingRef.current ? 0.7 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 2s ease 1s, transform 2s ease 1s',
            letterSpacing: '0.2em',
          }}
        >
          Independent Creative Studio
        </div>
      </Html>

      <Html
        transform
        position={[0, 11, 0]}
        sprite
        distanceFactor={3}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-sans text-micro text-gold text-center pointer-events-none"
          style={{
            opacity: isActive && isFracturingRef.current ? 0.6 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 2s ease 1.5s, transform 2s ease 1.5s',
            letterSpacing: '0.3em',
          }}
        >
          London · Everywhere
        </div>
      </Html>

      <Html
        transform
        position={[0, 5, 0]}
        sprite
        distanceFactor={3}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <a
          href="mailto:studio@divinum.studio"
          className="font-sans text-body-sm text-gold text-center pointer-events-auto hover:text-gold-light transition-colors duration-300 underline decoration-gold/30 underline-offset-4"
          style={{
            opacity: isActive && isFracturingRef.current ? 0.8 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 2s ease 2s, transform 2s ease 2s',
          }}
        >
          Contact Studio
        </a>
      </Html>
    </>
  )
}