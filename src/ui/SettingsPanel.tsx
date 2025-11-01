import React from 'react';

interface SpeedSettings {
  normal: number;
  slowMotion: number;
  rainbow: number;
  super: number;
  godMode: number;
}

interface SettingsPanelProps {
  speedSettings: SpeedSettings;
  saveSpeedSettings: (settings: SpeedSettings) => void;
  setShowSettings: (show: boolean) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  speedSettings,
  saveSpeedSettings,
  setShowSettings
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md text-white pixel-text">
        <h2 className="text-2xl mb-6 text-center">⚙️ Sebesség Beállítások</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">🏃 Alap sebesség: {speedSettings.normal.toFixed(1)}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="5.0" 
              step="0.1"
              value={speedSettings.normal}
              onChange={(e) => saveSpeedSettings({...speedSettings, normal: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">⏰ Slow Motion: {speedSettings.slowMotion.toFixed(1)}x</label>
            <input 
              type="range" 
              min="0.2" 
              max="3.0" 
              step="0.1"
              value={speedSettings.slowMotion}
              onChange={(e) => saveSpeedSettings({...speedSettings, slowMotion: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">🌈 Rainbow Mode: {speedSettings.rainbow.toFixed(1)}x</label>
            <input 
              type="range" 
              min="1.0" 
              max="8.0" 
              step="0.1"
              value={speedSettings.rainbow}
              onChange={(e) => saveSpeedSettings({...speedSettings, rainbow: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">⚡ Super Mode: {speedSettings.super.toFixed(1)}x</label>
            <input 
              type="range" 
              min="1.0" 
              max="10.0" 
              step="0.1"
              value={speedSettings.super}
              onChange={(e) => saveSpeedSettings({...speedSettings, super: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">🌟 God Mode: {speedSettings.godMode.toFixed(1)}x</label>
            <input 
              type="range" 
              min="1.0" 
              max="8.0" 
              step="0.1"
              value={speedSettings.godMode}
              onChange={(e) => saveSpeedSettings({...speedSettings, godMode: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-2 mt-6">
            <button 
              onClick={() => saveSpeedSettings({normal: 2.0, slowMotion: 1.0, rainbow: 3.0, super: 4.0, godMode: 2.5})}
              className="pixel-button px-4 py-2 text-sm flex-1"
            >
              🔄 Alapértelmezett
            </button>
            <button 
              onClick={() => setShowSettings(false)}
              className="pixel-button px-4 py-2 text-sm flex-1"
            >
              ❌ Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;