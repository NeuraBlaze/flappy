import { useState, useCallback, useRef, useEffect } from 'react';

// HUD element types and interfaces
export interface HUDElement {
  id: string;
  type: 'score' | 'lives' | 'health' | 'power-up' | 'timer' | 'progress' | 'status' | 'custom';
  position: HUDPosition;
  isVisible: boolean;
  isEnabled: boolean;
  priority: number; // Higher priority renders on top
  data: any;
  style?: HUDStyle;
  animation?: HUDAnimation;
}

export interface HUDPosition {
  x: number | string; // Pixel value or percentage
  y: number | string; // Pixel value or percentage
  anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  offsetX?: number;
  offsetY?: number;
}

export interface HUDStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
  scale?: number;
  rotation?: number;
  shadow?: string;
}

export interface HUDAnimation {
  type: 'none' | 'fade' | 'scale' | 'slide' | 'bounce' | 'pulse' | 'rotate' | 'shake';
  duration: number;
  delay?: number;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate';
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ScoreDisplay {
  current: number;
  best: number;
  format: 'number' | 'padded' | 'compact';
  showBest: boolean;
  showDifference: boolean;
  animateChanges: boolean;
}

export interface HealthDisplay {
  current: number;
  maximum: number;
  type: 'hearts' | 'bar' | 'numeric' | 'percentage';
  showRegeneraton: boolean;
  lowHealthThreshold: number;
  criticalHealthThreshold: number;
}

export interface PowerUpDisplay {
  activePowerUps: Array<{
    id: string;
    name: string;
    icon: string;
    remainingTime: number;
    maxTime: number;
    stackCount?: number;
  }>;
  showProgress: boolean;
  showStackCount: boolean;
  maxDisplayed: number;
}

export interface StatusIndicator {
  id: string;
  label: string;
  icon?: string;
  value: string | number;
  status: 'normal' | 'warning' | 'critical' | 'good';
  showValue: boolean;
  showIcon: boolean;
}

export interface ProgressBar {
  id: string;
  label: string;
  current: number;
  maximum: number;
  type: 'horizontal' | 'vertical' | 'circular' | 'radial';
  showPercentage: boolean;
  showValue: boolean;
  segments?: number;
  colorStops?: Array<{ position: number; color: string }>;
}

export interface TimerDisplay {
  currentTime: number;
  totalTime?: number;
  format: 'seconds' | 'minutes' | 'hours' | 'compact';
  countDirection: 'up' | 'down';
  showProgress: boolean;
  warningTime?: number;
  criticalTime?: number;
}

export interface HUDRendererReturn {
  // Core HUD functions
  addElement: (element: HUDElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<HUDElement>) => void;
  moveElement: (elementId: string, position: HUDPosition) => void;
  
  // Element visibility and state
  showElement: (elementId: string) => void;
  hideElement: (elementId: string) => void;
  enableElement: (elementId: string) => void;
  disableElement: (elementId: string) => void;
  
  // Score management
  updateScore: (current: number, best?: number) => void;
  setScoreFormat: (format: ScoreDisplay['format']) => void;
  showScoreDifference: (show: boolean) => void;
  animateScoreChange: (newScore: number, oldScore: number) => void;
  
  // Health/Lives management
  updateHealth: (current: number, maximum?: number) => void;
  setHealthType: (type: HealthDisplay['type']) => void;
  showHealthRegeneration: (show: boolean) => void;
  setHealthThresholds: (low: number, critical: number) => void;
  
  // Power-up management
  addPowerUp: (powerUp: PowerUpDisplay['activePowerUps'][0]) => void;
  removePowerUp: (powerUpId: string) => void;
  updatePowerUpTime: (powerUpId: string, remainingTime: number) => void;
  setPowerUpDisplayLimit: (maxDisplayed: number) => void;
  
  // Status indicators
  addStatusIndicator: (indicator: StatusIndicator) => void;
  updateStatusIndicator: (indicatorId: string, updates: Partial<StatusIndicator>) => void;
  removeStatusIndicator: (indicatorId: string) => void;
  
  // Progress bars
  addProgressBar: (progressBar: ProgressBar) => void;
  updateProgressBar: (barId: string, current: number, maximum?: number) => void;
  removeProgressBar: (barId: string) => void;
  
  // Timer management
  updateTimer: (time: number, totalTime?: number) => void;
  setTimerFormat: (format: TimerDisplay['format']) => void;
  setTimerDirection: (direction: TimerDisplay['countDirection']) => void;
  setTimerThresholds: (warning?: number, critical?: number) => void;
  
  // Game-specific HUD functions
  showGameHUD: (gameState: any) => void;
  showMenuHUD: () => void;
  showPauseHUD: () => void;
  showGameOverHUD: (finalScore: number, bestScore: number) => void;
  
  // Layout and positioning
  setHUDLayout: (layout: 'minimal' | 'standard' | 'detailed' | 'custom') => void;
  setElementPosition: (elementId: string, position: HUDPosition) => void;
  resetElementPositions: () => void;
  
  // Animation and effects
  animateElement: (elementId: string, animation: HUDAnimation) => void;
  stopElementAnimation: (elementId: string) => void;
  flashElement: (elementId: string, duration?: number) => void;
  highlightElement: (elementId: string, duration?: number) => void;
  
  // Global HUD control
  showAllElements: () => void;
  hideAllElements: () => void;
  resetHUD: () => void;
  clearHUD: () => void;
  
  // State getters
  currentElements: HUDElement[];
  scoreDisplay: ScoreDisplay;
  healthDisplay: HealthDisplay;
  powerUpDisplay: PowerUpDisplay;
  timerDisplay: TimerDisplay;
  isHUDVisible: boolean;
  
  // Event handlers
  onElementUpdate: (callback: (elementId: string, element: HUDElement) => void) => () => void;
  onScoreChange: (callback: (newScore: number, oldScore: number) => void) => () => void;
  onHealthChange: (callback: (newHealth: number, oldHealth: number) => void) => () => void;
  onPowerUpChange: (callback: (powerUps: PowerUpDisplay['activePowerUps']) => void) => () => void;
}

const DEFAULT_SCORE_DISPLAY: ScoreDisplay = {
  current: 0,
  best: 0,
  format: 'number',
  showBest: true,
  showDifference: false,
  animateChanges: true,
};

const DEFAULT_HEALTH_DISPLAY: HealthDisplay = {
  current: 3,
  maximum: 3,
  type: 'hearts',
  showRegeneraton: false,
  lowHealthThreshold: 0.3,
  criticalHealthThreshold: 0.1,
};

const DEFAULT_POWERUP_DISPLAY: PowerUpDisplay = {
  activePowerUps: [],
  showProgress: true,
  showStackCount: true,
  maxDisplayed: 5,
};

const DEFAULT_TIMER_DISPLAY: TimerDisplay = {
  currentTime: 0,
  format: 'compact',
  countDirection: 'up',
  showProgress: false,
};

export const useHUDRenderer = (): HUDRendererReturn => {
  const [elements, setElements] = useState<HUDElement[]>([]);
  const [scoreDisplay, setScoreDisplay] = useState<ScoreDisplay>(DEFAULT_SCORE_DISPLAY);
  const [healthDisplay, setHealthDisplay] = useState<HealthDisplay>(DEFAULT_HEALTH_DISPLAY);
  const [powerUpDisplay, setPowerUpDisplay] = useState<PowerUpDisplay>(DEFAULT_POWERUP_DISPLAY);
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplay>(DEFAULT_TIMER_DISPLAY);
  const [isVisible, setIsVisible] = useState(true);
  
  // Event callback refs
  const onElementUpdateCallbacks = useRef<Set<(elementId: string, element: HUDElement) => void>>(new Set());
  const onScoreChangeCallbacks = useRef<Set<(newScore: number, oldScore: number) => void>>(new Set());
  const onHealthChangeCallbacks = useRef<Set<(newHealth: number, oldHealth: number) => void>>(new Set());
  const onPowerUpChangeCallbacks = useRef<Set<(powerUps: PowerUpDisplay['activePowerUps']) => void>>(new Set());

  // Core HUD functions
  const addElement = useCallback((element: HUDElement) => {
    setElements(prev => {
      const filtered = prev.filter(el => el.id !== element.id);
      return [...filtered, element].sort((a, b) => b.priority - a.priority);
    });
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<HUDElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const updated = { ...el, ...updates };
        onElementUpdateCallbacks.current.forEach(callback => callback(elementId, updated));
        return updated;
      }
      return el;
    }));
  }, []);

  const moveElement = useCallback((elementId: string, position: HUDPosition) => {
    updateElement(elementId, { position });
  }, [updateElement]);

  // Element visibility and state
  const showElement = useCallback((elementId: string) => {
    updateElement(elementId, { isVisible: true });
  }, [updateElement]);

  const hideElement = useCallback((elementId: string) => {
    updateElement(elementId, { isVisible: false });
  }, [updateElement]);

  const enableElement = useCallback((elementId: string) => {
    updateElement(elementId, { isEnabled: true });
  }, [updateElement]);

  const disableElement = useCallback((elementId: string) => {
    updateElement(elementId, { isEnabled: false });
  }, [updateElement]);

  // Score management
  const updateScore = useCallback((current: number, best?: number) => {
    const oldScore = scoreDisplay.current;
    setScoreDisplay(prev => ({
      ...prev,
      current,
      best: best !== undefined ? best : Math.max(prev.best, current),
    }));
    
    onScoreChangeCallbacks.current.forEach(callback => callback(current, oldScore));
  }, [scoreDisplay.current]);

  const setScoreFormat = useCallback((format: ScoreDisplay['format']) => {
    setScoreDisplay(prev => ({ ...prev, format }));
  }, []);

  const showScoreDifference = useCallback((show: boolean) => {
    setScoreDisplay(prev => ({ ...prev, showDifference: show }));
  }, []);

  const animateScoreChange = useCallback((newScore: number, _oldScore: number) => {
    updateScore(newScore);
  }, [updateScore]);

  // Health/Lives management
  const updateHealth = useCallback((current: number, maximum?: number) => {
    const oldHealth = healthDisplay.current;
    setHealthDisplay(prev => ({
      ...prev,
      current,
      maximum: maximum !== undefined ? maximum : prev.maximum,
    }));
    
    onHealthChangeCallbacks.current.forEach(callback => callback(current, oldHealth));
  }, [healthDisplay.current]);

  const setHealthType = useCallback((type: HealthDisplay['type']) => {
    setHealthDisplay(prev => ({ ...prev, type }));
  }, []);

  const showHealthRegeneration = useCallback((show: boolean) => {
    setHealthDisplay(prev => ({ ...prev, showRegeneraton: show }));
  }, []);

  const setHealthThresholds = useCallback((low: number, critical: number) => {
    setHealthDisplay(prev => ({
      ...prev,
      lowHealthThreshold: low,
      criticalHealthThreshold: critical,
    }));
  }, []);

  // Power-up management
  const addPowerUp = useCallback((powerUp: PowerUpDisplay['activePowerUps'][0]) => {
    setPowerUpDisplay(prev => {
      const filtered = prev.activePowerUps.filter(pu => pu.id !== powerUp.id);
      const updated = [...filtered, powerUp].slice(0, prev.maxDisplayed);
      onPowerUpChangeCallbacks.current.forEach(callback => callback(updated));
      return { ...prev, activePowerUps: updated };
    });
  }, []);

  const removePowerUp = useCallback((powerUpId: string) => {
    setPowerUpDisplay(prev => {
      const updated = prev.activePowerUps.filter(pu => pu.id !== powerUpId);
      onPowerUpChangeCallbacks.current.forEach(callback => callback(updated));
      return { ...prev, activePowerUps: updated };
    });
  }, []);

  const updatePowerUpTime = useCallback((powerUpId: string, remainingTime: number) => {
    setPowerUpDisplay(prev => {
      const updated = prev.activePowerUps.map(pu =>
        pu.id === powerUpId ? { ...pu, remainingTime } : pu
      );
      onPowerUpChangeCallbacks.current.forEach(callback => callback(updated));
      return { ...prev, activePowerUps: updated };
    });
  }, []);

  const setPowerUpDisplayLimit = useCallback((maxDisplayed: number) => {
    setPowerUpDisplay(prev => ({
      ...prev,
      maxDisplayed,
      activePowerUps: prev.activePowerUps.slice(0, maxDisplayed),
    }));
  }, []);

  // Status indicators
  const addStatusIndicator = useCallback((indicator: StatusIndicator) => {
    addElement({
      id: indicator.id,
      type: 'status',
      position: { x: '10px', y: '100px', anchor: 'top-left' },
      isVisible: true,
      isEnabled: true,
      priority: 10,
      data: indicator,
    });
  }, [addElement]);

  const updateStatusIndicator = useCallback((indicatorId: string, updates: Partial<StatusIndicator>) => {
    const element = elements.find(el => el.id === indicatorId && el.type === 'status');
    if (element) {
      updateElement(indicatorId, {
        data: { ...element.data, ...updates },
      });
    }
  }, [elements, updateElement]);

  const removeStatusIndicator = useCallback((indicatorId: string) => {
    removeElement(indicatorId);
  }, [removeElement]);

  // Progress bars
  const addProgressBar = useCallback((progressBar: ProgressBar) => {
    addElement({
      id: progressBar.id,
      type: 'progress',
      position: { x: '50%', y: '20px', anchor: 'top-center' },
      isVisible: true,
      isEnabled: true,
      priority: 15,
      data: progressBar,
    });
  }, [addElement]);

  const updateProgressBar = useCallback((barId: string, current: number, maximum?: number) => {
    const element = elements.find(el => el.id === barId && el.type === 'progress');
    if (element) {
      updateElement(barId, {
        data: {
          ...element.data,
          current,
          maximum: maximum !== undefined ? maximum : element.data.maximum,
        },
      });
    }
  }, [elements, updateElement]);

  const removeProgressBar = useCallback((barId: string) => {
    removeElement(barId);
  }, [removeElement]);

  // Timer management
  const updateTimer = useCallback((time: number, totalTime?: number) => {
    setTimerDisplay(prev => ({
      ...prev,
      currentTime: time,
      totalTime: totalTime !== undefined ? totalTime : prev.totalTime,
    }));
  }, []);

  const setTimerFormat = useCallback((format: TimerDisplay['format']) => {
    setTimerDisplay(prev => ({ ...prev, format }));
  }, []);

  const setTimerDirection = useCallback((direction: TimerDisplay['countDirection']) => {
    setTimerDisplay(prev => ({ ...prev, countDirection: direction }));
  }, []);

  const setTimerThresholds = useCallback((warning?: number, critical?: number) => {
    setTimerDisplay(prev => ({
      ...prev,
      warningTime: warning,
      criticalTime: critical,
    }));
  }, []);

  // Global HUD control
  const showAllElements = useCallback(() => {
    setElements(prev => prev.map(el => ({ ...el, isVisible: true })));
    setIsVisible(true);
  }, []);

  const hideAllElements = useCallback(() => {
    setElements(prev => prev.map(el => ({ ...el, isVisible: false })));
  }, []);

  const clearHUD = useCallback(() => {
    setElements([]);
  }, []);

  const resetHUD = useCallback(() => {
    setScoreDisplay(DEFAULT_SCORE_DISPLAY);
    setHealthDisplay(DEFAULT_HEALTH_DISPLAY);
    setPowerUpDisplay(DEFAULT_POWERUP_DISPLAY);
    setTimerDisplay(DEFAULT_TIMER_DISPLAY);
    showAllElements();
  }, [showAllElements]);

  // Game-specific HUD functions
  const showGameHUD = useCallback((gameState: any) => {
    clearHUD();
    
    // Add score display
    addElement({
      id: 'game-score',
      type: 'score',
      position: { x: '20px', y: '20px', anchor: 'top-left' },
      isVisible: true,
      isEnabled: true,
      priority: 100,
      data: { score: gameState.score || 0 },
    });
    
    // Add lives/health display
    if (gameState.lives !== undefined || gameState.health !== undefined) {
      addElement({
        id: 'game-health',
        type: 'lives',
        position: { x: '20px', y: '60px', anchor: 'top-left' },
        isVisible: true,
        isEnabled: true,
        priority: 90,
        data: { lives: gameState.lives, health: gameState.health },
      });
    }
    
    // Add timer if present
    if (gameState.timeRemaining !== undefined || gameState.timeElapsed !== undefined) {
      addElement({
        id: 'game-timer',
        type: 'timer',
        position: { x: '50%', y: '20px', anchor: 'top-center' },
        isVisible: true,
        isEnabled: true,
        priority: 80,
        data: { time: gameState.timeRemaining || gameState.timeElapsed },
      });
    }
    
    setIsVisible(true);
  }, [addElement, clearHUD]);

  const showMenuHUD = useCallback(() => {
    clearHUD();
    setIsVisible(false);
  }, [clearHUD]);

  const showPauseHUD = useCallback(() => {
    // Keep current elements but add pause indicator
    addElement({
      id: 'pause-indicator',
      type: 'status',
      position: { x: '50%', y: '50%', anchor: 'center' },
      isVisible: true,
      isEnabled: true,
      priority: 1000,
      data: { label: 'PAUSED', status: 'normal' },
    });
  }, [addElement]);

  const showGameOverHUD = useCallback((finalScore: number, bestScore: number) => {
    // Keep score visible but add game over elements
    addElement({
      id: 'game-over-title',
      type: 'status',
      position: { x: '50%', y: '40%', anchor: 'center' },
      isVisible: true,
      isEnabled: true,
      priority: 1000,
      data: { label: 'GAME OVER', status: 'critical' },
    });
    
    addElement({
      id: 'final-score',
      type: 'score',
      position: { x: '50%', y: '55%', anchor: 'center' },
      isVisible: true,
      isEnabled: true,
      priority: 999,
      data: { score: finalScore, bestScore },
    });
  }, [addElement]);

  // Layout and positioning
  const setHUDLayout = useCallback((_layout: 'minimal' | 'standard' | 'detailed' | 'custom') => {
    // Layout implementation will be added later
  }, []);

  const setElementPosition = useCallback((elementId: string, position: HUDPosition) => {
    moveElement(elementId, position);
  }, [moveElement]);

  const resetElementPositions = useCallback(() => {
    // Reset all elements to default positions based on their type
    elements.forEach(element => {
      let defaultPosition: HUDPosition;
      
      switch (element.type) {
        case 'score':
          defaultPosition = { x: '20px', y: '20px', anchor: 'top-left' };
          break;
        case 'lives':
        case 'health':
          defaultPosition = { x: '20px', y: '60px', anchor: 'top-left' };
          break;
        case 'timer':
          defaultPosition = { x: '50%', y: '20px', anchor: 'top-center' };
          break;
        case 'power-up':
          defaultPosition = { x: '20px', y: '120px', anchor: 'top-left' };
          break;
        default:
          defaultPosition = { x: '20px', y: '20px', anchor: 'top-left' };
      }
      
      moveElement(element.id, defaultPosition);
    });
  }, [elements, moveElement]);

  // Animation and effects
  const animateElement = useCallback((elementId: string, animation: HUDAnimation) => {
    updateElement(elementId, { animation });
    
    // Clear animation after completion
    const duration = animation.duration + (animation.delay || 0);
    setTimeout(() => {
      updateElement(elementId, { animation: undefined });
    }, duration);
  }, [updateElement]);

  const stopElementAnimation = useCallback((elementId: string) => {
    updateElement(elementId, { animation: undefined });
  }, [updateElement]);

  const flashElement = useCallback((elementId: string, duration = 500) => {
    animateElement(elementId, {
      type: 'fade',
      duration: duration / 2,
      repeat: 2,
      direction: 'alternate',
      easing: 'ease-in-out',
    });
  }, [animateElement]);

  const highlightElement = useCallback((elementId: string, duration = 1000) => {
    animateElement(elementId, {
      type: 'pulse',
      duration: duration / 3,
      repeat: 3,
      easing: 'ease-in-out',
    });
  }, [animateElement]);

  // Event handlers
  const onElementUpdate = useCallback((callback: (elementId: string, element: HUDElement) => void) => {
    onElementUpdateCallbacks.current.add(callback);
    return () => onElementUpdateCallbacks.current.delete(callback);
  }, []);

  const onScoreChange = useCallback((callback: (newScore: number, oldScore: number) => void) => {
    onScoreChangeCallbacks.current.add(callback);
    return () => onScoreChangeCallbacks.current.delete(callback);
  }, []);

  const onHealthChange = useCallback((callback: (newHealth: number, oldHealth: number) => void) => {
    onHealthChangeCallbacks.current.add(callback);
    return () => onHealthChangeCallbacks.current.delete(callback);
  }, []);

  const onPowerUpChange = useCallback((callback: (powerUps: PowerUpDisplay['activePowerUps']) => void) => {
    onPowerUpChangeCallbacks.current.add(callback);
    return () => onPowerUpChangeCallbacks.current.delete(callback);
  }, []);

  // Auto-remove expired power-ups
  useEffect(() => {
    const interval = setInterval(() => {
      setPowerUpDisplay(prev => {
        const updated = prev.activePowerUps.filter(pu => {
          if (pu.remainingTime <= 0) {
            return false;
          }
          return true;
        }).map(pu => ({
          ...pu,
          remainingTime: Math.max(0, pu.remainingTime - 100),
        }));
        
        if (updated.length !== prev.activePowerUps.length) {
          onPowerUpChangeCallbacks.current.forEach(callback => callback(updated));
        }
        
        return { ...prev, activePowerUps: updated };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    // Core HUD functions
    addElement,
    removeElement,
    updateElement,
    moveElement,
    
    // Element visibility and state
    showElement,
    hideElement,
    enableElement,
    disableElement,
    
    // Score management
    updateScore,
    setScoreFormat,
    showScoreDifference,
    animateScoreChange,
    
    // Health/Lives management
    updateHealth,
    setHealthType,
    showHealthRegeneration,
    setHealthThresholds,
    
    // Power-up management
    addPowerUp,
    removePowerUp,
    updatePowerUpTime,
    setPowerUpDisplayLimit,
    
    // Status indicators
    addStatusIndicator,
    updateStatusIndicator,
    removeStatusIndicator,
    
    // Progress bars
    addProgressBar,
    updateProgressBar,
    removeProgressBar,
    
    // Timer management
    updateTimer,
    setTimerFormat,
    setTimerDirection,
    setTimerThresholds,
    
    // Game-specific HUD functions
    showGameHUD,
    showMenuHUD,
    showPauseHUD,
    showGameOverHUD,
    
    // Layout and positioning
    setHUDLayout,
    setElementPosition,
    resetElementPositions,
    
    // Animation and effects
    animateElement,
    stopElementAnimation,
    flashElement,
    highlightElement,
    
    // Global HUD control
    showAllElements,
    hideAllElements,
    resetHUD,
    clearHUD,
    
    // State getters
    currentElements: elements,
    scoreDisplay,
    healthDisplay,
    powerUpDisplay,
    timerDisplay,
    isHUDVisible: isVisible,
    
    // Event handlers
    onElementUpdate,
    onScoreChange,
    onHealthChange,
    onPowerUpChange,
  };
};

export default useHUDRenderer;