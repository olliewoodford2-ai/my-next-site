'use client'

import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import { useScrollStore } from '@/store'
import { useUIStore } from '@/store'
import { SCENES } from '@/types'

// Singleton Lenis instance - only created once
let lenisInstance: Lenis | null = null
let lenisInitialized = false

export function useLenis() {
  const rafRef = useRef<number>()
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Use refs for stable access to store setters
  const setProgressRef = useRef(useScrollStore.getState().setProgress)
  const setCurrentSceneRef = useRef(useScrollStore.getState().setCurrentScene)
  const setSceneProgressRef = useRef(useScrollStore.getState().setSceneProgress)
  const setVelocityRef = useRef(useScrollStore.getState().setVelocity)
  const setDirectionRef = useRef(useScrollStore.getState().setDirection)
  const setIsScrollingRef = useRef(useScrollStore.getState().setIsScrolling)

  // Keep refs updated
  useEffect(() => {
    setProgressRef.current = useScrollStore.getState().setProgress
    setCurrentSceneRef.current = useScrollStore.getState().setCurrentScene
    setSceneProgressRef.current = useScrollStore.getState().setSceneProgress
    setVelocityRef.current = useScrollStore.getState().setVelocity
    setDirectionRef.current = useScrollStore.getState().setDirection
    setIsScrollingRef.current = useScrollStore.getState().setIsScrolling
  })

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
        setProgressRef.current(0)
        setCurrentSceneRef.current('opening')
        setSceneProgressRef.current(0)
        setVelocityRef.current(0)
        setDirectionRef.current('none')
        setIsScrollingRef.current(false)
        return
      }

      const progress = e.scroll / e.limit
      const { currentScene, sceneProgress } = calculateScene(progress)
      const velocity = Math.abs(e.velocity)
      const direction = e.direction > 0 ? 'down' : e.direction < 0 ? 'up' : 'none'

      setProgressRef.current(progress)
      setCurrentSceneRef.current(currentScene)
      setSceneProgressRef.current(sceneProgress)
      setVelocityRef.current(velocity)
      setDirectionRef.current(direction)
      setIsScrollingRef.current(true)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollingRef.current(false)
      }, 150)
    },
    [calculateScene]
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

  // Return stable functions - lenis instance not needed by consumers
  return { scrollTo, scrollToProgress, stop }
}