import { useState, useCallback, useRef, useEffect } from 'react';

// Audio context and configuration types
export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  enableAudio: boolean;
  enableSpatialAudio: boolean;
  maxPolyphony: number;
  audioContextSampleRate: number;
  enableCompression: boolean;
  enableReverb: boolean;
  preloadSounds: boolean;
  crossfadeDuration: number;
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface AudioSource {
  id: string;
  url: string;
  buffer?: AudioBuffer;
  isLoaded: boolean;
  isLoading: boolean;
  loadError?: string;
  category: 'sfx' | 'music' | 'voice' | 'ambient';
  volume: number;
  loop: boolean;
  preload: boolean;
}

export interface AudioInstance {
  id: string;
  sourceId: string;
  gainNode: GainNode;
  sourceNode?: AudioBufferSourceNode;
  pannerNode?: PannerNode;
  filterNode?: BiquadFilterNode;
  isPlaying: boolean;
  isPaused: boolean;
  startTime: number;
  pauseTime: number;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  loop: boolean;
  position?: { x: number; y: number; z: number };
}

export interface AudioLoadProgress {
  sourceId: string;
  loaded: number;
  total: number;
  progress: number;
}

export interface AudioManagerReturn {
  // State
  isInitialized: boolean;
  audioContext: AudioContext | null;
  config: AudioConfig;
  sources: Map<string, AudioSource>;
  instances: Map<string, AudioInstance>;
  loadingProgress: AudioLoadProgress[];
  
  // Audio context management
  initializeAudio: () => Promise<boolean>;
  suspendAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  closeAudio: () => Promise<void>;
  
  // Source management
  addAudioSource: (source: Omit<AudioSource, 'isLoaded' | 'isLoading'>) => Promise<void>;
  removeAudioSource: (id: string) => void;
  loadAudioSource: (id: string) => Promise<boolean>;
  unloadAudioSource: (id: string) => void;
  loadAllSources: () => Promise<void>;
  
  // Playback control
  playSound: (sourceId: string, options?: Partial<AudioInstance>) => Promise<string | null>;
  stopSound: (instanceId: string) => void;
  pauseSound: (instanceId: string) => void;
  resumeSound: (instanceId: string) => void;
  stopAllSounds: (category?: AudioSource['category']) => void;
  
  // Volume and effects
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioSource['category'], volume: number) => void;
  setInstanceVolume: (instanceId: string, volume: number) => void;
  fadeIn: (instanceId: string, duration?: number) => void;
  fadeOut: (instanceId: string, duration?: number) => void;
  crossfade: (fromInstanceId: string, toInstanceId: string, duration?: number) => void;
  
  // Spatial audio
  setListenerPosition: (x: number, y: number, z: number) => void;
  setListenerOrientation: (fx: number, fy: number, fz: number, ux: number, uy: number, uz: number) => void;
  setSoundPosition: (instanceId: string, x: number, y: number, z: number) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<AudioConfig>) => void;
  
  // Utilities
  getAudioInfo: () => object;
  getSourceInfo: (sourceId: string) => AudioSource | undefined;
  getInstanceInfo: (instanceId: string) => AudioInstance | undefined;
  getPlayingSounds: () => AudioInstance[];
  cleanup: () => void;
}

// Default configuration
const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.6,
  enableAudio: true,
  enableSpatialAudio: true,
  maxPolyphony: 32,
  audioContextSampleRate: 44100,
  enableCompression: true,
  enableReverb: false,
  preloadSounds: true,
  crossfadeDuration: 1000,
  fadeInDuration: 500,
  fadeOutDuration: 500,
};

export const useAudioManager = (initialConfig: Partial<AudioConfig> = {}): AudioManagerReturn => {
  // Configuration
  const audioConfig: AudioConfig = { ...DEFAULT_AUDIO_CONFIG, ...initialConfig };
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<AudioConfig>(audioConfig);
  const [sources, setSources] = useState<Map<string, AudioSource>>(new Map());
  const [instances, setInstances] = useState<Map<string, AudioInstance>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState<AudioLoadProgress[]>([]);
  
  // Refs for audio nodes
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const categoryGains = useRef<Map<string, GainNode>>(new Map());
  const compressor = useRef<DynamicsCompressorNode | null>(null);
  const convolver = useRef<ConvolverNode | null>(null);
  const nextInstanceId = useRef<number>(1);
  
  // Initialize audio context and master nodes
  const initializeAudio = useCallback(async (): Promise<boolean> => {
    try {
      // Create audio context
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: config.audioContextSampleRate,
      });
      
      // Create master gain node
      masterGain.current = audioContext.current.createGain();
      masterGain.current.gain.value = config.masterVolume;
      
      // Create category gain nodes
      const categories: AudioSource['category'][] = ['sfx', 'music', 'voice', 'ambient'];
      categories.forEach(category => {
        const gainNode = audioContext.current!.createGain();
        gainNode.gain.value = getCategoryVolume(category);
        gainNode.connect(masterGain.current!);
        categoryGains.current.set(category, gainNode);
      });
      
      // Create compressor if enabled
      if (config.enableCompression) {
        compressor.current = audioContext.current.createDynamicsCompressor();
        compressor.current.threshold.value = -24;
        compressor.current.knee.value = 30;
        compressor.current.ratio.value = 12;
        compressor.current.attack.value = 0.003;
        compressor.current.release.value = 0.25;
        masterGain.current.connect(compressor.current);
        compressor.current.connect(audioContext.current.destination);
      } else {
        masterGain.current.connect(audioContext.current.destination);
      }
      
      // Create reverb convolver if enabled
      if (config.enableReverb) {
        convolver.current = audioContext.current.createConvolver();
        // Create impulse response for reverb
        createReverbImpulse();
      }
      
      // Resume context if suspended
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }, [config.audioContextSampleRate, config.masterVolume, config.enableCompression, config.enableReverb]);
  
  // Helper function to get category volume
  const getCategoryVolume = useCallback((category: AudioSource['category']): number => {
    switch (category) {
      case 'sfx': return config.sfxVolume;
      case 'music': return config.musicVolume;
      case 'voice': return config.sfxVolume;
      case 'ambient': return config.musicVolume * 0.5;
      default: return 1.0;
    }
  }, [config.sfxVolume, config.musicVolume]);
  
  // Create reverb impulse response
  const createReverbImpulse = useCallback(() => {
    if (!audioContext.current || !convolver.current) return;
    
    const sampleRate = audioContext.current.sampleRate;
    const length = sampleRate * 2; // 2 seconds reverb
    const impulse = audioContext.current.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    convolver.current.buffer = impulse;
  }, []);
  
  // Audio context state management
  const suspendAudio = useCallback(async (): Promise<void> => {
    if (audioContext.current && audioContext.current.state === 'running') {
      await audioContext.current.suspend();
    }
  }, []);
  
  const resumeAudio = useCallback(async (): Promise<void> => {
    if (audioContext.current && audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
  }, []);
  
  const closeAudio = useCallback(async (): Promise<void> => {
    // Stop all sounds
    instances.forEach((_, instanceId) => {
      stopSound(instanceId);
    });
    
    // Close audio context
    if (audioContext.current && audioContext.current.state !== 'closed') {
      await audioContext.current.close();
    }
    
    // Reset state
    setIsInitialized(false);
    setSources(new Map());
    setInstances(new Map());
    audioContext.current = null;
    masterGain.current = null;
    categoryGains.current.clear();
    compressor.current = null;
    convolver.current = null;
  }, [instances]);
  
  // Source management
  const addAudioSource = useCallback(async (source: Omit<AudioSource, 'isLoaded' | 'isLoading'>) => {
    const newSource: AudioSource = {
      ...source,
      isLoaded: false,
      isLoading: false,
    };
    
    setSources(prev => new Map(prev).set(source.id, newSource));
    
    if (source.preload || config.preloadSounds) {
      await loadAudioSource(source.id);
    }
  }, [config.preloadSounds]);
  
  const removeAudioSource = useCallback((id: string) => {
    // Stop all instances of this source
    instances.forEach((instance, instanceId) => {
      if (instance.sourceId === id) {
        stopSound(instanceId);
      }
    });
    
    // Remove source
    setSources(prev => {
      const newSources = new Map(prev);
      newSources.delete(id);
      return newSources;
    });
  }, [instances]);
  
  const loadAudioSource = useCallback(async (id: string): Promise<boolean> => {
    const source = sources.get(id);
    if (!source || source.isLoaded || source.isLoading) {
      return source?.isLoaded || false;
    }
    
    if (!audioContext.current) {
      console.warn('Audio context not initialized');
      return false;
    }
    
    try {
      // Mark as loading
      setSources(prev => {
        const newSources = new Map(prev);
        const updatedSource = { ...source, isLoading: true };
        newSources.set(id, updatedSource);
        return newSources;
      });
      
      // Add to loading progress
      setLoadingProgress(prev => [...prev, { sourceId: id, loaded: 0, total: 0, progress: 0 }]);
      
      // Fetch audio data
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Update progress
      setLoadingProgress(prev => 
        prev.map(p => p.sourceId === id ? { ...p, loaded: arrayBuffer.byteLength, total: arrayBuffer.byteLength, progress: 100 } : p)
      );
      
      // Decode audio data
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      
      // Update source with buffer
      setSources(prev => {
        const newSources = new Map(prev);
        const updatedSource = { 
          ...source, 
          buffer: audioBuffer, 
          isLoaded: true, 
          isLoading: false,
          loadError: undefined
        };
        newSources.set(id, updatedSource);
        return newSources;
      });
      
      // Remove from loading progress
      setLoadingProgress(prev => prev.filter(p => p.sourceId !== id));
      
      return true;
    } catch (error) {
      console.error(`Failed to load audio source ${id}:`, error);
      
      // Update source with error
      setSources(prev => {
        const newSources = new Map(prev);
        const updatedSource = { 
          ...source, 
          isLoading: false,
          loadError: error instanceof Error ? error.message : 'Unknown error'
        };
        newSources.set(id, updatedSource);
        return newSources;
      });
      
      // Remove from loading progress
      setLoadingProgress(prev => prev.filter(p => p.sourceId !== id));
      
      return false;
    }
  }, [sources]);
  
  const unloadAudioSource = useCallback((id: string) => {
    // Stop all instances of this source
    instances.forEach((instance, instanceId) => {
      if (instance.sourceId === id) {
        stopSound(instanceId);
      }
    });
    
    // Remove buffer from source
    setSources(prev => {
      const newSources = new Map(prev);
      const source = newSources.get(id);
      if (source) {
        const updatedSource = { ...source, buffer: undefined, isLoaded: false };
        newSources.set(id, updatedSource);
      }
      return newSources;
    });
  }, [instances]);
  
  const loadAllSources = useCallback(async (): Promise<void> => {
    const loadPromises = Array.from(sources.keys()).map(id => loadAudioSource(id));
    await Promise.all(loadPromises);
  }, [sources, loadAudioSource]);
  
  // Playback control
  const playSound = useCallback(async (
    sourceId: string, 
    options: Partial<AudioInstance> = {}
  ): Promise<string | null> => {
    if (!audioContext.current || !isInitialized) {
      console.warn('Audio context not initialized');
      return null;
    }
    
    const source = sources.get(sourceId);
    if (!source || !source.buffer) {
      console.warn(`Audio source ${sourceId} not loaded`);
      return null;
    }
    
    // Check polyphony limit
    const playingCount = Array.from(instances.values()).filter(i => i.isPlaying).length;
    if (playingCount >= config.maxPolyphony) {
      console.warn('Max polyphony reached');
      return null;
    }
    
    try {
      // Create source node
      const sourceNode = audioContext.current.createBufferSource();
      sourceNode.buffer = source.buffer;
      sourceNode.loop = options.loop ?? source.loop;
      sourceNode.playbackRate.value = options.playbackRate ?? 1.0;
      
      // Create gain node
      const gainNode = audioContext.current.createGain();
      gainNode.gain.value = (options.volume ?? source.volume) * getCategoryVolume(source.category);
      
      // Create panner node for spatial audio
      let pannerNode: PannerNode | undefined;
      if (config.enableSpatialAudio && options.position) {
        pannerNode = audioContext.current.createPanner();
        pannerNode.panningModel = 'HRTF';
        pannerNode.distanceModel = 'inverse';
        pannerNode.refDistance = 1;
        pannerNode.maxDistance = 10000;
        pannerNode.rolloffFactor = 1;
        pannerNode.positionX.value = options.position.x;
        pannerNode.positionY.value = options.position.y;
        pannerNode.positionZ.value = options.position.z;
      }
      
      // Connect audio graph
      sourceNode.connect(gainNode);
      
      if (pannerNode) {
        gainNode.connect(pannerNode);
        pannerNode.connect(categoryGains.current.get(source.category)!);
      } else {
        gainNode.connect(categoryGains.current.get(source.category)!);
      }
      
      // Create instance
      const instanceId = `instance_${nextInstanceId.current++}`;
      const instance: AudioInstance = {
        id: instanceId,
        sourceId,
        gainNode,
        sourceNode,
        pannerNode,
        isPlaying: true,
        isPaused: false,
        startTime: audioContext.current.currentTime,
        pauseTime: 0,
        duration: source.buffer.duration,
        currentTime: 0,
        volume: options.volume ?? source.volume,
        playbackRate: options.playbackRate ?? 1.0,
        loop: options.loop ?? source.loop,
        position: options.position,
      };
      
      // Handle sound end
      sourceNode.onended = () => {
        setInstances(prev => {
          const newInstances = new Map(prev);
          newInstances.delete(instanceId);
          return newInstances;
        });
      };
      
      // Start playback
      sourceNode.start(0);
      
      // Fade in if specified
      if (config.fadeInDuration > 0) {
        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          instance.volume * getCategoryVolume(source.category),
          audioContext.current.currentTime + config.fadeInDuration / 1000
        );
      }
      
      // Add to instances
      setInstances(prev => new Map(prev).set(instanceId, instance));
      
      return instanceId;
    } catch (error) {
      console.error('Failed to play sound:', error);
      return null;
    }
  }, [audioContext, isInitialized, sources, instances, config, getCategoryVolume]);
  
  const stopSound = useCallback((instanceId: string) => {
    const instance = instances.get(instanceId);
    if (!instance || !instance.sourceNode) return;
    
    try {
      if (config.fadeOutDuration > 0 && audioContext.current) {
        // Fade out before stopping
        const currentGain = instance.gainNode.gain.value;
        instance.gainNode.gain.setValueAtTime(currentGain, audioContext.current.currentTime);
        instance.gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + config.fadeOutDuration / 1000);
        
        setTimeout(() => {
          if (instance.sourceNode) {
            instance.sourceNode.stop();
          }
        }, config.fadeOutDuration);
      } else {
        instance.sourceNode.stop();
      }
      
      // Remove from instances
      setInstances(prev => {
        const newInstances = new Map(prev);
        newInstances.delete(instanceId);
        return newInstances;
      });
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }, [instances, config.fadeOutDuration]);
  
  const pauseSound = useCallback((instanceId: string) => {
    const instance = instances.get(instanceId);
    if (!instance || !instance.isPlaying || instance.isPaused || !audioContext.current) return;
    
    try {
      instance.sourceNode?.stop();
      
      setInstances(prev => {
        const newInstances = new Map(prev);
        const updatedInstance = {
          ...instance,
          isPaused: true,
          isPlaying: false,
          pauseTime: audioContext.current!.currentTime,
          currentTime: instance.currentTime + (audioContext.current!.currentTime - instance.startTime) * instance.playbackRate,
        };
        newInstances.set(instanceId, updatedInstance);
        return newInstances;
      });
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  }, [instances]);
  
  const resumeSound = useCallback((instanceId: string) => {
    const instance = instances.get(instanceId);
    if (!instance || !instance.isPaused || !audioContext.current) return;
    
    const source = sources.get(instance.sourceId);
    if (!source || !source.buffer) return;
    
    try {
      // Create new source node
      const sourceNode = audioContext.current.createBufferSource();
      sourceNode.buffer = source.buffer;
      sourceNode.loop = instance.loop;
      sourceNode.playbackRate.value = instance.playbackRate;
      
      // Connect to existing gain node
      sourceNode.connect(instance.gainNode);
      
      // Start from current time
      sourceNode.start(0, instance.currentTime);
      
      // Update instance
      setInstances(prev => {
        const newInstances = new Map(prev);
        const updatedInstance = {
          ...instance,
          sourceNode,
          isPaused: false,
          isPlaying: true,
          startTime: audioContext.current!.currentTime - instance.currentTime / instance.playbackRate,
        };
        newInstances.set(instanceId, updatedInstance);
        return newInstances;
      });
    } catch (error) {
      console.error('Error resuming sound:', error);
    }
  }, [instances, sources]);
  
  const stopAllSounds = useCallback((category?: AudioSource['category']) => {
    instances.forEach((instance, instanceId) => {
      const source = sources.get(instance.sourceId);
      if (!category || source?.category === category) {
        stopSound(instanceId);
      }
    });
  }, [instances, sources, stopSound]);
  
  // Volume and effects
  const setMasterVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setConfig(prev => ({ ...prev, masterVolume: clampedVolume }));
    
    if (masterGain.current) {
      masterGain.current.gain.value = clampedVolume;
    }
  }, []);
  
  const setCategoryVolume = useCallback((category: AudioSource['category'], volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    setConfig(prev => {
      const newConfig = { ...prev };
      switch (category) {
        case 'sfx':
        case 'voice':
          newConfig.sfxVolume = clampedVolume;
          break;
        case 'music':
        case 'ambient':
          newConfig.musicVolume = clampedVolume;
          break;
      }
      return newConfig;
    });
    
    const gainNode = categoryGains.current.get(category);
    if (gainNode) {
      gainNode.gain.value = clampedVolume;
    }
  }, []);
  
  const setInstanceVolume = useCallback((instanceId: string, volume: number) => {
    const instance = instances.get(instanceId);
    if (!instance) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const source = sources.get(instance.sourceId);
    if (source) {
      instance.gainNode.gain.value = clampedVolume * getCategoryVolume(source.category);
      
      setInstances(prev => {
        const newInstances = new Map(prev);
        newInstances.set(instanceId, { ...instance, volume: clampedVolume });
        return newInstances;
      });
    }
  }, [instances, sources, getCategoryVolume]);
  
  const fadeIn = useCallback((instanceId: string, duration: number = config.fadeInDuration) => {
    const instance = instances.get(instanceId);
    if (!instance || !audioContext.current) return;
    
    const source = sources.get(instance.sourceId);
    if (!source) return;
    
    const targetVolume = instance.volume * getCategoryVolume(source.category);
    instance.gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    instance.gainNode.gain.linearRampToValueAtTime(targetVolume, audioContext.current.currentTime + duration / 1000);
  }, [instances, sources, config.fadeInDuration, getCategoryVolume]);
  
  const fadeOut = useCallback((instanceId: string, duration: number = config.fadeOutDuration) => {
    const instance = instances.get(instanceId);
    if (!instance || !audioContext.current) return;
    
    const currentGain = instance.gainNode.gain.value;
    instance.gainNode.gain.setValueAtTime(currentGain, audioContext.current.currentTime);
    instance.gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + duration / 1000);
    
    setTimeout(() => stopSound(instanceId), duration);
  }, [instances, config.fadeOutDuration, stopSound]);
  
  const crossfade = useCallback((
    fromInstanceId: string, 
    toInstanceId: string, 
    duration: number = config.crossfadeDuration
  ) => {
    fadeOut(fromInstanceId, duration);
    fadeIn(toInstanceId, duration);
  }, [config.crossfadeDuration, fadeOut, fadeIn]);
  
  // Spatial audio
  const setListenerPosition = useCallback((x: number, y: number, z: number) => {
    if (audioContext.current && audioContext.current.listener) {
      if (audioContext.current.listener.positionX) {
        audioContext.current.listener.positionX.value = x;
        audioContext.current.listener.positionY.value = y;
        audioContext.current.listener.positionZ.value = z;
      } else {
        // Fallback for older browsers
        (audioContext.current.listener as any).setPosition(x, y, z);
      }
    }
  }, []);
  
  const setListenerOrientation = useCallback((
    fx: number, fy: number, fz: number,
    ux: number, uy: number, uz: number
  ) => {
    if (audioContext.current && audioContext.current.listener) {
      if (audioContext.current.listener.forwardX) {
        audioContext.current.listener.forwardX.value = fx;
        audioContext.current.listener.forwardY.value = fy;
        audioContext.current.listener.forwardZ.value = fz;
        audioContext.current.listener.upX.value = ux;
        audioContext.current.listener.upY.value = uy;
        audioContext.current.listener.upZ.value = uz;
      } else {
        // Fallback for older browsers
        (audioContext.current.listener as any).setOrientation(fx, fy, fz, ux, uy, uz);
      }
    }
  }, []);
  
  const setSoundPosition = useCallback((instanceId: string, x: number, y: number, z: number) => {
    const instance = instances.get(instanceId);
    if (!instance || !instance.pannerNode) return;
    
    if (instance.pannerNode.positionX) {
      instance.pannerNode.positionX.value = x;
      instance.pannerNode.positionY.value = y;
      instance.pannerNode.positionZ.value = z;
    } else {
      // Fallback for older browsers
      (instance.pannerNode as any).setPosition(x, y, z);
    }
    
    setInstances(prev => {
      const newInstances = new Map(prev);
      newInstances.set(instanceId, { ...instance, position: { x, y, z } });
      return newInstances;
    });
  }, [instances]);
  
  // Configuration
  const updateConfig = useCallback((newConfig: Partial<AudioConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // Apply immediate changes
    if (newConfig.masterVolume !== undefined && masterGain.current) {
      masterGain.current.gain.value = newConfig.masterVolume;
    }
    
    if (newConfig.sfxVolume !== undefined) {
      const sfxGain = categoryGains.current.get('sfx');
      const voiceGain = categoryGains.current.get('voice');
      if (sfxGain) sfxGain.gain.value = newConfig.sfxVolume;
      if (voiceGain) voiceGain.gain.value = newConfig.sfxVolume;
    }
    
    if (newConfig.musicVolume !== undefined) {
      const musicGain = categoryGains.current.get('music');
      const ambientGain = categoryGains.current.get('ambient');
      if (musicGain) musicGain.gain.value = newConfig.musicVolume;
      if (ambientGain) ambientGain.gain.value = newConfig.musicVolume * 0.5;
    }
  }, []);
  
  // Utilities
  const getAudioInfo = useCallback(() => {
    return {
      isInitialized,
      contextState: audioContext.current?.state,
      sampleRate: audioContext.current?.sampleRate,
      currentTime: audioContext.current?.currentTime,
      sourcesCount: sources.size,
      loadedSources: Array.from(sources.values()).filter(s => s.isLoaded).length,
      instancesCount: instances.size,
      playingCount: Array.from(instances.values()).filter(i => i.isPlaying).length,
      masterVolume: config.masterVolume,
      categoryVolumes: {
        sfx: config.sfxVolume,
        music: config.musicVolume,
      },
    };
  }, [isInitialized, sources, instances, config]);
  
  const getSourceInfo = useCallback((sourceId: string): AudioSource | undefined => {
    return sources.get(sourceId);
  }, [sources]);
  
  const getInstanceInfo = useCallback((instanceId: string): AudioInstance | undefined => {
    return instances.get(instanceId);
  }, [instances]);
  
  const getPlayingSounds = useCallback((): AudioInstance[] => {
    return Array.from(instances.values()).filter(instance => instance.isPlaying);
  }, [instances]);
  
  const cleanup = useCallback(() => {
    stopAllSounds();
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close();
    }
  }, [stopAllSounds]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    // State
    isInitialized,
    audioContext: audioContext.current,
    config,
    sources,
    instances,
    loadingProgress,
    
    // Audio context management
    initializeAudio,
    suspendAudio,
    resumeAudio,
    closeAudio,
    
    // Source management
    addAudioSource,
    removeAudioSource,
    loadAudioSource,
    unloadAudioSource,
    loadAllSources,
    
    // Playback control
    playSound,
    stopSound,
    pauseSound,
    resumeSound,
    stopAllSounds,
    
    // Volume and effects
    setMasterVolume,
    setCategoryVolume,
    setInstanceVolume,
    fadeIn,
    fadeOut,
    crossfade,
    
    // Spatial audio
    setListenerPosition,
    setListenerOrientation,
    setSoundPosition,
    
    // Configuration
    updateConfig,
    
    // Utilities
    getAudioInfo,
    getSourceInfo,
    getInstanceInfo,
    getPlayingSounds,
    cleanup,
  };
};

export default useAudioManager;