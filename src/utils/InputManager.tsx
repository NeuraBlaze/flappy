// ===== 🎮 INPUT MANAGER =====
// Input handling utility for keyboard/mouse/touch input and gesture recognition
// Extracted from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface KeyState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  pressTime: number;
  releaseTime: number;
}

export interface MouseState {
  x: number;
  y: number;
  buttons: {
    left: boolean;
    right: boolean;
    middle: boolean;
  };
  wheel: {
    deltaX: number;
    deltaY: number;
    deltaZ: number;
  };
  justClicked: boolean;
  clickCount: number;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  force?: number;
}

export interface TouchState {
  active: boolean;
  touches: TouchPoint[];
  touchCount: number;
  lastTouchTime: number;
  gestureActive: boolean;
}

export interface Gesture {
  type: 'tap' | 'doubletap' | 'hold' | 'swipe' | 'pinch' | 'rotate';
  startTime: number;
  endTime?: number;
  startPosition: { x: number; y: number };
  endPosition?: { x: number; y: number };
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: number;
  rotation?: number;
  velocity?: number;
}

export interface InputConfig {
  // Keyboard settings
  enableKeyboard: boolean;
  keyRepeatDelay: number; // ms
  keyRepeatRate: number; // ms
  
  // Mouse settings
  enableMouse: boolean;
  doubleClickTime: number; // ms
  doubleClickDistance: number; // pixels
  
  // Touch settings
  enableTouch: boolean;
  touchSensitivity: number;
  preventDefault: boolean;
  
  // Gesture settings
  enableGestures: boolean;
  tapMaxTime: number; // ms
  tapMaxDistance: number; // pixels
  holdMinTime: number; // ms
  swipeMinDistance: number; // pixels
  swipeMaxTime: number; // ms
  pinchMinDistance: number; // pixels
  
  // General settings
  enableDebug: boolean;
  captureEvents: boolean;
}

export interface InputCallbacks {
  onKeyDown?: (key: string, event: KeyboardEvent) => void;
  onKeyUp?: (key: string, event: KeyboardEvent) => void;
  onKeyHold?: (key: string, holdTime: number) => void;
  
  onMouseDown?: (button: string, x: number, y: number, event: MouseEvent) => void;
  onMouseUp?: (button: string, x: number, y: number, event: MouseEvent) => void;
  onMouseMove?: (x: number, y: number, deltaX: number, deltaY: number, event: MouseEvent) => void;
  onMouseWheel?: (deltaX: number, deltaY: number, deltaZ: number, event: WheelEvent) => void;
  onDoubleClick?: (x: number, y: number, event: MouseEvent) => void;
  
  onTouchStart?: (touches: TouchPoint[], event: TouchEvent) => void;
  onTouchMove?: (touches: TouchPoint[], event: TouchEvent) => void;
  onTouchEnd?: (touches: TouchPoint[], event: TouchEvent) => void;
  
  onGesture?: (gesture: Gesture) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onHold?: (x: number, y: number, holdTime: number) => void;
  onSwipe?: (direction: string, distance: number, velocity: number) => void;
  onPinch?: (scale: number, centerX: number, centerY: number) => void;
  onRotate?: (rotation: number, centerX: number, centerY: number) => void;
}

export interface UseInputManagerReturn {
  // State access
  keys: Map<string, KeyState>;
  mouse: MouseState;
  touch: TouchState;
  gestures: Gesture[];
  
  // Input checking
  isKeyPressed: (key: string) => boolean;
  isKeyJustPressed: (key: string) => boolean;
  isKeyJustReleased: (key: string) => boolean;
  getKeyHoldTime: (key: string) => number;
  
  isMouseButtonPressed: (button: 'left' | 'right' | 'middle') => boolean;
  getMousePosition: () => { x: number; y: number };
  getMouseWheelDelta: () => { deltaX: number; deltaY: number; deltaZ: number };
  
  isTouchActive: () => boolean;
  getTouchCount: () => number;
  getTouches: () => TouchPoint[];
  getTouch: (index: number) => TouchPoint | null;
  
  // Gesture detection
  getActiveGestures: () => Gesture[];
  getLastGesture: (type?: string) => Gesture | null;
  
  // Input simulation
  simulateKeyPress: (key: string) => void;
  simulateKeyRelease: (key: string) => void;
  simulateMouseClick: (x: number, y: number, button?: string) => void;
  simulateTouch: (x: number, y: number, id?: number) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<InputConfig>) => void;
  setCallbacks: (callbacks: Partial<InputCallbacks>) => void;
  
  // Utilities
  clearInputState: () => void;
  enableInputCapture: (element?: HTMLElement) => void;
  disableInputCapture: () => void;
  getInputSummary: () => string;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: InputConfig = {
  enableKeyboard: true,
  keyRepeatDelay: 500,
  keyRepeatRate: 50,
  enableMouse: true,
  doubleClickTime: 300,
  doubleClickDistance: 5,
  enableTouch: true,
  touchSensitivity: 1.0,
  preventDefault: true,
  enableGestures: true,
  tapMaxTime: 200,
  tapMaxDistance: 10,
  holdMinTime: 500,
  swipeMinDistance: 50,
  swipeMaxTime: 500,
  pinchMinDistance: 20,
  enableDebug: false,
  captureEvents: true,
};

// ===== UTILITY FUNCTIONS =====
const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// Utility function for angle calculation (reserved for future use)
// const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
//   return Math.atan2(y2 - y1, x2 - x1);
// };

const getDirection = (startX: number, startY: number, endX: number, endY: number): 'up' | 'down' | 'left' | 'right' => {
  const dx = endX - startX;
  const dy = endY - startY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
};

// Utility function for touch center calculation (reserved for future pinch/zoom gestures)
// const getTouchCenter = (touches: TouchPoint[]): { x: number; y: number } => {
//   if (touches.length === 0) return { x: 0, y: 0 };
//   
//   const sumX = touches.reduce((sum, touch) => sum + touch.x, 0);
//   const sumY = touches.reduce((sum, touch) => sum + touch.y, 0);
//   
//   return {
//     x: sumX / touches.length,
//     y: sumY / touches.length
//   };
// };

// ===== CUSTOM HOOK =====
export function useInputManager(
  initialConfig: Partial<InputConfig> = {},
  initialCallbacks: Partial<InputCallbacks> = {}
): UseInputManagerReturn {
  const config = useRef({ ...defaultConfig, ...initialConfig });
  const callbacks = useRef(initialCallbacks);
  
  // Input state
  const [keys] = useState(() => new Map<string, KeyState>());
  const [mouse, setMouse] = useState<MouseState>({
    x: 0,
    y: 0,
    buttons: { left: false, right: false, middle: false },
    wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 },
    justClicked: false,
    clickCount: 0
  });
  const [touch, setTouch] = useState<TouchState>({
    active: false,
    touches: [],
    touchCount: 0,
    lastTouchTime: 0,
    gestureActive: false
  });
  const [gestures, setGestures] = useState<Gesture[]>([]);
  
  // Internal state
  const captureElement = useRef<HTMLElement | null>(null);
  const lastClickTime = useRef(0);
  const lastClickPosition = useRef({ x: 0, y: 0 });
  const activeGesture = useRef<Partial<Gesture> | null>(null);
  const keyRepeatTimers = useRef<Map<string, number>>(new Map());
  
  // ===== KEYBOARD HANDLING =====
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!config.current.enableKeyboard) return;
    
    const key = event.code;
    const now = performance.now();
    
    // Get or create key state
    let keyState = keys.get(key);
    if (!keyState) {
      keyState = {
        pressed: false,
        justPressed: false,
        justReleased: false,
        pressTime: 0,
        releaseTime: 0
      };
      keys.set(key, keyState);
    }
    
    // Update key state
    if (!keyState.pressed) {
      keyState.pressed = true;
      keyState.justPressed = true;
      keyState.pressTime = now;
      
      // Call callback
      callbacks.current.onKeyDown?.(key, event);
      
      // Set up key repeat
      if (config.current.keyRepeatRate > 0) {
        const repeatTimer = setTimeout(() => {
          const holdTimer = setInterval(() => {
            if (keyState && keyState.pressed) {
              callbacks.current.onKeyHold?.(key, now - keyState.pressTime);
            } else {
              clearInterval(holdTimer);
            }
          }, config.current.keyRepeatRate);
          keyRepeatTimers.current.set(key, holdTimer);
        }, config.current.keyRepeatDelay);
        keyRepeatTimers.current.set(key, repeatTimer);
      }
    }
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, [keys]);
  
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!config.current.enableKeyboard) return;
    
    const key = event.code;
    const now = performance.now();
    
    const keyState = keys.get(key);
    if (keyState && keyState.pressed) {
      keyState.pressed = false;
      keyState.justReleased = true;
      keyState.releaseTime = now;
      
      // Clear key repeat timer
      const timer = keyRepeatTimers.current.get(key);
      if (timer) {
        clearTimeout(timer);
        clearInterval(timer);
        keyRepeatTimers.current.delete(key);
      }
      
      // Call callback
      callbacks.current.onKeyUp?.(key, event);
    }
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, [keys]);
  
  // ===== MOUSE HANDLING =====
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!config.current.enableMouse) return;
    
    const buttonName = ['left', 'middle', 'right'][event.button] || 'left';
    
    setMouse(prev => ({
      ...prev,
      x: event.clientX,
      y: event.clientY,
      buttons: {
        ...prev.buttons,
        [buttonName]: true
      },
      justClicked: true
    }));
    
    callbacks.current.onMouseDown?.(buttonName, event.clientX, event.clientY, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!config.current.enableMouse) return;
    
    const buttonName = ['left', 'middle', 'right'][event.button] || 'left';
    const now = performance.now();
    
    setMouse(prev => {
      const newMouse = {
        ...prev,
        x: event.clientX,
        y: event.clientY,
        buttons: {
          ...prev.buttons,
          [buttonName]: false
        },
        justClicked: false
      };
      
      // Check for double click
      const timeDiff = now - lastClickTime.current;
      const distance = getDistance(
        event.clientX, event.clientY,
        lastClickPosition.current.x, lastClickPosition.current.y
      );
      
      if (timeDiff < config.current.doubleClickTime && distance < config.current.doubleClickDistance) {
        newMouse.clickCount = 2;
        callbacks.current.onDoubleClick?.(event.clientX, event.clientY, event);
      } else {
        newMouse.clickCount = 1;
      }
      
      lastClickTime.current = now;
      lastClickPosition.current = { x: event.clientX, y: event.clientY };
      
      return newMouse;
    });
    
    callbacks.current.onMouseUp?.(buttonName, event.clientX, event.clientY, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!config.current.enableMouse) return;
    
    setMouse(prev => {
      const deltaX = event.clientX - prev.x;
      const deltaY = event.clientY - prev.y;
      
      callbacks.current.onMouseMove?.(event.clientX, event.clientY, deltaX, deltaY, event);
      
      return {
        ...prev,
        x: event.clientX,
        y: event.clientY
      };
    });
  }, []);
  
  const handleMouseWheel = useCallback((event: WheelEvent) => {
    if (!config.current.enableMouse) return;
    
    setMouse(prev => ({
      ...prev,
      wheel: {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ
      }
    }));
    
    callbacks.current.onMouseWheel?.(event.deltaX, event.deltaY, event.deltaZ, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  // ===== TOUCH HANDLING =====
  const createTouchPoint = (touch: Touch, startTime: number): TouchPoint => ({
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
    startX: touch.clientX,
    startY: touch.clientY,
    startTime,
    force: touch.force
  });
  
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!config.current.enableTouch) return;
    
    const now = performance.now();
    const newTouches: TouchPoint[] = [];
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      newTouches.push(createTouchPoint(touch, now));
    }
    
    setTouch(prev => {
      const allTouches = [...prev.touches, ...newTouches];
      
      // Start gesture detection
      if (allTouches.length === 1 && config.current.enableGestures) {
        const touch = allTouches[0];
        activeGesture.current = {
          type: 'tap',
          startTime: now,
          startPosition: { x: touch.x, y: touch.y }
        };
      }
      
      return {
        active: true,
        touches: allTouches,
        touchCount: allTouches.length,
        lastTouchTime: now,
        gestureActive: allTouches.length > 0
      };
    });
    
    callbacks.current.onTouchStart?.(newTouches, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!config.current.enableTouch) return;
    
    setTouch(prev => {
      const updatedTouches = prev.touches.map(existingTouch => {
        for (let i = 0; i < event.changedTouches.length; i++) {
          const touch = event.changedTouches[i];
          if (touch.identifier === existingTouch.id) {
            return {
              ...existingTouch,
              x: touch.clientX,
              y: touch.clientY,
              force: touch.force
            };
          }
        }
        return existingTouch;
      });
      
      // Update gesture
      if (activeGesture.current && updatedTouches.length === 1) {
        const touch = updatedTouches[0];
        const distance = getDistance(
          activeGesture.current.startPosition!.x,
          activeGesture.current.startPosition!.y,
          touch.x,
          touch.y
        );
        
        // Check if it's still a tap or became a swipe
        if (distance > config.current.tapMaxDistance) {
          activeGesture.current.type = 'swipe';
        }
      }
      
      return {
        ...prev,
        touches: updatedTouches
      };
    });
    
    // Create touch points array for callback
    const currentTouches: TouchPoint[] = [];
    setTouch(prevTouch => {
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const existingTouch = prevTouch.touches.find((t: TouchPoint) => t.id === touch.identifier);
        if (existingTouch) {
          currentTouches.push({
            ...existingTouch,
            x: touch.clientX,
            y: touch.clientY,
            force: touch.force
          });
        }
      }
      return prevTouch;
    });
    
    callbacks.current.onTouchMove?.(currentTouches, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!config.current.enableTouch) return;
    
    const now = performance.now();
    
    setTouch(prev => {
      const endedTouchIds = Array.from(event.changedTouches).map(t => t.identifier);
      const remainingTouches = prev.touches.filter(t => !endedTouchIds.includes(t.id));
      
      // Complete gesture
      if (activeGesture.current && remainingTouches.length === 0) {
        const gesture = activeGesture.current as Gesture;
        gesture.endTime = now;
        
        if (prev.touches.length === 1) {
          const touch = prev.touches[0];
          gesture.endPosition = { x: touch.x, y: touch.y };
          gesture.distance = getDistance(
            gesture.startPosition.x,
            gesture.startPosition.y,
            touch.x,
            touch.y
          );
          
          const duration = now - gesture.startTime;
          
          // Determine final gesture type
          if (gesture.distance < config.current.tapMaxDistance && duration < config.current.tapMaxTime) {
            gesture.type = 'tap';
            callbacks.current.onTap?.(touch.x, touch.y);
          } else if (gesture.distance > config.current.swipeMinDistance && duration < config.current.swipeMaxTime) {
            gesture.type = 'swipe';
            gesture.direction = getDirection(
              gesture.startPosition.x,
              gesture.startPosition.y,
              touch.x,
              touch.y
            );
            gesture.velocity = gesture.distance / duration;
            callbacks.current.onSwipe?.(gesture.direction, gesture.distance, gesture.velocity);
          } else if (duration > config.current.holdMinTime) {
            gesture.type = 'hold';
            callbacks.current.onHold?.(touch.x, touch.y, duration);
          }
          
          // Add to gesture history
          setGestures(prevGestures => [...prevGestures.slice(-9), gesture]);
          callbacks.current.onGesture?.(gesture);
        }
        
        activeGesture.current = null;
      }
      
      return {
        active: remainingTouches.length > 0,
        touches: remainingTouches,
        touchCount: remainingTouches.length,
        lastTouchTime: now,
        gestureActive: remainingTouches.length > 0
      };
    });
    
    // Create ended touches array for callback
    const endedTouches: TouchPoint[] = [];
    setTouch(prevTouch => {
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const existingTouch = prevTouch.touches.find((t: TouchPoint) => t.id === touch.identifier);
        if (existingTouch) {
          endedTouches.push(existingTouch);
        }
      }
      return prevTouch;
    });
    
    callbacks.current.onTouchEnd?.(endedTouches, event);
    
    if (config.current.preventDefault) {
      event.preventDefault();
    }
  }, []);
  
  // ===== INPUT CHECKING FUNCTIONS =====
  const isKeyPressed = useCallback((key: string): boolean => {
    return keys.get(key)?.pressed || false;
  }, [keys]);
  
  const isKeyJustPressed = useCallback((key: string): boolean => {
    return keys.get(key)?.justPressed || false;
  }, [keys]);
  
  const isKeyJustReleased = useCallback((key: string): boolean => {
    return keys.get(key)?.justReleased || false;
  }, [keys]);
  
  const getKeyHoldTime = useCallback((key: string): number => {
    const keyState = keys.get(key);
    if (keyState && keyState.pressed) {
      return performance.now() - keyState.pressTime;
    }
    return 0;
  }, [keys]);
  
  const isMouseButtonPressed = useCallback((button: 'left' | 'right' | 'middle'): boolean => {
    return mouse.buttons[button];
  }, [mouse]);
  
  const getMousePosition = useCallback(() => ({ x: mouse.x, y: mouse.y }), [mouse]);
  
  const getMouseWheelDelta = useCallback(() => mouse.wheel, [mouse]);
  
  const isTouchActive = useCallback(() => touch.active, [touch]);
  
  const getTouchCount = useCallback(() => touch.touchCount, [touch]);
  
  const getTouches = useCallback(() => touch.touches, [touch]);
  
  const getTouch = useCallback((index: number): TouchPoint | null => {
    return touch.touches[index] || null;
  }, [touch]);
  
  // ===== GESTURE FUNCTIONS =====
  const getActiveGestures = useCallback(() => gestures, [gestures]);
  
  const getLastGesture = useCallback((type?: string): Gesture | null => {
    if (type) {
      for (let i = gestures.length - 1; i >= 0; i--) {
        if (gestures[i].type === type) {
          return gestures[i];
        }
      }
      return null;
    }
    return gestures[gestures.length - 1] || null;
  }, [gestures]);
  
  // ===== INPUT SIMULATION =====
  const simulateKeyPress = useCallback((key: string) => {
    const event = new KeyboardEvent('keydown', { code: key });
    handleKeyDown(event);
  }, [handleKeyDown]);
  
  const simulateKeyRelease = useCallback((key: string) => {
    const event = new KeyboardEvent('keyup', { code: key });
    handleKeyUp(event);
  }, [handleKeyUp]);
  
  const simulateMouseClick = useCallback((x: number, y: number, button: string = 'left') => {
    const buttonIndex = { left: 0, middle: 1, right: 2 }[button] || 0;
    const downEvent = new MouseEvent('mousedown', { 
      clientX: x, 
      clientY: y, 
      button: buttonIndex 
    });
    const upEvent = new MouseEvent('mouseup', { 
      clientX: x, 
      clientY: y, 
      button: buttonIndex 
    });
    
    handleMouseDown(downEvent);
    setTimeout(() => handleMouseUp(upEvent), 100);
  }, [handleMouseDown, handleMouseUp]);
  
  const simulateTouch = useCallback((x: number, y: number, id: number = 0) => {
    // Note: Touch simulation is limited by browser Touch API constraints
    // This is a simplified version for testing
    const touchPoint: TouchPoint = {
      id,
      x,
      y,
      startX: x,
      startY: y,
      startTime: performance.now()
    };
    
    setTouch(prev => ({
      ...prev,
      active: true,
      touches: [touchPoint],
      touchCount: 1,
      gestureActive: true
    }));
  }, []);
  
  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<InputConfig>) => {
    config.current = { ...config.current, ...newConfig };
  }, []);
  
  const setCallbacks = useCallback((newCallbacks: Partial<InputCallbacks>) => {
    callbacks.current = { ...callbacks.current, ...newCallbacks };
  }, []);
  
  // ===== UTILITIES =====
  const clearInputState = useCallback(() => {
    keys.clear();
    setMouse({
      x: 0,
      y: 0,
      buttons: { left: false, right: false, middle: false },
      wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 },
      justClicked: false,
      clickCount: 0
    });
    setTouch({
      active: false,
      touches: [],
      touchCount: 0,
      lastTouchTime: 0,
      gestureActive: false
    });
    setGestures([]);
    
    // Clear all timers
    keyRepeatTimers.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    keyRepeatTimers.current.clear();
  }, [keys]);
  
  const enableInputCapture = useCallback((element?: HTMLElement) => {
    const target = element || document.body;
    captureElement.current = target;
    
    if (config.current.enableKeyboard) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    
    if (config.current.enableMouse) {
      target.addEventListener('mousedown', handleMouseDown);
      target.addEventListener('mouseup', handleMouseUp);
      target.addEventListener('mousemove', handleMouseMove);
      target.addEventListener('wheel', handleMouseWheel);
    }
    
    if (config.current.enableTouch) {
      target.addEventListener('touchstart', handleTouchStart, { passive: false });
      target.addEventListener('touchmove', handleTouchMove, { passive: false });
      target.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleMouseWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  const disableInputCapture = useCallback(() => {
    if (captureElement.current) {
      const target = captureElement.current;
      
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      target.removeEventListener('mousedown', handleMouseDown);
      target.removeEventListener('mouseup', handleMouseUp);
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('wheel', handleMouseWheel);
      
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      
      captureElement.current = null;
    }
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleMouseWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  const getInputSummary = useCallback((): string => {
    const pressedKeys = Array.from(keys.entries())
      .filter(([, state]) => state.pressed)
      .map(([key]) => key);
    
    const pressedButtons = Object.entries(mouse.buttons)
      .filter(([, pressed]) => pressed)
      .map(([button]) => button);
    
    return `Input Summary:
Keyboard: ${pressedKeys.length > 0 ? pressedKeys.join(', ') : 'none'}
Mouse: Position(${mouse.x}, ${mouse.y}), Buttons: ${pressedButtons.length > 0 ? pressedButtons.join(', ') : 'none'}
Touch: ${touch.active ? `${touch.touchCount} touches` : 'inactive'}
Recent Gestures: ${gestures.slice(-3).map(g => g.type).join(', ')}`;
  }, [keys, mouse, touch, gestures]);
  
  // ===== FRAME UPDATE =====
  useEffect(() => {
    const frameUpdate = () => {
      // Clear just-pressed and just-released flags
      keys.forEach(keyState => {
        keyState.justPressed = false;
        keyState.justReleased = false;
      });
      
      setMouse(prev => ({
        ...prev,
        justClicked: false,
        wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 }
      }));
    };
    
    const interval = setInterval(frameUpdate, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [keys]);
  
  // ===== AUTO-ENABLE INPUT CAPTURE =====
  useEffect(() => {
    if (config.current.captureEvents) {
      enableInputCapture();
    }
    
    return () => {
      disableInputCapture();
    };
  }, [enableInputCapture, disableInputCapture]);
  
  return {
    // State access
    keys,
    mouse,
    touch,
    gestures,
    
    // Input checking
    isKeyPressed,
    isKeyJustPressed,
    isKeyJustReleased,
    getKeyHoldTime,
    
    isMouseButtonPressed,
    getMousePosition,
    getMouseWheelDelta,
    
    isTouchActive,
    getTouchCount,
    getTouches,
    getTouch,
    
    // Gesture detection
    getActiveGestures,
    getLastGesture,
    
    // Input simulation
    simulateKeyPress,
    simulateKeyRelease,
    simulateMouseClick,
    simulateTouch,
    
    // Configuration
    updateConfig,
    setCallbacks,
    
    // Utilities
    clearInputState,
    enableInputCapture,
    disableInputCapture,
    getInputSummary,
  };
}

// ===== COMPONENT EXPORT =====
export default useInputManager;