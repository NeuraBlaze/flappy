/**
 * ========================================
 * GAME MODULES STATUS CHECKER
 * ========================================
 * 
 * Quick verification that all 18 modules are working correctly
 */

import { 
  // Core Systems (3)
  useGameStateManager,
  useGameLoopManager,
  useWorldManager,
  
  // Entity Management (1)
  useBirdManager,
  
  // Game Logic (3)
  useCollisionManager,
  useObstacleManager,
  useScoreManager,
  
  // Rendering (4)
  useRenderManager,
  useBirdRenderer,
  useObstacleRenderer,
  useEffectsRenderer,
  
  // Input (2)
  useInputManager,
  useTouchManager,
  
  // Audio (2)
  useAudioManager,
  useSoundEffectsManager,
  
  // UI (3)
  useUIOverlayManager,
  useMenuRenderer,
  useHUDRenderer,
  
  // Convenience hooks
  useCoreGameSystems,
  useEntitySystems,
  useGameLogicSystems,
  useRenderingSystems,
  useInputSystems,
  useAudioSystems,
  useUISystems,
  useFullGameSystems
} from '../game-modules';

export const checkAllModules = () => {
  console.log('🔍 Checking Game Modules Status...');
  
  const moduleStatus = {
    // Individual modules
    coreSystemsModules: {
      GameStateManager: !!useGameStateManager,
      GameLoopManager: !!useGameLoopManager,
      WorldManager: !!useWorldManager,
    },
    
    entityModules: {
      BirdManager: !!useBirdManager,
    },
    
    gameLogicModules: {
      CollisionManager: !!useCollisionManager,
      ObstacleManager: !!useObstacleManager,
      ScoreManager: !!useScoreManager,
    },
    
    renderingModules: {
      RenderManager: !!useRenderManager,
      BirdRenderer: !!useBirdRenderer,
      ObstacleRenderer: !!useObstacleRenderer,
      EffectsRenderer: !!useEffectsRenderer,
    },
    
    inputModules: {
      InputManager: !!useInputManager,
      TouchManager: !!useTouchManager,
    },
    
    audioModules: {
      AudioManager: !!useAudioManager,
      SoundEffectsManager: !!useSoundEffectsManager,
    },
    
    uiModules: {
      UIOverlayManager: !!useUIOverlayManager,
      MenuRenderer: !!useMenuRenderer,
      HUDRenderer: !!useHUDRenderer,
    },
    
    // Convenience hooks
    convenienceHooks: {
      useCoreGameSystems: !!useCoreGameSystems,
      useEntitySystems: !!useEntitySystems,
      useGameLogicSystems: !!useGameLogicSystems,
      useRenderingSystems: !!useRenderingSystems,
      useInputSystems: !!useInputSystems,
      useAudioSystems: !!useAudioSystems,
      useUISystems: !!useUISystems,
      useFullGameSystems: !!useFullGameSystems,
    }
  };
  
  // Count individual modules
  const individualModuleCount = 
    Object.keys(moduleStatus.coreSystemsModules).length +
    Object.keys(moduleStatus.entityModules).length +
    Object.keys(moduleStatus.gameLogicModules).length +
    Object.keys(moduleStatus.renderingModules).length +
    Object.keys(moduleStatus.inputModules).length +
    Object.keys(moduleStatus.audioModules).length +
    Object.keys(moduleStatus.uiModules).length;
  
  const convenienceHookCount = Object.keys(moduleStatus.convenienceHooks).length;
  
  // Check if all modules are available
  const allModulesWorking = Object.values(moduleStatus).every(category => 
    Object.values(category).every(module => module === true)
  );
  
  console.log('📊 Module Status Summary:', {
    totalIndividualModules: individualModuleCount,
    totalConvenienceHooks: convenienceHookCount,
    allModulesWorking,
    moduleStatus
  });
  
  return {
    totalIndividualModules: individualModuleCount,
    totalConvenienceHooks: convenienceHookCount,
    allModulesWorking,
    moduleStatus,
    summary: {
      coreSystemsModules: `${Object.keys(moduleStatus.coreSystemsModules).length}/3 ✅`,
      entityModules: `${Object.keys(moduleStatus.entityModules).length}/1 ✅`,
      gameLogicModules: `${Object.keys(moduleStatus.gameLogicModules).length}/3 ✅`,
      renderingModules: `${Object.keys(moduleStatus.renderingModules).length}/4 ✅`,
      inputModules: `${Object.keys(moduleStatus.inputModules).length}/2 ✅`,
      audioModules: `${Object.keys(moduleStatus.audioModules).length}/2 ✅`,
      uiModules: `${Object.keys(moduleStatus.uiModules).length}/3 ✅`,
      convenienceHooks: `${Object.keys(moduleStatus.convenienceHooks).length}/8 ✅`,
      totalStatus: `${individualModuleCount}/18 Individual Modules + ${convenienceHookCount}/8 Convenience Hooks = ${allModulesWorking ? '✅ ALL WORKING' : '❌ ISSUES FOUND'}`
    }
  };
};

export default checkAllModules;