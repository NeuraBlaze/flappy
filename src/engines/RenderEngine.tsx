/**
 * ========================================
 * PHASE 1: CORE SYSTEM COMPONENTS
 * ========================================
 * 
 * RenderEngine.tsx - Canvas renderelés és optimalizáció
 * 
 * FUNKCIÓK:
 * - Canvas setup és kezelés
 * - Pixel-perfect renderelés
 * - DPR (Device Pixel Ratio) kezelés
 * - Performance optimalizáció
 * - Viewport és scaling
 */

import { useRef, useCallback } from 'react';

// ===== 🖼️ RENDER CONFIGURATION =====
export interface RenderConfig {
  pixelPerfect: boolean;
  devicePixelRatio: number;
  smoothing: boolean;
  antialias: boolean;
  alpha: boolean;
  preserveDrawingBuffer: boolean;
}

export interface ViewportData {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasData {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

// ===== 🎨 RENDER ENGINE HOOK =====
export const useRenderEngine = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const configRef = useRef<RenderConfig>({
    pixelPerfect: true,
    devicePixelRatio: window.devicePixelRatio || 1,
    smoothing: false,
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: false
  });

  const viewportRef = useRef<ViewportData>({
    width: 320,
    height: 480,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  // ===== 🖥️ CANVAS SETUP =====
  
  /**
   * Canvas inicializálás
   */
  const initializeCanvas = useCallback((canvas: HTMLCanvasElement, worldWidth: number, worldHeight: number) => {
    canvasRef.current = canvas;
    
    // Context megszerzése
    const context = canvas.getContext('2d', {
      alpha: configRef.current.alpha,
      antialias: configRef.current.antialias,
      preserveDrawingBuffer: configRef.current.preserveDrawingBuffer
    }) as CanvasRenderingContext2D;

    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }

    contextRef.current = context;

    // DPR beállítás
    const dpr = configRef.current.devicePixelRatio;
    
    // Canvas méret beállítás
    const container = canvas.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const aspectRatio = worldWidth / worldHeight;
      
      let displayWidth = containerRect.width;
      let displayHeight = containerRect.height;
      
      // Aspect ratio megtartása
      if (displayWidth / displayHeight > aspectRatio) {
        displayWidth = displayHeight * aspectRatio;
      } else {
        displayHeight = displayWidth / aspectRatio;
      }
      
      // Canvas display méret
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      
      // Canvas tényleges méret (DPR-rel szorozva)
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Viewport update
      const scale = displayWidth / worldWidth;
      viewportRef.current = {
        width: displayWidth,
        height: displayHeight,
        scale,
        offsetX: (containerRect.width - displayWidth) / 2,
        offsetY: (containerRect.height - displayHeight) / 2
      };
    }

    // Context beállítások
    setupCanvasContext(context, dpr);
    
    return {
      canvas,
      context,
      width: canvas.width,
      height: canvas.height,
      dpr
    };
  }, []);

  /**
   * Canvas context konfigurálás
   */
  const setupCanvasContext = useCallback((context: CanvasRenderingContext2D, dpr: number) => {
    // DPR scaling
    context.scale(dpr, dpr);
    
    // Pixel-perfect renderelés
    if (configRef.current.pixelPerfect) {
      context.imageSmoothingEnabled = false;
      (context as any).webkitImageSmoothingEnabled = false;
      (context as any).mozImageSmoothingEnabled = false;
      (context as any).msImageSmoothingEnabled = false;
    } else {
      context.imageSmoothingEnabled = configRef.current.smoothing;
    }
    
    // Text renderelés optimalizáció
    context.textBaseline = 'top';
    context.textAlign = 'left';
  }, []);

  // ===== 🎯 COORDINATE TRANSFORMATION =====
  
  /**
   * Világ koordináták átalakítása képernyő koordinátákra
   */
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const viewport = viewportRef.current;
    return {
      x: worldX * viewport.scale,
      y: worldY * viewport.scale
    };
  }, []);

  /**
   * Képernyő koordináták átalakítása világ koordinátákra
   */
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const viewport = viewportRef.current;
    return {
      x: screenX / viewport.scale,
      y: screenY / viewport.scale
    };
  }, []);

  // ===== 🎨 DRAWING UTILITIES =====
  
  /**
   * Canvas törlése
   */
  const clearCanvas = useCallback((color: string = 'transparent') => {
    const context = contextRef.current;
    const viewport = viewportRef.current;
    if (!context) return;

    if (color === 'transparent') {
      context.clearRect(0, 0, viewport.width, viewport.height);
    } else {
      context.fillStyle = color;
      context.fillRect(0, 0, viewport.width, viewport.height);
    }
  }, []);

  /**
   * Kör rajzolás világ koordinátákban
   */
  const drawCircle = useCallback((
    worldX: number, 
    worldY: number, 
    radius: number, 
    fillColor?: string, 
    strokeColor?: string,
    strokeWidth: number = 1
  ) => {
    const context = contextRef.current;
    if (!context) return;

    const screen = worldToScreen(worldX, worldY);
    const scaledRadius = radius * viewportRef.current.scale;

    context.beginPath();
    context.arc(screen.x, screen.y, scaledRadius, 0, Math.PI * 2);
    
    if (fillColor) {
      context.fillStyle = fillColor;
      context.fill();
    }
    
    if (strokeColor) {
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }, [worldToScreen]);

  /**
   * Téglalap rajzolás világ koordinátákban
   */
  const drawRect = useCallback((
    worldX: number, 
    worldY: number, 
    width: number, 
    height: number, 
    fillColor?: string, 
    strokeColor?: string,
    strokeWidth: number = 1
  ) => {
    const context = contextRef.current;
    if (!context) return;

    const screen = worldToScreen(worldX, worldY);
    const scaledWidth = width * viewportRef.current.scale;
    const scaledHeight = height * viewportRef.current.scale;

    if (fillColor) {
      context.fillStyle = fillColor;
      context.fillRect(screen.x, screen.y, scaledWidth, scaledHeight);
    }
    
    if (strokeColor) {
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      context.strokeRect(screen.x, screen.y, scaledWidth, scaledHeight);
    }
  }, [worldToScreen]);

  /**
   * Szöveg rajzolás világ koordinátákban
   */
  const drawText = useCallback((
    text: string,
    worldX: number,
    worldY: number,
    font: string = '16px Arial',
    fillColor: string = 'black',
    strokeColor?: string,
    strokeWidth: number = 1
  ) => {
    const context = contextRef.current;
    if (!context) return;

    const screen = worldToScreen(worldX, worldY);
    
    context.font = font;
    
    if (strokeColor) {
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      context.strokeText(text, screen.x, screen.y);
    }
    
    context.fillStyle = fillColor;
    context.fillText(text, screen.x, screen.y);
  }, [worldToScreen]);

  /**
   * Gradient létrehozás
   */
  const createLinearGradient = useCallback((
    x1: number, y1: number, 
    x2: number, y2: number,
    colorStops: Array<{offset: number, color: string}>
  ) => {
    const context = contextRef.current;
    if (!context) return null;

    const screen1 = worldToScreen(x1, y1);
    const screen2 = worldToScreen(x2, y2);
    
    const gradient = context.createLinearGradient(screen1.x, screen1.y, screen2.x, screen2.y);
    
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    
    return gradient;
  }, [worldToScreen]);

  // ===== 📏 VIEWPORT MANAGEMENT =====
  
  /**
   * Viewport resize kezelés
   */
  const handleResize = useCallback((worldWidth: number, worldHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    initializeCanvas(canvas, worldWidth, worldHeight);
  }, [initializeCanvas]);

  /**
   * Viewport adatok lekérése
   */
  const getViewport = useCallback(() => viewportRef.current, []);

  /**
   * Canvas adatok lekérése
   */
  const getCanvasData = useCallback((): CanvasData | null => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (!canvas || !context) return null;
    
    return {
      canvas,
      context,
      width: canvas.width,
      height: canvas.height,
      dpr: configRef.current.devicePixelRatio
    };
  }, []);

  // ===== ⚙️ CONFIGURATION =====
  
  const updateRenderConfig = useCallback((newConfig: Partial<RenderConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
    
    // Context újrakonfigurálás ha szükséges
    const context = contextRef.current;
    if (context) {
      setupCanvasContext(context, configRef.current.devicePixelRatio);
    }
  }, [setupCanvasContext]);

  const getRenderConfig = useCallback(() => configRef.current, []);

  // ===== 🚀 RENDER ENGINE INTERFACE =====
  return {
    // Setup
    initializeCanvas,
    handleResize,
    
    // Drawing
    clearCanvas,
    drawCircle,
    drawRect,
    drawText,
    createLinearGradient,
    
    // Coordinate transformation
    worldToScreen,
    screenToWorld,
    
    // Data access
    getViewport,
    getCanvasData,
    canvasRef,
    contextRef,
    
    // Configuration
    updateRenderConfig,
    getRenderConfig,
    
    // Viewport data
    viewport: viewportRef.current
  };
};

export default useRenderEngine;