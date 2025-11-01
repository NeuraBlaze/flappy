// ===== 🔊 SOUND SYSTEM =====
// Audio management and sound effects
// Separated from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface SoundVariations {
  jumpSounds: number[];
  currentJumpIndex: number;
}

export interface SoundSystemConfig {
  // Audio settings
  enableAudio: boolean;
  masterVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  // Performance settings
  enableSoundVariations: boolean;
  maxConcurrentSounds: number;
  // Sound variations
  jumpSounds: number[];
}

export interface SoundEffect {
  type: 'jump' | 'score' | 'hit' | 'powerup' | 'explosion' | 'coin' | 'achievement';
  frequency: number;
  duration: number;
  volume?: number;
}

export interface UseSoundSystemReturn {
  // State
  isAudioInitialized: boolean;
  config: SoundSystemConfig;
  
  // Actions
  initAudio: () => Promise<boolean>;
  playSound: (frequency: number, duration: number, type?: SoundEffect['type']) => void;
  playSoundEffect: (effect: SoundEffect) => void;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  
  // Music
  playBackgroundMusic: (theme: string) => void;
  stopBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
  
  // Utilities
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  
  // Configuration
  updateConfig: (newConfig: Partial<SoundSystemConfig>) => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: SoundSystemConfig = {
  enableAudio: true,
  masterVolume: 1.0,
  sfxVolume: 1.0,
  musicVolume: 0.7,
  enableSoundVariations: true,
  maxConcurrentSounds: 8,
  jumpSounds: [440, 494, 523, 587], // A4, B4, C5, D5
};

// ===== CUSTOM HOOK =====
export function useSoundSystem(
  config: Partial<SoundSystemConfig> = {}
): UseSoundSystemReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  
  // ===== STATE =====
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isMutedState, setIsMutedState] = useState(false);
  
  // ===== AUDIO CONTEXT =====
  const audioContext = useRef<AudioContext | null>(null);
  const activeSounds = useRef<Set<OscillatorNode>>(new Set());
  const backgroundMusic = useRef<{
    playing: boolean;
    paused: boolean;
    theme: string | null;
  }>({
    playing: false,
    paused: false,
    theme: null
  });
  
  // ===== SOUND VARIATIONS =====
  const soundVariations = useRef<SoundVariations>({
    jumpSounds: finalConfig.current.jumpSounds,
    currentJumpIndex: 0
  });
  
  // ===== AUDIO INITIALIZATION =====
  const initAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioContext.current) {
        // Create audio context with proper browser compatibility
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext.current = new AudioContextClass();
      }
      
      // Resume context if suspended (required for Chrome autoplay policy)
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }
      
      setIsAudioInitialized(true);
      return true;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      setIsAudioInitialized(false);
      return false;
    }
  }, []);
  
  // ===== SOUND EFFECTS =====
  const playSound = useCallback((frequency: number, duration: number, type: SoundEffect['type'] = 'jump') => {
    if (!audioContext.current || !finalConfig.current.enableAudio || isMutedState) return;
    
    // Limit concurrent sounds for performance
    if (activeSounds.current.size >= finalConfig.current.maxConcurrentSounds) {
      // Remove oldest sound
      const oldestSound = activeSounds.current.values().next().value;
      if (oldestSound) {
        oldestSound.stop();
        activeSounds.current.delete(oldestSound);
      }
    }
    
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      const now = audioContext.current.currentTime;
      const volume = finalConfig.current.masterVolume * finalConfig.current.sfxVolume * 0.1;
      
      // Configure sound based on type
      switch (type) {
        case 'jump':
          if (finalConfig.current.enableSoundVariations) {
            const jumpVariations = soundVariations.current.jumpSounds;
            const randomJump = jumpVariations[Math.floor(Math.random() * jumpVariations.length)];
            oscillator.frequency.setValueAtTime(randomJump, now);
            oscillator.frequency.exponentialRampToValueAtTime(randomJump * 0.7, now + duration);
            oscillator.frequency.setValueAtTime(randomJump * 1.05, now + duration * 0.1);
          } else {
            oscillator.frequency.setValueAtTime(frequency, now);
          }
          oscillator.type = 'square';
          break;
          
        case 'score':
          oscillator.frequency.setValueAtTime(frequency, now);
          oscillator.frequency.setValueAtTime(frequency * 1.5, now + duration * 0.5);
          oscillator.type = 'sine';
          break;
          
        case 'hit':
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.exponentialRampToValueAtTime(50, now + duration);
          oscillator.type = 'sawtooth';
          break;
          
        case 'powerup':
          oscillator.frequency.setValueAtTime(frequency, now);
          oscillator.frequency.setValueAtTime(frequency * 2, now + duration * 0.3);
          oscillator.frequency.setValueAtTime(frequency * 1.5, now + duration);
          oscillator.type = 'triangle';
          break;
          
        case 'explosion':
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.exponentialRampToValueAtTime(30, now + duration);
          oscillator.type = 'sawtooth';
          break;
          
        case 'coin':
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.setValueAtTime(1200, now + duration * 0.3);
          oscillator.frequency.setValueAtTime(1000, now + duration);
          oscillator.type = 'sine';
          break;
          
        case 'achievement':
          oscillator.frequency.setValueAtTime(523, now); // C5
          oscillator.frequency.setValueAtTime(659, now + duration * 0.25); // E5
          oscillator.frequency.setValueAtTime(784, now + duration * 0.5); // G5
          oscillator.frequency.setValueAtTime(1047, now + duration * 0.75); // C6
          oscillator.type = 'sine';
          break;
          
        default:
          oscillator.frequency.setValueAtTime(frequency, now);
          oscillator.type = 'square';
      }
      
      // Configure gain envelope
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Track active sound
      activeSounds.current.add(oscillator);
      
      // Cleanup when sound ends
      oscillator.addEventListener('ended', () => {
        activeSounds.current.delete(oscillator);
      });
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [isMutedState]);
  
  const playSoundEffect = useCallback((effect: SoundEffect) => {
    const volume = effect.volume || 1.0;
    const adjustedDuration = effect.duration * volume;
    playSound(effect.frequency, adjustedDuration, effect.type);
  }, [playSound]);
  
  // ===== BACKGROUND MUSIC =====
  const playBackgroundMusic = useCallback((theme: string) => {
    if (!finalConfig.current.enableAudio || isMutedState) return;
    
    backgroundMusic.current = {
      playing: true,
      paused: false,
      theme
    };
    
    // TODO: Implement actual background music playback
    // This would typically involve loading and playing audio files
    console.log(`Playing background music theme: ${theme}`);
  }, [isMutedState]);
  
  const stopBackgroundMusic = useCallback(() => {
    backgroundMusic.current = {
      playing: false,
      paused: false,
      theme: null
    };
  }, []);
  
  const pauseBackgroundMusic = useCallback(() => {
    if (backgroundMusic.current.playing) {
      backgroundMusic.current.paused = true;
    }
  }, []);
  
  const resumeBackgroundMusic = useCallback(() => {
    if (backgroundMusic.current.playing && backgroundMusic.current.paused) {
      backgroundMusic.current.paused = false;
    }
  }, []);
  
  // ===== VOLUME CONTROLS =====
  const setMasterVolume = useCallback((volume: number) => {
    finalConfig.current.masterVolume = Math.max(0, Math.min(1, volume));
  }, []);
  
  const setSfxVolume = useCallback((volume: number) => {
    finalConfig.current.sfxVolume = Math.max(0, Math.min(1, volume));
  }, []);
  
  const setMusicVolume = useCallback((volume: number) => {
    finalConfig.current.musicVolume = Math.max(0, Math.min(1, volume));
  }, []);
  
  // ===== MUTE CONTROLS =====
  const mute = useCallback(() => {
    setIsMutedState(true);
    // Stop all active sounds
    activeSounds.current.forEach(sound => {
      try {
        sound.stop();
      } catch (error) {
        // Sound might already be stopped
      }
    });
    activeSounds.current.clear();
    pauseBackgroundMusic();
  }, [pauseBackgroundMusic]);
  
  const unmute = useCallback(() => {
    setIsMutedState(false);
    resumeBackgroundMusic();
  }, [resumeBackgroundMusic]);
  
  const isMuted = useCallback((): boolean => {
    return isMutedState;
  }, [isMutedState]);
  
  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<SoundSystemConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
    
    // Update sound variations if changed
    if (newConfig.jumpSounds) {
      soundVariations.current.jumpSounds = newConfig.jumpSounds;
    }
  }, []);
  
  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      // Cleanup all active sounds
      activeSounds.current.forEach(sound => {
        try {
          sound.stop();
        } catch (error) {
          // Sound might already be stopped
        }
      });
      activeSounds.current.clear();
      
      // Close audio context
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
    };
  }, []);
  
  return {
    // State
    isAudioInitialized,
    config: finalConfig.current,
    
    // Actions
    initAudio,
    playSound,
    playSoundEffect,
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    
    // Music
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    
    // Utilities
    mute,
    unmute,
    isMuted,
    
    // Configuration
    updateConfig,
  };
}

// ===== COMPONENT EXPORT =====
export default useSoundSystem;