/**
 * ========================================
 * PHASE 5.3: RENDER MANAGER
 * ========================================
 * 
 * Canvas and rendering coordination system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { WorldParameters, WorldBounds } from './WorldManager';

// ===== RENDER TYPES =====
export interface RenderContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  devicePixelRatio: number;
  
  // Calculated properties
  centerX: number;
  centerY: number;
  aspectRatio: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  
  // Camera behavior
  followTarget: boolean;
  targetX: number;
  targetY: number;
  smoothing: number;
  
  // Camera bounds
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZoom: number;
  maxZoom: number;
}

export interface RenderLayer {
  id: string;
  name: string;
  zIndex: number;
  visible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  
  // Layer transformations
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  
  // Performance
  cached: boolean;
  cacheCanvas?: HTMLCanvasElement;
  dirty: boolean;
}

export interface RenderStats {
  framesRendered: number;
  drawCalls: number;
  triangles: number;
  
  // Performance metrics
  renderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  
  // Memory usage
  canvasMemory: number;
  textureMemory: number;
  
  // Debug info
  visibleObjects: number;
  culledObjects: number;
}

export interface RenderConfig {
  // Canvas settings
  antialias: boolean;
  alpha: boolean;
  premultipliedAlpha: boolean;
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality: ImageSmoothingQuality;
  
  // Performance settings
  enableCulling: boolean;
  enableLayerCaching: boolean;
  maxDrawCalls: number;
  targetFPS: number;
  
  // Quality settings
  pixelRatio: 'auto' | number;
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  
  // Debug settings
  showDebugInfo: boolean;
  showBounds: boolean;
  showLayers: boolean;
  wireframe: boolean;
  
  // Background
  clearColor: string;
  backgroundPattern?: string;
}

export interface DrawCommand {
  type: 'clear' | 'rect' | 'circle' | 'path' | 'image' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  text?: string;
  font?: string;
  image?: HTMLImageElement | HTMLCanvasElement;
  path?: Path2D;
  layer: string;
  zIndex: number;
}

export interface RenderManagerReturn {
  // Render context
  renderContext: RenderContext;
  camera: Camera;
  layers: RenderLayer[];
  stats: RenderStats;
  config: RenderConfig;
  
  // Canvas management
  initializeCanvas: (canvas: HTMLCanvasElement) => boolean;
  resizeCanvas: (width: number, height: number) => void;
  clearCanvas: (color?: string) => void;
  getCanvas: () => HTMLCanvasElement | null;
  getContext: () => CanvasRenderingContext2D | null;
  
  // Camera controls
  setCameraPosition: (x: number, y: number) => void;
  setCameraZoom: (zoom: number) => void;
  setCameraTarget: (x: number, y: number, follow?: boolean) => void;
  updateCamera: (deltaTime: number) => void;
  resetCamera: () => void;
  
  // Coordinate transformations
  worldToScreen: (worldX: number, worldY: number) => { x: number; y: number };
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  applyTransform: () => void;
  resetTransform: () => void;
  
  // Layer management
  addLayer: (layer: Omit<RenderLayer, 'id'>) => string;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<RenderLayer>) => void;
  getLayer: (id: string) => RenderLayer | null;
  setLayerVisibility: (id: string, visible: boolean) => void;
  
  // Drawing operations
  queueDrawCommand: (command: DrawCommand) => void;
  executeDrawCommands: () => void;
  clearDrawQueue: () => void;
  
  // Direct drawing methods
  drawRect: (x: number, y: number, width: number, height: number, color: string, layer?: string) => void;
  drawCircle: (x: number, y: number, radius: number, color: string, layer?: string) => void;
  drawText: (text: string, x: number, y: number, font: string, color: string, layer?: string) => void;
  drawImage: (image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, layer?: string) => void;
  
  // Render pipeline
  startFrame: () => void;
  endFrame: () => void;
  render: (deltaTime: number) => void;
  
  // Performance
  updateStats: (deltaTime: number) => void;
  optimizePerformance: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<RenderConfig>) => void;
  setQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  getRenderInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_CAMERA: Camera = {
  x: 0,
  y: 0,
  zoom: 1.0,
  rotation: 0,
  followTarget: false,
  targetX: 0,
  targetY: 0,
  smoothing: 0.1,
  minX: -Infinity,
  maxX: Infinity,
  minY: -Infinity,
  maxY: Infinity,
  minZoom: 0.1,
  maxZoom: 5.0,
};

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  antialias: true,
  alpha: false,
  premultipliedAlpha: true,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  enableCulling: true,
  enableLayerCaching: false,
  maxDrawCalls: 1000,
  targetFPS: 60,
  pixelRatio: 'auto',
  resolution: 'high',
  showDebugInfo: false,
  showBounds: false,
  showLayers: false,
  wireframe: false,
  clearColor: '#87CEEB', // Sky blue
};

const DEFAULT_RENDER_STATS: RenderStats = {
  framesRendered: 0,
  drawCalls: 0,
  triangles: 0,
  renderTime: 0,
  averageRenderTime: 0,
  maxRenderTime: 0,
  canvasMemory: 0,
  textureMemory: 0,
  visibleObjects: 0,
  culledObjects: 0,
};

// ===== RENDER MANAGER HOOK =====
export const useRenderManager = (
  worldParams: WorldParameters,
  worldBounds: WorldBounds,
  initialConfig: Partial<RenderConfig> = {}
): RenderManagerReturn => {
  
  // State
  const [renderContext, setRenderContext] = useState<RenderContext>({
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    devicePixelRatio: 1,
    centerX: 0,
    centerY: 0,
    aspectRatio: 1,
  });
  
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [layers, setLayers] = useState<RenderLayer[]>([]);
  const [stats, setStats] = useState<RenderStats>(DEFAULT_RENDER_STATS);
  const [config, setConfig] = useState<RenderConfig>({ ...DEFAULT_RENDER_CONFIG, ...initialConfig });
  
  // Internal state
  const drawQueue = useRef<DrawCommand[]>([]);
  const layerIdCounter = useRef<number>(0);
  const renderStartTime = useRef<number>(0);
  const frameTimeHistory = useRef<number[]>([]);

  // ===== UTILITY FUNCTIONS =====
  const generateLayerId = useCallback((): string => {
    return `layer_${++layerIdCounter.current}`;
  }, []);

  const getPixelRatio = useCallback((): number => {
    if (config.pixelRatio === 'auto') {
      return window.devicePixelRatio || 1;
    }
    return typeof config.pixelRatio === 'number' ? config.pixelRatio : 1;
  }, [config.pixelRatio]);

  // ===== CANVAS MANAGEMENT =====
  const initializeCanvas = useCallback((canvas: HTMLCanvasElement): boolean => {
    try {
      const ctx = canvas.getContext('2d', {
        alpha: config.alpha,
        antialias: config.antialias,
        premultipliedAlpha: config.premultipliedAlpha,
      }) as CanvasRenderingContext2D;
      
      if (!ctx) {
        console.error('❌ Failed to get 2D context');
        return false;
      }
      
      // Configure context
      ctx.imageSmoothingEnabled = config.imageSmoothingEnabled;
      ctx.imageSmoothingQuality = config.imageSmoothingQuality;
      
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = getPixelRatio();
      
      setRenderContext({
        canvas,
        ctx,
        width: rect.width,
        height: rect.height,
        devicePixelRatio: pixelRatio,
        centerX: rect.width / 2,
        centerY: rect.height / 2,
        aspectRatio: rect.width / rect.height,
      });
      
      // Set canvas resolution
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Scale context to match device pixel ratio
      ctx.scale(pixelRatio, pixelRatio);
      
      console.log(`🎨 Canvas initialized: ${rect.width}×${rect.height} (${canvas.width}×${canvas.height})`);
      return true;
    } catch (error) {
      console.error('❌ Canvas initialization failed:', error);
      return false;
    }
  }, [config, getPixelRatio]);

  const resizeCanvas = useCallback((width: number, height: number) => {
    if (!renderContext.canvas || !renderContext.ctx) return;
    
    const pixelRatio = getPixelRatio();
    
    setRenderContext(prev => ({
      ...prev,
      width,
      height,
      centerX: width / 2,
      centerY: height / 2,
      aspectRatio: width / height,
    }));
    
    renderContext.canvas.width = width * pixelRatio;
    renderContext.canvas.height = height * pixelRatio;
    renderContext.canvas.style.width = width + 'px';
    renderContext.canvas.style.height = height + 'px';
    
    renderContext.ctx.scale(pixelRatio, pixelRatio);
    
    console.log(`🔄 Canvas resized: ${width}×${height}`);
  }, [renderContext, getPixelRatio]);

  const clearCanvas = useCallback((color?: string) => {
    if (!renderContext.ctx) return;
    
    const ctx = renderContext.ctx;
    const clearColor = color || config.clearColor;
    
    // Clear with background color
    ctx.save();
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, renderContext.width, renderContext.height);
    ctx.restore();
  }, [renderContext, config.clearColor]);

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    return renderContext.canvas;
  }, [renderContext.canvas]);

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    return renderContext.ctx;
  }, [renderContext.ctx]);

  // ===== CAMERA CONTROLS =====
  const setCameraPosition = useCallback((x: number, y: number) => {
    setCamera(prev => ({
      ...prev,
      x: Math.max(prev.minX, Math.min(prev.maxX, x)),
      y: Math.max(prev.minY, Math.min(prev.maxY, y)),
    }));
  }, []);

  const setCameraZoom = useCallback((zoom: number) => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(prev.minZoom, Math.min(prev.maxZoom, zoom)),
    }));
  }, []);

  const setCameraTarget = useCallback((x: number, y: number, follow: boolean = true) => {
    setCamera(prev => ({
      ...prev,
      targetX: x,
      targetY: y,
      followTarget: follow,
    }));
  }, []);

  const updateCamera = useCallback((deltaTime: number) => {
    if (!camera.followTarget) return;
    
    setCamera(prev => {
      const dx = prev.targetX - prev.x;
      const dy = prev.targetY - prev.y;
      
      const newX = prev.x + dx * prev.smoothing * deltaTime * 0.01;
      const newY = prev.y + dy * prev.smoothing * deltaTime * 0.01;
      
      return {
        ...prev,
        x: Math.max(prev.minX, Math.min(prev.maxX, newX)),
        y: Math.max(prev.minY, Math.min(prev.maxY, newY)),
      };
    });
  }, [camera.followTarget]);

  const resetCamera = useCallback(() => {
    setCamera(DEFAULT_CAMERA);
  }, []);

  // ===== COORDINATE TRANSFORMATIONS =====
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const screenX = (worldX - camera.x) * camera.zoom + renderContext.centerX;
    const screenY = (worldY - camera.y) * camera.zoom + renderContext.centerY;
    
    return { x: screenX, y: screenY };
  }, [camera, renderContext]);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const worldX = (screenX - renderContext.centerX) / camera.zoom + camera.x;
    const worldY = (screenY - renderContext.centerY) / camera.zoom + camera.y;
    
    return { x: worldX, y: worldY };
  }, [camera, renderContext]);

  const applyTransform = useCallback(() => {
    if (!renderContext.ctx) return;
    
    const ctx = renderContext.ctx;
    
    ctx.save();
    ctx.translate(renderContext.centerX, renderContext.centerY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation);
    ctx.translate(-camera.x, -camera.y);
  }, [renderContext, camera]);

  const resetTransform = useCallback(() => {
    if (!renderContext.ctx) return;
    
    renderContext.ctx.restore();
  }, [renderContext]);

  // ===== LAYER MANAGEMENT =====
  const addLayer = useCallback((layerData: Omit<RenderLayer, 'id'>): string => {
    const id = generateLayerId();
    const layer: RenderLayer = {
      id,
      ...layerData,
    };
    
    setLayers(prev => {
      const newLayers = [...prev, layer];
      return newLayers.sort((a, b) => a.zIndex - b.zIndex);
    });
    
    return id;
  }, [generateLayerId]);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<RenderLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  const getLayer = useCallback((id: string): RenderLayer | null => {
    return layers.find(layer => layer.id === id) || null;
  }, [layers]);

  const setLayerVisibility = useCallback((id: string, visible: boolean) => {
    updateLayer(id, { visible });
  }, [updateLayer]);

  // ===== DRAWING OPERATIONS =====
  const queueDrawCommand = useCallback((command: DrawCommand) => {
    drawQueue.current.push(command);
  }, []);

  const executeDrawCommands = useCallback(() => {
    if (!renderContext.ctx) return;
    
    const ctx = renderContext.ctx;
    
    // Sort by layer and zIndex
    const sortedCommands = [...drawQueue.current].sort((a, b) => {
      const layerA = layers.find(l => l.name === a.layer);
      const layerB = layers.find(l => l.name === b.layer);
      
      const zIndexA = (layerA?.zIndex || 0) * 1000 + a.zIndex;
      const zIndexB = (layerB?.zIndex || 0) * 1000 + b.zIndex;
      
      return zIndexA - zIndexB;
    });
    
    let drawCalls = 0;
    
    for (const command of sortedCommands) {
      if (drawCalls >= config.maxDrawCalls) break;
      
      const layer = layers.find(l => l.name === command.layer);
      if (layer && !layer.visible) continue;
      
      ctx.save();
      
      // Apply layer transformations
      if (layer) {
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.translate(layer.offsetX, layer.offsetY);
        ctx.scale(layer.scaleX, layer.scaleY);
      }
      
      // Execute draw command
      switch (command.type) {
        case 'clear':
          ctx.clearRect(command.x, command.y, command.width || renderContext.width, command.height || renderContext.height);
          break;
          
        case 'rect':
          if (command.color) {
            ctx.fillStyle = command.color;
            ctx.fillRect(command.x, command.y, command.width || 0, command.height || 0);
          }
          if (command.strokeColor && command.strokeWidth) {
            ctx.strokeStyle = command.strokeColor;
            ctx.lineWidth = command.strokeWidth;
            ctx.strokeRect(command.x, command.y, command.width || 0, command.height || 0);
          }
          break;
          
        case 'circle':
          ctx.beginPath();
          ctx.arc(command.x, command.y, command.radius || 0, 0, Math.PI * 2);
          if (command.color) {
            ctx.fillStyle = command.color;
            ctx.fill();
          }
          if (command.strokeColor && command.strokeWidth) {
            ctx.strokeStyle = command.strokeColor;
            ctx.lineWidth = command.strokeWidth;
            ctx.stroke();
          }
          break;
          
        case 'text':
          if (command.text && command.font && command.color) {
            ctx.font = command.font;
            ctx.fillStyle = command.color;
            ctx.fillText(command.text, command.x, command.y);
          }
          break;
          
        case 'image':
          if (command.image) {
            if (command.width && command.height) {
              ctx.drawImage(command.image, command.x, command.y, command.width, command.height);
            } else {
              ctx.drawImage(command.image, command.x, command.y);
            }
          }
          break;
      }
      
      ctx.restore();
      drawCalls++;
    }
    
    setStats(prev => ({ ...prev, drawCalls }));
  }, [renderContext, layers, config.maxDrawCalls]);

  const clearDrawQueue = useCallback(() => {
    drawQueue.current = [];
  }, []);

  // ===== DIRECT DRAWING METHODS =====
  const drawRect = useCallback((x: number, y: number, width: number, height: number, color: string, layer: string = 'default') => {
    queueDrawCommand({
      type: 'rect',
      x, y, width, height, color,
      layer,
      zIndex: 0,
    });
  }, [queueDrawCommand]);

  const drawCircle = useCallback((x: number, y: number, radius: number, color: string, layer: string = 'default') => {
    queueDrawCommand({
      type: 'circle',
      x, y, radius, color,
      layer,
      zIndex: 0,
    });
  }, [queueDrawCommand]);

  const drawText = useCallback((text: string, x: number, y: number, font: string, color: string, layer: string = 'default') => {
    queueDrawCommand({
      type: 'text',
      x, y, text, font, color,
      layer,
      zIndex: 0,
    });
  }, [queueDrawCommand]);

  const drawImage = useCallback((image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, layer: string = 'default') => {
    queueDrawCommand({
      type: 'image',
      x, y, width, height, image,
      layer,
      zIndex: 0,
    });
  }, [queueDrawCommand]);

  // ===== RENDER PIPELINE =====
  const startFrame = useCallback(() => {
    renderStartTime.current = performance.now();
    clearDrawQueue();
    setStats(prev => ({ 
      ...prev, 
      drawCalls: 0,
      visibleObjects: 0,
      culledObjects: 0,
    }));
  }, [clearDrawQueue]);

  const endFrame = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    frameTimeHistory.current.push(renderTime);
    if (frameTimeHistory.current.length > 60) {
      frameTimeHistory.current = frameTimeHistory.current.slice(-60);
    }
    
    const averageRenderTime = frameTimeHistory.current.reduce((a, b) => a + b, 0) / frameTimeHistory.current.length;
    
    setStats(prev => ({
      ...prev,
      framesRendered: prev.framesRendered + 1,
      renderTime,
      averageRenderTime,
      maxRenderTime: Math.max(prev.maxRenderTime, renderTime),
    }));
  }, []);

  const render = useCallback((deltaTime: number) => {
    if (!renderContext.ctx) return;
    
    startFrame();
    
    // Update camera
    updateCamera(deltaTime);
    
    // Clear canvas
    clearCanvas();
    
    // Apply camera transform
    applyTransform();
    
    // Execute all queued draw commands
    executeDrawCommands();
    
    // Reset transform
    resetTransform();
    
    // Draw debug info if enabled
    if (config.showDebugInfo) {
      renderContext.ctx.save();
      renderContext.ctx.fillStyle = 'white';
      renderContext.ctx.font = '12px monospace';
      renderContext.ctx.fillText(getRenderInfo(), 10, 20);
      renderContext.ctx.restore();
    }
    
    endFrame();
  }, [renderContext, updateCamera, clearCanvas, applyTransform, executeDrawCommands, resetTransform, config.showDebugInfo, startFrame, endFrame]);

  // ===== PERFORMANCE =====
  const updateStats = useCallback((_deltaTime: number) => {
    // Update memory estimates
    const canvasMemory = renderContext.width * renderContext.height * 4; // RGBA bytes
    
    setStats(prev => ({
      ...prev,
      canvasMemory,
    }));
  }, [renderContext]);

  const optimizePerformance = useCallback(() => {
    // Enable layer caching for static content
    if (stats.averageRenderTime > 16.67) { // > 60 FPS
      setConfig(prev => ({ ...prev, enableLayerCaching: true }));
    }
    
    // Reduce quality if performance is poor
    if (stats.averageRenderTime > 33.33) { // < 30 FPS
      setQuality('medium');
    }
  }, [stats.averageRenderTime]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<RenderConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const setQuality = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra') => {
    const qualitySettings: Record<string, Partial<RenderConfig>> = {
      low: {
        antialias: false,
        imageSmoothingEnabled: false,
        enableLayerCaching: true,
        maxDrawCalls: 300,
        resolution: 'low',
      },
      medium: {
        antialias: true,
        imageSmoothingEnabled: true,
        enableLayerCaching: false,
        maxDrawCalls: 500,
        resolution: 'medium',
      },
      high: {
        antialias: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        enableLayerCaching: false,
        maxDrawCalls: 800,
        resolution: 'high',
      },
      ultra: {
        antialias: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        enableLayerCaching: false,
        maxDrawCalls: 1000,
        resolution: 'ultra',
      },
    };
    
    updateConfig({ ...qualitySettings[quality], resolution: quality });
  }, [updateConfig]);

  const getRenderInfo = useCallback((): string => {
    return [
      `🎨 ${renderContext.width}×${renderContext.height}`,
      `📊 ${stats.drawCalls} draws`,
      `⏱️ ${stats.renderTime.toFixed(1)}ms`,
      `📹 ${stats.framesRendered} frames`,
      `📷 Cam: (${camera.x.toFixed(0)}, ${camera.y.toFixed(0)}) ${camera.zoom.toFixed(2)}x`,
    ].join(' | ');
  }, [renderContext, stats, camera]);

  // ===== INITIALIZE DEFAULT LAYERS =====
  useEffect(() => {
    // Add default layers
    addLayer({ name: 'background', zIndex: 0, visible: true, opacity: 1, blendMode: 'source-over', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, cached: false, dirty: true });
    addLayer({ name: 'game', zIndex: 5, visible: true, opacity: 1, blendMode: 'source-over', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, cached: false, dirty: true });
    addLayer({ name: 'ui', zIndex: 10, visible: true, opacity: 1, blendMode: 'source-over', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, cached: false, dirty: true });
    addLayer({ name: 'debug', zIndex: 15, visible: config.showDebugInfo, opacity: 1, blendMode: 'source-over', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, cached: false, dirty: true });
  }, []);

  return {
    renderContext,
    camera,
    layers,
    stats,
    config,
    initializeCanvas,
    resizeCanvas,
    clearCanvas,
    getCanvas,
    getContext,
    setCameraPosition,
    setCameraZoom,
    setCameraTarget,
    updateCamera,
    resetCamera,
    worldToScreen,
    screenToWorld,
    applyTransform,
    resetTransform,
    addLayer,
    removeLayer,
    updateLayer,
    getLayer,
    setLayerVisibility,
    queueDrawCommand,
    executeDrawCommands,
    clearDrawQueue,
    drawRect,
    drawCircle,
    drawText,
    drawImage,
    startFrame,
    endFrame,
    render,
    updateStats,
    optimizePerformance,
    updateConfig,
    setQuality,
    getRenderInfo,
  };
};

export default useRenderManager;