import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function DisplayScreen() {
  const { state, sessionId, isConnected, joinSession } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [displaySessionId, setDisplaySessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse sessionId from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get('sessionId');
    if (sid) setDisplaySessionId(sid);
  }, [location.search]);

  // If not connected to the session, join as display
  useEffect(() => {
    if (displaySessionId && (!sessionId || sessionId !== displaySessionId)) {
      setLoading(true);
      joinSession(displaySessionId, '__display__').finally(() => setLoading(false));
    }
  }, [displaySessionId, sessionId, joinSession]);

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

  // Poker table seat positions (clockwise from top)
  const getSeatPosition = (index: number, totalPlayers: number) => {
    const angle = (index * 360) / totalPlayers - 90; // Start from top
    const radius = 35; // Percentage from center
    
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    
    return { x, y };
  };

  if (loading || (displaySessionId && (!isConnected || sessionId !== displaySessionId))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Poker Shot Clock</h1>
          <p className="text-xl text-green-200 mb-6">Loading display for session {displaySessionId}...</p>
        </div>
      </div>
    );
  }

  if (state.players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Poker Shot Clock</h1>
          <p className="text-xl text-green-200 mb-6">No players configured</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
        >
          ← Home
        </button>
      </div>

      {/* Game Status */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
          <span className="text-white font-semibold">
            {state.isRunning && !state.isPaused ? (
              <span className="text-green-400">● RUNNING</span>
            ) : state.isPaused ? (
              <span className="text-yellow-400">⏸ PAUSED</span>
            ) : (
              <span className="text-red-400">⏹ STOPPED</span>
            )}
          </span>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
        {currentPlayer && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              {currentPlayer.name}
            </h2>
            <div className={`text-9xl font-mono font-bold ${getTimeColor(currentPlayer.remainingTime)} mb-4`}>
              {formatTime(currentPlayer.remainingTime)}
            </div>
            <div className="text-2xl text-green-200 mb-2">
              Time Bank: {currentPlayer.timeBank}/{state.maxTimeBank}
            </div>
            <div className="text-lg text-green-200">
              Position {currentPlayer.position}
            </div>
          </div>
        )}
      </div>

      {/* Poker Table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-4/5 h-4/5 max-w-4xl max-h-4xl">
          {/* Table Background */}
          <div className="absolute inset-0 bg-green-800 rounded-full border-8 border-green-600 shadow-2xl"></div>
          
          {/* Table Felt Pattern */}
          <div className="absolute inset-8 bg-green-700 rounded-full opacity-50"></div>
          
          {/* Center Logo */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
            <div className="text-center text-white/30">
              <div className="text-6xl mb-2">🃏</div>
              <div className="text-sm font-semibold">POKER</div>
            </div>
          </div>

          {/* Player Seats */}
          {state.players.map((player, index) => {
            const position = getSeatPosition(index, state.players.length);
            const isCurrentPlayer = player.isCurrentPlayer;
            const isClaimed = player.isClaimed;
            return (
              <div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <div className={`relative ${isCurrentPlayer ? 'animate-pulse' : ''}`}> 
                  {/* Seat Highlight */}
                  {isCurrentPlayer && (
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                  )}
                  {/* Player Card */}
                  <div className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 min-w-[120px] text-center transition-all duration-300 ${
                    isCurrentPlayer 
                      ? 'border-yellow-400 bg-yellow-400/20 scale-110 shadow-2xl' 
                      : isClaimed
                        ? 'border-white/20 hover:border-white/40'
                        : 'border-gray-400 bg-gray-700 opacity-40 grayscale pointer-events-none'
                  }`}>
                    <div className={`text-lg font-bold ${isClaimed ? 'text-white' : 'text-gray-300'} mb-1`}>
                      {player.name}
                    </div>
                    <div className={`text-sm ${isClaimed ? 'text-green-200' : 'text-gray-400'} mb-2`}>
                      Seat {player.position}
                    </div>
                    <div className={`text-xl font-mono font-bold ${isClaimed ? getTimeColor(player.remainingTime) : 'text-gray-400'} mb-1`}>
                      {formatTime(player.remainingTime)}
                    </div>
                    <div className={`text-xs ${isClaimed ? 'text-yellow-300' : 'text-gray-400'}`}>
                      Bank: {player.timeBank}/{state.maxTimeBank}
                    </div>
                    {/* Active Indicator */}
                    {isCurrentPlayer && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Info Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
          <div className="flex gap-8 text-white text-lg">
            <div>
              <span className="text-green-300">Players:</span>
              <span className="ml-2 font-semibold">{state.players.length}</span>
            </div>
            <div>
              <span className="text-green-300">Time Limit:</span>
              <span className="ml-2 font-semibold font-mono">{formatTime(state.timeLimit)}</span>
            </div>
            <div>
              <span className="text-green-300">Max Bank:</span>
              <span className="ml-2 font-semibold">{state.maxTimeBank}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 