import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    state, 
    sessionId, 
    deviceId, 
    isConnected,
    startGame, 
    pauseGame, 
    resetGame, 
    nextPlayer, 
    useTimeBank, 
    resetPlayerTimer,
    setCurrentPlayer,
    updatePlayerName,
    movePlayer,
    deleteSession,
    disconnect 
  } = useGame();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>(state.players.map(p => p.name));

  // Update player names when state changes
  React.useEffect(() => {
    setPlayerNames(state.players.map(p => p.name));
  }, [state.players]);

  const handlePlayerNameChange = (index: number, newName: string) => {
    const newNames = [...playerNames];
    newNames[index] = newName;
    setPlayerNames(newNames);
  };

  const handlePlayerNameSave = (index: number) => {
    const player = state.players[index];
    if (player && playerNames[index] !== player.name) {
      updatePlayerName(player.id, playerNames[index]);
    }
    setEditingPlayer(null);
  };

  const handleMovePlayer = (fromIndex: number, toIndex: number) => {
    movePlayer(fromIndex, toIndex);
  };

  const handleDeleteSession = () => {
    deleteSession();
    disconnect();
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayer = () => {
    return state.players.find(p => p.isCurrentPlayer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-green-200">Session: {sessionId} | Device: {deviceId}</p>
          <p className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            ← Home
          </button>
          <button
            onClick={() => navigate('/display')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
          >
            View Display
          </button>
        </div>
      </div>

      {/* Game Controls */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4">Game Controls</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <button
            onClick={startGame}
            disabled={state.isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
          >
            {state.isRunning ? 'Running' : 'Start Game'}
          </button>
          
          <button
            onClick={pauseGame}
            disabled={!state.isRunning || state.isPaused}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
          >
            {state.isPaused ? 'Paused' : 'Pause Game'}
          </button>
          
          <button
            onClick={resetGame}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
          >
            Reset Game
          </button>
          
          <button
            onClick={nextPlayer}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
          >
            Next Player
          </button>
        </div>

        {/* Current Player Status */}
        {getCurrentPlayer() && (
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Current Player</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-xl">{getCurrentPlayer()?.name}</p>
                <p className="text-green-200">Time: {formatTime(getCurrentPlayer()?.remainingTime || 0)}</p>
                <p className="text-yellow-200">Time Bank: {getCurrentPlayer()?.timeBank || 0}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => getCurrentPlayer() && useTimeBank(getCurrentPlayer()!.id)}
                  disabled={!getCurrentPlayer() || getCurrentPlayer()!.timeBank <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Use Time Bank
                </button>
                <button
                  onClick={() => getCurrentPlayer() && resetPlayerTimer(getCurrentPlayer()!.id)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Reset Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Players Grid */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Players ({state.players.length})</h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Delete Session
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.players.map((player, index) => (
            <div
              key={player.id}
              className={`bg-white/10 rounded-xl p-4 border-2 transition-all duration-200 ${
                player.isCurrentPlayer 
                  ? 'border-yellow-400 bg-yellow-500/20' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {/* Player Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {editingPlayer === index ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={playerNames[index]}
                        onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                        className="flex-1 px-2 py-1 bg-white/20 border border-white/30 rounded text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handlePlayerNameSave(index)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">{player.name}</h3>
                      <button
                        onClick={() => setEditingPlayer(index)}
                        className="text-white/60 hover:text-white text-sm"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  <p className="text-green-200 text-sm">Position {player.position}</p>
                </div>
                
                {/* Current Player Indicator */}
                {player.isCurrentPlayer && (
                  <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                    ACTING
                  </div>
                )}
              </div>

              {/* Player Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-white/80">Time Remaining:</span>
                  <span className={`font-bold ${player.remainingTime <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatTime(player.remainingTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Time Bank:</span>
                  <span className="text-yellow-400 font-bold">{player.timeBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Status:</span>
                  <span className={`font-bold ${player.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {player.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Player Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => useTimeBank(player.id)}
                  disabled={player.timeBank <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded text-sm transition-all duration-200"
                >
                  Time Bank
                </button>
                <button
                  onClick={() => resetPlayerTimer(player.id)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded text-sm transition-all duration-200"
                >
                  Reset Timer
                </button>
                <button
                  onClick={() => setCurrentPlayer(player.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm transition-all duration-200"
                >
                  Set Current
                </button>
              </div>

              {/* Move Controls */}
              <div className="flex gap-1 mt-2">
                {index > 0 && (
                  <button
                    onClick={() => handleMovePlayer(index, index - 1)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-all duration-200"
                  >
                    ↑
                  </button>
                )}
                {index < state.players.length - 1 && (
                  <button
                    onClick={() => handleMovePlayer(index, index + 1)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-all duration-200"
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Delete Session?</h3>
            <p className="text-white/80 mb-6">
              This will permanently delete the session "{sessionId}" and disconnect all players. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 