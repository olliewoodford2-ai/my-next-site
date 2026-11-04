'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSoundStore } from '@/store'

// Stable selectors for sound store
const selectIsMuted = (state: ReturnType<typeof useSoundStore>) => state.isMuted
const selectMasterVolume = (state: ReturnType<typeof useSoundStore>) => state.masterVolume
const selectAmbientVolume = (state: ReturnType<typeof useSoundStore>) => state.ambientVolume
const selectEffectsVolume = (state: ReturnType<typeof useSoundStore>) => state.effectsVolume
const selectMusicVolume = (state: ReturnType<typeof useSoundStore>) => state.musicVolume
const selectSetMute = (state: ReturnType<typeof useSoundStore>) => state.setMute
const selectSetMasterVolume = (state: ReturnType<typeof useSoundStore>) => state.setMasterVolume
const selectSetAmbientVolume = (state: ReturnType<typeof useSoundStore>) => state.setAmbientVolume
const selectSetEffectsVolume = (state: ReturnType<typeof useSoundStore>) => state.setEffectsVolume
const selectSetMusicVolume = (state: ReturnType<typeof useSoundStore>) => state.setMusicVolume

export function useSoundManager() {
  const isMuted = useSoundStore(selectIsMuted)
  const masterVolume = useSoundStore(selectMasterVolume)
  const ambientVolume = useSoundStore(selectAmbientVolume)
  const effectsVolume = useSoundStore(selectEffectsVolume)
  const musicVolume = useSoundStore(selectMusicVolume)
  const setMute = useSoundStore(selectSetMute)
  const setMasterVolume = useSoundStore(selectSetMasterVolume)
  const setAmbientVolume = useSoundStore(selectSetAmbientVolume)
  const setEffectsVolume = useSoundStore(selectSetEffectsVolume)
  const setMusicVolume = useSoundStore(selectSetMusicVolume)

  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)
  const effectsGainRef = useRef<GainNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map())
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const initializedRef = useRef(false)
  const isMutedRef = useRef(isMuted)
  const masterVolumeRef = useRef(masterVolume)
  const ambientVolumeRef = useRef(ambientVolume)
  const effectsVolumeRef = useRef(effectsVolume)
  const musicVolumeRef = useRef(musicVolume)

  // Keep refs in sync with store
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    masterVolumeRef.current = masterVolume
  }, [masterVolume])

  useEffect(() => {
    ambientVolumeRef.current = ambientVolume
  }, [ambientVolume])

  useEffect(() => {
    effectsVolumeRef.current = effectsVolume
  }, [effectsVolume])

  useEffect(() => {
    musicVolumeRef.current = musicVolume
  }, [musicVolume])

  const initializeAudio = useCallback(async () => {
    if (initializedRef.current) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      masterGainRef.current = audioContext.createGain()
      ambientGainRef.current = audioContext.createGain()
      effectsGainRef.current = audioContext.createGain()
      musicGainRef.current = audioContext.createGain()

      masterGainRef.current.gain.value = masterVolumeRef.current
      ambientGainRef.current.gain.value = ambientVolumeRef.current
      effectsGainRef.current.gain.value = effectsVolumeRef.current
      musicGainRef.current.gain.value = musicVolumeRef.current

      ambientGainRef.current.connect(masterGainRef.current)
      effectsGainRef.current.connect(masterGainRef.current)
      musicGainRef.current.connect(masterGainRef.current)
      masterGainRef.current.connect(audioContext.destination)

      initializedRef.current = true

      // Resume audio context if suspended (required by browsers autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }, [])

  const playAmbientTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.1) => {
      if (!audioContextRef.current || !ambientGainRef.current || isMutedRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.type = type
      oscillator.frequency.value = frequency
      gainNode.gain.value = gain

      oscillator.connect(gainNode)
      gainNode.connect(ambientGainRef.current)

      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + duration)

      return oscillator
    },
    []
  )

  const playEffectTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.2) => {
      if (!audioContextRef.current || !effectsGainRef.current || isMutedRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.type = type
      oscillator.frequency.value = frequency
      gainNode.gain.value = gain

      oscillator.connect(gainNode)
      gainNode.connect(effectsGainRef.current)

      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + duration)

      return oscillator
    },
    []
  )

  const playMusicTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) => {
      if (!audioContextRef.current || !musicGainRef.current || isMutedRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.type = type
      oscillator.frequency.value = frequency
      gainNode.gain.value = gain

      oscillator.connect(gainNode)
      gainNode.connect(musicGainRef.current)

      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + duration)

      return oscillator
    },
    []
  )

  const playSequence = useCallback(
    (frequencies: number[], interval: number, type: OscillatorType = 'sine', gain = 0.15) => {
      const timeouts: NodeJS.Timeout[] = []
      frequencies.forEach((freq, i) => {
        const timeout = setTimeout(() => {
          // Check current mute state at execution time via ref
          if (!isMutedRef.current) {
            playAmbientTone(freq, interval * 1.5, type, gain)
          }
        }, i * interval)
        timeouts.push(timeout)
        timeoutsRef.current.add(timeout)
      })
      return timeouts
    },
    [playAmbientTone]
  )

  const setMasterVolumeValue = useCallback(
    (volume: number) => {
      setMasterVolume(volume)
      if (masterGainRef.current && audioContextRef.current) {
        masterGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1)
      }
    },
    [setMasterVolume]
  )

  const setAmbientVolumeValue = useCallback(
    (volume: number) => {
      setAmbientVolume(volume)
      if (ambientGainRef.current && audioContextRef.current) {
        ambientGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1)
      }
    },
    [setAmbientVolume]
  )

  const setEffectsVolumeValue = useCallback(
    (volume: number) => {
      setEffectsVolume(volume)
      if (effectsGainRef.current && audioContextRef.current) {
        effectsGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1)
      }
    },
    [setEffectsVolume]
  )

  const setMusicVolumeValue = useCallback(
    (volume: number) => {
      setMusicVolume(volume)
      if (musicGainRef.current && audioContextRef.current) {
        musicGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1)
      }
    },
    [setMusicVolume]
  )

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current
    setMute(newMuted)
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(newMuted ? 0 : masterVolumeRef.current, audioContextRef.current.currentTime + 0.1)
    }
  }, [setMute])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current.clear()

    // Stop all oscillators
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
      } catch {}
    })
    oscillatorsRef.current.clear()

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    masterGainRef.current = null
    ambientGainRef.current = null
    effectsGainRef.current = null
    musicGainRef.current = null
    initializedRef.current = false
  }, [])

  useEffect(() => {
    const handleInteraction = () => {
      initializeAudio()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('mousemove', handleInteraction)
    }

    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })
    document.addEventListener('mousemove', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('mousemove', handleInteraction)
      cleanup()
    }
  }, [initializeAudio, cleanup])

  return {
    isInitialized: initializedRef.current,
    initializeAudio,
    playAmbientTone,
    playEffectTone,
    playMusicTone,
    playSequence,
    setMasterVolume: setMasterVolumeValue,
    setAmbientVolume: setAmbientVolumeValue,
    setEffectsVolume: setEffectsVolumeValue,
    setMusicVolume: setMusicVolumeValue,
    toggleMute,
    isMuted,
    masterVolume,
    ambientVolume,
    effectsVolume,
    musicVolume,
  }
}

export function useSceneSound(sceneId: string) {
  const sound = useSoundManager()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sequenceTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  useEffect(() => {
    if (!sound.isInitialized) return

    const playSceneAmbient = (): NodeJS.Timeout[] => {
      const timeouts: NodeJS.Timeout[] = []
      switch (sceneId) {
        case 'opening':
          sound.playSequence([65.41, 82.41, 98.00, 130.81], 2000, 'sine', 0.05).forEach(t => timeouts.push(t))
          break
        case 'hero':
          sound.playSequence([110.00, 146.83, 164.81, 220.00], 3000, 'sine', 0.04).forEach(t => timeouts.push(t))
          break
        case 'genesis':
          sound.playSequence([130.81, 174.61, 196.00, 261.63], 2500, 'triangle', 0.06).forEach(t => timeouts.push(t))
          break
        case 'oracle':
          sound.playSequence([73.42, 98.00, 123.47, 146.83], 4000, 'sine', 0.05).forEach(t => timeouts.push(t))
          break
        case 'afterimage':
          sound.playSequence([87.31, 116.54, 138.59, 174.61], 3500, 'sine', 0.05).forEach(t => timeouts.push(t))
          break
        case 'finale':
          sound.playSequence([146.83, 196.00, 220.00, 293.66], 2000, 'triangle', 0.07).forEach(t => timeouts.push(t))
          break
        default:
          break
      }
      return timeouts
    }

    const sequenceTimeouts = playSceneAmbient()
    sequenceTimeouts.forEach(t => sequenceTimeoutsRef.current.add(t))

    intervalRef.current = setInterval(() => {
      playSceneAmbient().forEach(t => sequenceTimeoutsRef.current.add(t))
    }, 15000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      sequenceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      sequenceTimeoutsRef.current.clear()
    }
  }, [sceneId, sound])

  return sound
}