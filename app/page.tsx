'use client'

import dynamic from 'next/dynamic'
import { useEffect, Suspense } from 'react'
import { ThreeCanvas, SceneProvider } from '@/components/three/ThreeCanvas'
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

// Dynamic import for the canvas to avoid SSR issues
const DynamicCanvas = dynamic(
  () => import('@/components/three/ThreeCanvas').then((mod) => mod.ThreeCanvas),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-obsidian" /> }
)

function LoadingScreen() {
  const { loadingProgress, isLoading } = useUIStore()

  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-obsidian"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
      }}
      aria-hidden="true"
    >
      <div className="text-center">
        <div
          className="font-editorial text-display-lg text-ivory mb-8 tracking-tight"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(201, 168, 76, 0.3))',
          }}
        >
          DIVINUM
        </div>
        <div
          className="font-sans text-caption text-gold tracking-[0.3em] mb-12"
        >
          Independent Creative Studio
        </div>
        <div className="w-64 h-px bg-oxidized/30 relative overflow-hidden mx-auto">
          <div
            className="absolute top-0 left-0 h-full bg-gold"
            style={{
              width: `${loadingProgress * 100}%`,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
        <div className="font-mono text-micro text-oxidized-light mt-6">
          {Math.round(loadingProgress * 100)}%
        </div>
      </div>
    </div>
  )
}

function SoundToggle() {
  const { isMuted, toggleMute, masterVolume, setMasterVolume } = useSoundManager()
  const { showSoundToggle } = useUIStore()
  const [isHovered, setIsHovered] = useState(false)

  if (!showSoundToggle) return null

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-obsidian/80 backdrop-blur-md border border-gold/30 transition-all duration-300 hover:border-gold/60 hover:bg-obsidian focus:outline-none focus:ring-2 focus:ring-gold/50"
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
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
        className="text-gold transition-colors duration-300"
        style={{
          opacity: isMuted ? 0.5 : 1,
        }}
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

function SceneProgressIndicator() {
  const { currentScene, sceneProgress, progress } = useScrollStore()
  const { scrollTo } = useLenis()
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
      scrollTo(targetProgress, { duration: 2 })
    }
  }

  return (
    <nav
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6"
      aria-label="Scene navigation"
    >
      {SCENES.map((scene, index) => (
        <button
          key={scene.id}
          className="group relative w-10 h-10 flex items-center justify-center"
          onClick={() => handleSceneClick(index)}
          aria-label={`Go to ${scene.name}`}
          aria-current={index === activeIndex ? 'true' : 'false'}
        >
          <div
            className="relative w-2 h-2 rounded-full transition-all duration-500 bg-oxidized/30"
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
                className="absolute inset-0 rounded-full bg-gold/30 animate-ping"
                style={{
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            )}
          </div>
          <div
            className="absolute right-14 top-1/2 -translate-y-1/2 font-sans text-micro text-oxidized-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
            style={{
              opacity: index === activeIndex ? 1 : 0,
              transform: index === activeIndex ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(10px)',
            }}
          >
            {scene.name}
          </div>
        </button>
      ))}
    </nav>
  )
}

import { useState } from 'react'

function SceneContainer() {
  const sound = useSoundManager()
  const { setLoading, setLoadingProgress } = useUIStore()

  useEffect(() => {
    // Simulate asset loading
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        const timeout = setTimeout(() => {
          setLoading(false)
        }, 500)
        return () => clearTimeout(timeout)
      }
      setLoadingProgress(progress / 100)
    }, 100)

    return () => clearInterval(interval)
  }, [setLoading, setLoadingProgress])

  return (
    <DynamicCanvas
      sceneConfig={{
        fov: 50,
        near: 0.1,
        far: 1000,
        backgroundColor: 0x0a0a0a,
        enablePostProcessing: true,
      }}
      className="fixed inset-0 z-0"
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
  )
}

export default function Home() {
  useLenis()
  useSoundManager()

  return (
    <div className="relative min-h-screen bg-obsidian overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      <LoadingScreen />
      <SceneContainer />
      <CustomCursor />
      <SoundToggle />
      <SceneProgressIndicator />
    </div>
  )
}