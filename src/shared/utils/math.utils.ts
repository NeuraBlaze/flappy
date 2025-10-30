/**
 * Math and calculation utilities
 */

/**
 * Generates a random number between min and max (inclusive)
 */
export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generates a random integer between min and max (inclusive)
 */
export const randomIntBetween = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1));
};

/**
 * Calculates the distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Clamps a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

/**
 * Converts degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Converts radians to degrees
 */
export const radToDeg = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Normalizes an angle to be between 0 and 2π
 */
export const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
};

/**
 * Easing function for smooth animations (ease in-out cubic)
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};