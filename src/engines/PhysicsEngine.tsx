/**
 * ========================================
 * PHASE 1: CORE SYSTEM COMPONENTS
 * ========================================
 * 
 * PhysicsEngine.tsx - Fizika számítások (gravitáció, ütközés)
 * 
 * FUNKCIÓK:
 * - Gravitáció számítások
 * - Mozgás fizika (sebesség, gyorsulás)
 * - Ütközés detektálás (AABB, kör-kör, kör-téglalap)
 * - Fizikai konstansok kezelése
 * - Madár fizika (ugrás, esés)
 */

import { useRef, useCallback } from 'react';

// ===== 🔵 COLLISION SHAPES =====
export interface CircleCollider {
  x: number;
  y: number;
  radius: number;
}

export interface RectCollider {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

// ===== 🐦 BIRD PHYSICS =====
export interface BirdPhysics {
  x: number;
  y: number;
  vy: number;        // függőleges sebesség
  vx?: number;       // vízszintes sebesség (opcionális)
  radius: number;
  grounded: boolean;
}

// ===== ⚖️ PHYSICS CONSTANTS =====
export interface PhysicsConstants {
  gravity: number;
  jumpPower: number;
  maxFallSpeed: number;
  airResistance: number;
  groundFriction: number;
}

// ===== 🎯 PHYSICS ENGINE HOOK =====
export const usePhysicsEngine = () => {
  // Fizikai konstansok
  const constants = useRef<PhysicsConstants>({
    gravity: 0.119,      // alapértelmezett gravitáció
    jumpPower: -3.83,    // alapértelmezett ugrás erő
    maxFallSpeed: 8.0,   // maximum esési sebesség
    airResistance: 0.99, // levegő ellenállás
    groundFriction: 0.8  // földi súrlódás
  });

  // ===== 🔄 MOVEMENT PHYSICS =====
  
  /**
   * Madár fizika update-je
   */
  const updateBirdPhysics = useCallback((
    bird: BirdPhysics, 
    deltaTime: number, 
    worldHeight: number,
    groundHeight: number = 50
  ): BirdPhysics => {
    const newBird = { ...bird };
    const dt = deltaTime / 16.67; // normalizáljuk 60 FPS-re
    
    // Gravitáció alkalmazása
    if (!newBird.grounded) {
      newBird.vy += constants.current.gravity * dt;
      
      // Maximum esési sebesség korlátozás
      if (newBird.vy > constants.current.maxFallSpeed) {
        newBird.vy = constants.current.maxFallSpeed;
      }
    }
    
    // Levegő ellenállás
    newBird.vy *= constants.current.airResistance;
    
    // Pozíció update
    newBird.y += newBird.vy * dt;
    
    // Vízszintes mozgás (ha van)
    if (newBird.vx !== undefined) {
      newBird.x += newBird.vx * dt;
    }
    
    // Föld ütközés ellenőrzés
    const groundY = worldHeight - groundHeight;
    if (newBird.y + newBird.radius >= groundY) {
      newBird.y = groundY - newBird.radius;
      newBird.vy *= -0.5; // visszapattanás
      newBird.grounded = true;
      
      // Földi súrlódás
      if (newBird.vx !== undefined) {
        newBird.vx *= constants.current.groundFriction;
      }
    } else {
      newBird.grounded = false;
    }
    
    // Felső határ ellenőrzés
    if (newBird.y - newBird.radius < 0) {
      newBird.y = newBird.radius;
      newBird.vy = Math.max(0, newBird.vy); // megállítjuk a felfelé mozgást
    }
    
    return newBird;
  }, []);

  /**
   * Madár ugrása
   */
  const jumpBird = useCallback((bird: BirdPhysics, jumpMultiplier: number = 1.0): BirdPhysics => {
    return {
      ...bird,
      vy: constants.current.jumpPower * jumpMultiplier,
      grounded: false
    };
  }, []);

  // ===== 💥 COLLISION DETECTION =====
  
  /**
   * Kör-kör ütközés detektálás
   */
  const circleCircleCollision = useCallback((c1: CircleCollider, c2: CircleCollider): boolean => {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (c1.radius + c2.radius);
  }, []);

  /**
   * Kör-téglalap ütközés detektálás
   */
  const circleRectCollision = useCallback((circle: CircleCollider, rect: RectCollider): boolean => {
    // Legközelebbi pont a téglalapban a körhöz képest
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    // Távolság a kör középpontja és a legközelebbi pont között
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= circle.radius;
  }, []);

  /**
   * AABB (Axis-Aligned Bounding Box) ütközés detektálás
   */
  const aabbCollision = useCallback((rect1: RectCollider, rect2: RectCollider): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  /**
   * Pont-kör ütközés detektálás
   */
  const pointCircleCollision = useCallback((point: Point, circle: CircleCollider): boolean => {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= circle.radius;
  }, []);

  /**
   * Pont-téglalap ütközés detektálás
   */
  const pointRectCollision = useCallback((point: Point, rect: RectCollider): boolean => {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }, []);

  // ===== 📐 PHYSICS UTILITIES =====
  
  /**
   * Távolság számítás két pont között
   */
  const distance = useCallback((p1: Point, p2: Point): number => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Vektor normalizálás
   */
  const normalizeVector = useCallback((vector: Vector2D): Vector2D => {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }, []);

  /**
   * Vektor forgatás radianban
   */
  const rotateVector = useCallback((vector: Vector2D, angle: number): Vector2D => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vector.x * cos - vector.y * sin,
      y: vector.x * sin + vector.y * cos
    };
  }, []);

  /**
   * Lineáris interpoláció
   */
  const lerp = useCallback((start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  }, []);

  // ===== ⚙️ PHYSICS CONFIGURATION =====
  
  const updatePhysicsConstants = useCallback((newConstants: Partial<PhysicsConstants>) => {
    constants.current = { ...constants.current, ...newConstants };
  }, []);

  const getPhysicsConstants = useCallback(() => constants.current, []);

  const resetPhysicsConstants = useCallback(() => {
    constants.current = {
      gravity: 0.119,
      jumpPower: -3.83,
      maxFallSpeed: 8.0,
      airResistance: 0.99,
      groundFriction: 0.8
    };
  }, []);

  // ===== 🚀 PHYSICS ENGINE INTERFACE =====
  return {
    // Bird physics
    updateBirdPhysics,
    jumpBird,
    
    // Collision detection
    circleCircleCollision,
    circleRectCollision,
    aabbCollision,
    pointCircleCollision,
    pointRectCollision,
    
    // Physics utilities
    distance,
    normalizeVector,
    rotateVector,
    lerp,
    
    // Configuration
    constants: constants.current,
    updatePhysicsConstants,
    getPhysicsConstants,
    resetPhysicsConstants
  };
};

// ===== 🔧 PHYSICS HELPERS =====

/**
 * Egyszerű madár objektum létrehozása
 */
export const createBird = (x: number, y: number, radius: number = 12): BirdPhysics => ({
  x,
  y,
  vy: 0,
  radius,
  grounded: false
});

/**
 * Kör collider létrehozása
 */
export const createCircleCollider = (x: number, y: number, radius: number): CircleCollider => ({
  x, y, radius
});

/**
 * Téglalap collider létrehozása
 */
export const createRectCollider = (x: number, y: number, width: number, height: number): RectCollider => ({
  x, y, width, height
});

export default usePhysicsEngine;