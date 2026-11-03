'use client'

import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useMemo, useRef, useEffect, useCallback, Suspense } from 'react'
import { useScrollStore } from '@/store'
import { gsap } from 'gsap'

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

export function ThreeCanvas({ children, sceneConfig, className }: ThreeCanvasProps) {
  const {
    fov = 50,
    near = 0.1,
    far = 1000,
    backgroundColor = 0x0a0a0a,
    enablePostProcessing = true,
  } = sceneConfig || {}

  const { progress, currentScene, sceneProgress } = useScrollStore()

  const cameraRef = useRef<THREE.Camera>()
  const sceneRef = useRef<THREE.Scene>()
  const composerRef = useRef<any>()

  useFrame((state, delta) => {
    cameraRef.current = state.camera
    sceneRef.current = state.scene
  })

  const onCreated = useCallback((state: any) => {
    state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    state.gl.shadowMap.enabled = true
    state.gl.shadowMap.type = THREE.PCFSoftShadowMap
    state.gl.toneMapping = THREE.ACESFilmicToneMapping
    state.gl.toneMappingExposure = 1
    state.gl.physicallyCorrectLights = true

    state.camera.fov = fov
    state.camera.near = near
    state.camera.far = far
    state.camera.updateProjectionMatrix()

    state.gl.scene.background = new THREE.Color(backgroundColor)
    state.gl.scene.fog = new THREE.FogExp2(backgroundColor, 0.002)
  }, [fov, near, far, backgroundColor])

  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 10], fov, near, far }}
      onCreated={onCreated}
      gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance', antialias: true }}
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>

      {enablePostProcessing && (
        <EffectComposer multisampling={Math.min(window.devicePixelRatio, 2)}>
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

import React from 'react'

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
      {children}
    </SceneContext.Provider>
  )
}