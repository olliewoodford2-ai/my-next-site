'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSoundStore } from '@/store'

export function useSoundManager() {
  const {
    isMuted,
    masterVolume,
    ambientVolume,
    effectsVolume,
    musicVolume,
    setMute,
    setMasterVolume,
    setAmbientVolume,
    setEffectsVolume,
    setMusicVolume,
  } = useSoundStore()

  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)
  const effectsGainRef = useRef<GainNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map())
  const initializedRef = useRef(false)

  const initializeAudio = useCallback(async () => {
    if (initializedRef.current) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      masterGainRef.current = audioContext.createGain()
      ambientGainRef.current = audioContext.createGain()
      effectsGainRef.current = audioContext.createGain()
      musicGainRef.current = audioContext.createGain()

      masterGainRef.current.gain.value = masterVolume
      ambientGainRef.current.gain.value = ambientVolume
      effectsGainRef.current.gain.value = effectsVolume
      musicGainRef.current.gain.value = musicVolume

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
  }, [masterVolume, ambientVolume, effectsVolume, musicVolume])

  const playAmbientTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.1) => {
      if (!audioContextRef.current || !ambientGainRef.current || isMuted) return

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
    [isMuted]
  )

  const playEffectTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.2) => {
      if (!audioContextRef.current || !effectsGainRef.current || isMuted) return

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
    [isMuted]
  )

  const playMusicTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) => {
      if (!audioContextRef.current || !musicGainRef.current || isMuted) return

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
    [isMuted]
  )

  const playSequence = useCallback(
    (frequencies: number[], interval: number, type: OscillatorType = 'sine', gain = 0.15) => {
      const timeouts: NodeJS.Timeout[] = []
      frequencies.forEach((freq, i) => {
        const timeout = setTimeout(() => {
          // Check current mute state at execution time, not capture time
          const { isMuted: currentMuted } = useSoundStore.getState()
          if (!currentMuted) {
            playAmbientTone(freq, interval * 1.5, type, gain)
          }
        }, i * interval)
        timeouts.push(timeout)
      })
      return timeouts
    },
    [playAmbientTone]
  )

  const setMasterVolumeValue = useCallback(
    (volume: number) => {
      setMasterVolume(volume)
      if (masterGainRef.current) {
        masterGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current!.currentTime + 0.1)
      }
    },
    [setMasterVolume]
  )

  const setAmbientVolumeValue = useCallback(
    (volume: number) => {
      setAmbientVolume(volume)
      if (ambientGainRef.current) {
        ambientGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current!.currentTime + 0.1)
      }
    },
    [setAmbientVolume]
  )

  const setEffectsVolumeValue = useCallback(
    (volume: number) => {
      setEffectsVolume(volume)
      if (effectsGainRef.current) {
        effectsGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current!.currentTime + 0.1)
      }
    },
    [setEffectsVolume]
  )

  const setMusicVolumeValue = useCallback(
    (volume: number) => {
      setMusicVolume(volume)
      if (musicGainRef.current) {
        musicGainRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current!.currentTime + 0.1)
      }
    },
    [setMusicVolume]
  )

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setMute(newMuted)
    if (masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(newMuted ? 0 : masterVolume, audioContextRef.current!.currentTime + 0.1)
    }
  }, [isMuted, masterVolume, setMute])

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

      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop()
        } catch {}
      })
      oscillatorsRef.current.clear()

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      masterGainRef.current = null
      ambientGainRef.current = null
      effectsGainRef.current = null
      musicGainRef.current = null
      initializedRef.current = false
    }
  }, [initializeAudio])

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

  useEffect(() => {
    if (!sound.isInitialized) return

    const playSceneAmbient = (): NodeJS.Timeout[] => {
      switch (sceneId) {
        case 'opening':
          return sound.playSequence([65.41, 82.41, 98.00, 130.81], 2000, 'sine', 0.05)
        case 'hero':
          return sound.playSequence([110.00, 146.83, 164.81, 220.00], 3000, 'sine', 0.04)
        case 'genesis':
          return sound.playSequence([130.81, 174.61, 196.00, 261.63], 2500, 'triangle', 0.06)
        case 'oracle':
          return sound.playSequence([73.42, 98.00, 123.47, 146.83], 4000, 'sine', 0.05)
        case 'afterimage':
          return sound.playSequence([87.31, 116.54, 138.59, 174.61], 3500, 'sine', 0.05)
        case 'finale':
          return sound.playSequence([146.83, 196.00, 220.00, 293.66], 2000, 'triangle', 0.07)
        default:
          return []
      }
    }

    const sequenceTimeouts = playSceneAmbient()
    const interval = setInterval(() => {
      sequenceTimeouts.push(...playSceneAmbient())
    }, 15000)

    return () => {
      clearInterval(interval)
      sequenceTimeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [sceneId, sound])

  return sound
}