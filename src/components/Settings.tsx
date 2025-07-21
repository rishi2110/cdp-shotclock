import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { GameSettings } from '../types';

export function Settings() {
  const { state, updateSettings } = useGame();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<GameSettings>({
    playerCount: 6,
    timeLimit: 30,
    maxTimeBank: 3,
    timeBankIncrement: 0,
    playerNames: Array(10).fill('').map((_, i) => `Player ${i + 1}`),
  });

  const handleInputChange = (field: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...settings.playerNames];
    newNames[index] = name;
    setSettings(prev => ({ ...prev, playerNames: newNames }));
  };

  const handleSave = () => {
    updateSettings(settings);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
        >
          ← Home
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-4xl w-full">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Game Settings</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Settings */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-yellow-400 mb-4">Basic Settings</h3>
            
            <div>
              <label className="block text-white font-medium mb-3">
                Number of Players
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.playerCount}
                onChange={(e) => handleInputChange('playerCount', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.timeLimit}
                onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Max Time Bank
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={settings.maxTimeBank}
                onChange={(e) => handleInputChange('maxTimeBank', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Player Names */}
          <div>
            <h3 className="text-2xl font-semibold text-yellow-400 mb-4">Player Names</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={`${i < settings.playerCount ? 'block' : 'hidden'}`}>
                  <label className="block text-white font-medium mb-2">
                    Player {i + 1}
                  </label>
                  <input
                    type="text"
                    value={settings.playerNames[i]}
                    onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Save Settings & Start Game
          </button>
        </div>

        {/* Current Game Info */}
        {state.players.length > 0 && (
          <div className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20">
            <h4 className="text-xl font-semibold text-white mb-4">Current Game Configuration</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-300">Players:</span>
                <span className="ml-2 text-white font-semibold">{state.players.length}</span>
              </div>
              <div>
                <span className="text-green-300">Time Limit:</span>
                <span className="ml-2 text-white font-semibold">{state.timeLimit}s</span>
              </div>
              <div>
                <span className="text-green-300">Max Time Bank:</span>
                <span className="ml-2 text-white font-semibold">{state.maxTimeBank}</span>
              </div>
              <div>
                <span className="text-green-300">Current Player:</span>
                <span className="ml-2 text-white font-semibold">{state.players[state.currentPlayerIndex]?.name || 'None'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 