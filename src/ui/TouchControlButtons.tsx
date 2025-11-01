import React from 'react';

interface BirdSkin {
  abilities: {
    shadowTeleport?: boolean;
    flyThroughWalls?: boolean;
    warpSpeed?: boolean;
    canShoot?: boolean;
  };
}

interface Bird {
  x: number;
  y: number;
  shadowTeleportsLeft: number;
  wallPhaseLeft: number;
  wallPhaseActive: boolean;
  warpJumpsLeft: number;
}

interface TouchControlButtonsProps {
  buttonPosition: 'left' | 'right';
  getCurrentBirdSkin: () => BirdSkin;
  bird: { current: Bird };
  world: { current: { h: number } };
  createParticles: (x: number, y: number, count: number, color: string, type: string) => void;
  playSound: (frequency: number, volume: number, type: string) => void;
  shoot: () => void;
}

const TouchControlButtons: React.FC<TouchControlButtonsProps> = ({
  buttonPosition,
  getCurrentBirdSkin,
  bird,
  world,
  createParticles,
  playSound,
  shoot
}) => {
  const handleShadowTeleport = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const b = bird.current;
    if (b.shadowTeleportsLeft > 0) {
      b.shadowTeleportsLeft--;
      b.y = Math.max(50, Math.min(world.current.h - 50, Math.random() * world.current.h));
      createParticles(b.x, b.y, 15, '#8B0000', 'explosion');
      playSound(400, 0.3, 'powerup');
    }
  };

  const handleWallPhase = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const b = bird.current;
    if (b.wallPhaseLeft > 0 && !b.wallPhaseActive) {
      b.wallPhaseLeft = Math.min(b.wallPhaseLeft, 180); // 3 seconds max
      b.wallPhaseActive = true;
      createParticles(b.x, b.y, 10, '#0080FF', 'sparkle');
      playSound(600, 0.2, 'powerup');
    }
  };

  const handleWarpSpeed = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const b = bird.current;
    if (b.warpJumpsLeft > 0) {
      b.warpJumpsLeft--;
      b.x += 150; // Quick forward movement
      createParticles(b.x, b.y, 12, '#00FF00', 'trail');
      playSound(800, 0.2, 'powerup');
    }
  };

  const handleShoot = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shoot();
  };

  return (
    <>
      {/* Special Abilities Buttons */}
      <div className={`absolute bottom-4 ${buttonPosition === 'left' ? 'left-4' : 'right-4'} flex flex-col gap-2 pointer-events-auto`}>
        {/* Shadow Teleport - Demon Bird */}
        {getCurrentBirdSkin().abilities.shadowTeleport && bird.current.shadowTeleportsLeft > 0 && (
          <button
            className="w-12 h-12 bg-red-800 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-red-600"
            onTouchStart={handleShadowTeleport}
            onClick={handleShadowTeleport}
          >
            😈
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {bird.current.shadowTeleportsLeft}
            </span>
          </button>
        )}
        
        {/* Wall Phase - Super Bird */}
        {getCurrentBirdSkin().abilities.flyThroughWalls && bird.current.wallPhaseLeft > 0 && (
          <button
            className="w-12 h-12 bg-blue-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-blue-400"
            onTouchStart={handleWallPhase}
            onClick={handleWallPhase}
          >
            🦸‍♂️
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Math.ceil(bird.current.wallPhaseLeft / 60)}
            </span>
          </button>
        )}
        
        {/* Warp Speed - UFO Bird */}
        {getCurrentBirdSkin().abilities.warpSpeed && bird.current.warpJumpsLeft > 0 && (
          <button
            className="w-12 h-12 bg-green-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-green-400"
            onTouchStart={handleWarpSpeed}
            onClick={handleWarpSpeed}
          >
            🛸
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {bird.current.warpJumpsLeft}
            </span>
          </button>
        )}
      </div>
      
      {/* Shoot Button for Combat Birds */}
      {getCurrentBirdSkin().abilities.canShoot && (
        <div className={`absolute bottom-4 ${buttonPosition === 'left' ? 'right-4' : 'left-4'} pointer-events-auto`}>
          <button
            className="w-14 h-14 bg-orange-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg active:bg-orange-400"
            onTouchStart={handleShoot}
            onClick={handleShoot}
          >
            🔫
          </button>
        </div>
      )}
    </>
  );
};

export default TouchControlButtons;