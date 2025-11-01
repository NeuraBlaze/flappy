// ===== 🧮 MATH UTILS =====
// Mathematical utility functions for collision detection, physics calculations, and vector math
// Extracted from PhysicsEngine and game components for modularity

import { useCallback } from 'react';

// ===== INTERFACES =====
export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Line {
  start: Point2D;
  end: Point2D;
}

export interface Triangle {
  a: Point2D;
  b: Point2D;
  c: Point2D;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CollisionResult {
  collided: boolean;
  penetrationDepth?: number;
  collisionNormal?: Vector2D;
  contactPoint?: Point2D;
}

export interface RaycastResult {
  hit: boolean;
  distance?: number;
  hitPoint?: Point2D;
  hitNormal?: Vector2D;
}

export interface UseMathUtilsReturn {
  // Basic math operations
  clamp: (value: number, min: number, max: number) => number;
  lerp: (start: number, end: number, factor: number) => number;
  smoothStep: (edge0: number, edge1: number, x: number) => number;
  map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  
  // Distance and angle calculations
  distance: (p1: Point2D, p2: Point2D) => number;
  distanceSquared: (p1: Point2D, p2: Point2D) => number;
  manhattanDistance: (p1: Point2D, p2: Point2D) => number;
  angle: (from: Point2D, to: Point2D) => number;
  angleDifference: (angle1: number, angle2: number) => number;
  
  // Vector operations
  vectorAdd: (v1: Vector2D, v2: Vector2D) => Vector2D;
  vectorSubtract: (v1: Vector2D, v2: Vector2D) => Vector2D;
  vectorMultiply: (v: Vector2D, scalar: number) => Vector2D;
  vectorDivide: (v: Vector2D, scalar: number) => Vector2D;
  vectorLength: (v: Vector2D) => number;
  vectorLengthSquared: (v: Vector2D) => number;
  vectorNormalize: (v: Vector2D) => Vector2D;
  vectorDot: (v1: Vector2D, v2: Vector2D) => number;
  vectorCross: (v1: Vector2D, v2: Vector2D) => number;
  vectorRotate: (v: Vector2D, angle: number) => Vector2D;
  vectorReflect: (v: Vector2D, normal: Vector2D) => Vector2D;
  
  // Collision detection
  pointInCircle: (point: Point2D, circle: Circle) => boolean;
  pointInRectangle: (point: Point2D, rect: Rectangle) => boolean;
  pointInTriangle: (point: Point2D, triangle: Triangle) => boolean;
  circleCircleCollision: (c1: Circle, c2: Circle) => CollisionResult;
  circleRectangleCollision: (circle: Circle, rect: Rectangle) => CollisionResult;
  rectangleRectangleCollision: (r1: Rectangle, r2: Rectangle) => CollisionResult;
  lineIntersection: (line1: Line, line2: Line) => Point2D | null;
  
  // Advanced collision detection
  sweepCircleCircle: (c1: Circle, velocity1: Vector2D, c2: Circle, velocity2: Vector2D, deltaTime: number) => CollisionResult;
  raycastCircle: (origin: Point2D, direction: Vector2D, circle: Circle) => RaycastResult;
  raycastRectangle: (origin: Point2D, direction: Vector2D, rect: Rectangle) => RaycastResult;
  
  // Geometric utilities
  getBoundingBox: (points: Point2D[]) => BoundingBox;
  isPointInPolygon: (point: Point2D, polygon: Point2D[]) => boolean;
  getClosestPointOnLine: (point: Point2D, line: Line) => Point2D;
  getClosestPointOnCircle: (point: Point2D, circle: Circle) => Point2D;
  
  // Game-specific utilities
  getRandomInRange: (min: number, max: number) => number;
  getRandomPoint: (bounds: Rectangle) => Point2D;
  getRandomVector: (magnitude: number) => Vector2D;
  generateNoiseValue: (x: number, y: number, seed?: number) => number;
  
  // Easing functions
  easeInQuad: (t: number) => number;
  easeOutQuad: (t: number) => number;
  easeInOutQuad: (t: number) => number;
  easeInCubic: (t: number) => number;
  easeOutCubic: (t: number) => number;
  easeInOutCubic: (t: number) => number;
  easeBounce: (t: number) => number;
  
  // Transform utilities
  transformPoint: (point: Point2D, translation: Vector2D, rotation: number, scale: Vector2D) => Point2D;
  transformRectangle: (rect: Rectangle, translation: Vector2D, rotation: number, scale: Vector2D) => Point2D[];
  
  // Physics helpers
  calculateTrajectory: (initialVelocity: Vector2D, gravity: number, time: number) => Point2D;
  calculateImpact: (velocity: Vector2D, mass1: number, mass2: number) => Vector2D;
  calculateFriction: (velocity: Vector2D, friction: number) => Vector2D;
  
  // Utility functions
  degToRad: (degrees: number) => number;
  radToDeg: (radians: number) => number;
  isPowerOfTwo: (value: number) => boolean;
  nextPowerOfTwo: (value: number) => number;
  formatNumber: (value: number, decimals: number) => string;
}

// ===== CONSTANTS =====
export const MATH_CONSTANTS = {
  PI: Math.PI,
  TAU: Math.PI * 2,
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  EPSILON: 1e-10,
  GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
} as const;

// ===== UTILITY FUNCTIONS =====
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// ===== CUSTOM HOOK =====
export function useMathUtils(): UseMathUtilsReturn {
  
  // ===== BASIC MATH OPERATIONS =====
  const clamp = useCallback((value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  }, []);
  
  const lerp = useCallback((start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  }, []);
  
  const smoothStep = useCallback((edge0: number, edge1: number, x: number): number => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }, [clamp]);
  
  const map = useCallback((value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }, []);
  
  // ===== DISTANCE AND ANGLE CALCULATIONS =====
  const distance = useCallback((p1: Point2D, p2: Point2D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  const distanceSquared = useCallback((p1: Point2D, p2: Point2D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  }, []);
  
  const manhattanDistance = useCallback((p1: Point2D, p2: Point2D): number => {
    return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
  }, []);
  
  const angle = useCallback((from: Point2D, to: Point2D): number => {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }, []);
  
  const angleDifference = useCallback((angle1: number, angle2: number): number => {
    let diff = angle2 - angle1;
    while (diff > Math.PI) diff -= MATH_CONSTANTS.TAU;
    while (diff < -Math.PI) diff += MATH_CONSTANTS.TAU;
    return diff;
  }, []);
  
  // ===== VECTOR OPERATIONS =====
  const vectorAdd = useCallback((v1: Vector2D, v2: Vector2D): Vector2D => ({
    x: v1.x + v2.x,
    y: v1.y + v2.y
  }), []);
  
  const vectorSubtract = useCallback((v1: Vector2D, v2: Vector2D): Vector2D => ({
    x: v1.x - v2.x,
    y: v1.y - v2.y
  }), []);
  
  const vectorMultiply = useCallback((v: Vector2D, scalar: number): Vector2D => ({
    x: v.x * scalar,
    y: v.y * scalar
  }), []);
  
  const vectorDivide = useCallback((v: Vector2D, scalar: number): Vector2D => ({
    x: v.x / scalar,
    y: v.y / scalar
  }), []);
  
  const vectorLength = useCallback((v: Vector2D): number => {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }, []);
  
  const vectorLengthSquared = useCallback((v: Vector2D): number => {
    return v.x * v.x + v.y * v.y;
  }, []);
  
  const vectorNormalize = useCallback((v: Vector2D): Vector2D => {
    const length = vectorLength(v);
    if (length < MATH_CONSTANTS.EPSILON) return { x: 0, y: 0 };
    return vectorDivide(v, length);
  }, [vectorLength, vectorDivide]);
  
  const vectorDot = useCallback((v1: Vector2D, v2: Vector2D): number => {
    return v1.x * v2.x + v1.y * v2.y;
  }, []);
  
  const vectorCross = useCallback((v1: Vector2D, v2: Vector2D): number => {
    return v1.x * v2.y - v1.y * v2.x;
  }, []);
  
  const vectorRotate = useCallback((v: Vector2D, angle: number): Vector2D => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos
    };
  }, []);
  
  const vectorReflect = useCallback((v: Vector2D, normal: Vector2D): Vector2D => {
    const dot = vectorDot(v, normal);
    return vectorSubtract(v, vectorMultiply(normal, 2 * dot));
  }, [vectorDot, vectorSubtract, vectorMultiply]);
  
  // ===== COLLISION DETECTION =====
  const pointInCircle = useCallback((point: Point2D, circle: Circle): boolean => {
    return distanceSquared(point, circle) <= circle.radius * circle.radius;
  }, [distanceSquared]);
  
  const pointInRectangle = useCallback((point: Point2D, rect: Rectangle): boolean => {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }, []);
  
  const pointInTriangle = useCallback((point: Point2D, triangle: Triangle): boolean => {
    const { a, b, c } = triangle;
    const v0 = vectorSubtract(c, a);
    const v1 = vectorSubtract(b, a);
    const v2 = vectorSubtract(point, a);
    
    const dot00 = vectorDot(v0, v0);
    const dot01 = vectorDot(v0, v1);
    const dot02 = vectorDot(v0, v2);
    const dot11 = vectorDot(v1, v1);
    const dot12 = vectorDot(v1, v2);
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }, [vectorSubtract, vectorDot]);
  
  const circleCircleCollision = useCallback((c1: Circle, c2: Circle): CollisionResult => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = c1.radius + c2.radius;
    const radiusSumSq = radiusSum * radiusSum;
    
    if (distSq <= radiusSumSq) {
      const dist = Math.sqrt(distSq);
      const penetrationDepth = radiusSum - dist;
      const normal = dist > MATH_CONSTANTS.EPSILON ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
      const contactPoint = {
        x: c1.x + normal.x * c1.radius,
        y: c1.y + normal.y * c1.radius
      };
      
      return {
        collided: true,
        penetrationDepth,
        collisionNormal: normal,
        contactPoint
      };
    }
    
    return { collided: false };
  }, []);
  
  const circleRectangleCollision = useCallback((circle: Circle, rect: Rectangle): CollisionResult => {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distSq = dx * dx + dy * dy;
    
    if (distSq <= circle.radius * circle.radius) {
      const dist = Math.sqrt(distSq);
      const penetrationDepth = circle.radius - dist;
      const normal = dist > MATH_CONSTANTS.EPSILON ? { x: dx / dist, y: dy / dist } : { x: 0, y: -1 };
      
      return {
        collided: true,
        penetrationDepth,
        collisionNormal: normal,
        contactPoint: { x: closestX, y: closestY }
      };
    }
    
    return { collided: false };
  }, [clamp]);
  
  const rectangleRectangleCollision = useCallback((r1: Rectangle, r2: Rectangle): CollisionResult => {
    const overlapX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
    const overlapY = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);
    
    if (overlapX > 0 && overlapY > 0) {
      let normal: Vector2D;
      let penetrationDepth: number;
      
      if (overlapX < overlapY) {
        penetrationDepth = overlapX;
        normal = r1.x < r2.x ? { x: -1, y: 0 } : { x: 1, y: 0 };
      } else {
        penetrationDepth = overlapY;
        normal = r1.y < r2.y ? { x: 0, y: -1 } : { x: 0, y: 1 };
      }
      
      const contactPoint = {
        x: Math.max(r1.x, r2.x) + overlapX / 2,
        y: Math.max(r1.y, r2.y) + overlapY / 2
      };
      
      return {
        collided: true,
        penetrationDepth,
        collisionNormal: normal,
        contactPoint
      };
    }
    
    return { collided: false };
  }, []);
  
  const lineIntersection = useCallback((line1: Line, line2: Line): Point2D | null => {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;
    
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (Math.abs(denom) < MATH_CONSTANTS.EPSILON) {
      return null; // Lines are parallel
    }
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }, []);
  
  // ===== ADVANCED COLLISION DETECTION =====
  const sweepCircleCircle = useCallback((
    c1: Circle, 
    velocity1: Vector2D, 
    c2: Circle, 
    velocity2: Vector2D, 
    deltaTime: number
  ): CollisionResult => {
    const relativeVelocity = vectorSubtract(velocity1, velocity2);
    const relativePosition = vectorSubtract(c1, c2);
    
    const a = vectorDot(relativeVelocity, relativeVelocity);
    const b = 2 * vectorDot(relativePosition, relativeVelocity);
    const c = vectorDot(relativePosition, relativePosition) - Math.pow(c1.radius + c2.radius, 2);
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return { collided: false };
    }
    
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    
    if (t >= 0 && t <= deltaTime) {
      const collisionPoint1 = vectorAdd(c1, vectorMultiply(velocity1, t));
      const collisionPoint2 = vectorAdd(c2, vectorMultiply(velocity2, t));
      const normal = vectorNormalize(vectorSubtract(collisionPoint1, collisionPoint2));
      
      return {
        collided: true,
        penetrationDepth: 0, // At the moment of collision
        collisionNormal: normal,
        contactPoint: vectorAdd(collisionPoint2, vectorMultiply(normal, c2.radius))
      };
    }
    
    return { collided: false };
  }, [vectorSubtract, vectorDot, vectorAdd, vectorMultiply, vectorNormalize]);
  
  const raycastCircle = useCallback((origin: Point2D, direction: Vector2D, circle: Circle): RaycastResult => {
    const toCircle = vectorSubtract(circle, origin);
    const projLength = vectorDot(toCircle, direction);
    
    if (projLength < 0) {
      return { hit: false };
    }
    
    const projPoint = vectorAdd(origin, vectorMultiply(direction, projLength));
    const distToCenter = distance(projPoint, circle);
    
    if (distToCenter > circle.radius) {
      return { hit: false };
    }
    
    const distToSurface = Math.sqrt(circle.radius * circle.radius - distToCenter * distToCenter);
    const hitDistance = projLength - distToSurface;
    
    if (hitDistance < 0) {
      return { hit: false };
    }
    
    const hitPoint = vectorAdd(origin, vectorMultiply(direction, hitDistance));
    const hitNormal = vectorNormalize(vectorSubtract(hitPoint, circle));
    
    return {
      hit: true,
      distance: hitDistance,
      hitPoint,
      hitNormal
    };
  }, [vectorSubtract, vectorDot, vectorAdd, vectorMultiply, distance, vectorNormalize]);
  
  const raycastRectangle = useCallback((origin: Point2D, direction: Vector2D, rect: Rectangle): RaycastResult => {
    const invDir = { x: 1 / direction.x, y: 1 / direction.y };
    
    const t1 = (rect.x - origin.x) * invDir.x;
    const t2 = (rect.x + rect.width - origin.x) * invDir.x;
    const t3 = (rect.y - origin.y) * invDir.y;
    const t4 = (rect.y + rect.height - origin.y) * invDir.y;
    
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
    
    if (tmax < 0 || tmin > tmax) {
      return { hit: false };
    }
    
    const hitDistance = tmin < 0 ? tmax : tmin;
    const hitPoint = vectorAdd(origin, vectorMultiply(direction, hitDistance));
    
    // Calculate normal based on which face was hit
    let hitNormal: Vector2D;
    const epsilon = 0.001;
    
    if (Math.abs(hitPoint.x - rect.x) < epsilon) {
      hitNormal = { x: -1, y: 0 };
    } else if (Math.abs(hitPoint.x - (rect.x + rect.width)) < epsilon) {
      hitNormal = { x: 1, y: 0 };
    } else if (Math.abs(hitPoint.y - rect.y) < epsilon) {
      hitNormal = { x: 0, y: -1 };
    } else {
      hitNormal = { x: 0, y: 1 };
    }
    
    return {
      hit: true,
      distance: hitDistance,
      hitPoint,
      hitNormal
    };
  }, [vectorAdd, vectorMultiply]);
  
  // ===== GEOMETRIC UTILITIES =====
  const getBoundingBox = useCallback((points: Point2D[]): BoundingBox => {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
  }, []);
  
  const isPointInPolygon = useCallback((point: Point2D, polygon: Point2D[]): boolean => {
    let inside = false;
    const x = point.x;
    const y = point.y;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }, []);
  
  const getClosestPointOnLine = useCallback((point: Point2D, line: Line): Point2D => {
    const lineVector = vectorSubtract(line.end, line.start);
    const pointVector = vectorSubtract(point, line.start);
    
    const lineLength = vectorLengthSquared(lineVector);
    if (lineLength < MATH_CONSTANTS.EPSILON) {
      return line.start;
    }
    
    const t = clamp(vectorDot(pointVector, lineVector) / lineLength, 0, 1);
    return vectorAdd(line.start, vectorMultiply(lineVector, t));
  }, [vectorSubtract, vectorLengthSquared, vectorDot, clamp, vectorAdd, vectorMultiply]);
  
  const getClosestPointOnCircle = useCallback((point: Point2D, circle: Circle): Point2D => {
    const direction = vectorSubtract(point, circle);
    const normalized = vectorNormalize(direction);
    return vectorAdd(circle, vectorMultiply(normalized, circle.radius));
  }, [vectorSubtract, vectorNormalize, vectorAdd, vectorMultiply]);
  
  // ===== GAME-SPECIFIC UTILITIES =====
  const getRandomInRange = useCallback((min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  }, []);
  
  const getRandomPoint = useCallback((bounds: Rectangle): Point2D => ({
    x: getRandomInRange(bounds.x, bounds.x + bounds.width),
    y: getRandomInRange(bounds.y, bounds.y + bounds.height)
  }), [getRandomInRange]);
  
  const getRandomVector = useCallback((magnitude: number): Vector2D => {
    const angle = getRandomInRange(0, MATH_CONSTANTS.TAU);
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  }, [getRandomInRange]);
  
  const generateNoiseValue = useCallback((x: number, y: number, seed: number = 12345): number => {
    const hashedSeed = hashCode(`${x}_${y}_${seed}`);
    return seededRandom(hashedSeed);
  }, []);
  
  // ===== EASING FUNCTIONS =====
  const easeInQuad = useCallback((t: number): number => t * t, []);
  const easeOutQuad = useCallback((t: number): number => t * (2 - t), []);
  const easeInOutQuad = useCallback((t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, []);
  const easeInCubic = useCallback((t: number): number => t * t * t, []);
  const easeOutCubic = useCallback((t: number): number => (--t) * t * t + 1, []);
  const easeInOutCubic = useCallback((t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1, []);
  const easeBounce = useCallback((t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }, []);
  
  // ===== TRANSFORM UTILITIES =====
  const transformPoint = useCallback((
    point: Point2D, 
    translation: Vector2D, 
    rotation: number, 
    scale: Vector2D
  ): Point2D => {
    // Scale first
    let transformed = { x: point.x * scale.x, y: point.y * scale.y };
    
    // Then rotate
    transformed = vectorRotate(transformed, rotation);
    
    // Finally translate
    transformed = vectorAdd(transformed, translation);
    
    return transformed;
  }, [vectorRotate, vectorAdd]);
  
  const transformRectangle = useCallback((
    rect: Rectangle, 
    translation: Vector2D, 
    rotation: number, 
    scale: Vector2D
  ): Point2D[] => {
    const corners = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];
    
    return corners.map(corner => transformPoint(corner, translation, rotation, scale));
  }, [transformPoint]);
  
  // ===== PHYSICS HELPERS =====
  const calculateTrajectory = useCallback((initialVelocity: Vector2D, gravity: number, time: number): Point2D => ({
    x: initialVelocity.x * time,
    y: initialVelocity.y * time + 0.5 * gravity * time * time
  }), []);
  
  const calculateImpact = useCallback((velocity: Vector2D, mass1: number, mass2: number): Vector2D => {
    const totalMass = mass1 + mass2;
    const velocityReduction = mass2 / totalMass;
    return vectorMultiply(velocity, velocityReduction);
  }, [vectorMultiply]);
  
  const calculateFriction = useCallback((velocity: Vector2D, friction: number): Vector2D => {
    const speed = vectorLength(velocity);
    if (speed < MATH_CONSTANTS.EPSILON) return { x: 0, y: 0 };
    
    const frictionForce = friction * speed;
    const direction = vectorNormalize(velocity);
    const frictionVector = vectorMultiply(direction, -frictionForce);
    
    return vectorAdd(velocity, frictionVector);
  }, [vectorLength, vectorNormalize, vectorMultiply, vectorAdd]);
  
  // ===== UTILITY FUNCTIONS =====
  const degToRad = useCallback((degrees: number): number => degrees * MATH_CONSTANTS.DEG_TO_RAD, []);
  const radToDeg = useCallback((radians: number): number => radians * MATH_CONSTANTS.RAD_TO_DEG, []);
  
  const isPowerOfTwo = useCallback((value: number): boolean => {
    return value > 0 && (value & (value - 1)) === 0;
  }, []);
  
  const nextPowerOfTwo = useCallback((value: number): number => {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }, []);
  
  const formatNumber = useCallback((value: number, decimals: number): string => {
    return value.toFixed(decimals);
  }, []);
  
  return {
    // Basic math operations
    clamp,
    lerp,
    smoothStep,
    map,
    
    // Distance and angle calculations
    distance,
    distanceSquared,
    manhattanDistance,
    angle,
    angleDifference,
    
    // Vector operations
    vectorAdd,
    vectorSubtract,
    vectorMultiply,
    vectorDivide,
    vectorLength,
    vectorLengthSquared,
    vectorNormalize,
    vectorDot,
    vectorCross,
    vectorRotate,
    vectorReflect,
    
    // Collision detection
    pointInCircle,
    pointInRectangle,
    pointInTriangle,
    circleCircleCollision,
    circleRectangleCollision,
    rectangleRectangleCollision,
    lineIntersection,
    
    // Advanced collision detection
    sweepCircleCircle,
    raycastCircle,
    raycastRectangle,
    
    // Geometric utilities
    getBoundingBox,
    isPointInPolygon,
    getClosestPointOnLine,
    getClosestPointOnCircle,
    
    // Game-specific utilities
    getRandomInRange,
    getRandomPoint,
    getRandomVector,
    generateNoiseValue,
    
    // Easing functions
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeBounce,
    
    // Transform utilities
    transformPoint,
    transformRectangle,
    
    // Physics helpers
    calculateTrajectory,
    calculateImpact,
    calculateFriction,
    
    // Utility functions
    degToRad,
    radToDeg,
    isPowerOfTwo,
    nextPowerOfTwo,
    formatNumber,
  };
}

// ===== COMPONENT EXPORT =====
export default useMathUtils;