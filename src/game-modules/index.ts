/**
 * ========================================
 * PHASE 5.1: GAME MODULES INDEX
 * ========================================
 * 
 * Central export hub for all Phase 5 game modules
 * Provides modular components extracted from SzenyoMadar.tsx monolith
 */

// ===== CORE SYSTEM MODULES =====
export { default as useGameStateManager, type GameStateManagerReturn, type GameStateType, GameState } from './GameStateManager';
export { default as useGameLoopManager, type GameLoopManagerReturn, type GameLoopData } from './GameLoopManager';
export { default as useWorldManager, type WorldManagerReturn, type WorldParameters, type WorldBounds, type WorldConfig } from './WorldManager';

// ===== ENTITY MANAGEMENT MODULES =====
export { default as useBirdManager, type BirdManagerReturn, type BirdState, type BirdPhysics, type BirdConfig } from './BirdManager';

// ===== GAME LOGIC MODULES =====
export { default as useCollisionManager, type CollisionManagerReturn, type CollisionObject, type CollisionEvent, type CollisionConfig } from './CollisionManager';
export { default as useObstacleManager, type ObstacleManagerReturn, type Obstacle, type ObstaclePattern, type ObstacleConfig } from './ObstacleManager';
export { default as useScoreManager, type ScoreManagerReturn, type ScoreData, type Achievement, type GameStats, type ScoreConfig } from './ScoreManager';

// ===== RENDERING MODULES =====
export { default as useRenderManager, type RenderManagerReturn } from './RenderManager';
export { default as useBirdRenderer, type BirdRendererReturn } from './BirdRenderer';
export { default as useObstacleRenderer, type ObstacleRendererReturn } from './ObstacleRenderer';
export { default as useEffectsRenderer, type EffectsRendererReturn } from './EffectsRenderer';

// ===== INPUT MODULES =====
export { useInputManager, type InputConfig, type InputEvent, type InputBinding } from './InputManager';
export { default as useTouchManager, type TouchConfig, type TouchPoint, type GestureEvent, type TouchActionMapping } from './TouchManager';

// ===== AUDIO MODULES =====
export { default as useAudioManager, type AudioConfig, type AudioSource, type AudioInstance, type AudioManagerReturn } from './AudioManager';
export { default as useSoundEffectsManager, type SoundEffectConfig, type SoundInstance, type SoundSequence, type SoundEffectsManagerReturn } from './SoundEffectsManager';

// ===== UI MODULES =====
export { useUIOverlayManager, type NotificationOptions, type PopupOptions, type UIOverlayManagerReturn } from './UIOverlayManager';
export { useMenuRenderer, type MenuItem, type MenuConfig, type MenuState, type MenuRendererReturn } from './MenuRenderer';
export { useHUDRenderer, type HUDElement, type HUDPosition, type ScoreDisplay, type HealthDisplay, type PowerUpDisplay, type TimerDisplay, type HUDRendererReturn } from './HUDRenderer';

// Re-import for internal use
import useGameStateManager from './GameStateManager';
import useGameLoopManager from './GameLoopManager';
import useWorldManager from './WorldManager';
import useBirdManager from './BirdManager';
import useCollisionManager from './CollisionManager';
import useObstacleManager from './ObstacleManager';
import useScoreManager from './ScoreManager';
import useRenderManager from './RenderManager';
import useBirdRenderer from './BirdRenderer';
import useObstacleRenderer from './ObstacleRenderer';
import useEffectsRenderer from './EffectsRenderer';
import { useInputManager } from './InputManager';
import useTouchManager from './TouchManager';
import useAudioManager from './AudioManager';
import useSoundEffectsManager from './SoundEffectsManager';
import { useUIOverlayManager } from './UIOverlayManager';
import { useMenuRenderer } from './MenuRenderer';
import { useHUDRenderer } from './HUDRenderer';

// ===== CONVENIENCE HOOKS =====

/**
 * Combined hook for core game systems
 * Use this for basic game setup with state management, loop, and world
 */
export const useCoreGameSystems = (worldConfig?: {
  initialWorld?: any;
  initialWorldConfig?: any;
}) => {
  const gameState = useGameStateManager();
  const gameLoop = useGameLoopManager();
  const world = useWorldManager(worldConfig?.initialWorld, worldConfig?.initialWorldConfig);
  
  return {
    gameState,
    gameLoop,
    world,
  };
};

/**
 * Combined hook for entity management
 * Use this when you need bird and world management together
 */
export const useEntitySystems = (worldParams?: any, worldBounds?: any) => {
  const world = useWorldManager();
  const bird = useBirdManager(
    worldParams || world.world,
    worldBounds || world.bounds
  );
  
  return {
    world,
    bird,
  };
};

/**
 * Combined hook for game logic systems
 * Use this when you need collision, obstacles, and scoring together
 */
export const useGameLogicSystems = (worldParams?: any, worldBounds?: any) => {
  const world = useWorldManager();
  const collision = useCollisionManager(worldBounds || world.bounds);
  const obstacles = useObstacleManager(worldParams || world.world, worldBounds || world.bounds);
  const score = useScoreManager();
  
  return {
    world,
    collision,
    obstacles,
    score,
  };
};

/**
 * Combined hook for rendering systems
 * Use this when you need all rendering modules together
 */
export const useRenderingSystems = (worldParams?: any, worldBounds?: any) => {
  const world = useWorldManager();
  const renderManager = useRenderManager(
    worldParams || world.world, 
    worldBounds || world.bounds
  );
  const birdRenderer = useBirdRenderer();
  const obstacleRenderer = useObstacleRenderer();
  const effectsRenderer = useEffectsRenderer();
  
  return {
    renderManager,
    birdRenderer,
    obstacleRenderer,
    effectsRenderer,
  };
};

/**
 * Combined hook for input systems
 * Use this when you need all input handling together
 */
export const useInputSystems = () => {
  const inputManager = useInputManager();
  const touchManager = useTouchManager();
  
  return {
    inputManager,
    touchManager,
    
    // Convenience methods
    isActionActive: (action: string) => {
      return inputManager.isActionPressed(action) || 
             touchManager.currentGesture?.type === action;
    },
    
    enableAllInputs: (element: HTMLElement) => {
      inputManager.captureInput(element);
      const removeTouch = touchManager.enableTouch(element);
      
      return () => {
        inputManager.releaseInput();
        removeTouch();
      };
    }
  };
};

/**
 * Combined hook for audio systems
 * Use this when you need all audio handling together
 */
export const useAudioSystems = () => {
  const audioManager = useAudioManager();
  const soundEffectsManager = useSoundEffectsManager();
  
  return {
    audioManager,
    soundEffectsManager,
    
    // Convenience methods
    initializeAudio: async () => {
      const audioInitialized = await audioManager.initializeAudio();
      if (audioInitialized) {
        await soundEffectsManager.preloadSounds();
      }
      return audioInitialized;
    },
    
    setGameVolume: (volume: number) => {
      audioManager.setMasterVolume(volume);
    },
    
    setSfxVolume: (volume: number) => {
      audioManager.setCategoryVolume('sfx', volume);
    },
    
    setMusicVolume: (volume: number) => {
      audioManager.setCategoryVolume('music', volume);
    },
    
    muteAll: () => {
      audioManager.setMasterVolume(0);
    },
    
    unmuteAll: () => {
      audioManager.setMasterVolume(0.7);
    }
  };
};

/**
 * Combined hook for UI systems
 * Use this when you need all UI management together
 */
export const useUISystems = () => {
  const uiOverlayManager = useUIOverlayManager();
  const menuRenderer = useMenuRenderer();
  const hudRenderer = useHUDRenderer();
  
  return {
    uiOverlayManager,
    menuRenderer,
    hudRenderer,
    
    // Convenience methods
    showGameUI: (gameState: any) => {
      hudRenderer.showGameHUD(gameState);
      uiOverlayManager.clearAllNotifications();
      uiOverlayManager.clearAllPopups();
      menuRenderer.hideMenu();
    },
    
    showMainMenu: (onNewGame: () => void, onLoadGame: () => void, onSettings: () => void, onQuit: () => void) => {
      hudRenderer.showMenuHUD();
      uiOverlayManager.clearAllNotifications();
      uiOverlayManager.clearAllPopups();
      return menuRenderer.showMainMenu(onNewGame, onLoadGame, onSettings, onQuit);
    },
    
    showPauseOverlay: (onResume: () => void, onRestart: () => void, onSettings: () => void, onMainMenu: () => void) => {
      hudRenderer.showPauseHUD();
      uiOverlayManager.showPauseMenu(onResume, onRestart, onMainMenu);
      return menuRenderer.showPauseMenu(onResume, onRestart, onSettings, onMainMenu);
    },
    
    showGameOverUI: (finalScore: number, bestScore: number, onRestart: () => void, onMainMenu: () => void) => {
      hudRenderer.showGameOverHUD(finalScore, bestScore);
      uiOverlayManager.showGameOver(finalScore, bestScore, onRestart, onMainMenu);
      return menuRenderer.showGameOverMenu(finalScore, bestScore, onRestart, onMainMenu);
    },
    
    updateScore: (score: number, bestScore?: number) => {
      hudRenderer.updateScore(score, bestScore);
    },
    
    updateHealth: (health: number, maxHealth?: number) => {
      hudRenderer.updateHealth(health, maxHealth);
    },
    
    showNotification: (content: string, title?: string, type?: 'info' | 'success' | 'warning' | 'error') => {
      uiOverlayManager.showNotification({ title, content, type: type || 'info' });
    },
    
    hideAllUI: () => {
      uiOverlayManager.clearAllNotifications();
      uiOverlayManager.clearAllPopups();
      menuRenderer.hideMenu();
      hudRenderer.hideAllElements();
    }
  };
};

/**
 * Full game systems integration
 * Use this for complete game setup with all core modules (18 modules)
 */
export const useFullGameSystems = (config?: {
  initialWorld?: any;
  initialWorldConfig?: any;
  initialBird?: any;
  initialBirdPhysics?: any;
  initialBirdConfig?: any;
  initialCollisionConfig?: any;
  initialObstacleConfig?: any;
  initialScoreConfig?: any;
}) => {
  // Core systems
  const gameState = useGameStateManager();
  const gameLoop = useGameLoopManager();
  const world = useWorldManager(config?.initialWorld, config?.initialWorldConfig);
  
  // Entity systems
  const bird = useBirdManager(
    world.world,
    world.bounds,
    config?.initialBird,
    config?.initialBirdPhysics,
    config?.initialBirdConfig
  );
  
  // Game logic systems
  const collision = useCollisionManager(world.bounds, config?.initialCollisionConfig);
  const obstacles = useObstacleManager(world.world, world.bounds, config?.initialObstacleConfig);
  const score = useScoreManager(config?.initialScoreConfig);
  
  // Rendering systems
  const renderingSystems = useRenderingSystems(world.world, world.bounds);
  
  // Input systems
  const inputSystems = useInputSystems();
  
  // Audio systems
  const audioSystems = useAudioSystems();
  
  // UI systems
  const uiSystems = useUISystems();
  
  return {
    // Core systems
    gameState,
    gameLoop,
    world,
    
    // Entity systems
    bird,
    
    // Game logic systems
    collision,
    obstacles,
    score,
    
    // Rendering systems
    ...renderingSystems,
    
    // Input systems  
    ...inputSystems,
    
    // Audio systems
    ...audioSystems,
    
    // UI systems
    ...uiSystems,
    
    // Utility methods
    resetAll: () => {
      gameState.returnToMenu();
      bird.reset();
      world.resetPhysics();
      gameLoop.resetFpsStats();
      collision.resetCollisions();
      obstacles.clearObstacles();
      score.resetScore();
      renderingSystems.effectsRenderer.clearParticles();
      renderingSystems.effectsRenderer.clearVisualEffects();
      renderingSystems.effectsRenderer.clearScreenEffects();
      renderingSystems.effectsRenderer.clearUIOverlays();
      renderingSystems.effectsRenderer.clearBackgroundEffects();
      inputSystems.inputManager.resetInputState();
      inputSystems.touchManager.clearGestureHistory();
      audioSystems.soundEffectsManager.stopAllSounds();
      uiSystems.hideAllUI();
    },
    
    // Status info
    getSystemsInfo: () => ({
      totalModules: 18,
      state: gameState.gameState,
      fps: gameLoop.getFrameRate(),
      worldInfo: world.getWorldInfo(),
      birdInfo: bird.getBirdInfo(),
      collisionInfo: collision.getCollisionStats(),
      obstacleInfo: obstacles.getObstacleStats(),
      scoreInfo: score.getScoreInfo(),
      renderInfo: renderingSystems.renderManager.getRenderInfo(),
      birdRenderInfo: renderingSystems.birdRenderer.getBirdRenderInfo(),
      obstacleRenderInfo: renderingSystems.obstacleRenderer.getObstacleRenderInfo(),
      effectsInfo: renderingSystems.effectsRenderer.getEffectsInfo(),
      inputInfo: inputSystems.inputManager.getInputInfo(),
      touchStats: inputSystems.touchManager.getGestureStats(),
      audioInfo: audioSystems.audioManager.getAudioInfo(),
      soundStats: audioSystems.soundEffectsManager.getSoundStats(),
      uiInfo: {
        notifications: uiSystems.uiOverlayManager.activeNotifications.length,
        popups: uiSystems.uiOverlayManager.activePopups.length,
        menuVisible: uiSystems.menuRenderer.isMenuVisible,
        hudVisible: uiSystems.hudRenderer.isHUDVisible,
      },
    }),
  };
};

// ===== TYPE AGGREGATIONS =====

// Import types for internal use
import type { GameStateType } from './GameStateManager';
import type { BirdState, BirdPhysics, BirdConfig } from './BirdManager';
import type { WorldParameters, WorldConfig } from './WorldManager';
import type { CollisionConfig } from './CollisionManager';
import type { ObstacleConfig } from './ObstacleManager';
import type { ScoreData, ScoreConfig } from './ScoreManager';

/**
 * Complete game state for save/load operations
 */
export interface CompleteGameState {
  gameState: GameStateType;
  bird: BirdState;
  world: WorldParameters;
  worldConfig: WorldConfig;
  birdConfig: BirdConfig;
  collisionConfig: CollisionConfig;
  obstacleConfig: ObstacleConfig;
  scoreData: ScoreData;
  scoreConfig: ScoreConfig;
  timestamp: number;
}

/**
 * Game systems configuration
 */
export interface GameSystemsConfig {
  world?: {
    initialWorld?: Partial<WorldParameters>;
    initialConfig?: Partial<WorldConfig>;
  };
  bird?: {
    initialState?: Partial<BirdState>;
    initialPhysics?: Partial<BirdPhysics>;
    initialConfig?: Partial<BirdConfig>;
  };
  collision?: {
    initialConfig?: Partial<CollisionConfig>;
  };
  obstacles?: {
    initialConfig?: Partial<ObstacleConfig>;
  };
  score?: {
    initialConfig?: Partial<ScoreConfig>;
  };
  enableDebugMode?: boolean;
  enablePerformanceMonitoring?: boolean;
}

// ===== DEBUG UTILITIES =====

/**
 * Debug information collector for all game systems
 */
export const getGameSystemsDebugInfo = (systems: ReturnType<typeof useFullGameSystems>) => {
  return {
    timestamp: Date.now(),
    gameState: {
      current: systems.gameState.gameState,
      history: systems.gameState.getStateHistory(),
    },
    gameLoop: {
      stats: systems.gameLoop.getFpsStats(),
      frameRate: systems.gameLoop.getFrameRate(),
      loopData: systems.gameLoop.loopData,
    },
    world: {
      info: systems.world.getWorldInfo(),
      bounds: systems.world.bounds,
      config: systems.world.config,
    },
    bird: {
      info: systems.bird.getBirdInfo(),
      state: systems.bird.bird,
      physics: systems.bird.physics,
    },
    collision: {
      info: systems.collision.getCollisionStats(),
      objects: systems.collision.collisionObjects.length,
      events: systems.collision.collisionEvents.length,
    },
    obstacles: {
      info: systems.obstacles.getObstacleStats(),
      count: systems.obstacles.obstacles.length,
      patterns: systems.obstacles.obstaclePatterns.length,
    },
    score: {
      info: systems.score.getScoreInfo(),
      current: systems.score.score.current,
      achievements: systems.score.getUnlockedAchievements().length,
    },
  };
};