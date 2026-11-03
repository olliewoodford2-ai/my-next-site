'use client'

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import Lenis from 'lenis'
import { useScrollStore } from '@/store'
import { useUIStore } from '@/store'
import { SCENES } from '@/types'

// Singleton Lenis instance - only created once
let lenisInstance: Lenis | null = null
let lenisInitialized = false
const subscribers = new Set<() => void>()

function notifySubscribers() {
  subscribers.forEach((cb) => cb())
}

// Store for sync external store
const lenisStore = {
  subscribe: (callback: () => void) => {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  },
  getSnapshot: () => ({ lenis: lenisInstance }),
  getServerSnapshot: () => ({ lenis: null }),
}

export function useLenis() {
  const rafRef = useRef<number>()
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    setProgress,
    setCurrentScene,
    setSceneProgress,
    setVelocity,
    setDirection,
    setIsScrolling,
  } = useScrollStore()

  const { setReducedMotion } = useUIStore()

  // Initialize reduced motion from media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [setReducedMotion])

  const calculateScene = useCallback((progress: number) => {
    const scene = SCENES.find(
      (s) => progress >= s.startProgress && progress < s.endProgress
    ) || SCENES[SCENES.length - 1]

    const sceneProgress = (progress - scene.startProgress) / (scene.endProgress - scene.startProgress)

    return {
      currentScene: scene.id,
      sceneProgress: Math.max(0, Math.min(1, sceneProgress)),
    }
  }, [])

  const onScroll = useCallback(
    (e: { scroll: number; limit: number; velocity: number; direction: number }) => {
      // Guard against division by zero when page has no scrollable content
      if (e.limit === 0) {
        setProgress(0)
        setCurrentScene('opening')
        setSceneProgress(0)
        setVelocity(0)
        setDirection('none')
        setIsScrolling(false)
        return
      }

      const progress = e.scroll / e.limit
      const { currentScene, sceneProgress } = calculateScene(progress)
      const velocity = Math.abs(e.velocity)
      const direction = e.direction > 0 ? 'down' : e.direction < 0 ? 'up' : 'none'

      setProgress(progress)
      setCurrentScene(currentScene)
      setSceneProgress(sceneProgress)
      setVelocity(velocity)
      setDirection(direction)
      setIsScrolling(true)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    },
    [calculateScene, setProgress, setCurrentScene, setSceneProgress, setVelocity, setDirection, setIsScrolling]
  )

  // Initialize Lenis singleton - only once
  useEffect(() => {
    if (!lenisInitialized) {
      lenisInstance = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        syncTouch: false,
        touchInertiaExponent: 2,
        infinite: false,
      })
      lenisInitialized = true
    }

    if (lenisInstance) {
      lenisInstance.on('scroll', onScroll)

      const animate = (time: number) => {
        lenisInstance!.raf(time)
        rafRef.current = requestAnimationFrame(animate)
      }

      rafRef.current = requestAnimationFrame(animate)
      notifySubscribers()
    }

    return () => {
      if (lenisInstance) {
        lenisInstance.off('scroll', onScroll)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      // Don't destroy lenisInstance - it's a singleton for the app lifetime
    }
  }, [onScroll])

  // Scroll to a progress value (0-1) by converting to pixels
  const scrollToProgress = useCallback(
    (progress: number, options?: { duration?: number; easing?: (t: number) => number }) => {
      if (lenisInstance) {
        const limit = lenisInstance.limit
        const targetScroll = progress * limit
        lenisInstance.scrollTo(targetScroll, options)
      }
    },
    []
  )

  const scrollTo = useCallback(
    (target: number | string, options?: { duration?: number; easing?: (t: number) => number }) => {
      if (lenisInstance) {
        lenisInstance.scrollTo(target, options)
      }
    },
    []
  )

  const stop = useCallback(() => {
    if (lenisInstance) {
      lenisInstance.stop()
    }
  }, [])

  // Use sync external store to get the singleton instance
  const { lenis } = useSyncExternalStore(
    lenisStore.subscribe,
    lenisStore.getSnapshot,
    lenisStore.getServerSnapshot
  )

  return { lenis, scrollTo, scrollToProgress, stop }
}