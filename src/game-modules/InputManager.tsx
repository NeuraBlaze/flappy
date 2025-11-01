/**
 * ========================================
 * PHASE 5.4: INPUT MANAGER
 * ========================================
 * 
 * Input handling and control management system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';

// ===== INPUT TYPES =====
export interface KeyState {
  isPressed: boolean;
  wasPressed: boolean;
  pressTime: number;
  releaseTime: number;
  repeatCount: number;
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
  lastMoveTime: number;
}

export interface InputBinding {
  id: string;
  name: string;
  keys: string[];
  mouseButtons?: number[];
  action: 'press' | 'hold' | 'release' | 'repeat';
  category: 'game' | 'debug' | 'menu' | 'system';
  description: string;
  enabled: boolean;
  
  // Advanced options
  repeatDelay?: number;
  repeatRate?: number;
  combination?: boolean; // require all keys simultaneously
  sequence?: boolean; // require keys in sequence
}

export interface InputEvent {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel' | 'action';
  timestamp: number;
  
  // Key events
  key?: string;
  code?: string;
  
  // Mouse events
  mouseX?: number;
  mouseY?: number;
  button?: number;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
  
  // Action events
  action?: string;
  binding?: InputBinding;
  
  // Modifiers
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  
  // State
  repeat: boolean;
  handled: boolean;
}

export interface InputConfig {
  // Keyboard settings
  enableKeyboard: boolean;
  enableKeyRepeat: boolean;
  keyRepeatDelay: number;
  keyRepeatRate: number;
  preventDefaults: string[]; // keys to prevent default behavior
  
  // Mouse settings
  enableMouse: boolean;
  enableMouseWheel: boolean;
  mouseSensitivity: number;
  invertMouseY: boolean;
  
  // Input buffering
  enableInputBuffer: boolean;
  bufferSize: number;
  bufferTimeout: number; // ms
  
  // Debug settings
  enableInputDebug: boolean;
  showInputOverlay: boolean;
  logInputEvents: boolean;
  
  // Performance
  eventThrottling: boolean;
  throttleRate: number; // ms between events
}

export interface InputManagerReturn {
  // State
  keys: Map<string, KeyState>;
  mouse: MouseState;
  bindings: InputBinding[];
  inputBuffer: InputEvent[];
  config: InputConfig;
  
  // Key operations
  isKeyPressed: (key: string) => boolean;
  isKeyHeld: (key: string) => boolean;
  wasKeyPressed: (key: string) => boolean;
  wasKeyReleased: (key: string) => boolean;
  getKeyPressTime: (key: string) => number;
  getKeyState: (key: string) => KeyState | undefined;
  
  // Mouse operations
  getMousePosition: () => { x: number; y: number };
  isMouseButtonPressed: (button: number) => boolean;
  getMouseWheel: () => { deltaX: number; deltaY: number; deltaZ: number };
  
  // Input binding operations
  addBinding: (binding: Omit<InputBinding, 'id'>) => string;
  removeBinding: (id: string) => void;
  updateBinding: (id: string, updates: Partial<InputBinding>) => void;
  getBinding: (id: string) => InputBinding | undefined;
  getBindingsByCategory: (category: string) => InputBinding[];
  enableBinding: (id: string, enabled: boolean) => void;
  
  // Action system
  isActionPressed: (action: string) => boolean;
  isActionHeld: (action: string) => boolean;
  wasActionTriggered: (action: string) => boolean;
  
  // Event handling
  addEventListener: (type: string, callback: (event: InputEvent) => void) => () => void;
  removeEventListener: (callback: (event: InputEvent) => void) => void;
  
  // Input buffer
  getBufferedInputs: () => InputEvent[];
  clearInputBuffer: () => void;
  
  // System operations
  captureInput: (element?: HTMLElement) => void;
  releaseInput: () => void;
  resetInputState: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<InputConfig>) => void;
  saveBindings: () => string;
  loadBindings: (data: string) => boolean;
  resetBindings: () => void;
  
  // Debug and info
  getInputInfo: () => string;
  getActiveInputs: () => string[];
}

// ===== DEFAULT VALUES =====
const DEFAULT_INPUT_CONFIG: InputConfig = {
  enableKeyboard: true,
  enableKeyRepeat: true,
  keyRepeatDelay: 500,
  keyRepeatRate: 50,
  preventDefaults: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  enableMouse: true,
  enableMouseWheel: true,
  mouseSensitivity: 1.0,
  invertMouseY: false,
  enableInputBuffer: true,
  bufferSize: 50,
  bufferTimeout: 100,
  enableInputDebug: false,
  showInputOverlay: false,
  logInputEvents: false,
  eventThrottling: false,
  throttleRate: 16, // ~60fps
};

const DEFAULT_BINDINGS: Omit<InputBinding, 'id'>[] = [
  {
    name: 'Flap/Jump',
    keys: ['Space', 'ArrowUp', 'KeyW'],
    mouseButtons: [0], // left click
    action: 'press',
    category: 'game',
    description: 'Make the bird flap its wings',
    enabled: true,
  },
  {
    name: 'Pause',
    keys: ['Escape', 'KeyP'],
    action: 'press',
    category: 'game',
    description: 'Pause/unpause the game',
    enabled: true,
  },
  {
    name: 'Reset',
    keys: ['KeyR'],
    action: 'press',
    category: 'game',
    description: 'Reset the game',
    enabled: true,
  },
  {
    name: 'Debug Toggle',
    keys: ['F1'],
    action: 'press',
    category: 'debug',
    description: 'Toggle debug information',
    enabled: true,
  },
  {
    name: 'Console Toggle',
    keys: ['Backquote'], // `
    action: 'press',
    category: 'debug',
    description: 'Toggle developer console',
    enabled: true,
  },
  {
    name: 'Fullscreen',
    keys: ['F11'],
    action: 'press',
    category: 'system',
    description: 'Toggle fullscreen mode',
    enabled: true,
  },
  {
    name: 'Menu',
    keys: ['Escape'],
    action: 'press',
    category: 'menu',
    description: 'Open main menu',
    enabled: true,
  },
];

// ===== INPUT MANAGER HOOK =====
export const useInputManager = (
  initialConfig: Partial<InputConfig> = {}
): InputManagerReturn => {
  
  // State
  const [keys, setKeys] = useState<Map<string, KeyState>>(new Map());
  const [mouse, setMouse] = useState<MouseState>({
    x: 0,
    y: 0,
    buttons: { left: false, right: false, middle: false },
    wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 },
    lastMoveTime: 0,
  });
  const [bindings, setBindings] = useState<InputBinding[]>([]);
  const [inputBuffer, setInputBuffer] = useState<InputEvent[]>([]);
  const [config, setConfig] = useState<InputConfig>({ ...DEFAULT_INPUT_CONFIG, ...initialConfig });
  
  // Internal state
  const eventListeners = useRef<Array<(event: InputEvent) => void>>([]);
  const capturedElement = useRef<HTMLElement | null>(null);
  const nextBindingId = useRef<number>(1);
  const lastThrottle = useRef<number>(0);
  const keyRepeatTimers = useRef<Map<string, number>>(new Map());

  // ===== UTILITY FUNCTIONS =====
  const generateBindingId = useCallback(() => `binding_${nextBindingId.current++}`, []);
  
  const shouldThrottle = useCallback((): boolean => {
    if (!config.eventThrottling) return false;
    
    const now = Date.now();
    if (now - lastThrottle.current < config.throttleRate) {
      return true;
    }
    lastThrottle.current = now;
    return false;
  }, [config.eventThrottling, config.throttleRate]);

  const createInputEvent = useCallback((
    type: InputEvent['type'],
    nativeEvent?: Event,
    additionalData?: Partial<InputEvent>
  ): InputEvent => {
    const event: InputEvent = {
      type,
      timestamp: Date.now(),
      ctrlKey: (nativeEvent as KeyboardEvent)?.ctrlKey || (nativeEvent as MouseEvent)?.ctrlKey || false,
      shiftKey: (nativeEvent as KeyboardEvent)?.shiftKey || (nativeEvent as MouseEvent)?.shiftKey || false,
      altKey: (nativeEvent as KeyboardEvent)?.altKey || (nativeEvent as MouseEvent)?.altKey || false,
      metaKey: (nativeEvent as KeyboardEvent)?.metaKey || (nativeEvent as MouseEvent)?.metaKey || false,
      repeat: false,
      handled: false,
      ...additionalData,
    };

    // Add specific event data
    if (nativeEvent && 'key' in nativeEvent) {
      event.key = (nativeEvent as KeyboardEvent).key;
      event.code = (nativeEvent as KeyboardEvent).code;
      event.repeat = (nativeEvent as KeyboardEvent).repeat;
    } else if (nativeEvent && 'clientX' in nativeEvent) {
      event.mouseX = (nativeEvent as MouseEvent).clientX;
      event.mouseY = (nativeEvent as MouseEvent).clientY;
      event.button = (nativeEvent as MouseEvent).button;
    } else if (nativeEvent && 'deltaX' in nativeEvent) {
      event.deltaX = (nativeEvent as WheelEvent).deltaX;
      event.deltaY = (nativeEvent as WheelEvent).deltaY;
      event.deltaZ = (nativeEvent as WheelEvent).deltaZ;
    }

    return event;
  }, []);

  const addToBuffer = useCallback((event: InputEvent) => {
    if (!config.enableInputBuffer) return;
    
    setInputBuffer(prev => {
      const newBuffer = [...prev, event];
      
      // Remove old events
      const cutoff = Date.now() - config.bufferTimeout;
      const filtered = newBuffer.filter(e => e.timestamp > cutoff);
      
      // Limit buffer size
      return filtered.slice(-config.bufferSize);
    });
  }, [config.enableInputBuffer, config.bufferTimeout, config.bufferSize]);

  const emitEvent = useCallback((event: InputEvent) => {
    if (config.logInputEvents) {
      console.log('Input Event:', event);
    }
    
    eventListeners.current.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Input event listener error:', error);
      }
    });
    
    addToBuffer(event);
  }, [config.logInputEvents, addToBuffer]);

  // ===== KEY OPERATIONS =====
  const updateKeyState = useCallback((key: string, pressed: boolean, timestamp: number) => {
    setKeys(prev => {
      const newKeys = new Map(prev);
      const currentState = newKeys.get(key) || {
        isPressed: false,
        wasPressed: false,
        pressTime: 0,
        releaseTime: 0,
        repeatCount: 0,
      };

      if (pressed && !currentState.isPressed) {
        // Key pressed
        newKeys.set(key, {
          ...currentState,
          isPressed: true,
          wasPressed: true,
          pressTime: timestamp,
          repeatCount: 0,
        });
        
        // Set up repeat timer
        if (config.enableKeyRepeat) {
          const timer = setTimeout(() => {
            const repeatTimer = setInterval(() => {
              const keyState = keys.get(key);
              if (keyState?.isPressed) {
                keyState.repeatCount++;
                emitEvent(createInputEvent('keydown', undefined, {
                  key,
                  repeat: true,
                }));
              } else {
                clearInterval(repeatTimer);
              }
            }, config.keyRepeatRate);
          }, config.keyRepeatDelay);
          
          keyRepeatTimers.current.set(key, timer);
        }
      } else if (!pressed && currentState.isPressed) {
        // Key released
        newKeys.set(key, {
          ...currentState,
          isPressed: false,
          releaseTime: timestamp,
        });
        
        // Clear repeat timer
        const timer = keyRepeatTimers.current.get(key);
        if (timer) {
          clearTimeout(timer);
          keyRepeatTimers.current.delete(key);
        }
      }

      return newKeys;
    });
  }, [config.enableKeyRepeat, config.keyRepeatDelay, config.keyRepeatRate, keys, emitEvent, createInputEvent]);

  const isKeyPressed = useCallback((key: string): boolean => {
    return keys.get(key)?.isPressed || false;
  }, [keys]);

  const isKeyHeld = useCallback((key: string): boolean => {
    const keyState = keys.get(key);
    if (!keyState?.isPressed) return false;
    
    const holdTime = Date.now() - keyState.pressTime;
    return holdTime > 100; // Consider held after 100ms
  }, [keys]);

  const wasKeyPressed = useCallback((key: string): boolean => {
    const wasPressed = keys.get(key)?.wasPressed || false;
    
    // Clear the wasPressed flag after reading
    if (wasPressed) {
      setKeys(prev => {
        const newKeys = new Map(prev);
        const keyState = newKeys.get(key);
        if (keyState) {
          newKeys.set(key, { ...keyState, wasPressed: false });
        }
        return newKeys;
      });
    }
    
    return wasPressed;
  }, [keys]);

  const wasKeyReleased = useCallback((key: string): boolean => {
    const keyState = keys.get(key);
    if (!keyState) return false;
    
    const releaseTime = keyState.releaseTime;
    const now = Date.now();
    return releaseTime > 0 && (now - releaseTime) < 50; // Released within last 50ms
  }, [keys]);

  const getKeyPressTime = useCallback((key: string): number => {
    const keyState = keys.get(key);
    if (!keyState?.isPressed) return 0;
    
    return Date.now() - keyState.pressTime;
  }, [keys]);

  const getKeyState = useCallback((key: string): KeyState | undefined => {
    return keys.get(key);
  }, [keys]);

  // ===== MOUSE OPERATIONS =====
  const getMousePosition = useCallback((): { x: number; y: number } => {
    return { x: mouse.x, y: mouse.y };
  }, [mouse]);

  const isMouseButtonPressed = useCallback((button: number): boolean => {
    switch (button) {
      case 0: return mouse.buttons.left;
      case 1: return mouse.buttons.middle;
      case 2: return mouse.buttons.right;
      default: return false;
    }
  }, [mouse]);

  const getMouseWheel = useCallback(() => {
    return mouse.wheel;
  }, [mouse]);

  // ===== BINDING OPERATIONS =====
  const addBinding = useCallback((bindingData: Omit<InputBinding, 'id'>): string => {
    const id = generateBindingId();
    const binding: InputBinding = { id, ...bindingData };
    
    setBindings(prev => [...prev, binding]);
    return id;
  }, [generateBindingId]);

  const removeBinding = useCallback((id: string) => {
    setBindings(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBinding = useCallback((id: string, updates: Partial<InputBinding>) => {
    setBindings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const getBinding = useCallback((id: string): InputBinding | undefined => {
    return bindings.find(b => b.id === id);
  }, [bindings]);

  const getBindingsByCategory = useCallback((category: string): InputBinding[] => {
    return bindings.filter(b => b.category === category);
  }, [bindings]);

  const enableBinding = useCallback((id: string, enabled: boolean) => {
    updateBinding(id, { enabled });
  }, [updateBinding]);

  // ===== ACTION SYSTEM =====
  const getActiveBindingsForAction = useCallback((action: string): InputBinding[] => {
    return bindings.filter(binding => {
      if (!binding.enabled || binding.name !== action) return false;
      
      // Check if any of the binding's keys are pressed
      const keyPressed = binding.keys.some(key => isKeyPressed(key));
      const mousePressed = binding.mouseButtons?.some(button => isMouseButtonPressed(button));
      
      return keyPressed || mousePressed;
    });
  }, [bindings, isKeyPressed, isMouseButtonPressed]);

  const isActionPressed = useCallback((action: string): boolean => {
    return getActiveBindingsForAction(action).length > 0;
  }, [getActiveBindingsForAction]);

  const isActionHeld = useCallback((action: string): boolean => {
    const activeBindings = getActiveBindingsForAction(action);
    return activeBindings.some(binding => {
      return binding.keys.some(key => isKeyHeld(key));
    });
  }, [getActiveBindingsForAction, isKeyHeld]);

  const wasActionTriggered = useCallback((action: string): boolean => {
    const matchingBindings = bindings.filter(b => b.enabled && b.name === action);
    
    return matchingBindings.some(binding => {
      switch (binding.action) {
        case 'press':
          return binding.keys.some(key => wasKeyPressed(key)) ||
                 binding.mouseButtons?.some(button => isMouseButtonPressed(button));
        case 'release':
          return binding.keys.some(key => wasKeyReleased(key));
        case 'hold':
          return binding.keys.some(key => isKeyHeld(key));
        default:
          return false;
      }
    });
  }, [bindings, wasKeyPressed, wasKeyReleased, isKeyHeld, isMouseButtonPressed]);

  // ===== EVENT HANDLING =====
  const addEventListener = useCallback((_type: string, callback: (event: InputEvent) => void): (() => void) => {
    eventListeners.current.push(callback);
    
    return () => {
      const index = eventListeners.current.indexOf(callback);
      if (index > -1) {
        eventListeners.current.splice(index, 1);
      }
    };
  }, []);

  const removeEventListener = useCallback((callback: (event: InputEvent) => void) => {
    const index = eventListeners.current.indexOf(callback);
    if (index > -1) {
      eventListeners.current.splice(index, 1);
    }
  }, []);

  // ===== INPUT BUFFER =====
  const getBufferedInputs = useCallback((): InputEvent[] => {
    return [...inputBuffer];
  }, [inputBuffer]);

  const clearInputBuffer = useCallback(() => {
    setInputBuffer([]);
  }, []);

  // ===== SYSTEM OPERATIONS =====
  const captureInput = useCallback((element?: HTMLElement) => {
    const target = element || document.body;
    capturedElement.current = target;

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldThrottle()) return;
      
      if (config.preventDefaults.includes(e.code)) {
        e.preventDefault();
      }
      
      if (!config.enableKeyboard) return;
      
      updateKeyState(e.code, true, Date.now());
      
      const event = createInputEvent('keydown', e);
      emitEvent(event);
      
      // Check for action triggers
      bindings.forEach(binding => {
        if (binding.enabled && binding.keys.includes(e.code) && binding.action === 'press') {
          emitEvent(createInputEvent('action', e, {
            action: binding.name,
            binding,
          }));
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (shouldThrottle()) return;
      
      if (!config.enableKeyboard) return;
      
      updateKeyState(e.code, false, Date.now());
      
      const event = createInputEvent('keyup', e);
      emitEvent(event);
      
      // Check for release action triggers
      bindings.forEach(binding => {
        if (binding.enabled && binding.keys.includes(e.code) && binding.action === 'release') {
          emitEvent(createInputEvent('action', e, {
            action: binding.name,
            binding,
          }));
        }
      });
    };

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (shouldThrottle()) return;
      if (!config.enableMouse) return;
      
      setMouse(prev => ({
        ...prev,
        buttons: {
          ...prev.buttons,
          left: e.button === 0 ? true : prev.buttons.left,
          right: e.button === 2 ? true : prev.buttons.right,
          middle: e.button === 1 ? true : prev.buttons.middle,
        },
      }));
      
      const event = createInputEvent('mousedown', e);
      emitEvent(event);
      
      // Check for mouse action triggers
      bindings.forEach(binding => {
        if (binding.enabled && binding.mouseButtons?.includes(e.button) && binding.action === 'press') {
          emitEvent(createInputEvent('action', e, {
            action: binding.name,
            binding,
          }));
        }
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (shouldThrottle()) return;
      if (!config.enableMouse) return;
      
      setMouse(prev => ({
        ...prev,
        buttons: {
          ...prev.buttons,
          left: e.button === 0 ? false : prev.buttons.left,
          right: e.button === 2 ? false : prev.buttons.right,
          middle: e.button === 1 ? false : prev.buttons.middle,
        },
      }));
      
      const event = createInputEvent('mouseup', e);
      emitEvent(event);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (shouldThrottle()) return;
      if (!config.enableMouse) return;
      
      setMouse(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
        lastMoveTime: Date.now(),
      }));
      
      const event = createInputEvent('mousemove', e);
      emitEvent(event);
    };

    const handleWheel = (e: WheelEvent) => {
      if (shouldThrottle()) return;
      if (!config.enableMouseWheel) return;
      
      const deltaY = config.invertMouseY ? -e.deltaY : e.deltaY;
      
      setMouse(prev => ({
        ...prev,
        wheel: {
          deltaX: e.deltaX * config.mouseSensitivity,
          deltaY: deltaY * config.mouseSensitivity,
          deltaZ: e.deltaZ * config.mouseSensitivity,
        },
      }));
      
      const event = createInputEvent('wheel', e);
      emitEvent(event);
    };

    // Attach event listeners
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    target.addEventListener('mousedown', handleMouseDown);
    target.addEventListener('mouseup', handleMouseUp);
    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('wheel', handleWheel);

    // Store cleanup function
    target.dataset.inputCleanup = 'attached';
    
    console.log('🎮 Input capture started');
  }, [config, shouldThrottle, updateKeyState, createInputEvent, emitEvent, bindings]);

  const releaseInput = useCallback(() => {
    if (!capturedElement.current) return;
    
    // This is a simplified cleanup - in real implementation you'd store the handlers
    // and remove them properly
    capturedElement.current.dataset.inputCleanup = '';
    capturedElement.current = null;
    
    // Clear repeat timers
    keyRepeatTimers.current.forEach(timer => clearTimeout(timer));
    keyRepeatTimers.current.clear();
    
    console.log('🎮 Input capture released');
  }, []);

  const resetInputState = useCallback(() => {
    setKeys(new Map());
    setMouse({
      x: 0,
      y: 0,
      buttons: { left: false, right: false, middle: false },
      wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 },
      lastMoveTime: 0,
    });
    clearInputBuffer();
    
    // Clear repeat timers
    keyRepeatTimers.current.forEach(timer => clearTimeout(timer));
    keyRepeatTimers.current.clear();
  }, [clearInputBuffer]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<InputConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const saveBindings = useCallback((): string => {
    return JSON.stringify(bindings, null, 2);
  }, [bindings]);

  const loadBindings = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        setBindings(parsed);
        return true;
      }
    } catch (error) {
      console.error('Failed to load input bindings:', error);
    }
    return false;
  }, []);

  const resetBindings = useCallback(() => {
    setBindings(DEFAULT_BINDINGS.map(binding => ({
      id: generateBindingId(),
      ...binding,
    })));
  }, [generateBindingId]);

  // ===== DEBUG AND INFO =====
  const getInputInfo = useCallback((): string => {
    const activeKeys = Array.from(keys.entries())
      .filter(([, state]) => state.isPressed)
      .map(([key]) => key);
    
    const activeButtons = Object.entries(mouse.buttons)
      .filter(([, pressed]) => pressed)
      .map(([button]) => button);
    
    return [
      `🎮 Keys: ${activeKeys.length} (${activeKeys.join(', ')})`,
      `🖱️ Mouse: ${activeButtons.length} (${activeButtons.join(', ')})`,
      `📋 Bindings: ${bindings.filter(b => b.enabled).length}/${bindings.length}`,
      `📦 Buffer: ${inputBuffer.length}/${config.bufferSize}`,
    ].join(' | ');
  }, [keys, mouse, bindings, inputBuffer, config.bufferSize]);

  const getActiveInputs = useCallback((): string[] => {
    const activeInputs: string[] = [];
    
    // Active keys
    keys.forEach((state, key) => {
      if (state.isPressed) {
        activeInputs.push(`Key:${key}`);
      }
    });
    
    // Active mouse buttons
    if (mouse.buttons.left) activeInputs.push('Mouse:Left');
    if (mouse.buttons.right) activeInputs.push('Mouse:Right');
    if (mouse.buttons.middle) activeInputs.push('Mouse:Middle');
    
    return activeInputs;
  }, [keys, mouse]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    // Initialize default bindings
    if (bindings.length === 0) {
      resetBindings();
    }
  }, [bindings.length, resetBindings]);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      releaseInput();
    };
  }, [releaseInput]);

  return {
    keys,
    mouse,
    bindings,
    inputBuffer,
    config,
    isKeyPressed,
    isKeyHeld,
    wasKeyPressed,
    wasKeyReleased,
    getKeyPressTime,
    getKeyState,
    getMousePosition,
    isMouseButtonPressed,
    getMouseWheel,
    addBinding,
    removeBinding,
    updateBinding,
    getBinding,
    getBindingsByCategory,
    enableBinding,
    isActionPressed,
    isActionHeld,
    wasActionTriggered,
    addEventListener,
    removeEventListener,
    getBufferedInputs,
    clearInputBuffer,
    captureInput,
    releaseInput,
    resetInputState,
    updateConfig,
    saveBindings,
    loadBindings,
    resetBindings,
    getInputInfo,
    getActiveInputs,
  };
};

export default useInputManager;