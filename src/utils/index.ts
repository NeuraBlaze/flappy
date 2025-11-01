/**
 * ========================================
 * PHASE 4: UTILITY HOOKS INDEX
 * ========================================
 * 
 * Központi export az összes utility hook-hoz
 */

// Utility Hooks
export { useInputManager } from './InputManager';
export type { 
  KeyState, 
  MouseState, 
  TouchState, 
  TouchPoint, 
  Gesture, 
  InputConfig, 
  InputCallbacks, 
  UseInputManagerReturn 
} from './InputManager';

export { usePerformanceManager } from './PerformanceManager';
export type { 
  PerformanceLevel, 
  FPSData, 
  MemoryUsage, 
  HardwareInfo, 
  PerformanceMetrics, 
  PerformanceConfig, 
  UsePerformanceManagerReturn 
} from './PerformanceManager';

export { useStorageManager } from './StorageManager';
export type { 
  StorageConfig, 
  SaveData, 
  StorageStats, 
  BackupInfo, 
  UseStorageManagerReturn,
  GameSaveData,
  GameSettings,
  Achievement
} from './StorageManager';

export { useErrorTracker } from './ErrorTracker';
export type { 
  GameError, 
  GameContext, 
  ErrorStats, 
  ErrorTrackerConfig, 
  UseErrorTrackerReturn 
} from './ErrorTracker';

export { useMathUtils } from './MathUtils';
export type { 
  Point2D, 
  Vector2D, 
  Circle, 
  Rectangle, 
  Line, 
  Triangle, 
  BoundingBox, 
  CollisionResult, 
  UseMathUtilsReturn 
} from './MathUtils';

// Combined utility hooks for easy usage
import { useInputManager } from './InputManager';
import { usePerformanceManager } from './PerformanceManager';
import { useStorageManager } from './StorageManager';
import { useErrorTracker } from './ErrorTracker';
import { useMathUtils } from './MathUtils';

/**
 * Combined utility hook that provides all Phase 4 utilities
 * Use this when you need multiple utility systems
 */
export const useGameUtilities = (config?: {
  input?: any;
  performance?: any;
  storage?: any;
  errorTracker?: any;
}) => {
  const inputManager = useInputManager(config?.input?.config, config?.input?.callbacks);
  const performanceManager = usePerformanceManager(config?.performance);
  const storageManager = useStorageManager(config?.storage);
  const errorTracker = useErrorTracker(config?.errorTracker);
  const mathUtils = useMathUtils();

  return {
    input: inputManager,
    performance: performanceManager,
    storage: storageManager,
    errorTracker: errorTracker,
    math: mathUtils,
  };
};

export default useGameUtilities;