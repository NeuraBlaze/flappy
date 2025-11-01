// ===== ✨ VISUAL EFFECTS SYSTEM =====
// Screen effects and visual enhancements
// Separated from main game component for modularity

import { useState, useCallback, useRef } from 'react';

// ===== INTERFACES =====
export interface ScreenShake {
  intensity: number;
  duration: number;
  remaining: number;
  frequency: number;
}

export interface ColorFilter {
  name: string;
  enabled: boolean;
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  alpha: number;
}

export interface GlowEffect {
  enabled: boolean;
  color: string;
  blur: number;
  strength: number;
}

export interface RainbowEffect {
  enabled: boolean;
  speed: number;
  intensity: number;
  hueShift: number;
}

export interface VisualEffectsState {
  screenShake: ScreenShake;
  colorFilters: ColorFilter[];
  activeGlow: GlowEffect;
  rainbowMode: RainbowEffect;
  flashEffect: {
    enabled: boolean;
    color: string;
    intensity: number;
    duration: number;
  };
  // Performance settings
  enableEffects: boolean;
  enableGlow: boolean;
  enableShake: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

export interface VisualEffectsConfig {
  // Performance settings
  enableVisualEffects: boolean;
  enableScreenShake: boolean;
  enableGlowEffects: boolean;
  enableColorFilters: boolean;
  // Quality settings
  maxShakeIntensity: number;
  maxGlowBlur: number;
  // Browser compatibility
  disableEffectsForOpera: boolean;
}

export interface UseVisualEffectsSystemReturn {
  // State
  effectsState: VisualEffectsState;
  
  // Screen shake
  addScreenShake: (intensity: number, duration: number, frequency?: number) => void;
  updateScreenShake: () => { x: number; y: number };
  stopScreenShake: () => void;
  
  // Color effects
  addColorFilter: (filter: ColorFilter) => void;
  removeColorFilter: (name: string) => void;
  setRainbowMode: (enabled: boolean, speed?: number, intensity?: number) => void;
  
  // Glow effects
  setGlowEffect: (color: string, blur: number, strength?: number) => void;
  clearGlowEffect: () => void;
  
  // Flash effects
  addFlashEffect: (color: string, intensity: number, duration: number) => void;
  
  // Canvas utilities
  applyCanvasEffects: (ctx: CanvasRenderingContext2D, frameCount: number) => void;
  restoreCanvasEffects: (ctx: CanvasRenderingContext2D) => void;
  getRainbowColor: (baseColor: string, offset?: number) => string;
  
  // Utilities
  isEffectActive: (effectName: string) => boolean;
  updateEffects: (deltaTime: number) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<VisualEffectsConfig>) => void;
  setQualityLevel: (level: 'low' | 'medium' | 'high') => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: VisualEffectsConfig = {
  enableVisualEffects: true,
  enableScreenShake: true,
  enableGlowEffects: true,
  enableColorFilters: true,
  maxShakeIntensity: 10,
  maxGlowBlur: 15,
  disableEffectsForOpera: true,
};

// ===== UTILITY FUNCTIONS =====
const isOpera = (): boolean => {
  return /Opera|OPR\//.test(navigator.userAgent);
};

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// ===== CUSTOM HOOK =====
export function useVisualEffectsSystem(
  config: Partial<VisualEffectsConfig> = {}
): UseVisualEffectsSystemReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  
  // Disable effects for Opera if configured
  const shouldDisableEffects = finalConfig.current.disableEffectsForOpera && isOpera();
  
  // ===== STATE =====
  const [effectsState, setEffectsState] = useState<VisualEffectsState>({
    screenShake: {
      intensity: 0,
      duration: 0,
      remaining: 0,
      frequency: 1
    },
    colorFilters: [],
    activeGlow: {
      enabled: false,
      color: '#ffffff',
      blur: 0,
      strength: 1
    },
    rainbowMode: {
      enabled: false,
      speed: 1,
      intensity: 1,
      hueShift: 0
    },
    flashEffect: {
      enabled: false,
      color: '#ffffff',
      intensity: 0,
      duration: 0
    },
    enableEffects: finalConfig.current.enableVisualEffects && !shouldDisableEffects,
    enableGlow: finalConfig.current.enableGlowEffects && !shouldDisableEffects,
    enableShake: finalConfig.current.enableScreenShake,
    qualityLevel: shouldDisableEffects ? 'low' : 'high'
  });
  
  const stateRef = useRef<VisualEffectsState>(effectsState);
  stateRef.current = effectsState;
  
  // ===== SCREEN SHAKE =====
  const addScreenShake = useCallback((intensity: number, duration: number, frequency: number = 1) => {
    if (!stateRef.current.enableShake || !finalConfig.current.enableScreenShake) return;
    
    const clampedIntensity = Math.min(intensity, finalConfig.current.maxShakeIntensity);
    
    setEffectsState(prev => ({
      ...prev,
      screenShake: {
        intensity: clampedIntensity,
        duration,
        remaining: duration,
        frequency
      }
    }));
  }, []);
  
  const updateScreenShake = useCallback((): { x: number; y: number } => {
    const shake = stateRef.current.screenShake;
    
    if (shake.remaining <= 0) {
      return { x: 0, y: 0 };
    }
    
    const progress = 1 - (shake.remaining / shake.duration);
    const currentIntensity = shake.intensity * (1 - progress);
    
    const x = (Math.random() - 0.5) * currentIntensity * 2;
    const y = (Math.random() - 0.5) * currentIntensity * 2;
    
    // Update remaining time
    setEffectsState(prev => ({
      ...prev,
      screenShake: {
        ...prev.screenShake,
        remaining: Math.max(0, shake.remaining - 1)
      }
    }));
    
    return { x, y };
  }, []);
  
  const stopScreenShake = useCallback(() => {
    setEffectsState(prev => ({
      ...prev,
      screenShake: {
        ...prev.screenShake,
        remaining: 0
      }
    }));
  }, []);
  
  // ===== COLOR EFFECTS =====
  const addColorFilter = useCallback((filter: ColorFilter) => {
    if (!finalConfig.current.enableColorFilters) return;
    
    setEffectsState(prev => ({
      ...prev,
      colorFilters: [...prev.colorFilters.filter(f => f.name !== filter.name), filter]
    }));
  }, []);
  
  const removeColorFilter = useCallback((name: string) => {
    setEffectsState(prev => ({
      ...prev,
      colorFilters: prev.colorFilters.filter(f => f.name !== name)
    }));
  }, []);
  
  const setRainbowMode = useCallback((enabled: boolean, speed: number = 1, intensity: number = 1) => {
    setEffectsState(prev => ({
      ...prev,
      rainbowMode: {
        enabled,
        speed,
        intensity,
        hueShift: prev.rainbowMode.hueShift
      }
    }));
  }, []);
  
  // ===== GLOW EFFECTS =====
  const setGlowEffect = useCallback((color: string, blur: number, strength: number = 1) => {
    if (!stateRef.current.enableGlow || !finalConfig.current.enableGlowEffects) return;
    
    const clampedBlur = Math.min(blur, finalConfig.current.maxGlowBlur);
    
    setEffectsState(prev => ({
      ...prev,
      activeGlow: {
        enabled: true,
        color,
        blur: clampedBlur,
        strength
      }
    }));
  }, []);
  
  const clearGlowEffect = useCallback(() => {
    setEffectsState(prev => ({
      ...prev,
      activeGlow: {
        ...prev.activeGlow,
        enabled: false
      }
    }));
  }, []);
  
  // ===== FLASH EFFECTS =====
  const addFlashEffect = useCallback((color: string, intensity: number, duration: number) => {
    setEffectsState(prev => ({
      ...prev,
      flashEffect: {
        enabled: true,
        color,
        intensity,
        duration
      }
    }));
    
    // Auto-disable after duration
    setTimeout(() => {
      setEffectsState(prev => ({
        ...prev,
        flashEffect: {
          ...prev.flashEffect,
          enabled: false
        }
      }));
    }, duration * 16.67); // Convert frames to milliseconds
  }, []);
  
  // ===== CANVAS UTILITIES =====
  const applyCanvasEffects = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    if (!stateRef.current.enableEffects) return;
    
    // Apply glow effect
    if (stateRef.current.activeGlow.enabled) {
      const glow = stateRef.current.activeGlow;
      ctx.shadowColor = glow.color;
      ctx.shadowBlur = glow.blur;
    }
    
    // Apply rainbow mode
    if (stateRef.current.rainbowMode.enabled) {
      const rainbow = stateRef.current.rainbowMode;
      rainbow.hueShift = (frameCount * rainbow.speed) % 360;
    }
    
    // Apply flash effect
    if (stateRef.current.flashEffect.enabled) {
      const flash = stateRef.current.flashEffect;
      ctx.globalAlpha = flash.intensity;
      ctx.fillStyle = flash.color;
    }
  }, []);
  
  const restoreCanvasEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    // Reset canvas effects
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1.0;
  }, []);
  
  const getRainbowColor = useCallback((baseColor: string, offset: number = 0): string => {
    if (!stateRef.current.rainbowMode.enabled) return baseColor;
    
    const rainbow = stateRef.current.rainbowMode;
    const hue = (rainbow.hueShift + offset) % 360;
    const saturation = 70 * rainbow.intensity;
    const lightness = 50;
    
    return hslToHex(hue, saturation, lightness);
  }, []);
  
  // ===== UTILITIES =====
  const isEffectActive = useCallback((effectName: string): boolean => {
    switch (effectName) {
      case 'screenShake':
        return stateRef.current.screenShake.remaining > 0;
      case 'glow':
        return stateRef.current.activeGlow.enabled;
      case 'rainbow':
        return stateRef.current.rainbowMode.enabled;
      case 'flash':
        return stateRef.current.flashEffect.enabled;
      default:
        return false;
    }
  }, []);
  
  const updateEffects = useCallback((deltaTime: number) => {
    // Update rainbow hue shift
    if (stateRef.current.rainbowMode.enabled) {
      setEffectsState(prev => ({
        ...prev,
        rainbowMode: {
          ...prev.rainbowMode,
          hueShift: (prev.rainbowMode.hueShift + prev.rainbowMode.speed * deltaTime) % 360
        }
      }));
    }
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<VisualEffectsConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
    
    // Update effects state based on new config
    const shouldDisable = (finalConfig.current.disableEffectsForOpera && isOpera()) || !newConfig.enableVisualEffects;
    
    setEffectsState(prev => ({
      ...prev,
      enableEffects: finalConfig.current.enableVisualEffects && !shouldDisable,
      enableGlow: finalConfig.current.enableGlowEffects && !shouldDisable,
      enableShake: finalConfig.current.enableScreenShake
    }));
  }, []);
  
  const setQualityLevel = useCallback((level: 'low' | 'medium' | 'high') => {
    setEffectsState(prev => ({
      ...prev,
      qualityLevel: level,
      enableEffects: level !== 'low',
      enableGlow: level === 'high',
      enableShake: level !== 'low'
    }));
  }, []);
  
  return {
    // State
    effectsState,
    
    // Screen shake
    addScreenShake,
    updateScreenShake,
    stopScreenShake,
    
    // Color effects
    addColorFilter,
    removeColorFilter,
    setRainbowMode,
    
    // Glow effects
    setGlowEffect,
    clearGlowEffect,
    
    // Flash effects
    addFlashEffect,
    
    // Canvas utilities
    applyCanvasEffects,
    restoreCanvasEffects,
    getRainbowColor,
    
    // Utilities
    isEffectActive,
    updateEffects,
    
    // Configuration
    updateConfig,
    setQualityLevel,
  };
}

// ===== COMPONENT EXPORT =====
export default useVisualEffectsSystem;