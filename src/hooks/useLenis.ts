'use client'

import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import { useScrollStore } from '@/store'
import { useUIStore } from '@/store'
import { SCENES } from '@/types'

// Singleton Lenis instance
let lenisInstance: Lenis | null = null
let lenisInitialized = false
const lenisSubscribers = new Set<() => void>()

function notifySubscribers() {
  lenisSubscribers.forEach((cb) => cb())
}

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<number>()
  const lastScrollRef = useRef(0)
  const isScrollingRef = useRef(false)
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

      lastScrollRef.current = progress

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    },
    [calculateScene, setProgress, setCurrentScene, setSceneProgress, setVelocity, setDirection, setIsScrolling]
  )

  // Initialize Lenis singleton
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

    lenisRef.current = lenisInstance!
    lenisInstance!.on('scroll', onScroll)

    const animate = (time: number) => {
      lenisInstance!.raf(time)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    // Subscribe to cleanup notifications
    const cleanup = () => {
      lenisInstance!.off('scroll', onScroll)
      cancelAnimationFrame(rafRef.current!)
      lenisInstance!.destroy()
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
    lenisSubscribers.add(cleanup)

    return () => {
      lenisSubscribers.delete(cleanup)
      // Only actually destroy if no more subscribers
      if (lenisSubscribers.size === 0 && lenisInstance) {
        lenisInstance.off('scroll', onScroll)
        cancelAnimationFrame(rafRef.current!)
        lenisInstance.destroy()
        lenisInstance = null
        lenisInitialized = false
      } else {
        lenisInstance!.off('scroll', onScroll)
        cancelAnimationFrame(rafRef.current!)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [onScroll])

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

  return { lenis: lenisRef.current, scrollTo, stop }
}