'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useSceneContext, useSceneProgress } from '@/components/three/ThreeCanvas'
import { useCustomCursor } from '@/hooks/useCustomCursor'
import { useSoundManager } from '@/hooks/useSoundManager'

export function OpeningScene() {
  const { isActive } = useSceneContext()
  const { progress } = useSceneProgress()
  const { targetX, targetY } = useCustomCursor()
  const sound = useSoundManager()

  const pearlRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Timeline>()
  const hasAnimatedRef = useRef(false)

  const pearlGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 64, 64), [])
  const pearlMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x8b8b8b,
        metalness: 1,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        reflectivity: 1,
        envMapIntensity: 2,
      }),
    []
  )

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 2000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 3 + 1
      alphas[i] = Math.random() * 0.5 + 0.1

      velocities[i * 3] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    return geometry
  }, [])

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0xc9a84c,
        size: 2,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
        sizeAttenuation: true,
      }),
    []
  )

  useEffect(() => {
    if (isActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true

      animationRef.current = gsap.timeline({ defaults: { ease: 'power2.out' } })

      animationRef.current
        .to(pearlRef.current?.scale || { x: 0, y: 0, z: 0 }, {
          x: 1,
          y: 1,
          z: 1,
          duration: 2,
          ease: 'elastic.out(1, 0.5)',
        })
        .to(
          { r: 8 / 15, g: 8 / 15, b: 8 / 15, metalness: 1, roughness: 0.1 },
          {
            r: 201 / 255,
            g: 168 / 255,
            b: 76 / 255,
            metalness: 0.8,
            roughness: 0.2,
            duration: 3,
            onUpdate: function () {
              const target = this.targets()[0]
              if (pearlMaterial) {
                pearlMaterial.color.setRGB(target.r, target.g, target.b)
                pearlMaterial.metalness = target.metalness
                pearlMaterial.roughness = target.roughness
              }
            },
          },
          '-=1'
        )
        .to(
          particleMaterial,
          {
            opacity: 0.8,
            size: 4,
            duration: 2,
          },
          '-=2'
        )
        .to(
          { value: 0 },
          {
            value: 2,
            duration: 2,
            onUpdate: function () {
              if (lightRef.current) lightRef.current.intensity = this.targets()[0].value
            },
          },
          '-=2'
        )

      sound.playSequence([65.41, 82.41, 98.00, 130.81], 800, 'sine', 0.1)
    }
  }, [isActive, sound, pearlMaterial, particleMaterial])

  useFrame((state, delta) => {
    if (!isActive) return

    const time = state.clock.getElapsedTime()

    if (pearlRef.current) {
      const mouseX = (targetX - window.innerWidth / 2) / window.innerWidth
      const mouseY = (targetY - window.innerHeight / 2) / window.innerHeight

      pearlRef.current.position.x += (mouseX * 0.5 - pearlRef.current.position.x) * 0.02
      pearlRef.current.position.y += (-mouseY * 0.5 - pearlRef.current.position.y) * 0.02

      pearlRef.current.rotation.x += 0.001
      pearlRef.current.rotation.y += 0.002
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

        if (dist > 15) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const radius = 2 + Math.random() * 3

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
          positions[i * 3 + 2] = radius * Math.cos(phi)
        }

        alphas[i] = Math.max(0.1, Math.min(1, 1 - dist / 15))
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.alpha.needsUpdate = true

      particlesRef.current.rotation.y += 0.0001
    }

    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(time * 0.5) * 0.3
    }
  })

  useEffect(() => {
    const textEl = textRef.current
    if (!textEl) return

    if (isActive && progress > 0.3) {
      gsap.to(textEl, {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: 'power2.out',
      })
    } else {
      gsap.set(textEl, { opacity: 0, y: 40 })
    }
  }, [isActive, progress])

  return (
    <>
      <group ref={pearlRef} scale={0.001}>
        <mesh
          geometry={pearlGeometry}
          material={pearlMaterial}
          castShadow
          receiveShadow
        />
        <pointLight
          ref={lightRef}
          color={0xc9a84c}
          intensity={0}
          distance={10}
          decay={2}
        />
      </group>

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      <Html
        transform
        sprite
        distanceFactor={10}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          ref={textRef}
          className="font-editorial text-display-xl text-ivory text-center leading-tight tracking-tight pointer-events-none"
          style={{
            opacity: 0,
            transform: 'translateY(40px)',
            textShadow: '0 0 60px rgba(201, 168, 76, 0.5)',
            maxWidth: '80vw',
            padding: '0 2rem',
          }}
        >
          EVERYTHING BEAUTIFUL BEGINS WITH AN IMPOSSIBILITY.
        </div>
      </Html>

      <Html
        transform
        position={[0, -3, 0]}
        sprite
        distanceFactor={10}
        zIndexRange={[100, 200]}
        fullscreen
      >
        <div
          className="font-sans text-micro text-gold text-center pointer-events-none opacity-50"
          style={{
            opacity: progress > 0.5 ? 0.5 : 0,
            transform: 'translateY(20px)',
            transition: 'opacity 1s ease, transform 1s ease',
          }}
        >
          SCROLL TO ENTER
        </div>
      </Html>
    </>
  )
}