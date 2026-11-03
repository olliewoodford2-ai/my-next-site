'use client'

import { Canvas, extend, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'

extend({
  EffectComposer,
  Bloom,
})

interface ThreeCanvasProps {
  children: React.ReactNode
  sceneConfig?: {
    fov?: number
    near?: number
    far?: number
    backgroundColor?: number
    enablePostProcessing?: boolean
  }
  className?: string
}

// Separate component to handle Canvas initialization safely
function CanvasInitializer({
  fov,
  near,
  far,
  backgroundColor
}: {
  fov: number
  near: number
  far: number
  backgroundColor: number
}) {
  const { gl: glRef, scene: sceneRef, camera: cameraRef } = useThree()
  const initializedRef = useRef(false)

  useEffect(() => {
    const gl = glRef
    const scene = sceneRef
    if (!gl || !scene || initializedRef.current) return

    try {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      gl.shadowMap.enabled = true
      gl.shadowMap.type = THREE.PCFSoftShadowMap
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1

      scene.background = new THREE.Color(backgroundColor)
      scene.fog = new THREE.FogExp2(backgroundColor, 0.002)

      initializedRef.current = true
    } catch (e) {
      console.warn('Canvas initialization failed:', e)
    }
  }, [glRef, sceneRef, backgroundColor])

  // Also update camera settings when they change
  useEffect(() => {
    const camera = cameraRef as THREE.PerspectiveCamera | null
    if (!camera) return

    try {
      camera.fov = fov
      camera.near = near
      camera.far = far
      camera.updateProjectionMatrix()
    } catch (e) {
      console.warn('Camera update failed:', e)
    }
  }, [cameraRef, fov, near, far])

  return null
}

export function ThreeCanvas({ children, sceneConfig, className }: ThreeCanvasProps) {
  const {
    fov = 50,
    near = 0.1,
    far = 1000,
    backgroundColor = 0x0a0a0a,
    enablePostProcessing = true,
  } = sceneConfig || {}

  const [pixelRatio, setPixelRatio] = useState(1)

  useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  }, [])

  return (
    <Canvas
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'visible',
      }}
      camera={{ position: [0, 0, 10], fov, near, far }}
      dpr={pixelRatio}
      gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance', antialias: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.18} color={0x8f8aa0} />
        <directionalLight
          position={[4, 8, 6]}
          intensity={0.55}
          color={0xe8d4a0}
        />
        <directionalLight
          position={[-6, 2, -4]}
          intensity={0.35}
          color={0x6f7fa8}
        />
        {children}
        <CanvasInitializer fov={fov} near={near} far={far} backgroundColor={backgroundColor} />
      </Suspense>

      {enablePostProcessing && (
        <EffectComposer multisampling={2}>
          <Bloom
            intensity={0.3}
            kernelSize={0.8}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
            height={480}
          />
        </EffectComposer>
      )}
    </Canvas>
  )
}

interface SceneContextValue {
  isActive: boolean
  sceneId: string
}

const SceneContext = React.createContext<SceneContextValue | null>(null)

export function useSceneContext() {
  const context = React.useContext(SceneContext)
  if (!context) {
    throw new Error('useSceneContext must be used within a SceneProvider')
  }
  return context
}

export function useSceneProgress() {
  const { progress, sceneProgress } = useScrollStore()
  return { progress, sceneProgress, globalProgress: progress }
}

interface SceneProviderProps {
  children: React.ReactNode
  sceneId: string
}

export function SceneProvider({ children, sceneId }: SceneProviderProps) {
  const { currentScene } = useScrollStore()
  const isActive = currentScene === sceneId

  const sceneContext = useMemo<SceneContextValue>(
    () => ({
      isActive,
      sceneId,
    }),
    [isActive, sceneId]
  )

  return (
    <SceneContext.Provider value={sceneContext}>
      <group visible={isActive}>{children}</group>
    </SceneContext.Provider>
  )
}