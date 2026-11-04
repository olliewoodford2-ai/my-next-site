'use client'

import dynamic from 'next/dynamic'
import { useEffect, Suspense, useState, useMemo } from 'react'
import { ThreeCanvas, SceneProvider } from '@/components/three/ThreeCanvas'
import { ThreeErrorBoundary } from '@/components/three/ThreeErrorBoundary'
import { OpeningScene } from '@/components/scenes/OpeningScene'
import { HeroScene } from '@/components/scenes/HeroScene'
import { GenesisScene } from '@/components/scenes/GenesisScene'
import { OracleScene } from '@/components/scenes/OracleScene'
import { AfterimageScene } from '@/components/scenes/AfterimageScene'
import { FinaleScene } from '@/components/scenes/FinaleScene'
import { CustomCursor } from '@/components/cursor/CustomCursor'
import { useScrollStore } from '@/store'
import { useLenis } from '@/hooks/useLenis'
import { useSoundManager } from '@/hooks/useSoundManager'
import { useUIStore } from '@/store'
import { SCENES } from '@/types'
import styles from './page.module.css'

// Dynamic import for the canvas to avoid SSR issues
const DynamicCanvas = dynamic(
  () => import('@/components/three/ThreeCanvas').then((mod) => mod.ThreeCanvas),
  { ssr: false, loading: () => <div className={styles.canvasLoading} /> }
)

// Wrapped canvas with error boundary
function CanvasWithErrorBoundary() {
  return (
    <ThreeErrorBoundary>
      <DynamicCanvas
        sceneConfig={{
          fov: 50,
          near: 0.1,
          far: 1000,
          backgroundColor: 0x0a0a0a,
          enablePostProcessing: true,
        }}
        className={styles.canvas}
      >
        <Suspense fallback={null}>
          <SceneProvider sceneId="opening">
            <OpeningScene />
          </SceneProvider>
          <SceneProvider sceneId="hero">
            <HeroScene />
          </SceneProvider>
          <SceneProvider sceneId="genesis">
            <GenesisScene />
          </SceneProvider>
          <SceneProvider sceneId="oracle">
            <OracleScene />
          </SceneProvider>
          <SceneProvider sceneId="afterimage">
            <AfterimageScene />
          </SceneProvider>
          <SceneProvider sceneId="finale">
            <FinaleScene />
          </SceneProvider>
        </Suspense>
      </DynamicCanvas>
    </ThreeErrorBoundary>
  )
}

// LoadingScreen component
function LoadingScreen() {
  // Use inline selectors to ensure proper store subscription
  const isLoading = useUIStore((state) => state.isLoading)
  const loadingProgress = useUIStore((state) => state.loadingProgress)

  if (!isLoading) return null

  return (
    <div className={styles.loadingScreen} aria-hidden="true">
      <div className={styles.loadingContent}>
        <div className={styles.loadingTitle}>DIVINUM</div>
        <div className={styles.loadingSubtitle}>Independent Creative Studio</div>
        <div className={styles.loadingBar}>
          <div
            className={styles.loadingProgress}
            style={{ width: `${loadingProgress * 100}%` }}
          />
        </div>
        <div className={styles.loadingPercent}>{Math.round(loadingProgress * 100)}%</div>
      </div>
    </div>
  )
}

// SoundToggle component
function SoundToggle() {
  const { isMuted, toggleMute, masterVolume, setMasterVolume } = useSoundManager()
  // Use inline selector to ensure proper store subscription
  const showSoundToggle = useUIStore((state) => state.showSoundToggle)
  const [isHovered, setIsHovered] = useState(false)

  if (!showSoundToggle) return null

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.soundToggle}
      style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={isMuted}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.soundIcon}
        style={{ opacity: isMuted ? 0.5 : 1 }}
      >
        {!isMuted ? (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        )}
      </svg>
    </button>
  )
}

// SceneProgressIndicator component
function SceneProgressIndicator() {
  // Use selectors to avoid re-renders on unrelated state changes
  const currentScene = useScrollStore((state) => state.currentScene)
  const sceneProgress = useScrollStore((state) => state.sceneProgress)
  const progress = useScrollStore((state) => state.progress)
  const { scrollToProgress } = useLenis()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const index = SCENES.findIndex((s) => s.id === currentScene)
    if (index !== -1) setActiveIndex(index)
  }, [currentScene])

  const handleSceneClick = (sceneIndex: number) => {
    const scene = SCENES[sceneIndex]
    if (scene) {
      // Calculate target progress - middle of the scene
      const targetProgress = (scene.startProgress + scene.endProgress) / 2
      scrollToProgress(targetProgress, { duration: 2 })
    }
  }

  return (
    <nav className={styles.sceneNav} aria-label="Scene navigation">
      {SCENES.map((scene, index) => (
        <button
          key={scene.id}
          className={styles.sceneButton}
          onClick={() => handleSceneClick(index)}
          aria-label={`Go to ${scene.name}`}
          aria-current={index === activeIndex ? 'true' : 'false'}
          data-active={index === activeIndex}
        >
          <div
            className={`${styles.sceneDot} ${index === activeIndex ? styles.active : ''}`}
            style={{
              background: index === activeIndex
                ? 'linear-gradient(180deg, #C9A84C 0%, #E8D4A0 100%)'
                : 'rgba(122, 122, 138, 0.3)',
              transform: index === activeIndex ? 'scale(1.5)' : 'scale(1)',
              boxShadow: index === activeIndex
                ? '0 0 20px rgba(201, 168, 76, 0.6), 0 0 40px rgba(201, 168, 76, 0.3)'
                : 'none',
            }}
          >
            {index === activeIndex && (
              <div
                className={styles.scenePulse}
                style={{
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            )}
          </div>
          <div className={styles.sceneLabel}>
            {scene.name}
          </div>
        </button>
      ))}
    </nav>
  )
}

function SceneContainer() {
  const sound = useSoundManager()
  // Use inline selectors to ensure proper store subscription
  const isLoading = useUIStore((state) => state.isLoading)
  const loadingProgress = useUIStore((state) => state.loadingProgress)
  const setLoading = useUIStore((state) => state.setLoading)
  const setLoadingProgress = useUIStore((state) => state.setLoadingProgress)

  useEffect(() => {
    console.log('[SceneContainer] useEffect started, isLoading:', isLoading, 'loadingProgress:', loadingProgress)
    // Simulate asset loading - complete immediately for tests (avoids StrictMode interval issues)
    setLoadingProgress(1)
    console.log('[SceneContainer] Called setLoadingProgress(1)')
    // Hide loading screen immediately after progress reaches 100%
    setLoading(false)
    console.log('[SceneContainer] Called setLoading(false)')
  }, [setLoading, setLoadingProgress])

  console.log('[SceneContainer] render, isLoading:', isLoading, 'loadingProgress:', loadingProgress)

  return <CanvasWithErrorBoundary />
}

export default function Home() {
  useLenis()
  useSoundManager()

  // Create scrollable content height for Lenis (6 scenes * 100vh each = 600vh)
  const scrollHeight = useMemo(() => SCENES.length * 100, [])

  return (
    <div className={styles.pageWrapper}>
      {/* Scrollable content for Lenis */}
      <div
        className={styles.scrollContainer}
        style={{ height: `${scrollHeight}vh` }}
        aria-hidden="true"
      />

      {/* Fixed canvas and UI overlay */}
      <div className={styles.fixedOverlay}>
        <LoadingScreen />
        <SceneContainer />
        <CustomCursor />
        <SoundToggle />
        <SceneProgressIndicator />
      </div>
    </div>
  )
}