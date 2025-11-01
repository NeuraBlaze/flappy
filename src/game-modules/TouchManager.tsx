import { useState, useCallback, useRef, useEffect } from 'react';

// Touch and gesture event types
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  force?: number;
  timestamp: number;
}

export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  touches: TouchPoint[];
  startPosition?: { x: number; y: number };
  currentPosition?: { x: number; y: number };
  deltaX?: number;
  deltaY?: number;
  distance?: number;
  scale?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  timestamp: number;
  duration?: number;
  handled: boolean;
}

export interface TouchConfig {
  tapThreshold: number;
  doubleTapTimeout: number;
  longPressTimeout: number;
  swipeThreshold: number;
  pinchThreshold: number;
  rotateThreshold: number;
  velocityThreshold: number;
  enableMultiTouch: boolean;
  preventDefault: boolean;
  maxTouches: number;
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  velocity: { x: number; y: number };
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  startDistance: number;
  currentDistance: number;
}

export interface RotateGesture {
  rotation: number;
  center: { x: number; y: number };
  startAngle: number;
  currentAngle: number;
}

export interface PanGesture {
  deltaX: number;
  deltaY: number;
  totalX: number;
  totalY: number;
  velocity: { x: number; y: number };
}

// Touch action mappings
export interface TouchActionMapping {
  gesture: GestureEvent['type'];
  action: string;
  conditions?: {
    minTouches?: number;
    maxTouches?: number;
    direction?: SwipeGesture['direction'];
    zone?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'full';
  };
}

export interface TouchZone {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  actions: TouchActionMapping[];
}

export const useTouchManager = (config: Partial<TouchConfig> = {}) => {
  // Configuration with defaults
  const touchConfig: TouchConfig = {
    tapThreshold: 10,
    doubleTapTimeout: 300,
    longPressTimeout: 500,
    swipeThreshold: 50,
    pinchThreshold: 10,
    rotateThreshold: 15,
    velocityThreshold: 0.5,
    enableMultiTouch: true,
    preventDefault: true,
    maxTouches: 10,
    ...config,
  };

  // State management
  const [activeTouches, setActiveTouches] = useState<Map<number, TouchPoint>>(new Map());
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureEvent | null>(null);
  const [touchZones, setTouchZones] = useState<TouchZone[]>([]);
  const [gestureHistory, setGestureHistory] = useState<GestureEvent[]>([]);

  // Refs for gesture tracking
  const gestureStartTime = useRef<number>(0);
  const gestureStartPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);
  const lastTapPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  const panStartPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panCurrentPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistance = useRef<number>(0);
  const initialRotationAngle = useRef<number>(0);
  const velocityTracker = useRef<{ x: number; y: number; time: number }[]>([]);

  // Event listeners
  const gestureListeners = useRef<((event: GestureEvent) => void)[]>([]);
  const touchActionMappings = useRef<TouchActionMapping[]>([]);

  // Helper functions
  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
    force: touch.force,
    timestamp: Date.now(),
  }), []);

  const getDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  const getAngle = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  }, []);

  const getSwipeDirection = useCallback((deltaX: number, deltaY: number): SwipeGesture['direction'] => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const calculateVelocity = useCallback((points: { x: number; y: number; time: number }[]): { x: number; y: number } => {
    if (points.length < 2) return { x: 0, y: 0 };
    
    const recent = points.slice(-5); // Use last 5 points
    const first = recent[0];
    const last = recent[recent.length - 1];
    const timeDiff = last.time - first.time;
    
    if (timeDiff === 0) return { x: 0, y: 0 };
    
    return {
      x: (last.x - first.x) / timeDiff,
      y: (last.y - first.y) / timeDiff,
    };
  }, []);

  const isPointInZone = useCallback((point: { x: number; y: number }, zone: TouchZone): boolean => {
    return point.x >= zone.x && 
           point.x <= zone.x + zone.width && 
           point.y >= zone.y && 
           point.y <= zone.y + zone.height;
  }, []);

  const getZoneForPoint = useCallback((point: { x: number; y: number }): TouchZone | null => {
    return touchZones.find(zone => isPointInZone(point, zone)) || null;
  }, [touchZones, isPointInZone]);

  // Gesture detection functions
  const detectTap = useCallback((touchPoint: TouchPoint): GestureEvent | null => {
    const now = Date.now();
    const distance = getDistance(gestureStartPosition.current, touchPoint);
    
    if (distance <= touchConfig.tapThreshold) {
      // Check for double tap
      const timeSinceLastTap = now - lastTapTime.current;
      const distanceFromLastTap = getDistance(lastTapPosition.current, touchPoint);
      
      if (timeSinceLastTap <= touchConfig.doubleTapTimeout && 
          distanceFromLastTap <= touchConfig.tapThreshold) {
        // Double tap detected
        lastTapTime.current = 0; // Reset to prevent triple tap
        return {
          type: 'double-tap',
          touches: [touchPoint],
          startPosition: gestureStartPosition.current,
          currentPosition: { x: touchPoint.x, y: touchPoint.y },
          timestamp: now,
          duration: now - gestureStartTime.current,
          handled: false,
        };
      } else {
        // Single tap
        lastTapTime.current = now;
        lastTapPosition.current = { x: touchPoint.x, y: touchPoint.y };
        return {
          type: 'tap',
          touches: [touchPoint],
          startPosition: gestureStartPosition.current,
          currentPosition: { x: touchPoint.x, y: touchPoint.y },
          timestamp: now,
          duration: now - gestureStartTime.current,
          handled: false,
        };
      }
    }
    
    return null;
  }, [touchConfig.tapThreshold, touchConfig.doubleTapTimeout, getDistance]);

  const detectSwipe = useCallback((touchPoint: TouchPoint): GestureEvent | null => {
    const deltaX = touchPoint.x - gestureStartPosition.current.x;
    const deltaY = touchPoint.y - gestureStartPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance >= touchConfig.swipeThreshold) {
      const velocity = calculateVelocity(velocityTracker.current);
      const direction = getSwipeDirection(deltaX, deltaY);
      
      return {
        type: 'swipe',
        touches: [touchPoint],
        startPosition: gestureStartPosition.current,
        currentPosition: { x: touchPoint.x, y: touchPoint.y },
        deltaX,
        deltaY,
        distance,
        velocity,
        direction,
        timestamp: Date.now(),
        duration: Date.now() - gestureStartTime.current,
        handled: false,
      };
    }
    
    return null;
  }, [touchConfig.swipeThreshold, calculateVelocity, getSwipeDirection]);

  const detectPinch = useCallback((touches: TouchPoint[]): GestureEvent | null => {
    if (touches.length !== 2) return null;
    
    const currentDistance = getDistance(touches[0], touches[1]);
    const scale = currentDistance / initialPinchDistance.current;
    
    if (Math.abs(scale - 1) >= touchConfig.pinchThreshold / 100) {
      return {
        type: 'pinch',
        touches,
        scale,
        timestamp: Date.now(),
        duration: Date.now() - gestureStartTime.current,
        handled: false,
      };
    }
    
    return null;
  }, [touchConfig.pinchThreshold, getDistance]);

  const detectRotate = useCallback((touches: TouchPoint[]): GestureEvent | null => {
    if (touches.length !== 2) return null;
    
    const currentAngle = getAngle(touches[0], touches[1]);
    const rotation = currentAngle - initialRotationAngle.current;
    
    if (Math.abs(rotation) >= touchConfig.rotateThreshold) {
      return {
        type: 'rotate',
        touches,
        rotation,
        timestamp: Date.now(),
        duration: Date.now() - gestureStartTime.current,
        handled: false,
      };
    }
    
    return null;
  }, [touchConfig.rotateThreshold, getAngle]);

  const detectPan = useCallback((touchPoint: TouchPoint): GestureEvent | null => {
    const deltaX = touchPoint.x - panCurrentPosition.current.x;
    const deltaY = touchPoint.y - panCurrentPosition.current.y;
    
    panCurrentPosition.current = { x: touchPoint.x, y: touchPoint.y };
    
    const velocity = calculateVelocity(velocityTracker.current);
    
    return {
      type: 'pan',
      touches: [touchPoint],
      startPosition: panStartPosition.current,
      currentPosition: { x: touchPoint.x, y: touchPoint.y },
      deltaX,
      deltaY,
      velocity,
      timestamp: Date.now(),
      duration: Date.now() - gestureStartTime.current,
      handled: false,
    };
  }, [calculateVelocity]);

  // Long press detection
  const startLongPressDetection = useCallback((touchPoint: TouchPoint) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = window.setTimeout(() => {
      const gesture: GestureEvent = {
        type: 'long-press',
        touches: [touchPoint],
        startPosition: gestureStartPosition.current,
        currentPosition: { x: touchPoint.x, y: touchPoint.y },
        timestamp: Date.now(),
        duration: touchConfig.longPressTimeout,
        handled: false,
      };
      
      setCurrentGesture(gesture);
      emitGesture(gesture);
    }, touchConfig.longPressTimeout);
  }, [touchConfig.longPressTimeout]);

  const stopLongPressDetection = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Gesture emission
  const emitGesture = useCallback((gesture: GestureEvent) => {
    // Add to history
    setGestureHistory(prev => [...prev.slice(-49), gesture]); // Keep last 50 gestures
    
    // Notify listeners
    gestureListeners.current.forEach(listener => {
      try {
        listener(gesture);
      } catch (error) {
        console.error('Error in gesture listener:', error);
      }
    });
    
    // Check action mappings
    const mappings = touchActionMappings.current.filter(mapping => {
      if (mapping.gesture !== gesture.type) return false;
      
      if (mapping.conditions) {
        const { minTouches, maxTouches, direction, zone } = mapping.conditions;
        
        if (minTouches && gesture.touches.length < minTouches) return false;
        if (maxTouches && gesture.touches.length > maxTouches) return false;
        if (direction && gesture.direction !== direction) return false;
        
        if (zone && gesture.touches.length > 0) {
          const touchPoint = gesture.touches[0];
          const touchZone = getZoneForPoint(touchPoint);
          if (!touchZone || touchZone.name !== zone) return false;
        }
      }
      
      return true;
    });
    
    // Execute mapped actions
    mappings.forEach(mapping => {
      console.log(`Executing action: ${mapping.action} for gesture: ${gesture.type}`);
    });
  }, [getZoneForPoint]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (touchConfig.preventDefault) {
      event.preventDefault();
    }
    
    const now = Date.now();
    const newTouches = new Map(activeTouches);
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = getTouchPoint(touch);
      newTouches.set(touch.identifier, touchPoint);
      
      // Initialize gesture tracking for first touch
      if (newTouches.size === 1) {
        gestureStartTime.current = now;
        gestureStartPosition.current = { x: touchPoint.x, y: touchPoint.y };
        panStartPosition.current = { x: touchPoint.x, y: touchPoint.y };
        panCurrentPosition.current = { x: touchPoint.x, y: touchPoint.y };
        velocityTracker.current = [{ x: touchPoint.x, y: touchPoint.y, time: now }];
        
        startLongPressDetection(touchPoint);
      }
      
      // Initialize multi-touch gestures
      if (newTouches.size === 2 && touchConfig.enableMultiTouch) {
        const touches = Array.from(newTouches.values());
        initialPinchDistance.current = getDistance(touches[0], touches[1]);
        initialRotationAngle.current = getAngle(touches[0], touches[1]);
      }
    }
    
    setActiveTouches(newTouches);
    setIsGestureActive(true);
  }, [
    activeTouches,
    touchConfig.preventDefault,
    touchConfig.enableMultiTouch,
    getTouchPoint,
    startLongPressDetection,
    getDistance,
    getAngle,
  ]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (touchConfig.preventDefault) {
      event.preventDefault();
    }
    
    const now = Date.now();
    const newTouches = new Map(activeTouches);
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (newTouches.has(touch.identifier)) {
        const touchPoint = getTouchPoint(touch);
        newTouches.set(touch.identifier, touchPoint);
        
        // Update velocity tracking
        velocityTracker.current.push({ x: touchPoint.x, y: touchPoint.y, time: now });
        if (velocityTracker.current.length > 10) {
          velocityTracker.current = velocityTracker.current.slice(-10);
        }
        
        // Cancel long press if moved too much
        const moveDistance = getDistance(gestureStartPosition.current, touchPoint);
        if (moveDistance > touchConfig.tapThreshold) {
          stopLongPressDetection();
        }
        
        // Detect gestures based on number of touches
        const touches = Array.from(newTouches.values());
        let gesture: GestureEvent | null = null;
        
        if (touches.length === 1) {
          // Single touch gestures
          gesture = detectPan(touchPoint);
        } else if (touches.length === 2 && touchConfig.enableMultiTouch) {
          // Multi-touch gestures
          gesture = detectPinch(touches) || detectRotate(touches);
        }
        
        if (gesture) {
          setCurrentGesture(gesture);
          emitGesture(gesture);
        }
      }
    }
    
    setActiveTouches(newTouches);
  }, [
    activeTouches,
    touchConfig.preventDefault,
    touchConfig.enableMultiTouch,
    touchConfig.tapThreshold,
    getTouchPoint,
    getDistance,
    stopLongPressDetection,
    detectPan,
    detectPinch,
    detectRotate,
    emitGesture,
  ]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (touchConfig.preventDefault) {
      event.preventDefault();
    }
    
    const newTouches = new Map(activeTouches);
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = newTouches.get(touch.identifier);
      
      if (touchPoint) {
        // Detect end gestures
        let gesture: GestureEvent | null = null;
        
        if (newTouches.size === 1) {
          // Single touch end gestures
          gesture = detectTap(touchPoint) || detectSwipe(touchPoint);
        }
        
        if (gesture) {
          setCurrentGesture(gesture);
          emitGesture(gesture);
        }
        
        newTouches.delete(touch.identifier);
      }
    }
    
    // Clean up when all touches end
    if (newTouches.size === 0) {
      setIsGestureActive(false);
      setCurrentGesture(null);
      stopLongPressDetection();
      velocityTracker.current = [];
    }
    
    setActiveTouches(newTouches);
  }, [
    activeTouches,
    touchConfig.preventDefault,
    detectTap,
    detectSwipe,
    stopLongPressDetection,
    emitGesture,
  ]);

  const handleTouchCancel = useCallback((event: TouchEvent) => {
    if (touchConfig.preventDefault) {
      event.preventDefault();
    }
    
    // Reset all touch state
    setActiveTouches(new Map());
    setIsGestureActive(false);
    setCurrentGesture(null);
    stopLongPressDetection();
    velocityTracker.current = [];
  }, [touchConfig.preventDefault, stopLongPressDetection]);

  // Public API functions
  const addTouchZone = useCallback((zone: TouchZone) => {
    setTouchZones(prev => [...prev, zone]);
  }, []);

  const removeTouchZone = useCallback((zoneName: string) => {
    setTouchZones(prev => prev.filter(zone => zone.name !== zoneName));
  }, []);

  const addGestureListener = useCallback((listener: (event: GestureEvent) => void) => {
    gestureListeners.current.push(listener);
    return () => {
      const index = gestureListeners.current.indexOf(listener);
      if (index > -1) {
        gestureListeners.current.splice(index, 1);
      }
    };
  }, []);

  const addTouchActionMapping = useCallback((mapping: TouchActionMapping) => {
    touchActionMappings.current.push(mapping);
  }, []);

  const removeTouchActionMapping = useCallback((gesture: string, action: string) => {
    touchActionMappings.current = touchActionMappings.current.filter(
      mapping => !(mapping.gesture === gesture && mapping.action === action)
    );
  }, []);

  const clearTouchActionMappings = useCallback(() => {
    touchActionMappings.current = [];
  }, []);

  const enableTouch = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};
    
    element.addEventListener('touchstart', handleTouchStart, { passive: !touchConfig.preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !touchConfig.preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !touchConfig.preventDefault });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: !touchConfig.preventDefault });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    touchConfig.preventDefault,
  ]);

  const clearGestureHistory = useCallback(() => {
    setGestureHistory([]);
  }, []);

  const getGestureStats = useCallback(() => {
    const stats = gestureHistory.reduce((acc, gesture) => {
      acc[gesture.type] = (acc[gesture.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: gestureHistory.length,
      byType: stats,
      activeTouches: activeTouches.size,
      isActive: isGestureActive,
    };
  }, [gestureHistory, activeTouches.size, isGestureActive]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopLongPressDetection();
    };
  }, [stopLongPressDetection]);

  return {
    // State
    activeTouches: Array.from(activeTouches.values()),
    isGestureActive,
    currentGesture,
    touchZones,
    gestureHistory,
    
    // Configuration
    config: touchConfig,
    
    // Touch zone management
    addTouchZone,
    removeTouchZone,
    
    // Event handling
    addGestureListener,
    enableTouch,
    
    // Action mappings
    addTouchActionMapping,
    removeTouchActionMapping,
    clearTouchActionMappings,
    
    // Utilities
    clearGestureHistory,
    getGestureStats,
    isPointInZone,
    getZoneForPoint,
  };
};

export default useTouchManager;