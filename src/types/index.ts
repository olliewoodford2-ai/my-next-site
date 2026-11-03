export type SceneId =
  | 'opening'
  | 'hero'
  | 'genesis'
  | 'oracle'
  | 'afterimage'
  | 'finale'

export interface SceneConfig {
  id: SceneId
  name: string
  startProgress: number
  endProgress: number
  duration: number
}

export const SCENES: readonly SceneConfig[] = [
  { id: 'opening', name: 'The Opening', startProgress: 0, endProgress: 0.15, duration: 3000 },
  { id: 'hero', name: 'The Hero', startProgress: 0.15, endProgress: 0.3, duration: 4000 },
  { id: 'genesis', name: 'The Genesis', startProgress: 0.3, endProgress: 0.5, duration: 5000 },
  { id: 'oracle', name: 'The Oracle', startProgress: 0.5, endProgress: 0.7, duration: 5000 },
  { id: 'afterimage', name: 'The Afterimage', startProgress: 0.7, endProgress: 0.85, duration: 4000 },
  { id: 'finale', name: 'The Finale', startProgress: 0.85, endProgress: 1, duration: 3000 },
] as const

export interface ScrollState {
  progress: number
  currentScene: SceneId
  sceneProgress: number
  velocity: number
  direction: 'up' | 'down' | 'none'
  isScrolling: boolean
}

export interface CursorState {
  x: number
  y: number
  targetX: number
  targetY: number
  isVisible: boolean
  isHovering: boolean
  isClicking: boolean
  scale: number
  blendMode: 'normal' | 'difference' | 'screen'
}

export interface SoundState {
  isMuted: boolean
  masterVolume: number
  ambientVolume: number
  effectsVolume: number
  musicVolume: number
}

export interface ThreeSceneConfig {
  fov: number
  near: number
  far: number
  backgroundColor: number
  enablePostProcessing: boolean
}

export interface MagneticElement {
  element: HTMLElement
  strength: number
  radius: number
  callback?: (progress: number) => void
  handleMouseMove?: (e: MouseEvent) => void
  handleMouseLeave?: () => void
}

export interface ParticleConfig {
  count: number
  size: number
  color: number
  opacity: number
  speed: number
  life: number
}

export interface TypographicSequence {
  texts: string[]
  duration: number
  delay: number
  stagger: number
}

export interface SceneTransitionConfig {
  type: 'fade' | 'slide' | 'dissolve' | 'morph' | 'camera'
  duration: number
  ease: string
  direction?: 'forward' | 'backward'
}