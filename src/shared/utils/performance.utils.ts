/**
 * Performance detection utilities
 */

import { PerformanceLevel } from '../types/game.types';
import { PERFORMANCE_CONFIG } from '../constants/game.constants';

/**
 * Detects the performance level of the current device/browser
 * Returns performance level appropriate for 120 FPS target
 */
export const detectPerformanceLevel = (): PerformanceLevel => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Mobile device detection
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  // Browser types
  const isOldBrowser = ua.includes('msie') || ua.includes('trident');
  
  // Hardware info (if available)
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  // 120 FPS on all devices - aggressive optimization for mobile
  if (isMobile) {
    // Modern mobile devices can handle 120 FPS
    return cores >= 6 ? 'high' : 'medium'; // Strong mobiles HIGH, weaker ones MEDIUM
  }
  
  // Desktop optimization - 120 FPS target
  if (isOldBrowser || cores < 2) return 'low'; // Old browsers
  if (cores < 4 || memory < 4) return 'medium';
  if (cores < 8 || memory < 8) return 'high';
  return 'high'; // All modern machines HIGH for 120 FPS
};

/**
 * Gets the dynamic performance configuration for the current device
 */
export const getPerformanceConfig = () => {
  const level = detectPerformanceLevel();
  return PERFORMANCE_CONFIG[level];
};

/**
 * Checks if the current device can handle high performance effects
 */
export const canHandleHighPerformance = (): boolean => {
  const level = detectPerformanceLevel();
  return level === 'high' || level === 'medium';
};

/**
 * Checks if effects should be reduced for performance
 */
export const shouldReduceEffects = (): boolean => {
  const config = getPerformanceConfig();
  return config.reducedEffects;
};

/**
 * Gets the maximum number of particles allowed for current device
 */
export const getMaxParticles = (): number => {
  const config = getPerformanceConfig();
  return config.maxParticles;
};