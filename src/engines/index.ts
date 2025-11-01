/**
 * ========================================
 * PHASE 1: CORE SYSTEM ENGINES
 * ========================================
 * 
 * Központi export az összes core engine komponenshez
 */

// Core Engines
export { default as useGameEngine } from './GameEngine';
export type { WorldParameters, TimeData } from './GameEngine';
export { createPerformanceMonitor } from './GameEngine';

export { default as usePhysicsEngine } from './PhysicsEngine';
export type { 
  CircleCollider, 
  RectCollider, 
  Point, 
  Vector2D, 
  BirdPhysics, 
  PhysicsConstants 
} from './PhysicsEngine';
export { 
  createBird, 
  createCircleCollider, 
  createRectCollider 
} from './PhysicsEngine';

export { default as useRenderEngine } from './RenderEngine';
export type { 
  RenderConfig, 
  ViewportData, 
  CanvasData 
} from './RenderEngine';

// Import hooks for combined usage
import useGameEngine from './GameEngine';
import usePhysicsEngine from './PhysicsEngine';
import useRenderEngine from './RenderEngine';

// Combined Core Engine Hook
export const useCoreEngines = () => {
  const gameEngine = useGameEngine();
  const physicsEngine = usePhysicsEngine();
  const renderEngine = useRenderEngine();
  
  return {
    game: gameEngine,
    physics: physicsEngine,
    render: renderEngine
  };
};