// ===== 🎨 ANIMATION SYSTEM =====
// Sprite animations and frame management
// Separated from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationFrame {
  wing?: 'up' | 'middle' | 'down';
  bodyOffset?: number;
  spriteFrame?: SpriteFrame;
  duration?: number; // Override frame duration for this specific frame
}

export interface AnimationData {
  frames: AnimationFrame[];
  frameRate: number; // fps
  loop: boolean;
  name: string;
}

export interface AnimationState {
  currentFrame: number;
  frameTimer: number;
  isPlaying: boolean;
  currentAnimation: string;
  loopCount: number;
}

export interface AnimationSystemConfig {
  // Performance settings
  enableAnimations: boolean;
  defaultFrameRate: number;
  maxAnimations: number;
  // Timing settings
  useGameSpeedMultiplier: boolean;
  pauseOnInactive: boolean;
}

export interface UseAnimationSystemReturn {
  // State
  animationState: AnimationState;
  availableAnimations: { [key: string]: AnimationData };
  
  // Actions
  playAnimation: (animationName: string, loop?: boolean) => boolean;
  stopAnimation: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  setFrame: (frameIndex: number) => void;
  
  // Animation management
  addAnimation: (name: string, animation: AnimationData) => void;
  removeAnimation: (name: string) => void;
  updateAnimations: (gameSpeed: number) => void;
  
  // Utilities
  getCurrentFrame: () => AnimationFrame | null;
  getFrameProgress: () => number; // 0-1
  isAnimationPlaying: (animationName?: string) => boolean;
  getAnimationDuration: (animationName: string) => number; // in seconds
  
  // Configuration
  updateConfig: (newConfig: Partial<AnimationSystemConfig>) => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: AnimationSystemConfig = {
  enableAnimations: true,
  defaultFrameRate: 8,
  maxAnimations: 20,
  useGameSpeedMultiplier: true,
  pauseOnInactive: true,
};

// ===== DEFAULT ANIMATIONS =====
const defaultAnimations: { [key: string]: AnimationData } = {
  birdFlying: {
    name: 'birdFlying',
    frames: [
      { wing: 'up', bodyOffset: 0 },
      { wing: 'middle', bodyOffset: -1 },
      { wing: 'down', bodyOffset: 0 },
      { wing: 'middle', bodyOffset: 1 },
    ],
    frameRate: 8,
    loop: true
  },
  birdDying: {
    name: 'birdDying',
    frames: [
      { wing: 'down', bodyOffset: 0 },
      { wing: 'down', bodyOffset: 2 },
      { wing: 'down', bodyOffset: 4 },
    ],
    frameRate: 4,
    loop: false
  },
  powerUpPulse: {
    name: 'powerUpPulse',
    frames: [
      { bodyOffset: 0 },
      { bodyOffset: -1 },
      { bodyOffset: -2 },
      { bodyOffset: -1 },
    ],
    frameRate: 12,
    loop: true
  },
  coinSpin: {
    name: 'coinSpin',
    frames: [
      { spriteFrame: { x: 0, y: 0, width: 16, height: 16 } },
      { spriteFrame: { x: 16, y: 0, width: 12, height: 16 } },
      { spriteFrame: { x: 28, y: 0, width: 8, height: 16 } },
      { spriteFrame: { x: 36, y: 0, width: 12, height: 16 } },
    ],
    frameRate: 10,
    loop: true
  }
};

// ===== CUSTOM HOOK =====
export function useAnimationSystem(
  config: Partial<AnimationSystemConfig> = {},
  customAnimations: { [key: string]: AnimationData } = {}
): UseAnimationSystemReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  
  // ===== STATE =====
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentFrame: 0,
    frameTimer: 0,
    isPlaying: false,
    currentAnimation: '',
    loopCount: 0
  });
  
  const animationsRef = useRef<{ [key: string]: AnimationData }>({
    ...defaultAnimations,
    ...customAnimations
  });
  
  const stateRef = useRef<AnimationState>(animationState);
  
  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = animationState;
  }, [animationState]);
  
  // ===== ACTIONS =====
  const playAnimation = useCallback((animationName: string, loop?: boolean): boolean => {
    const animation = animationsRef.current[animationName];
    if (!animation || !finalConfig.current.enableAnimations) {
      return false;
    }
    
    const newState: AnimationState = {
      currentFrame: 0,
      frameTimer: 0,
      isPlaying: true,
      currentAnimation: animationName,
      loopCount: 0
    };
    
    // Override loop setting if provided
    if (loop !== undefined) {
      animation.loop = loop;
    }
    
    stateRef.current = newState;
    setAnimationState(newState);
    return true;
  }, []);
  
  const stopAnimation = useCallback(() => {
    const newState: AnimationState = {
      ...stateRef.current,
      isPlaying: false,
      currentFrame: 0,
      frameTimer: 0
    };
    
    stateRef.current = newState;
    setAnimationState(newState);
  }, []);
  
  const pauseAnimation = useCallback(() => {
    const newState: AnimationState = {
      ...stateRef.current,
      isPlaying: false
    };
    
    stateRef.current = newState;
    setAnimationState(newState);
  }, []);
  
  const resumeAnimation = useCallback(() => {
    const newState: AnimationState = {
      ...stateRef.current,
      isPlaying: true
    };
    
    stateRef.current = newState;
    setAnimationState(newState);
  }, []);
  
  const setFrame = useCallback((frameIndex: number) => {
    const animation = animationsRef.current[stateRef.current.currentAnimation];
    if (!animation) return;
    
    const clampedFrame = Math.max(0, Math.min(frameIndex, animation.frames.length - 1));
    const newState: AnimationState = {
      ...stateRef.current,
      currentFrame: clampedFrame,
      frameTimer: 0
    };
    
    stateRef.current = newState;
    setAnimationState(newState);
  }, []);
  
  // ===== ANIMATION MANAGEMENT =====
  const addAnimation = useCallback((name: string, animation: AnimationData) => {
    if (Object.keys(animationsRef.current).length < finalConfig.current.maxAnimations) {
      animationsRef.current[name] = animation;
    }
  }, []);
  
  const removeAnimation = useCallback((name: string) => {
    if (name in animationsRef.current && !defaultAnimations[name]) {
      delete animationsRef.current[name];
      
      // Stop animation if it's currently playing
      if (stateRef.current.currentAnimation === name) {
        stopAnimation();
      }
    }
  }, [stopAnimation]);
  
  const updateAnimations = useCallback((gameSpeed: number = 1) => {
    if (!stateRef.current.isPlaying || !finalConfig.current.enableAnimations) {
      return;
    }
    
    const animation = animationsRef.current[stateRef.current.currentAnimation];
    if (!animation) return;
    
    const currentState = stateRef.current;
    const speedMultiplier = finalConfig.current.useGameSpeedMultiplier ? gameSpeed : 1;
    const frameRate = animation.frameRate || finalConfig.current.defaultFrameRate;
    const frameDuration = 60 / frameRate; // frames at 60fps
    
    const newFrameTimer = currentState.frameTimer + speedMultiplier;
    
    if (newFrameTimer >= frameDuration) {
      let newFrame = currentState.currentFrame + 1;
      let newLoopCount = currentState.loopCount;
      let isStillPlaying = true;
      
      // Check if animation finished
      if (newFrame >= animation.frames.length) {
        if (animation.loop) {
          newFrame = 0;
          newLoopCount++;
        } else {
          newFrame = animation.frames.length - 1;
          isStillPlaying = false;
        }
      }
      
      const newState: AnimationState = {
        currentFrame: newFrame,
        frameTimer: newFrameTimer - frameDuration,
        isPlaying: isStillPlaying,
        currentAnimation: currentState.currentAnimation,
        loopCount: newLoopCount
      };
      
      stateRef.current = newState;
      setAnimationState(newState);
    } else {
      const newState: AnimationState = {
        ...currentState,
        frameTimer: newFrameTimer
      };
      
      stateRef.current = newState;
      setAnimationState(newState);
    }
  }, []);
  
  // ===== UTILITIES =====
  const getCurrentFrame = useCallback((): AnimationFrame | null => {
    const animation = animationsRef.current[stateRef.current.currentAnimation];
    if (!animation) return null;
    
    return animation.frames[stateRef.current.currentFrame] || null;
  }, []);
  
  const getFrameProgress = useCallback((): number => {
    const animation = animationsRef.current[stateRef.current.currentAnimation];
    if (!animation) return 0;
    
    const frameRate = animation.frameRate || finalConfig.current.defaultFrameRate;
    const frameDuration = 60 / frameRate;
    
    return Math.min(1, stateRef.current.frameTimer / frameDuration);
  }, []);
  
  const isAnimationPlaying = useCallback((animationName?: string): boolean => {
    if (animationName) {
      return stateRef.current.isPlaying && stateRef.current.currentAnimation === animationName;
    }
    return stateRef.current.isPlaying;
  }, []);
  
  const getAnimationDuration = useCallback((animationName: string): number => {
    const animation = animationsRef.current[animationName];
    if (!animation) return 0;
    
    const frameRate = animation.frameRate || finalConfig.current.defaultFrameRate;
    return animation.frames.length / frameRate;
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<AnimationSystemConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
  }, []);
  
  return {
    // State
    animationState,
    availableAnimations: animationsRef.current,
    
    // Actions
    playAnimation,
    stopAnimation,
    pauseAnimation,
    resumeAnimation,
    setFrame,
    
    // Animation management
    addAnimation,
    removeAnimation,
    updateAnimations,
    
    // Utilities
    getCurrentFrame,
    getFrameProgress,
    isAnimationPlaying,
    getAnimationDuration,
    
    // Configuration
    updateConfig,
  };
}

// ===== COMPONENT EXPORT =====
export default useAnimationSystem;