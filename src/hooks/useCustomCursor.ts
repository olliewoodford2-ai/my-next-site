'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCursorStore } from '@/store'
import { gsap } from 'gsap'

export function useCustomCursor() {
  const {
    setPosition,
    setTargetPosition,
    setVisibility,
    setHovering,
    setClicking,
    setScale,
    setBlendMode,
    x,
    y,
    targetX,
    targetY,
    isVisible,
    isHovering,
    isClicking,
    scale,
    blendMode,
  } = useCursorStore()

  const rafRef = useRef<number>()
  const magneticElementsRef = useRef<Map<HTMLElement, {
    strength: number;
    radius: number;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseLeave: () => void;
  }>>(new Map())

  // Use refs for latest values to avoid stale closures
  const targetXRef = useRef(targetX)
  const targetYRef = useRef(targetY)
  const xRef = useRef(x)
  const yRef = useRef(y)

  targetXRef.current = targetX
  targetYRef.current = targetY
  xRef.current = x
  yRef.current = y

  const updateCursor = useCallback(() => {
    const dx = targetXRef.current - xRef.current
    const dy = targetYRef.current - yRef.current

    const newX = xRef.current + dx * 0.15
    const newY = yRef.current + dy * 0.15

    setPosition(newX, newY)

    // Update refs
    xRef.current = newX
    yRef.current = newY

    rafRef.current = requestAnimationFrame(updateCursor)
  }, [setPosition])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTargetPosition(e.clientX, e.clientY)
    }

    const handleMouseDown = () => setClicking(true)
    const handleMouseUp = () => setClicking(false)
    const handleMouseEnter = () => setVisibility(true)
    const handleMouseLeave = () => setVisibility(false)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('mouseleave', handleMouseLeave)

    rafRef.current = requestAnimationFrame(updateCursor)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [setTargetPosition, setClicking, setVisibility, updateCursor])

  const addMagneticElement = useCallback(
    (element: HTMLElement, strength = 0.3, radius = 100) => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = e.clientX - centerX
        const dy = e.clientY - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < radius) {
          const force = (1 - distance / radius) * strength
          const targetX = centerX + dx * force
          const targetY = centerY + dy * force
          setTargetPosition(targetX, targetY)
          setHovering(true)
          setScale(1.5)
        } else {
          setHovering(false)
          setScale(1)
        }
      }

      const handleMouseLeave = () => {
        setHovering(false)
        setScale(1)
      }

      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseleave', handleMouseLeave)

      magneticElementsRef.current.set(element, { strength, radius, handleMouseMove, handleMouseLeave })

      return () => {
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseleave', handleMouseLeave)
        magneticElementsRef.current.delete(element)
      }
    },
    [setTargetPosition, setHovering, setScale]
  )

  const removeMagneticElement = useCallback((element: HTMLElement) => {
    const data = magneticElementsRef.current.get(element)
    if (data) {
      element.removeEventListener('mousemove', data.handleMouseMove)
      element.removeEventListener('mouseleave', data.handleMouseLeave)
      magneticElementsRef.current.delete(element)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      magneticElementsRef.current.forEach((_, element) => {
        element.removeEventListener('mousemove', magneticElementsRef.current.get(element)!.handleMouseMove)
        element.removeEventListener('mouseleave', magneticElementsRef.current.get(element)!.handleMouseLeave)
      })
      magneticElementsRef.current.clear()
    }
  }, [])

  return {
    x,
    y,
    targetX,
    targetY,
    isVisible,
    isHovering,
    isClicking,
    scale,
    blendMode,
    addMagneticElement,
    removeMagneticElement,
  }
}