/**
 * ========================================
 * PHASE 5.1: BIRD MANAGER
 * ========================================
 * 
 * Bird physics, movement, abilities, and state management
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { WorldParameters, WorldBounds } from './WorldManager';

// ===== BIRD TYPES =====
export interface BirdState {
  // Position and velocity
  x: number;
  y: number;
  vx: number;      // horizontal velocity
  vy: number;      // vertical velocity
  
  // Physics
  angle: number;   // rotation angle (radians)
  radius: number;  // collision radius
  
  // Animation
  frame: number;   // animation frame
  animTime: number; // animation timer
  
  // State flags
  isAlive: boolean;
  isGrounded: boolean;
  isFlapping: boolean;
  
  // Power-ups and abilities
  hasShield: boolean;
  hasSpeedBoost: boolean;
  hasMagnet: boolean;
  canDoubleJump: boolean;
  doubleJumpUsed: boolean;
  
  // Timers
  shieldTime: number;
  speedBoostTime: number;
  magnetTime: number;
  invulnerabilityTime: number;
  
  // Stats
  jumpsCount: number;
  distanceTraveled: number;
  timeAlive: number;
}

export interface BirdPhysics {
  gravity: number;
  jumpPower: number;
  maxFallSpeed: number;
  maxRiseSpeed: number;
  horizontalDrag: number;
  verticalDrag: number;
  angleSmoothing: number;
  flapCooldown: number;
}

export interface BirdConfig {
  // Animation settings
  animationSpeed: number;
  flapDuration: number;
  frameCount: number;
  
  // Visual settings
  showTrail: boolean;
  trailLength: number;
  showHitbox: boolean;
  
  // Power-up durations
  shieldDuration: number;
  speedBoostDuration: number;
  magnetDuration: number;
  invulnerabilityDuration: number;
  
  // Abilities
  enableDoubleJump: boolean;
  enablePowerUps: boolean;
  
  // Debug
  showDebugInfo: boolean;
  logPhysics: boolean;
}

export interface BirdManagerReturn {
  // Bird state
  bird: BirdState;
  physics: BirdPhysics;
  config: BirdConfig;
  
  // Bird actions
  flap: () => void;
  doubleJump: () => void;
  move: (deltaTime: number) => void;
  reset: () => void;
  kill: () => void;
  revive: () => void;
  
  // Position management
  setBirdPosition: (x: number, y: number) => void;
  setBirdVelocity: (vx: number, vy: number) => void;
  applyForce: (fx: number, fy: number) => void;
  applyImpulse: (ix: number, iy: number) => void;
  
  // Power-ups
  activateShield: (duration?: number) => void;
  activateSpeedBoost: (duration?: number) => void;
  activateMagnet: (duration?: number) => void;
  makeInvulnerable: (duration?: number) => void;
  clearPowerUps: () => void;
  
  // Collision queries
  getBoundingBox: () => { x: number; y: number; width: number; height: number };
  getCollisionCircle: () => { x: number; y: number; radius: number };
  isCollidingWith: (other: { x: number; y: number; width?: number; height?: number; radius?: number }) => boolean;
  
  // Animation
  updateAnimation: (deltaTime: number) => void;
  getCurrentFrame: () => number;
  
  // Configuration
  updatePhysics: (newPhysics: Partial<BirdPhysics>) => void;
  updateConfig: (newConfig: Partial<BirdConfig>) => void;
  getBirdInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_BIRD_STATE: BirdState = {
  x: 60,
  y: 240,
  vx: 0,
  vy: 0,
  angle: 0,
  radius: 12,
  frame: 0,
  animTime: 0,
  isAlive: true,
  isGrounded: false,
  isFlapping: false,
  hasShield: false,
  hasSpeedBoost: false,
  hasMagnet: false,
  canDoubleJump: false,
  doubleJumpUsed: false,
  shieldTime: 0,
  speedBoostTime: 0,
  magnetTime: 0,
  invulnerabilityTime: 0,
  jumpsCount: 0,
  distanceTraveled: 0,
  timeAlive: 0,
};

const DEFAULT_BIRD_PHYSICS: BirdPhysics = {
  gravity: 0.119,
  jumpPower: -3.83,
  maxFallSpeed: 8.0,
  maxRiseSpeed: -8.0,
  horizontalDrag: 0.98,
  verticalDrag: 0.99,
  angleSmoothing: 0.1,
  flapCooldown: 100, // ms
};

const DEFAULT_BIRD_CONFIG: BirdConfig = {
  animationSpeed: 8.0,
  flapDuration: 150,
  frameCount: 3,
  showTrail: false,
  trailLength: 10,
  showHitbox: false,
  shieldDuration: 5000,
  speedBoostDuration: 3000,
  magnetDuration: 4000,
  invulnerabilityDuration: 1000,
  enableDoubleJump: false,
  enablePowerUps: true,
  showDebugInfo: false,
  logPhysics: false,
};

// ===== BIRD MANAGER HOOK =====
export const useBirdManager = (
  worldParams: WorldParameters,
  worldBounds: WorldBounds,
  initialBird: Partial<BirdState> = {},
  initialPhysics: Partial<BirdPhysics> = {},
  initialConfig: Partial<BirdConfig> = {}
): BirdManagerReturn => {
  
  // Bird state
  const [bird, setBird] = useState<BirdState>({ ...DEFAULT_BIRD_STATE, ...initialBird });
  const [physics, setPhysics] = useState<BirdPhysics>({ ...DEFAULT_BIRD_PHYSICS, ...initialPhysics });
  const [config, setConfig] = useState<BirdConfig>({ ...DEFAULT_BIRD_CONFIG, ...initialConfig });
  
  // Internal timers
  const lastFlapTime = useRef<number>(0);
  const trailPoints = useRef<Array<{ x: number; y: number; time: number }>>([]);
  
  // Sync physics with world parameters
  useEffect(() => {
    setPhysics(prev => ({
      ...prev,
      gravity: worldParams.gravity,
      jumpPower: worldParams.jumpPower,
      maxFallSpeed: worldParams.birdMaxSpeed,
    }));
  }, [worldParams.gravity, worldParams.jumpPower, worldParams.birdMaxSpeed]);

  // ===== BIRD ACTIONS =====
  const flap = useCallback(() => {
    const now = Date.now();
    
    if (!bird.isAlive || now - lastFlapTime.current < physics.flapCooldown) {
      return;
    }
    
    lastFlapTime.current = now;
    
    setBird(prev => ({
      ...prev,
      vy: physics.jumpPower,
      isFlapping: true,
      isGrounded: false,
      jumpsCount: prev.jumpsCount + 1,
    }));
    
    // Clear flapping flag after animation
    setTimeout(() => {
      setBird(prev => ({ ...prev, isFlapping: false }));
    }, config.flapDuration);
    
    if (config.logPhysics) {
      console.log(`🐦 Flap! vy: ${physics.jumpPower}, jumps: ${bird.jumpsCount + 1}`);
    }
  }, [bird.isAlive, physics.jumpPower, physics.flapCooldown, config.flapDuration, config.logPhysics, bird.jumpsCount]);

  const doubleJump = useCallback(() => {
    if (!config.enableDoubleJump || !bird.canDoubleJump || bird.doubleJumpUsed || !bird.isAlive) {
      return;
    }
    
    setBird(prev => ({
      ...prev,
      vy: physics.jumpPower * 1.5, // Stronger double jump
      doubleJumpUsed: true,
      isFlapping: true,
      jumpsCount: prev.jumpsCount + 1,
    }));
    
    setTimeout(() => {
      setBird(prev => ({ ...prev, isFlapping: false }));
    }, config.flapDuration);
    
    console.log('🐦 Double jump activated!');
  }, [config.enableDoubleJump, bird.canDoubleJump, bird.doubleJumpUsed, bird.isAlive, physics.jumpPower, config.flapDuration]);

  const move = useCallback((deltaTime: number) => {
    if (!bird.isAlive) return;
    
    setBird(prev => {
      let newX = prev.x;
      let newY = prev.y;
      let newVx = prev.vx * physics.horizontalDrag;
      let newVy = prev.vy;
      
      // Apply gravity
      newVy += physics.gravity * deltaTime;
      
      // Apply speed boost
      const speedMultiplier = prev.hasSpeedBoost ? 1.5 : 1.0;
      
      // Clamp velocities
      newVy = Math.max(physics.maxRiseSpeed, Math.min(physics.maxFallSpeed, newVy));
      
      // Update position
      newX += newVx * deltaTime * speedMultiplier;
      newY += newVy * deltaTime;
      
      // Calculate angle based on velocity
      let newAngle = Math.atan2(newVy, Math.max(1, Math.abs(newVx))) * physics.angleSmoothing;
      newAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 2, newAngle));
      
      // Check ground collision
      const wasGrounded = prev.isGrounded;
      const isGrounded = newY >= worldBounds.groundY - prev.radius;
      
      if (isGrounded && !wasGrounded) {
        newY = worldBounds.groundY - prev.radius;
        newVy = 0;
        // Reset double jump on landing
        if (config.enableDoubleJump) {
          return {
            ...prev,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            angle: newAngle,
            isGrounded: true,
            doubleJumpUsed: false,
            distanceTraveled: prev.distanceTraveled + Math.abs(newX - prev.x),
            timeAlive: prev.timeAlive + deltaTime,
          };
        }
      }
      
      // Check ceiling collision
      if (newY <= worldBounds.ceilingY + prev.radius) {
        newY = worldBounds.ceilingY + prev.radius;
        newVy = Math.max(0, newVy);
      }
      
      // Update trail
      if (config.showTrail) {
        const now = Date.now();
        trailPoints.current.push({ x: newX, y: newY, time: now });
        trailPoints.current = trailPoints.current.filter(p => now - p.time < config.trailLength * 100);
      }
      
      return {
        ...prev,
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy,
        angle: newAngle,
        isGrounded,
        distanceTraveled: prev.distanceTraveled + Math.abs(newX - prev.x),
        timeAlive: prev.timeAlive + deltaTime,
      };
    });
    
    // Update power-up timers
    setBird(prev => {
      const updates: Partial<BirdState> = {};
      
      if (prev.shieldTime > 0) {
        updates.shieldTime = Math.max(0, prev.shieldTime - deltaTime);
        if (updates.shieldTime === 0) updates.hasShield = false;
      }
      
      if (prev.speedBoostTime > 0) {
        updates.speedBoostTime = Math.max(0, prev.speedBoostTime - deltaTime);
        if (updates.speedBoostTime === 0) updates.hasSpeedBoost = false;
      }
      
      if (prev.magnetTime > 0) {
        updates.magnetTime = Math.max(0, prev.magnetTime - deltaTime);
        if (updates.magnetTime === 0) updates.hasMagnet = false;
      }
      
      if (prev.invulnerabilityTime > 0) {
        updates.invulnerabilityTime = Math.max(0, prev.invulnerabilityTime - deltaTime);
      }
      
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [bird.isAlive, physics, worldBounds, config.enableDoubleJump, config.showTrail, config.trailLength]);

  const reset = useCallback(() => {
    setBird({ ...DEFAULT_BIRD_STATE, ...initialBird });
    lastFlapTime.current = 0;
    trailPoints.current = [];
    console.log('🐦 Bird reset');
  }, [initialBird]);

  const kill = useCallback(() => {
    setBird(prev => ({ ...prev, isAlive: false }));
    console.log('💀 Bird died');
  }, []);

  const revive = useCallback(() => {
    setBird(prev => ({ ...prev, isAlive: true, invulnerabilityTime: config.invulnerabilityDuration }));
    console.log('🐦 Bird revived');
  }, [config.invulnerabilityDuration]);

  // ===== POSITION MANAGEMENT =====
  const setBirdPosition = useCallback((x: number, y: number) => {
    setBird(prev => ({ ...prev, x, y }));
  }, []);

  const setBirdVelocity = useCallback((vx: number, vy: number) => {
    setBird(prev => ({ ...prev, vx, vy }));
  }, []);

  const applyForce = useCallback((fx: number, fy: number) => {
    setBird(prev => ({
      ...prev,
      vx: prev.vx + fx,
      vy: prev.vy + fy,
    }));
  }, []);

  const applyImpulse = useCallback((ix: number, iy: number) => {
    setBird(prev => ({
      ...prev,
      vx: prev.vx + ix / prev.radius, // Mass-adjusted impulse
      vy: prev.vy + iy / prev.radius,
    }));
  }, []);

  // ===== POWER-UPS =====
  const activateShield = useCallback((duration: number = config.shieldDuration) => {
    if (!config.enablePowerUps) return;
    
    setBird(prev => ({
      ...prev,
      hasShield: true,
      shieldTime: duration,
    }));
    console.log(`🛡️ Shield activated for ${duration}ms`);
  }, [config.enablePowerUps, config.shieldDuration]);

  const activateSpeedBoost = useCallback((duration: number = config.speedBoostDuration) => {
    if (!config.enablePowerUps) return;
    
    setBird(prev => ({
      ...prev,
      hasSpeedBoost: true,
      speedBoostTime: duration,
    }));
    console.log(`🚀 Speed boost activated for ${duration}ms`);
  }, [config.enablePowerUps, config.speedBoostDuration]);

  const activateMagnet = useCallback((duration: number = config.magnetDuration) => {
    if (!config.enablePowerUps) return;
    
    setBird(prev => ({
      ...prev,
      hasMagnet: true,
      magnetTime: duration,
    }));
    console.log(`🧲 Magnet activated for ${duration}ms`);
  }, [config.enablePowerUps, config.magnetDuration]);

  const makeInvulnerable = useCallback((duration: number = config.invulnerabilityDuration) => {
    setBird(prev => ({
      ...prev,
      invulnerabilityTime: duration,
    }));
    console.log(`✨ Invulnerability activated for ${duration}ms`);
  }, [config.invulnerabilityDuration]);

  const clearPowerUps = useCallback(() => {
    setBird(prev => ({
      ...prev,
      hasShield: false,
      hasSpeedBoost: false,
      hasMagnet: false,
      shieldTime: 0,
      speedBoostTime: 0,
      magnetTime: 0,
      invulnerabilityTime: 0,
    }));
    console.log('🧹 All power-ups cleared');
  }, []);

  // ===== COLLISION QUERIES =====
  const getBoundingBox = useCallback(() => {
    const size = bird.radius * 2;
    return {
      x: bird.x - bird.radius,
      y: bird.y - bird.radius,
      width: size,
      height: size,
    };
  }, [bird.x, bird.y, bird.radius]);

  const getCollisionCircle = useCallback(() => {
    return {
      x: bird.x,
      y: bird.y,
      radius: bird.radius,
    };
  }, [bird.x, bird.y, bird.radius]);

  const isCollidingWith = useCallback((other: { x: number; y: number; width?: number; height?: number; radius?: number }): boolean => {
    if (bird.invulnerabilityTime > 0 || bird.hasShield) {
      return false;
    }
    
    if (other.radius !== undefined) {
      // Circle-circle collision
      const dx = bird.x - other.x;
      const dy = bird.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < bird.radius + other.radius;
    } else if (other.width !== undefined && other.height !== undefined) {
      // Circle-rectangle collision
      const closestX = Math.max(other.x, Math.min(bird.x, other.x + other.width));
      const closestY = Math.max(other.y, Math.min(bird.y, other.y + other.height));
      const dx = bird.x - closestX;
      const dy = bird.y - closestY;
      return (dx * dx + dy * dy) < (bird.radius * bird.radius);
    }
    
    return false;
  }, [bird.x, bird.y, bird.radius, bird.invulnerabilityTime, bird.hasShield]);

  // ===== ANIMATION =====
  const updateAnimation = useCallback((deltaTime: number) => {
    setBird(prev => {
      let newAnimTime = prev.animTime + deltaTime * config.animationSpeed;
      let newFrame = Math.floor(newAnimTime) % config.frameCount;
      
      // Reset animation time to prevent overflow
      if (newAnimTime >= config.frameCount) {
        newAnimTime = newAnimTime % config.frameCount;
      }
      
      return {
        ...prev,
        animTime: newAnimTime,
        frame: newFrame,
      };
    });
  }, [config.animationSpeed, config.frameCount]);

  const getCurrentFrame = useCallback((): number => {
    return bird.frame;
  }, [bird.frame]);

  // ===== CONFIGURATION =====
  const updatePhysics = useCallback((newPhysics: Partial<BirdPhysics>) => {
    setPhysics(prev => ({ ...prev, ...newPhysics }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<BirdConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getBirdInfo = useCallback((): string => {
    const activeEffects = [
      bird.hasShield && '🛡️',
      bird.hasSpeedBoost && '🚀',
      bird.hasMagnet && '🧲',
      bird.invulnerabilityTime > 0 && '✨',
    ].filter(Boolean).join('');
    
    return [
      `🐦 (${Math.round(bird.x)}, ${Math.round(bird.y)})`,
      `📈 vy: ${bird.vy.toFixed(2)}`,
      `🎯 Jumps: ${bird.jumpsCount}`,
      `⏱️ Alive: ${(bird.timeAlive / 1000).toFixed(1)}s`,
      activeEffects && `${activeEffects}`,
    ].filter(Boolean).join(' | ');
  }, [bird]);

  return {
    bird,
    physics,
    config,
    flap,
    doubleJump,
    move,
    reset,
    kill,
    revive,
    setBirdPosition,
    setBirdVelocity,
    applyForce,
    applyImpulse,
    activateShield,
    activateSpeedBoost,
    activateMagnet,
    makeInvulnerable,
    clearPowerUps,
    getBoundingBox,
    getCollisionCircle,
    isCollidingWith,
    updateAnimation,
    getCurrentFrame,
    updatePhysics,
    updateConfig,
    getBirdInfo,
  };
};

export default useBirdManager;