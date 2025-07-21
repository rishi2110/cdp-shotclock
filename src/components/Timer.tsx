import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function Timer() {
  const { state, startGame, pauseGame, resetGame, nextPlayer, useTimeBank, resetPlayerTimer } = useGame();
  const navigate = useNavigate();
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isAdminMode = state.gameMode === 'admin';
  
  // Get claimed player info for time bank functionality
  const claimedPlayerId = localStorage.getItem('claimedPlayerId');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (time: number): string => {
    if (time <= 5) return 'text-red-500 animate-pulse-slow';
    if (time <= 10) return 'text-yellow-500';
    return 'text-white';
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">No Players Configured</h2>
          <p className="text-green-200 mb-6">Please set up the game in settings first.</p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

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

      {/* Mode Indicator */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
          <span className="text-white font-semibold">
            {isAdminMode ? '🎮 Admin Mode' : '👤 Player Mode'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl w-full">
        {/* Current Player Info */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h3 className="text-lg text-green-200 mb-2">🎯 ACTIVE PLAYER</h3>
            <h2 className="text-4xl font-bold text-white mb-2">
              {currentPlayer.name}
            </h2>
            <p className="text-green-200">Position {currentPlayer.position}</p>
          </div>
          
          {/* Next Player Info */}
          {state.players.length > 1 && (
            <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
              <h3 className="text-lg text-blue-200 mb-2">⏭️ NEXT TO ACT</h3>
              {(() => {
                const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
                const nextPlayer = state.players[nextPlayerIndex];
                return (
                  <div>
                    <p className="text-2xl font-semibold text-blue-300">{nextPlayer.name}</p>
                    <p className="text-blue-200">Position {nextPlayer.position}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-8xl font-mono font-bold ${getTimeColor(currentPlayer.remainingTime)} mb-4`}>
            {formatTime(currentPlayer.remainingTime)}
          </div>
          <div className="text-lg text-green-200">
            Time Limit: {formatTime(state.timeLimit)}
          </div>
        </div>

        {/* Time Bank Info */}
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-yellow-400 mb-4">
            Time Bank: {currentPlayer.timeBank}/{state.maxTimeBank}
          </div>
          {currentPlayer.timeBank > 0 && (
            <button
              onClick={() => useTimeBank(currentPlayer.id)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              disabled={!state.isRunning || state.isPaused}
            >
              Use Time Bank
            </button>
          )}
          {isAdminMode && (
            <button
              onClick={() => resetPlayerTimer(currentPlayer.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Reset Timer
            </button>
          )}
        </div>
        
        {/* Claimed Player Time Bank - Show for players */}
        {!isAdminMode && claimedPlayerId && (
          <div className="text-center mb-8">
            {(() => {
              const claimedPlayer = state.players.find(p => p.id === claimedPlayerId);
              if (claimedPlayer && claimedPlayer.id !== currentPlayer.id) {
                return (
                  <div className="bg-purple-600/20 rounded-xl p-6 border border-purple-400/30">
                    <h3 className="text-xl font-semibold text-purple-200 mb-2">
                      Your Time Bank
                    </h3>
                    <div className="text-2xl font-semibold text-purple-300 mb-4">
                      {claimedPlayer.timeBank}/{state.maxTimeBank}
                    </div>
                    {claimedPlayer.timeBank > 0 && claimedPlayer.isCurrentPlayer && (
                      <button
                        onClick={() => useTimeBank(claimedPlayer.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                        disabled={!state.isRunning || state.isPaused}
                      >
                        Use Your Time Bank
                      </button>
                    )}
                    {claimedPlayer.isCurrentPlayer && (
                      <p className="text-purple-200 mt-2">It's your turn!</p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Game Controls - Only show for admins */}
        {isAdminMode && (
          <div className="flex flex-wrap gap-4 justify-center">
            {!state.isRunning ? (
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ▶️ Start Game
              </button>
            ) : state.isPaused ? (
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={pauseGame}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ⏸️ Pause
              </button>
            )}
            
            <button
              onClick={nextPlayer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Next Player
            </button>
            
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔄 Reset
            </button>
          </div>
        )}

        {/* Game Status */}
        <div className="text-center mt-8">
          <div className="text-lg text-green-200">
            {state.isRunning && !state.isPaused ? (
              <span className="text-green-400">● Game Running</span>
            ) : state.isPaused ? (
              <span className="text-yellow-400">⏸ Game Paused</span>
            ) : (
              <span className="text-red-400">⏹ Game Stopped</span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            onClick={() => navigate('/display')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            📺 Display Screen
          </button>
          {isAdminMode && (
            <button
              onClick={() => navigate('/session')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ⚙️ Session Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 