/**
 * ========================================
 * PHASE 1 DEMO: CORE ENGINES HASZNÁLAT
 * ========================================
 * 
 * Ez a fájl bemutatja hogyan használhatók az új kiszervezett core engine-ek
 */

import React, { useEffect, useRef } from 'react';
import { 
  useGameEngine, 
  usePhysicsEngine, 
  useRenderEngine,
  createBird 
} from '../engines';

export const CoreEnginesDemo: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core engine-ek inicializálása
  const gameEngine = useGameEngine();
  const physicsEngine = usePhysicsEngine();
  const renderEngine = useRenderEngine();

  // Demo madár
  const birdRef = useRef(createBird(160, 240, 12));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render engine inicializálás
    renderEngine.initializeCanvas(canvas, gameEngine.world.w, gameEngine.world.h);

    // Demo game loop
    const gameLoop = (deltaTime: number) => {
      // Physics update
      birdRef.current = physicsEngine.updateBirdPhysics(
        birdRef.current,
        deltaTime,
        gameEngine.world.h,
        gameEngine.world.groundH
      );

      // Rendering
      renderEngine.clearCanvas('#87CEEB'); // Ég kék háttér
      
      // Föld rajzolás
      renderEngine.drawRect(
        0, 
        gameEngine.world.h - gameEngine.world.groundH,
        gameEngine.world.w,
        gameEngine.world.groundH,
        '#8B4513' // Barna föld
      );

      // Madár rajzolás
      renderEngine.drawCircle(
        birdRef.current.x,
        birdRef.current.y,
        birdRef.current.radius,
        '#FFD700', // Arany madár
        '#000000', // Fekete körvonal
        2
      );

      // Debug info
      renderEngine.drawText(
        `FPS: ${gameEngine.getCurrentFPS()}`,
        10, 10,
        '14px Arial',
        '#000000'
      );

      renderEngine.drawText(
        `Bird Y: ${birdRef.current.y.toFixed(1)}`,
        10, 30,
        '14px Arial',
        '#000000'
      );

      renderEngine.drawText(
        `Velocity: ${birdRef.current.vy.toFixed(2)}`,
        10, 50,
        '14px Arial',
        '#000000'
      );
    };

    // Game loop indítás
    gameEngine.startGameLoop(gameLoop);

    // Click handler madár ugráshoz
    const handleClick = () => {
      birdRef.current = physicsEngine.jumpBird(birdRef.current);
    };

    canvas.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      gameEngine.stopGameLoop();
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameEngine, physicsEngine, renderEngine]);

  return (
    <div 
      ref={wrapperRef}
      className="relative w-full h-screen bg-black flex items-center justify-center"
    >
      <div className="relative bg-gray-800 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          className="block border border-gray-600 rounded"
          style={{
            imageRendering: 'pixelated'
          }}
        />
        <div className="mt-4 text-white text-center">
          <h3 className="text-lg font-bold mb-2">Phase 1 Core Engines Demo</h3>
          <p className="text-sm text-gray-300 mb-2">
            Kattints a madárra az ugráshoz!
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <div>🏗️ GameEngine: Game loop és világ paraméterek</div>
            <div>⚖️ PhysicsEngine: Gravitáció és ütközés detektálás</div>
            <div>🎨 RenderEngine: Canvas renderelés és optimalizáció</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreEnginesDemo;