import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import type { ScrollState, CursorState, SoundState, SceneId } from '@/types'

interface ScrollStore extends ScrollState {
  setProgress: (progress: number) => void
  setCurrentScene: (scene: SceneId) => void
  setSceneProgress: (progress: number) => void
  setVelocity: (velocity: number) => void
  setDirection: (direction: 'up' | 'down' | 'none') => void
  setIsScrolling: (isScrolling: boolean) => void
  reset: () => void
}

const initialScrollState: ScrollState = {
  progress: 0,
  currentScene: 'opening',
  sceneProgress: 0,
  velocity: 0,
  direction: 'none',
  isScrolling: false,
}

export const useScrollStore = create<ScrollStore>()(
  subscribeWithSelector((set) => ({
    ...initialScrollState,
    setProgress: (progress) => set({ progress: Math.max(0, Math.min(1, progress)) }),
    setCurrentScene: (currentScene) => set({ currentScene }),
    setSceneProgress: (sceneProgress) => set({ sceneProgress: Math.max(0, Math.min(1, sceneProgress)) }),
    setVelocity: (velocity) => set({ velocity }),
    setDirection: (direction) => set({ direction }),
    setIsScrolling: (isScrolling) => set({ isScrolling }),
    reset: () => set(initialScrollState),
  }))
)

interface CursorStore extends CursorState {
  setPosition: (x: number, y: number) => void
  setTargetPosition: (x: number, y: number) => void
  setVisibility: (visible: boolean) => void
  setHovering: (hovering: boolean) => void
  setClicking: (clicking: boolean) => void
  setScale: (scale: number) => void
  setBlendMode: (mode: 'normal' | 'difference' | 'screen') => void
  reset: () => void
}

const initialCursorState: CursorState = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  isVisible: true,
  isHovering: false,
  isClicking: false,
  scale: 1,
  blendMode: 'normal',
}

export { initialCursorState }

export const useCursorStore = create<CursorStore>()(
  subscribeWithSelector((set) => ({
    ...initialCursorState,
    setPosition: (x, y) => set({ x, y }),
    setTargetPosition: (targetX, targetY) => set({ targetX, targetY }),
    setVisibility: (isVisible) => set({ isVisible }),
    setHovering: (isHovering) => set({ isHovering }),
    setClicking: (isClicking) => set({ isClicking }),
    setScale: (scale) => set({ scale }),
    setBlendMode: (blendMode) => set({ blendMode }),
    reset: () => set(initialCursorState),
  }))
)

interface SoundStore extends SoundState {
  toggleMute: () => void
  setMute: (muted: boolean) => void
  setMasterVolume: (volume: number) => void
  setAmbientVolume: (volume: number) => void
  setEffectsVolume: (volume: number) => void
  setMusicVolume: (volume: number) => void
  reset: () => void
}

const initialSoundState: SoundState = {
  isMuted: false,
  masterVolume: 0.5,
  ambientVolume: 0.3,
  effectsVolume: 0.5,
  musicVolume: 0.4,
}

export const useSoundStore = create<SoundStore>()(
  subscribeWithSelector((set) => ({
    ...initialSoundState,
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setMute: (isMuted) => set({ isMuted }),
    setMasterVolume: (masterVolume) => set({ masterVolume: Math.max(0, Math.min(1, masterVolume)) }),
    setAmbientVolume: (ambientVolume) => set({ ambientVolume: Math.max(0, Math.min(1, ambientVolume)) }),
    setEffectsVolume: (effectsVolume) => set({ effectsVolume: Math.max(0, Math.min(1, effectsVolume)) }),
    setMusicVolume: (musicVolume) => set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
    reset: () => set(initialSoundState),
  }))
)

interface UIStore {
  isLoading: boolean
  loadingProgress: number
  showCursorHint: boolean
  showSoundToggle: boolean
  reducedMotion: boolean
  setLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setShowCursorHint: (show: boolean) => void
  setShowSoundToggle: (show: boolean) => void
  setReducedMotion: (reduced: boolean) => void
}

export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set) => ({
    isLoading: true,
    loadingProgress: 0,
    showCursorHint: true,
    showSoundToggle: true,
    reducedMotion: false,
    setLoading: (isLoading) => set({ isLoading }),
    setLoadingProgress: (loadingProgress) => set({ loadingProgress: Math.max(0, Math.min(1, loadingProgress)) }),
    setShowCursorHint: (showCursorHint) => set({ showCursorHint }),
    setShowSoundToggle: (showSoundToggle) => set({ showSoundToggle }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  }))
)