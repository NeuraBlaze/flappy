/**
 * ========================================
 * PHASE 5.1: GAME STATE MANAGER
 * ========================================
 * 
 * Core game state coordination module
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useState, useCallback, useRef } from 'react';

// ===== GAME STATE TYPES =====
export const GameState = {
  MENU: "menu",
  RUN: "run",
  GAMEOVER: "gameover",
  PAUSE: "pause",
} as const;

export type GameStateType = typeof GameState[keyof typeof GameState];

// ===== GAME STATE MANAGER INTERFACE =====
export interface GameStateData {
  current: GameStateType;
  previous: GameStateType | null;
  transitionTime: number;
  isPaused: boolean;
  isRunning: boolean;
  isGameOver: boolean;
  isMenu: boolean;
}

export interface GameStateManagerReturn {
  // Current state data
  gameState: GameStateData;
  
  // State queries
  isState: (state: GameStateType) => boolean;
  canTransitionTo: (newState: GameStateType) => boolean;
  
  // State transitions
  setState: (newState: GameStateType) => boolean;
  togglePause: () => boolean;
  startGame: () => boolean;
  endGame: () => boolean;
  returnToMenu: () => boolean;
  restart: () => boolean;
  
  // State lifecycle
  onStateEnter: (callback: (state: GameStateType) => void) => void;
  onStateExit: (callback: (state: GameStateType) => void) => void;
  onStateChange: (callback: (from: GameStateType, to: GameStateType) => void) => void;
  
  // Debug and utilities
  getStateHistory: () => GameStateType[];
  getStateDuration: () => number;
  clearStateHistory: () => void;
}

// ===== STATE TRANSITION RULES =====
const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameState.MENU]: [GameState.RUN],
  [GameState.RUN]: [GameState.PAUSE, GameState.GAMEOVER, GameState.MENU],
  [GameState.PAUSE]: [GameState.RUN, GameState.MENU],
  [GameState.GAMEOVER]: [GameState.MENU, GameState.RUN],
};

// ===== GAME STATE MANAGER HOOK =====
export const useGameStateManager = (initialState: GameStateType = GameState.MENU): GameStateManagerReturn => {
  // Core state
  const [currentState, setCurrentState] = useState<GameStateType>(initialState);
  const [previousState, setPreviousState] = useState<GameStateType | null>(null);
  
  // State tracking
  const stateHistory = useRef<GameStateType[]>([initialState]);
  const stateStartTime = useRef<number>(Date.now());
  const transitionCallbacks = useRef<{
    enter: ((state: GameStateType) => void)[];
    exit: ((state: GameStateType) => void)[];
    change: ((from: GameStateType, to: GameStateType) => void)[];
  }>({
    enter: [],
    exit: [],
    change: []
  });

  // ===== STATE DATA COMPUTATION =====
  const gameState: GameStateData = {
    current: currentState,
    previous: previousState,
    transitionTime: Date.now() - stateStartTime.current,
    isPaused: currentState === GameState.PAUSE,
    isRunning: currentState === GameState.RUN,
    isGameOver: currentState === GameState.GAMEOVER,
    isMenu: currentState === GameState.MENU,
  };

  // ===== STATE QUERIES =====
  const isState = useCallback((state: GameStateType): boolean => {
    return currentState === state;
  }, [currentState]);

  const canTransitionTo = useCallback((newState: GameStateType): boolean => {
    const validTransitions = VALID_TRANSITIONS[currentState] || [];
    return validTransitions.includes(newState);
  }, [currentState]);

  // ===== CORE STATE TRANSITION =====
  const setState = useCallback((newState: GameStateType): boolean => {
    // Validate transition
    if (!canTransitionTo(newState)) {
      console.warn(`Invalid state transition: ${currentState} → ${newState}`);
      return false;
    }

    // Skip if already in target state
    if (currentState === newState) {
      return true;
    }

    const oldState = currentState;

    // Execute exit callbacks
    transitionCallbacks.current.exit.forEach(callback => {
      try {
        callback(oldState);
      } catch (error) {
        console.error('State exit callback error:', error);
      }
    });

    // Update state
    setPreviousState(oldState);
    setCurrentState(newState);
    stateStartTime.current = Date.now();
    stateHistory.current.push(newState);

    // Keep history manageable
    if (stateHistory.current.length > 50) {
      stateHistory.current = stateHistory.current.slice(-25);
    }

    // Execute enter callbacks
    transitionCallbacks.current.enter.forEach(callback => {
      try {
        callback(newState);
      } catch (error) {
        console.error('State enter callback error:', error);
      }
    });

    // Execute change callbacks
    transitionCallbacks.current.change.forEach(callback => {
      try {
        callback(oldState, newState);
      } catch (error) {
        console.error('State change callback error:', error);
      }
    });

    console.log(`🎮 State transition: ${oldState} → ${newState}`);
    return true;
  }, [currentState, canTransitionTo]);

  // ===== COMMON STATE OPERATIONS =====
  const togglePause = useCallback((): boolean => {
    if (currentState === GameState.RUN) {
      return setState(GameState.PAUSE);
    } else if (currentState === GameState.PAUSE) {
      return setState(GameState.RUN);
    }
    return false;
  }, [currentState, setState]);

  const startGame = useCallback((): boolean => {
    return setState(GameState.RUN);
  }, [setState]);

  const endGame = useCallback((): boolean => {
    return setState(GameState.GAMEOVER);
  }, [setState]);

  const returnToMenu = useCallback((): boolean => {
    return setState(GameState.MENU);
  }, [setState]);

  const restart = useCallback((): boolean => {
    // Can restart from any state
    if (currentState === GameState.GAMEOVER || currentState === GameState.PAUSE) {
      return setState(GameState.RUN);
    } else if (currentState === GameState.MENU) {
      return setState(GameState.RUN);
    }
    return false;
  }, [currentState, setState]);

  // ===== CALLBACK MANAGEMENT =====
  const onStateEnter = useCallback((callback: (state: GameStateType) => void) => {
    transitionCallbacks.current.enter.push(callback);
  }, []);

  const onStateExit = useCallback((callback: (state: GameStateType) => void) => {
    transitionCallbacks.current.exit.push(callback);
  }, []);

  const onStateChange = useCallback((callback: (from: GameStateType, to: GameStateType) => void) => {
    transitionCallbacks.current.change.push(callback);
  }, []);

  // ===== UTILITIES =====
  const getStateHistory = useCallback((): GameStateType[] => {
    return [...stateHistory.current];
  }, []);

  const getStateDuration = useCallback((): number => {
    return Date.now() - stateStartTime.current;
  }, []);

  const clearStateHistory = useCallback(() => {
    stateHistory.current = [currentState];
  }, [currentState]);

  return {
    gameState,
    isState,
    canTransitionTo,
    setState,
    togglePause,
    startGame,
    endGame,
    returnToMenu,
    restart,
    onStateEnter,
    onStateExit,
    onStateChange,
    getStateHistory,
    getStateDuration,
    clearStateHistory,
  };
};

export default useGameStateManager;