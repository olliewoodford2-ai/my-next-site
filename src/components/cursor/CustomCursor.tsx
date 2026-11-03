'use client'

import { useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import { useCursorStore } from '@/store'
import { initialCursorState } from '@/store'

interface CustomCursorProps {
  className?: string
}

function subscribe(callback: () => void) {
  return useCursorStore.subscribe(callback)
}

function getSnapshot() {
  return useCursorStore.getState()
}

function getServerSnapshot() {
  return initialCursorState as any
}

export function CustomCursor({ className }: CustomCursorProps) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const {
    x,
    y,
    isVisible,
    isHovering,
    isClicking,
    scale,
    blendMode,
  } = state

  const cursorRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()
  const currentXRef = useRef(0)
  const currentYRef = useRef(0)
  const prevScaleRef = useRef(scale)
  const prevBlendModeRef = useRef(blendMode)
  const prevIsVisibleRef = useRef(isVisible)
  const prevIsHoveringRef = useRef(isHovering)
  const prevIsClickingRef = useRef(isClicking)

  // Update DOM directly without React re-renders for position
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`
    }
  }, [x, y, scale])

  // Update other properties only when they change
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.opacity = isVisible ? '1' : '0'
      cursorRef.current.style.mixBlendMode = blendMode
    }
    if (followerRef.current) {
      followerRef.current.style.opacity = isVisible ? '0.3' : '0'
      followerRef.current.style.mixBlendMode = blendMode
    }
    prevIsVisibleRef.current = isVisible
    prevBlendModeRef.current = blendMode
  }, [isVisible, blendMode])

  useEffect(() => {
    if (cursorRef.current) {
      const innerCircle = cursorRef.current.querySelector('circle:last-child') as SVGCircleElement | null
      if (innerCircle) {
        innerCircle.style.transform = isHovering ? 'scale(1.5)' : 'scale(1)'
      }
      const pulseRing = cursorRef.current.querySelector('.cursor-pulse-ring') as HTMLElement | null
      if (pulseRing) {
        pulseRing.style.display = isHovering ? 'block' : 'none'
      }
    }
    if (followerRef.current) {
      const followerCircle = followerRef.current.querySelector('div') as HTMLElement | null
      if (followerCircle) {
        followerCircle.style.transform = isHovering ? 'scale(2)' : 'scale(1)'
      }
    }
    prevIsHoveringRef.current = isHovering
  }, [isHovering])

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = isClicking ? 'scale(0.8)' : 'scale(1)'
    }
    prevIsClickingRef.current = isClicking
  }, [isClicking])

  // Animate follower position
  useEffect(() => {
    const animateFollower = () => {
      if (followerRef.current) {
        const targetX = x
        const targetY = y

        currentXRef.current += (targetX - currentXRef.current) * 0.15
        currentYRef.current += (targetY - currentYRef.current) * 0.15

        followerRef.current.style.transform = `translate(${currentXRef.current}px, ${currentYRef.current}px) translate(-50%, -50%) scale(${scale * 1.5})`
      }

      rafRef.current = requestAnimationFrame(animateFollower)
    }

    rafRef.current = requestAnimationFrame(animateFollower)

    return () => cancelAnimationFrame(rafRef.current!)
  }, [x, y, scale])

  return (
    <>
      <div
        ref={followerRef}
        className="cursor-follower"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          transform: `translate(${currentXRef.current}px, ${currentYRef.current}px) translate(-50%, -50%) scale(${scale * 1.5})`,
          mixBlendMode: blendMode,
          transition: 'transform 0.2s ease-out, opacity 0.3s ease',
          opacity: isVisible ? 0.3 : 0,
        }}
      >
        <div
          className="w-8 h-8 rounded-full border border-gold/30 bg-gold/10"
          style={{
            transform: isHovering ? 'scale(2)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      <div
        ref={cursorRef}
        className={`custom-cursor ${className || ''}`}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
          mixBlendMode: blendMode,
          transition: 'transform 0.1s ease-out, opacity 0.3s ease, mix-blend-mode 0.3s ease',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isClicking ? 'scale(0.8)' : 'scale(1)',
            transition: 'transform 0.1s ease',
          }}
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            style={{
              strokeDasharray: '88',
              strokeDashoffset: 0,
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
          <circle
            cx="16"
            cy="16"
            r="4"
            fill="currentColor"
            style={{
              transform: isHovering ? 'scale(1.5)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </svg>

        {isHovering && (
          <div
            className="cursor-pulse-ring absolute -inset-2 rounded-full border border-gold/50 animate-pulse"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.5); }
        }

        .custom-cursor {
          color: #F5F0E8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-cursor svg {
          filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.5));
        }

        @media (prefers-reduced-motion: reduce) {
          .custom-cursor,
          .cursor-follower {
            transition: none !important;
            animation: none !important;
          }
        }

        @media (max-width: 768px) {
          .custom-cursor,
          .cursor-follower {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}