/**
 * Game configuration constants
 */

import { PerformanceConfig, PerformanceLevel } from '../types/game.types';

// Performance configuration for different device capabilities
export const PERFORMANCE_CONFIG: Record<PerformanceLevel, PerformanceConfig> = {
  // High performance - powerful devices
  high: {
    maxParticles: 150,
    maxPowerUps: 8,
    maxCoins: 10,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 1.0
  },
  
  // Medium performance - average devices
  medium: {
    maxParticles: 100,
    maxPowerUps: 6,
    maxCoins: 8,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 0.8
  },
  
  // Low performance - weak devices/browsers
  low: {
    maxParticles: 60,
    maxPowerUps: 5,
    maxCoins: 6,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.6
  },
  
  // Minimal performance - very weak devices
  minimal: {
    maxParticles: 40,
    maxPowerUps: 4,
    maxCoins: 5,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.2
  }
};

// Game physics constants
export const PHYSICS_CONFIG = {
  GRAVITY: 0.08,         // Eredeti finomabb gravitáció
  JUMP_FORCE: -2.8,      // Eredeti enyhébb ugrás
  BIRD_RADIUS: 15,
  TARGET_FPS: 120,
  MAX_VELOCITY: 12       // Nagyobb max sebesség
};

// Game world dimensions
export const WORLD_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 100,
  PIPE_WIDTH: 80,
  PIPE_GAP: 180,
  PIPE_SPAWN_INTERVAL: 2000 // milliseconds
};

// Default speed settings
export const DEFAULT_SPEED_SETTINGS = {
  normal: 2.0,
  slowMotion: 1.0,
  rainbow: 3.0,
  super: 4.0,
  godMode: 2.5
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  COINS: 'szenyo_madar_coins',
  ACHIEVEMENTS: 'szenyo_madar_achievements', 
  BEST_SCORE: 'szenyo_madar_best',
  SPEED_SETTINGS: 'szenyo_madar_speed_settings',
  SELECTED_SKIN: 'szenyo_madar_selected_skin',
  STARTING_BIOME: 'szenyo_madar_starting_biome',
  BUTTON_POSITION: 'szenyo_madar_button_position'
};

// Default achievements
export const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_flight', name: 'Első Repülés', description: 'Repülj először!', unlocked: false, icon: '🐣' },
  { id: 'coin_collector', name: 'Érme Gyűjtő', description: 'Gyűjts 50 érmét!', unlocked: false, icon: '💰' },
  { id: 'high_flyer', name: 'Magas Repülő', description: 'Érj el 20 pontot!', unlocked: false, icon: '🚀' },
  { id: 'power_user', name: 'Power Felhasználó', description: 'Használj 10 power-upot!', unlocked: false, icon: '⚡' },
  { id: 'shield_master', name: 'Pajzs Mester', description: 'Túlélj 5 ütközést pajzzsal!', unlocked: false, icon: '🛡️' },
  { id: 'rainbow_rider', name: 'Szivárvány Lovas', description: 'Használd a rainbow mode-ot!', unlocked: false, icon: '🌈' }
];