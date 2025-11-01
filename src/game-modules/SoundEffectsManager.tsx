import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioManager, AudioConfig } from './AudioManager';

// Sound effect types and configurations
export interface SoundEffectConfig {
  id: string;
  name: string;
  category: 'gameplay' | 'ui' | 'ambient' | 'voice';
  variations: SoundVariation[];
  volume: number;
  pitch: number;
  randomPitchRange: number;
  randomVolumeRange: number;
  cooldown: number;
  maxInstances: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  priority: number;
  spatial: boolean;
}

export interface SoundVariation {
  id: string;
  url: string;
  weight: number; // Probability weight for random selection
  pitch: number;
  volume: number;
  duration?: number;
}

export interface PlaySoundOptions {
  volume?: number;
  pitch?: number;
  position?: { x: number; y: number; z: number };
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  onComplete?: () => void;
}

export interface SoundInstance {
  id: string;
  effectId: string;
  variationId: string;
  audioInstanceId: string;
  startTime: number;
  endTime?: number;
  volume: number;
  pitch: number;
  position?: { x: number; y: number; z: number };
  isPlaying: boolean;
  isPaused: boolean;
}

export interface SoundSequence {
  id: string;
  name: string;
  steps: SoundSequenceStep[];
  currentStep: number;
  isPlaying: boolean;
  loop: boolean;
}

export interface SoundSequenceStep {
  effectId: string;
  delay: number;
  options?: PlaySoundOptions;
  parallel?: boolean; // Play simultaneously with next step
}

export interface SoundEffectsManagerReturn {
  // State
  soundEffects: Map<string, SoundEffectConfig>;
  activeSounds: Map<string, SoundInstance>;
  soundSequences: Map<string, SoundSequence>;
  lastPlayTimes: Map<string, number>;
  
  // Configuration
  addSoundEffect: (config: SoundEffectConfig) => void;
  removeSoundEffect: (id: string) => void;
  updateSoundEffect: (id: string, updates: Partial<SoundEffectConfig>) => void;
  
  // Playback
  playSound: (effectId: string, options?: PlaySoundOptions) => Promise<string | null>;
  playSoundVariation: (effectId: string, variationId: string, options?: PlaySoundOptions) => Promise<string | null>;
  stopSound: (instanceId: string) => void;
  stopAllSounds: (effectId?: string) => void;
  pauseSound: (instanceId: string) => void;
  resumeSound: (instanceId: string) => void;
  
  // Sequences
  createSoundSequence: (sequence: Omit<SoundSequence, 'currentStep' | 'isPlaying'>) => void;
  playSoundSequence: (sequenceId: string) => void;
  stopSoundSequence: (sequenceId: string) => void;
  pauseSoundSequence: (sequenceId: string) => void;
  resumeSoundSequence: (sequenceId: string) => void;
  
  // Game-specific sounds
  playFlapSound: () => void;
  playScoreSound: () => void;
  playPowerUpSound: (powerUpType: string) => void;
  playCollisionSound: (type: 'obstacle' | 'ground' | 'coin') => void;
  playMenuSound: (action: 'hover' | 'click' | 'open' | 'close') => void;
  playAmbientSound: (biome: string) => void;
  
  // Utilities
  preloadSounds: () => Promise<void>;
  getSoundInfo: (effectId: string) => SoundEffectConfig | undefined;
  getActiveSounds: () => SoundInstance[];
  getSoundStats: () => object;
  cleanup: () => void;
}

// Predefined sound effects for the game
const GAME_SOUND_EFFECTS: SoundEffectConfig[] = [
  // Gameplay sounds
  {
    id: 'flap',
    name: 'Bird Flap',
    category: 'gameplay',
    variations: [
      { id: 'flap1', url: '/sounds/flap1.wav', weight: 1, pitch: 1.0, volume: 1.0 },
      { id: 'flap2', url: '/sounds/flap2.wav', weight: 1, pitch: 1.1, volume: 0.9 },
      { id: 'flap3', url: '/sounds/flap3.wav', weight: 1, pitch: 0.9, volume: 1.1 },
    ],
    volume: 0.7,
    pitch: 1.0,
    randomPitchRange: 0.2,
    randomVolumeRange: 0.1,
    cooldown: 50,
    maxInstances: 3,
    fadeIn: 0,
    fadeOut: 100,
    loop: false,
    priority: 2,
    spatial: true,
  },
  {
    id: 'score',
    name: 'Score Point',
    category: 'gameplay',
    variations: [
      { id: 'score1', url: '/sounds/score1.wav', weight: 2, pitch: 1.0, volume: 1.0 },
      { id: 'score2', url: '/sounds/score2.wav', weight: 1, pitch: 1.2, volume: 0.8 },
    ],
    volume: 0.8,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 100,
    maxInstances: 2,
    fadeIn: 0,
    fadeOut: 200,
    loop: false,
    priority: 3,
    spatial: false,
  },
  {
    id: 'collision_obstacle',
    name: 'Obstacle Collision',
    category: 'gameplay',
    variations: [
      { id: 'hit1', url: '/sounds/hit1.wav', weight: 1, pitch: 1.0, volume: 1.0 },
      { id: 'hit2', url: '/sounds/hit2.wav', weight: 1, pitch: 0.9, volume: 1.1 },
    ],
    volume: 0.9,
    pitch: 1.0,
    randomPitchRange: 0.3,
    randomVolumeRange: 0.1,
    cooldown: 200,
    maxInstances: 1,
    fadeIn: 0,
    fadeOut: 300,
    loop: false,
    priority: 5,
    spatial: true,
  },
  {
    id: 'collision_ground',
    name: 'Ground Collision',
    category: 'gameplay',
    variations: [
      { id: 'ground_hit', url: '/sounds/ground_hit.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.8,
    pitch: 1.0,
    randomPitchRange: 0.2,
    randomVolumeRange: 0.1,
    cooldown: 500,
    maxInstances: 1,
    fadeIn: 0,
    fadeOut: 500,
    loop: false,
    priority: 4,
    spatial: true,
  },
  
  // Power-up sounds
  {
    id: 'powerup_shield',
    name: 'Shield Power-up',
    category: 'gameplay',
    variations: [
      { id: 'shield_activate', url: '/sounds/shield_activate.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.6,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 0,
    maxInstances: 1,
    fadeIn: 100,
    fadeOut: 200,
    loop: false,
    priority: 3,
    spatial: false,
  },
  {
    id: 'powerup_speed',
    name: 'Speed Boost Power-up',
    category: 'gameplay',
    variations: [
      { id: 'speed_boost', url: '/sounds/speed_boost.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.6,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 0,
    maxInstances: 1,
    fadeIn: 100,
    fadeOut: 200,
    loop: false,
    priority: 3,
    spatial: false,
  },
  {
    id: 'powerup_magnet',
    name: 'Magnet Power-up',
    category: 'gameplay',
    variations: [
      { id: 'magnet_activate', url: '/sounds/magnet_activate.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.6,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 0,
    maxInstances: 1,
    fadeIn: 100,
    fadeOut: 200,
    loop: false,
    priority: 3,
    spatial: false,
  },
  
  // UI sounds
  {
    id: 'ui_hover',
    name: 'UI Hover',
    category: 'ui',
    variations: [
      { id: 'hover1', url: '/sounds/ui_hover.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.4,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 100,
    maxInstances: 1,
    fadeIn: 0,
    fadeOut: 100,
    loop: false,
    priority: 1,
    spatial: false,
  },
  {
    id: 'ui_click',
    name: 'UI Click',
    category: 'ui',
    variations: [
      { id: 'click1', url: '/sounds/ui_click.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.5,
    pitch: 1.0,
    randomPitchRange: 0.1,
    randomVolumeRange: 0.05,
    cooldown: 50,
    maxInstances: 2,
    fadeIn: 0,
    fadeOut: 100,
    loop: false,
    priority: 2,
    spatial: false,
  },
  
  // Ambient sounds
  {
    id: 'ambient_forest',
    name: 'Forest Ambient',
    category: 'ambient',
    variations: [
      { id: 'forest_ambience', url: '/sounds/forest_ambience.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.3,
    pitch: 1.0,
    randomPitchRange: 0.05,
    randomVolumeRange: 0.1,
    cooldown: 0,
    maxInstances: 1,
    fadeIn: 2000,
    fadeOut: 2000,
    loop: true,
    priority: 1,
    spatial: false,
  },
  {
    id: 'ambient_city',
    name: 'City Ambient',
    category: 'ambient',
    variations: [
      { id: 'city_ambience', url: '/sounds/city_ambience.wav', weight: 1, pitch: 1.0, volume: 1.0 },
    ],
    volume: 0.3,
    pitch: 1.0,
    randomPitchRange: 0.05,
    randomVolumeRange: 0.1,
    cooldown: 0,
    maxInstances: 1,
    fadeIn: 2000,
    fadeOut: 2000,
    loop: true,
    priority: 1,
    spatial: false,
  },
];

export const useSoundEffectsManager = (audioConfig?: Partial<AudioConfig>): SoundEffectsManagerReturn => {
  const audioManager = useAudioManager(audioConfig);
  
  // State
  const [soundEffects, setSoundEffects] = useState<Map<string, SoundEffectConfig>>(new Map());
  const [activeSounds, setActiveSounds] = useState<Map<string, SoundInstance>>(new Map());
  const [soundSequences, setSoundSequences] = useState<Map<string, SoundSequence>>(new Map());
  const [lastPlayTimes, setLastPlayTimes] = useState<Map<string, number>>(new Map());
  
  // Refs
  const sequenceTimeouts = useRef<Map<string, number>>(new Map());
  const nextInstanceId = useRef<number>(1);
  
  // Initialize default sound effects
  useEffect(() => {
    const effectsMap = new Map<string, SoundEffectConfig>();
    GAME_SOUND_EFFECTS.forEach(effect => {
      effectsMap.set(effect.id, effect);
    });
    setSoundEffects(effectsMap);
  }, []);
  
  // Configuration
  const addSoundEffect = useCallback((config: SoundEffectConfig) => {
    setSoundEffects(prev => new Map(prev).set(config.id, config));
    
    // Add audio sources for variations
    config.variations.forEach(variation => {
      audioManager.addAudioSource({
        id: `${config.id}_${variation.id}`,
        url: variation.url,
        category: config.category === 'gameplay' ? 'sfx' : config.category === 'ui' ? 'sfx' : 'ambient',
        volume: config.volume * variation.volume,
        loop: config.loop,
        preload: true,
      });
    });
  }, [audioManager]);
  
  const removeSoundEffect = useCallback((id: string) => {
    const effect = soundEffects.get(id);
    if (!effect) return;
    
    // Stop all active instances
    activeSounds.forEach((sound, instanceId) => {
      if (sound.effectId === id) {
        audioManager.stopSound(sound.audioInstanceId);
        setActiveSounds(prev => {
          const newActiveSounds = new Map(prev);
          newActiveSounds.delete(instanceId);
          return newActiveSounds;
        });
      }
    });
    
    // Remove audio sources
    effect.variations.forEach(variation => {
      audioManager.removeAudioSource(`${id}_${variation.id}`);
    });
    
    // Remove from effects
    setSoundEffects(prev => {
      const newEffects = new Map(prev);
      newEffects.delete(id);
      return newEffects;
    });
  }, [soundEffects, activeSounds, audioManager]);
  
  const updateSoundEffect = useCallback((id: string, updates: Partial<SoundEffectConfig>) => {
    setSoundEffects(prev => {
      const newEffects = new Map(prev);
      const effect = newEffects.get(id);
      if (effect) {
        newEffects.set(id, { ...effect, ...updates });
      }
      return newEffects;
    });
  }, []);
  
  // Utility functions
  const getRandomVariation = useCallback((effect: SoundEffectConfig): SoundVariation => {
    const totalWeight = effect.variations.reduce((sum, variation) => sum + variation.weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (const variation of effect.variations) {
      randomValue -= variation.weight;
      if (randomValue <= 0) {
        return variation;
      }
    }
    
    return effect.variations[0]; // Fallback
  }, []);
  
  const applyRandomization = useCallback((_effect: SoundEffectConfig, baseValue: number, range: number): number => {
    const randomOffset = (Math.random() - 0.5) * range;
    return Math.max(0.1, Math.min(2.0, baseValue + randomOffset));
  }, []);
  
  const checkCooldown = useCallback((effectId: string): boolean => {
    const effect = soundEffects.get(effectId);
    if (!effect || effect.cooldown === 0) return true;
    
    const lastPlayTime = lastPlayTimes.get(effectId) || 0;
    const now = Date.now();
    return (now - lastPlayTime) >= effect.cooldown;
  }, [soundEffects, lastPlayTimes]);
  
  const checkMaxInstances = useCallback((effectId: string): boolean => {
    const effect = soundEffects.get(effectId);
    if (!effect) return false;
    
    const activeCount = Array.from(activeSounds.values()).filter(sound => 
      sound.effectId === effectId && sound.isPlaying
    ).length;
    
    return activeCount < effect.maxInstances;
  }, [soundEffects, activeSounds]);
  
  // Playback
  const playSound = useCallback(async (
    effectId: string, 
    options: PlaySoundOptions = {}
  ): Promise<string | null> => {
    const effect = soundEffects.get(effectId);
    if (!effect) {
      console.warn(`Sound effect ${effectId} not found`);
      return null;
    }
    
    // Check cooldown
    if (!checkCooldown(effectId)) {
      return null;
    }
    
    // Check max instances
    if (!checkMaxInstances(effectId)) {
      // Stop oldest instance if at limit
      const oldestSound = Array.from(activeSounds.values())
        .filter(sound => sound.effectId === effectId && sound.isPlaying)
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      if (oldestSound) {
        stopSound(oldestSound.id);
      }
    }
    
    // Select variation
    const variation = getRandomVariation(effect);
    
    // Calculate final volume and pitch
    const finalVolume = applyRandomization(
      effect,
      (options.volume ?? effect.volume) * variation.volume,
      effect.randomVolumeRange
    );
    
    const finalPitch = applyRandomization(
      effect,
      (options.pitch ?? effect.pitch) * variation.pitch,
      effect.randomPitchRange
    );
    
    // Play audio
    const audioInstanceId = await audioManager.playSound(`${effectId}_${variation.id}`, {
      volume: finalVolume,
      playbackRate: finalPitch,
      loop: options.loop ?? effect.loop,
      position: options.position,
    });
    
    if (!audioInstanceId) {
      return null;
    }
    
    // Create sound instance
    const instanceId = `sound_${nextInstanceId.current++}`;
    const soundInstance: SoundInstance = {
      id: instanceId,
      effectId,
      variationId: variation.id,
      audioInstanceId,
      startTime: Date.now(),
      volume: finalVolume,
      pitch: finalPitch,
      position: options.position,
      isPlaying: true,
      isPaused: false,
    };
    
    // Apply fade in
    const fadeInDuration = options.fadeIn ?? effect.fadeIn;
    if (fadeInDuration > 0) {
      audioManager.fadeIn(audioInstanceId, fadeInDuration);
    }
    
    // Add to active sounds
    setActiveSounds(prev => new Map(prev).set(instanceId, soundInstance));
    
    // Update last play time
    setLastPlayTimes(prev => new Map(prev).set(effectId, Date.now()));
    
    // Set up completion callback
    if (options.onComplete || !effect.loop) {
      const duration = variation.duration || 1000; // Default duration
      setTimeout(() => {
        if (options.onComplete) {
          options.onComplete();
        }
        
        setActiveSounds(prev => {
          const newActiveSounds = new Map(prev);
          newActiveSounds.delete(instanceId);
          return newActiveSounds;
        });
      }, duration);
    }
    
    return instanceId;
  }, [
    soundEffects,
    activeSounds,
    audioManager,
    checkCooldown,
    checkMaxInstances,
    getRandomVariation,
    applyRandomization,
  ]);
  
  const playSoundVariation = useCallback(async (
    effectId: string,
    variationId: string,
    options: PlaySoundOptions = {}
  ): Promise<string | null> => {
    const effect = soundEffects.get(effectId);
    if (!effect) return null;
    
    const variation = effect.variations.find(v => v.id === variationId);
    if (!variation) return null;
    
    // Temporarily override variations to force specific variation
    const tempEffect = {
      ...effect,
      variations: [variation],
    };
    
    setSoundEffects(prev => new Map(prev).set(effectId, tempEffect));
    const result = await playSound(effectId, options);
    setSoundEffects(prev => new Map(prev).set(effectId, effect)); // Restore original
    
    return result;
  }, [soundEffects, playSound]);
  
  const stopSound = useCallback((instanceId: string) => {
    const soundInstance = activeSounds.get(instanceId);
    if (!soundInstance) return;
    
    const effect = soundEffects.get(soundInstance.effectId);
    const fadeOutDuration = effect?.fadeOut || 0;
    
    if (fadeOutDuration > 0) {
      audioManager.fadeOut(soundInstance.audioInstanceId, fadeOutDuration);
    } else {
      audioManager.stopSound(soundInstance.audioInstanceId);
    }
    
    setActiveSounds(prev => {
      const newActiveSounds = new Map(prev);
      newActiveSounds.delete(instanceId);
      return newActiveSounds;
    });
  }, [activeSounds, soundEffects, audioManager]);
  
  const stopAllSounds = useCallback((effectId?: string) => {
    activeSounds.forEach((sound, instanceId) => {
      if (!effectId || sound.effectId === effectId) {
        stopSound(instanceId);
      }
    });
  }, [activeSounds, stopSound]);
  
  const pauseSound = useCallback((instanceId: string) => {
    const soundInstance = activeSounds.get(instanceId);
    if (!soundInstance) return;
    
    audioManager.pauseSound(soundInstance.audioInstanceId);
    
    setActiveSounds(prev => {
      const newActiveSounds = new Map(prev);
      newActiveSounds.set(instanceId, { ...soundInstance, isPaused: true, isPlaying: false });
      return newActiveSounds;
    });
  }, [activeSounds, audioManager]);
  
  const resumeSound = useCallback((instanceId: string) => {
    const soundInstance = activeSounds.get(instanceId);
    if (!soundInstance) return;
    
    audioManager.resumeSound(soundInstance.audioInstanceId);
    
    setActiveSounds(prev => {
      const newActiveSounds = new Map(prev);
      newActiveSounds.set(instanceId, { ...soundInstance, isPaused: false, isPlaying: true });
      return newActiveSounds;
    });
  }, [activeSounds, audioManager]);
  
  // Sound sequences
  const createSoundSequence = useCallback((sequence: Omit<SoundSequence, 'currentStep' | 'isPlaying'>) => {
    const newSequence: SoundSequence = {
      ...sequence,
      currentStep: 0,
      isPlaying: false,
    };
    setSoundSequences(prev => new Map(prev).set(sequence.id, newSequence));
  }, []);
  
  const playSoundSequence = useCallback((sequenceId: string) => {
    const sequence = soundSequences.get(sequenceId);
    if (!sequence || sequence.isPlaying) return;
    
    setSoundSequences(prev => new Map(prev).set(sequenceId, { ...sequence, isPlaying: true, currentStep: 0 }));
    
    const playNextStep = (stepIndex: number) => {
      const currentSequence = soundSequences.get(sequenceId);
      if (!currentSequence || !currentSequence.isPlaying || stepIndex >= currentSequence.steps.length) {
        if (currentSequence?.loop && currentSequence.isPlaying) {
          playNextStep(0); // Restart sequence
        } else {
          setSoundSequences(prev => new Map(prev).set(sequenceId, { ...currentSequence!, isPlaying: false }));
        }
        return;
      }
      
      const step = currentSequence.steps[stepIndex];
      
      // Play sound after delay
      const timeoutId = window.setTimeout(() => {
        playSound(step.effectId, step.options);
        
        // Update current step
        setSoundSequences(prev => {
          const updated = new Map(prev);
          const seq = updated.get(sequenceId);
          if (seq) {
            updated.set(sequenceId, { ...seq, currentStep: stepIndex });
          }
          return updated;
        });
        
        // Schedule next step
        if (!step.parallel) {
          playNextStep(stepIndex + 1);
        } else {
          // Play next step immediately in parallel
          playNextStep(stepIndex + 1);
        }
        
        sequenceTimeouts.current.delete(sequenceId);
      }, step.delay);
      
      sequenceTimeouts.current.set(sequenceId, timeoutId);
    };
    
    playNextStep(0);
  }, [soundSequences, playSound]);
  
  const stopSoundSequence = useCallback((sequenceId: string) => {
    const sequence = soundSequences.get(sequenceId);
    if (!sequence) return;
    
    // Clear timeout
    const timeoutId = sequenceTimeouts.current.get(sequenceId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      sequenceTimeouts.current.delete(sequenceId);
    }
    
    setSoundSequences(prev => new Map(prev).set(sequenceId, { ...sequence, isPlaying: false }));
  }, [soundSequences]);
  
  const pauseSoundSequence = useCallback((sequenceId: string) => {
    // For simplicity, just stop the sequence
    stopSoundSequence(sequenceId);
  }, [stopSoundSequence]);
  
  const resumeSoundSequence = useCallback((sequenceId: string) => {
    // For simplicity, restart the sequence
    playSoundSequence(sequenceId);
  }, [playSoundSequence]);
  
  // Game-specific sound functions
  const playFlapSound = useCallback(() => {
    playSound('flap');
  }, [playSound]);
  
  const playScoreSound = useCallback(() => {
    playSound('score');
  }, [playSound]);
  
  const playPowerUpSound = useCallback((powerUpType: string) => {
    const soundId = `powerup_${powerUpType}`;
    playSound(soundId);
  }, [playSound]);
  
  const playCollisionSound = useCallback((type: 'obstacle' | 'ground' | 'coin') => {
    if (type === 'coin') {
      playScoreSound();
    } else {
      const soundId = `collision_${type}`;
      playSound(soundId);
    }
  }, [playSound, playScoreSound]);
  
  const playMenuSound = useCallback((action: 'hover' | 'click' | 'open' | 'close') => {
    const soundId = `ui_${action}`;
    playSound(soundId);
  }, [playSound]);
  
  const playAmbientSound = useCallback((biome: string) => {
    // Stop current ambient sounds
    stopAllSounds();
    
    // Play new ambient sound
    const soundId = `ambient_${biome}`;
    playSound(soundId, { loop: true });
  }, [playSound, stopAllSounds]);
  
  // Utilities
  const preloadSounds = useCallback(async () => {
    // Initialize audio if needed
    if (!audioManager.isInitialized) {
      await audioManager.initializeAudio();
    }
    
    // Add all sound sources
    for (const effect of soundEffects.values()) {
      for (const variation of effect.variations) {
        await audioManager.addAudioSource({
          id: `${effect.id}_${variation.id}`,
          url: variation.url,
          category: effect.category === 'gameplay' ? 'sfx' : effect.category === 'ui' ? 'sfx' : 'ambient',
          volume: effect.volume * variation.volume,
          loop: effect.loop,
          preload: true,
        });
      }
    }
    
    // Load all sources
    await audioManager.loadAllSources();
  }, [audioManager, soundEffects]);
  
  const getSoundInfo = useCallback((effectId: string): SoundEffectConfig | undefined => {
    return soundEffects.get(effectId);
  }, [soundEffects]);
  
  const getActiveSounds = useCallback((): SoundInstance[] => {
    return Array.from(activeSounds.values());
  }, [activeSounds]);
  
  const getSoundStats = useCallback(() => {
    const stats = {
      totalEffects: soundEffects.size,
      activeSounds: activeSounds.size,
      playingSounds: Array.from(activeSounds.values()).filter(s => s.isPlaying).length,
      pausedSounds: Array.from(activeSounds.values()).filter(s => s.isPaused).length,
      sequences: soundSequences.size,
      playingSequences: Array.from(soundSequences.values()).filter(s => s.isPlaying).length,
      audioManagerInfo: audioManager.getAudioInfo(),
    };
    
    return stats;
  }, [soundEffects, activeSounds, soundSequences, audioManager]);
  
  const cleanup = useCallback(() => {
    // Stop all sounds
    stopAllSounds();
    
    // Clear all timeouts
    sequenceTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    sequenceTimeouts.current.clear();
    
    // Cleanup audio manager
    audioManager.cleanup();
  }, [stopAllSounds, audioManager]);
  
  // Initialize sound effects on mount
  useEffect(() => {
    GAME_SOUND_EFFECTS.forEach(effect => {
      addSoundEffect(effect);
    });
  }, [addSoundEffect]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    // State
    soundEffects,
    activeSounds,
    soundSequences,
    lastPlayTimes,
    
    // Configuration
    addSoundEffect,
    removeSoundEffect,
    updateSoundEffect,
    
    // Playback
    playSound,
    playSoundVariation,
    stopSound,
    stopAllSounds,
    pauseSound,
    resumeSound,
    
    // Sequences
    createSoundSequence,
    playSoundSequence,
    stopSoundSequence,
    pauseSoundSequence,
    resumeSoundSequence,
    
    // Game-specific sounds
    playFlapSound,
    playScoreSound,
    playPowerUpSound,
    playCollisionSound,
    playMenuSound,
    playAmbientSound,
    
    // Utilities
    preloadSounds,
    getSoundInfo,
    getActiveSounds,
    getSoundStats,
    cleanup,
  };
};

export default useSoundEffectsManager;