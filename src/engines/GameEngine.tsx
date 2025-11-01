/**
 * ========================================
 * PHASE 1: CORE SYSTEM COMPONENTS
 * ========================================
 * 
 * GameEngine.tsx - Fő játék logika és loop
 * 
 * FUNKCIÓK:
 * - Játék loop kezelés (requestAnimationFrame)
 * - Világ paraméterek (gravity, jump, speed, stb.)
 * - Időkezelés és frame counting
 * - Játék állapot koordináció
 * - Performance monitoring
 */

import { useRef, useCallback } from 'react';

// ===== 🌍 WORLD PARAMETERS =====
export interface WorldParameters {
  w: number;          // világ szélesség (logikai px)
  h: number;          // világ magasság
  gravity: number;    // gravitációs erő
  jump: number;       // ugrás erő
  speed: number;      // játék sebesség
  gap: number;        // akadályok közötti rés
  pipeW: number;      // cső szélesség
  pipeSpace: number;  // csövek közötti távolság
  groundH: number;    // föld magasság
}

// ===== ⏱️ TIME MANAGEMENT =====
export interface TimeData {
  frameCount: number;
  lastTime: number;
  deltaTime: number;
  fps: number;
  gameTime: number;
}

// ===== 🎮 GAME ENGINE HOOK =====
export const useGameEngine = () => {
  // Világ paraméterek (virtuális koordináta-rendszer)
  const world = useRef<WorldParameters>({
    w: 320,         // világ szélesség (logikai px)
    h: 480,         // világ magasság
    gravity: 0.119, // 5%-kal kevesebb gravitáció (volt: 0.125)
    jump: -3.83,    // 10%-kal gyengébb ugrás (volt: -4.25)
    speed: 1.0,     // lassabb sebesség
    gap: 110,       // még nagyobb rés
    pipeW: 40,
    pipeSpace: 200, // még nagyobb távolság
    groundH: 50,
  });

  // Időkezelés
  const time = useRef<TimeData>({
    frameCount: 0,
    lastTime: 0,
    deltaTime: 0,
    fps: 60,
    gameTime: 0
  });

  // RAF reference a game loop-hoz
  const rafRef = useRef<number | null>(null);

  // ===== 🔄 GAME LOOP MANAGEMENT =====
  const startGameLoop = useCallback((updateCallback: (deltaTime: number) => void) => {
    const loop = (currentTime: number) => {
      // Delta time számítás
      if (time.current.lastTime === 0) {
        time.current.lastTime = currentTime;
      }
      
      const deltaTime = currentTime - time.current.lastTime;
      time.current.deltaTime = deltaTime;
      time.current.lastTime = currentTime;
      time.current.frameCount++;
      time.current.gameTime += deltaTime;

      // FPS számítás (minden 60. frame-ben)
      if (time.current.frameCount % 60 === 0) {
        time.current.fps = Math.round(1000 / deltaTime);
      }

      // Játék logika update
      updateCallback(deltaTime);

      // Következő frame kérése
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopGameLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetGameTime = useCallback(() => {
    time.current.frameCount = 0;
    time.current.lastTime = 0;
    time.current.deltaTime = 0;
    time.current.gameTime = 0;
  }, []);

  // ===== 🎯 WORLD PARAMETER GETTERS =====
  const getWorldParams = useCallback(() => world.current, []);
  
  const updateWorldParams = useCallback((newParams: Partial<WorldParameters>) => {
    world.current = { ...world.current, ...newParams };
  }, []);

  // ===== ⏱️ TIME DATA GETTERS =====
  const getTimeData = useCallback(() => time.current, []);

  const getCurrentFPS = useCallback(() => time.current.fps, []);

  const getFrameCount = useCallback(() => time.current.frameCount, []);

  // ===== 🚀 ENGINE INTERFACE =====
  return {
    // World management
    world: world.current,
    getWorldParams,
    updateWorldParams,
    
    // Time management
    time: time.current,
    getTimeData,
    getCurrentFPS,
    getFrameCount,
    resetGameTime,
    
    // Game loop management
    startGameLoop,
    stopGameLoop,
    rafRef,
    
    // Performance data
    performance: {
      fps: time.current.fps,
      frameCount: time.current.frameCount,
      gameTime: time.current.gameTime,
      deltaTime: time.current.deltaTime
    }
  };
};

// ===== 📊 PERFORMANCE UTILITIES =====
export const createPerformanceMonitor = () => {
  let frameCount = 0;
  let lastTime = performance.now();
  let fpsHistory: number[] = [];
  
  return {
    update: () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (frameCount % 60 === 0) {
        const fps = Math.round(60000 / (currentTime - lastTime));
        fpsHistory.push(fps);
        
        // Csak az utolsó 10 FPS mérést tartjuk meg
        if (fpsHistory.length > 10) {
          fpsHistory.shift();
        }
        
        lastTime = currentTime;
      }
    },
    
    getAverageFPS: () => {
      if (fpsHistory.length === 0) return 60;
      return Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
    },
    
    getLatestFPS: () => {
      return fpsHistory[fpsHistory.length - 1] || 60;
    },
    
    reset: () => {
      frameCount = 0;
      lastTime = performance.now();
      fpsHistory = [];
    }
  };
};

export default useGameEngine;