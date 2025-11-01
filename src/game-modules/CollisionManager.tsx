/**
 * ========================================
 * PHASE 5.2: COLLISION MANAGER
 * ========================================
 * 
 * Collision detection and response system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState } from 'react';
import { BirdState } from './BirdManager';
import { WorldBounds } from './WorldManager';

// ===== COLLISION TYPES =====
export interface CollisionShape {
  type: 'circle' | 'rectangle';
  x: number;
  y: number;
  width?: number;   // for rectangle
  height?: number;  // for rectangle
  radius?: number;  // for circle
}

export interface CollisionObject {
  id: string;
  type: 'bird' | 'obstacle' | 'powerup' | 'coin' | 'ground' | 'ceiling';
  shape: CollisionShape;
  solid: boolean;           // whether it blocks movement
  deadly: boolean;          // whether it causes game over
  collectible: boolean;     // whether it can be collected
  metadata?: any;           // additional object data
}

export interface CollisionEvent {
  id: string;
  timestamp: number;
  objectA: CollisionObject;
  objectB: CollisionObject;
  point: { x: number; y: number };
  penetration: number;
  normal: { x: number; y: number };
  handled: boolean;
}

export interface CollisionConfig {
  // Detection settings
  enableBroadPhase: boolean;
  spatialPartitioning: boolean;
  gridSize: number;
  
  // Response settings
  enablePhysicsResponse: boolean;
  restitution: number;
  friction: number;
  
  // Debug settings
  showCollisionBoxes: boolean;
  showCollisionPoints: boolean;
  logCollisions: boolean;
  
  // Performance settings
  maxCollisionsPerFrame: number;
  collisionCooldown: number;
}

export interface CollisionManagerReturn {
  // Collision objects
  collisionObjects: CollisionObject[];
  collisionEvents: CollisionEvent[];
  
  // Object management
  addCollisionObject: (object: CollisionObject) => void;
  removeCollisionObject: (id: string) => void;
  updateCollisionObject: (id: string, updates: Partial<CollisionObject>) => void;
  clearCollisionObjects: () => void;
  
  // Collision detection
  checkCollisions: () => CollisionEvent[];
  checkBirdCollisions: (bird: BirdState) => CollisionEvent[];
  checkPointCollision: (x: number, y: number, objects?: CollisionObject[]) => CollisionObject | null;
  checkShapeCollision: (shapeA: CollisionShape, shapeB: CollisionShape) => boolean;
  
  // Collision queries
  getObjectsInRadius: (x: number, y: number, radius: number) => CollisionObject[];
  getObjectsInRect: (x: number, y: number, width: number, height: number) => CollisionObject[];
  getObjectsByType: (type: CollisionObject['type']) => CollisionObject[];
  getCollisionHistory: (objectId: string, timeRange?: number) => CollisionEvent[];
  
  // Collision response
  handleCollisionEvent: (event: CollisionEvent) => void;
  resolveCollision: (objectA: CollisionObject, objectB: CollisionObject) => { x: number; y: number };
  
  // Configuration
  updateConfig: (newConfig: Partial<CollisionConfig>) => void;
  resetCollisions: () => void;
  getCollisionStats: () => string;
}

// ===== DEFAULT CONFIGURATION =====
const DEFAULT_COLLISION_CONFIG: CollisionConfig = {
  enableBroadPhase: true,
  spatialPartitioning: false,
  gridSize: 64,
  enablePhysicsResponse: true,
  restitution: 0.3,
  friction: 0.1,
  showCollisionBoxes: false,
  showCollisionPoints: false,
  logCollisions: false,
  maxCollisionsPerFrame: 50,
  collisionCooldown: 100, // ms
};

// ===== COLLISION MANAGER HOOK =====
export const useCollisionManager = (
  worldBounds: WorldBounds,
  initialConfig: Partial<CollisionConfig> = {}
): CollisionManagerReturn => {
  
  // State
  const [collisionObjects, setCollisionObjects] = useState<CollisionObject[]>([]);
  const [collisionEvents, setCollisionEvents] = useState<CollisionEvent[]>([]);
  const [config, setConfig] = useState<CollisionConfig>({ ...DEFAULT_COLLISION_CONFIG, ...initialConfig });
  
  // Internal tracking
  const eventIdCounter = useRef<number>(0);
  const lastCollisionCheck = useRef<number>(0);
  const collisionCooldowns = useRef<Map<string, number>>(new Map());
  const spatialGrid = useRef<Map<string, CollisionObject[]>>(new Map());

  // ===== UTILITY FUNCTIONS =====
  const generateEventId = useCallback((): string => {
    return `collision_${++eventIdCounter.current}_${Date.now()}`;
  }, []);

  const getGridKey = useCallback((x: number, y: number): string => {
    const gridX = Math.floor(x / config.gridSize);
    const gridY = Math.floor(y / config.gridSize);
    return `${gridX},${gridY}`;
  }, [config.gridSize]);

  const updateSpatialGrid = useCallback(() => {
    if (!config.spatialPartitioning) return;
    
    spatialGrid.current.clear();
    
    collisionObjects.forEach(obj => {
      const keys = new Set<string>();
      
      if (obj.shape.type === 'circle') {
        const radius = obj.shape.radius || 0;
        for (let x = obj.shape.x - radius; x <= obj.shape.x + radius; x += config.gridSize) {
          for (let y = obj.shape.y - radius; y <= obj.shape.y + radius; y += config.gridSize) {
            keys.add(getGridKey(x, y));
          }
        }
      } else {
        const width = obj.shape.width || 0;
        const height = obj.shape.height || 0;
        for (let x = obj.shape.x; x <= obj.shape.x + width; x += config.gridSize) {
          for (let y = obj.shape.y; y <= obj.shape.y + height; y += config.gridSize) {
            keys.add(getGridKey(x, y));
          }
        }
      }
      
      keys.forEach(key => {
        if (!spatialGrid.current.has(key)) {
          spatialGrid.current.set(key, []);
        }
        spatialGrid.current.get(key)!.push(obj);
      });
    });
  }, [collisionObjects, config.spatialPartitioning, config.gridSize, getGridKey]);

  // ===== OBJECT MANAGEMENT =====
  const addCollisionObject = useCallback((object: CollisionObject) => {
    setCollisionObjects(prev => {
      // Remove existing object with same ID
      const filtered = prev.filter(obj => obj.id !== object.id);
      return [...filtered, object];
    });
  }, []);

  const removeCollisionObject = useCallback((id: string) => {
    setCollisionObjects(prev => prev.filter(obj => obj.id !== id));
    collisionCooldowns.current.delete(id);
  }, []);

  const updateCollisionObject = useCallback((id: string, updates: Partial<CollisionObject>) => {
    setCollisionObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const clearCollisionObjects = useCallback(() => {
    setCollisionObjects([]);
    collisionCooldowns.current.clear();
  }, []);

  // ===== COLLISION DETECTION =====
  const checkShapeCollision = useCallback((shapeA: CollisionShape, shapeB: CollisionShape): boolean => {
    if (shapeA.type === 'circle' && shapeB.type === 'circle') {
      // Circle-circle collision
      const dx = shapeA.x - shapeB.x;
      const dy = shapeA.y - shapeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radiusSum = (shapeA.radius || 0) + (shapeB.radius || 0);
      return distance < radiusSum;
    }
    
    if (shapeA.type === 'rectangle' && shapeB.type === 'rectangle') {
      // Rectangle-rectangle collision (AABB)
      const aLeft = shapeA.x;
      const aRight = shapeA.x + (shapeA.width || 0);
      const aTop = shapeA.y;
      const aBottom = shapeA.y + (shapeA.height || 0);
      
      const bLeft = shapeB.x;
      const bRight = shapeB.x + (shapeB.width || 0);
      const bTop = shapeB.y;
      const bBottom = shapeB.y + (shapeB.height || 0);
      
      return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
    }
    
    // Circle-rectangle collision
    const circle = shapeA.type === 'circle' ? shapeA : shapeB;
    const rect = shapeA.type === 'rectangle' ? shapeA : shapeB;
    
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + (rect.width || 0)));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + (rect.height || 0)));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (circle.radius || 0);
  }, []);

  const checkCollisions = useCallback((): CollisionEvent[] => {
    const now = Date.now();
    
    // Rate limiting
    if (now - lastCollisionCheck.current < config.collisionCooldown) {
      return [];
    }
    lastCollisionCheck.current = now;
    
    updateSpatialGrid();
    
    const newEvents: CollisionEvent[] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < collisionObjects.length && newEvents.length < config.maxCollisionsPerFrame; i++) {
      const objA = collisionObjects[i];
      
      // Check cooldown
      const cooldown = collisionCooldowns.current.get(objA.id) || 0;
      if (now < cooldown) continue;
      
      const candidates = config.spatialPartitioning
        ? spatialGrid.current.get(getGridKey(objA.shape.x, objA.shape.y)) || []
        : collisionObjects;
      
      for (const objB of candidates) {
        if (objA.id === objB.id) continue;
        
        const pairKey = [objA.id, objB.id].sort().join('-');
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);
        
        if (checkShapeCollision(objA.shape, objB.shape)) {
          // Calculate collision details
          const dx = objB.shape.x - objA.shape.x;
          const dy = objB.shape.y - objA.shape.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const normal = distance > 0 
            ? { x: dx / distance, y: dy / distance }
            : { x: 1, y: 0 };
          
          const point = {
            x: (objA.shape.x + objB.shape.x) / 2,
            y: (objA.shape.y + objB.shape.y) / 2,
          };
          
          const event: CollisionEvent = {
            id: generateEventId(),
            timestamp: now,
            objectA: objA,
            objectB: objB,
            point,
            penetration: 0, // TODO: Calculate actual penetration
            normal,
            handled: false,
          };
          
          newEvents.push(event);
          
          // Set cooldown
          collisionCooldowns.current.set(objA.id, now + config.collisionCooldown);
          collisionCooldowns.current.set(objB.id, now + config.collisionCooldown);
          
          if (config.logCollisions) {
            console.log(`🎯 Collision: ${objA.type}(${objA.id}) ↔ ${objB.type}(${objB.id})`);
          }
        }
      }
    }
    
    // Update collision events
    setCollisionEvents(prev => {
      const filtered = prev.filter(event => now - event.timestamp < 5000); // Keep 5s history
      return [...filtered, ...newEvents];
    });
    
    return newEvents;
  }, [collisionObjects, config, updateSpatialGrid, getGridKey, checkShapeCollision, generateEventId]);

  const checkBirdCollisions = useCallback((bird: BirdState): CollisionEvent[] => {
    const birdObject: CollisionObject = {
      id: 'bird',
      type: 'bird',
      shape: {
        type: 'circle',
        x: bird.x,
        y: bird.y,
        radius: bird.radius,
      },
      solid: false,
      deadly: false,
      collectible: false,
    };
    
    const collisions: CollisionEvent[] = [];
    const now = Date.now();
    
    for (const obj of collisionObjects) {
      if (checkShapeCollision(birdObject.shape, obj.shape)) {
        const dx = obj.shape.x - bird.x;
        const dy = obj.shape.y - bird.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const normal = distance > 0 
          ? { x: dx / distance, y: dy / distance }
          : { x: 1, y: 0 };
        
        const event: CollisionEvent = {
          id: generateEventId(),
          timestamp: now,
          objectA: birdObject,
          objectB: obj,
          point: { x: (bird.x + obj.shape.x) / 2, y: (bird.y + obj.shape.y) / 2 },
          penetration: 0,
          normal,
          handled: false,
        };
        
        collisions.push(event);
      }
    }
    
    return collisions;
  }, [collisionObjects, checkShapeCollision, generateEventId]);

  const checkPointCollision = useCallback((x: number, y: number, objects?: CollisionObject[]): CollisionObject | null => {
    const targets = objects || collisionObjects;
    const pointShape: CollisionShape = { type: 'circle', x, y, radius: 1 };
    
    for (const obj of targets) {
      if (checkShapeCollision(pointShape, obj.shape)) {
        return obj;
      }
    }
    
    return null;
  }, [collisionObjects, checkShapeCollision]);

  // ===== COLLISION QUERIES =====
  const getObjectsInRadius = useCallback((x: number, y: number, radius: number): CollisionObject[] => {
    return collisionObjects.filter(obj => {
      const dx = obj.shape.x - x;
      const dy = obj.shape.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }, [collisionObjects]);

  const getObjectsInRect = useCallback((x: number, y: number, width: number, height: number): CollisionObject[] => {
    const rectShape: CollisionShape = { type: 'rectangle', x, y, width, height };
    return collisionObjects.filter(obj => checkShapeCollision(obj.shape, rectShape));
  }, [collisionObjects, checkShapeCollision]);

  const getObjectsByType = useCallback((type: CollisionObject['type']): CollisionObject[] => {
    return collisionObjects.filter(obj => obj.type === type);
  }, [collisionObjects]);

  const getCollisionHistory = useCallback((objectId: string, timeRange: number = 5000): CollisionEvent[] => {
    const now = Date.now();
    return collisionEvents.filter(event => 
      (event.objectA.id === objectId || event.objectB.id === objectId) &&
      (now - event.timestamp) <= timeRange
    );
  }, [collisionEvents]);

  // ===== COLLISION RESPONSE =====
  const handleCollisionEvent = useCallback((event: CollisionEvent) => {
    if (event.handled) return;
    
    // Mark as handled
    event.handled = true;
    
    // Apply physics response if enabled
    if (config.enablePhysicsResponse) {
      const resolved = resolveCollision(event.objectA, event.objectB);
      
      // Update object positions
      updateCollisionObject(event.objectA.id, {
        shape: {
          ...event.objectA.shape,
          x: resolved.x,
          y: resolved.y,
        }
      });
    }
    
    if (config.logCollisions) {
      console.log(`⚡ Handled collision: ${event.objectA.type} ↔ ${event.objectB.type}`);
    }
  }, [config.enablePhysicsResponse, config.logCollisions, updateCollisionObject]);

  const resolveCollision = useCallback((objectA: CollisionObject, objectB: CollisionObject): { x: number; y: number } => {
    // Simple collision resolution - push objects apart
    const dx = objectB.shape.x - objectA.shape.x;
    const dy = objectB.shape.y - objectA.shape.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: objectA.shape.x, y: objectA.shape.y };
    
    const separationDistance = objectA.shape.radius || 10;
    const separationX = (dx / distance) * separationDistance;
    const separationY = (dy / distance) * separationDistance;
    
    return {
      x: objectA.shape.x - separationX * 0.5,
      y: objectA.shape.y - separationY * 0.5,
    };
  }, []);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<CollisionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const resetCollisions = useCallback(() => {
    setCollisionEvents([]);
    collisionCooldowns.current.clear();
    spatialGrid.current.clear();
  }, []);

  const getCollisionStats = useCallback((): string => {
    const totalObjects = collisionObjects.length;
    const totalEvents = collisionEvents.length;
    const recentEvents = collisionEvents.filter(e => Date.now() - e.timestamp < 1000).length;
    
    return [
      `🎯 Objects: ${totalObjects}`,
      `⚡ Events: ${totalEvents}`,
      `🔥 Recent: ${recentEvents}/s`,
      `🔧 Grid: ${config.spatialPartitioning ? 'ON' : 'OFF'}`,
    ].join(' | ');
  }, [collisionObjects.length, collisionEvents, config.spatialPartitioning]);

  return {
    collisionObjects,
    collisionEvents,
    addCollisionObject,
    removeCollisionObject,
    updateCollisionObject,
    clearCollisionObjects,
    checkCollisions,
    checkBirdCollisions,
    checkPointCollision,
    checkShapeCollision,
    getObjectsInRadius,
    getObjectsInRect,
    getObjectsByType,
    getCollisionHistory,
    handleCollisionEvent,
    resolveCollision,
    updateConfig,
    resetCollisions,
    getCollisionStats,
  };
};

export default useCollisionManager;