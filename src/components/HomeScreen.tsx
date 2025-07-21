import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function HomeScreen() {
  const navigate = useNavigate();
  const { state, sessionId, isConnected, startGame, pauseGame, resetGame, disconnect, deviceId } = useGame();

  const hasActiveSession = sessionId && isConnected;
  const hasActiveGame = hasActiveSession && state.players.length > 0;
  const claimedPlayerId = localStorage.getItem('claimedPlayerId');
  
  // Check if this device has a claimed player in the current game state
  const hasClaimedPlayerInState = state.players.some(player => 
    player.claimedBy === deviceId && player.isClaimed
  );
  
  const hasClaimedSeat = claimedPlayerId || hasClaimedPlayerInState;
  
  console.log('HomeScreen - Component loaded, hasActiveSession:', hasActiveSession, 'gameMode:', state.gameMode, 'hasClaimedSeat:', hasClaimedSeat);

  const [displaySessionId, setDisplaySessionId] = useState('');

  // State for reset modal
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Reset State Icon/Button (top right) */}
      <div className="absolute top-6 right-6 z-50">
        <button
          aria-label="Open reset local state dialog"
          className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400"
          onClick={() => setShowResetModal(true)}
        >
          {/* Gear/Settings Icon (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 01-.44 2.5l1.7 1.32a.75.75 0 01.17 1.02l-1.6 2.77a.75.75 0 01-1.02.28l-2-1.16a7.5 7.5 0 01-2.16 1.25l-.3 2.23a.75.75 0 01-.74.64h-3.2a.75.75 0 01-.74-.64l-.3-2.23a7.5 7.5 0 01-2.16-1.25l-2 1.16a.75.75 0 01-1.02-.28l-1.6-2.77a.75.75 0 01.17-1.02l1.7-1.32A7.5 7.5 0 014.5 12c0-.86.15-1.68.44-2.5l-1.7-1.32a.75.75 0 01-.17-1.02l1.6-2.77a.75.75 0 011.02-.28l2 1.16A7.5 7.5 0 018.55 4.5l.3-2.23A.75.75 0 019.59 1.5h3.2a.75.75 0 01.74.64l.3 2.23a7.5 7.5 0 012.16 1.25l2-1.16a.75.75 0 011.02.28l1.6 2.77a.75.75 0 01-.17 1.02l-1.7 1.32c.29.82.44 1.64.44 2.5z" />
          </svg>
        </button>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-green-200">
            <h2 className="text-2xl font-bold mb-4 text-green-900">Reset Local State</h2>
            <p className="mb-6 text-green-800">This will clear all local data for this app on your device, including claimed seats and session info. You will be logged out of any sessions.</p>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-200 mb-4 w-full"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Reset Local State
            </button>
            <button
              className="mt-2 text-green-700 hover:underline text-sm"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            Central District Poker Shot Clock
          </h1>
        </div>

        {/* Session Status */}
        {hasActiveSession && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Active Session</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <span className="text-green-300">Session ID:</span>
                <span className="ml-2 text-white font-semibold">{sessionId}</span>
              </div>
              <div>
                <span className="text-green-300">Status:</span>
                <span className={`ml-2 font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {hasActiveGame && (
                <>
                  <div>
                    <span className="text-green-300">Players:</span>
                    <span className="ml-2 text-white font-semibold">{state.players.length}</span>
                  </div>
                  <div>
                    <span className="text-green-300">Time Limit:</span>
                    <span className="ml-2 text-white font-semibold">{state.timeLimit}s</span>
                  </div>
                </>
              )}
            </div>

            {/* Game Control Buttons - Only show for admins if game is configured */}
            {hasActiveGame && state.gameMode === 'admin' && (
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
                    ▶️ Resume Game
                  </button>
                ) : (
                  <button
                    onClick={pauseGame}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    ⏸️ Pause Game
                  </button>
                )}
                
                <button
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🔄 Reset Game
                </button>
              </div>
            )}
          </div>
        )}

        {/* Primary Action - Session Management */}
        {!hasActiveSession ? (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <button
                onClick={() => navigate('/session')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🎮 Create/Join Game
              </button>
            </div>
          </div>
        ) : (
          /* Navigation Buttons - Only show when session is active */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Admin Mode - Only show for admins */}
            {state.gameMode === 'admin' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <h3 className="text-2xl font-bold text-white mb-4">🎮 Admin Mode</h3>
                <p className="text-green-200 mb-6">
                  Full control over the game. Start, stop, pause, and manage all players.
                </p>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Open Admin Panel
                </button>
              </div>
            )}

            {/* Player Mode - Available to all users */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <h3 className="text-2xl font-bold text-white mb-4">👤 Player Mode</h3>
              <p className="text-green-200 mb-6">
                {state.gameMode === 'admin' 
                  ? 'View your claimed player\'s timer and use your time bank.'
                  : hasClaimedSeat
                    ? 'View your timer and use your time bank.'
                    : 'Join the game and select your seat.'
                }
              </p>
              <button
                onClick={() => {
                  console.log('HomeScreen - Player Mode clicked, gameMode:', state.gameMode, 'hasClaimedSeat:', hasClaimedSeat);
                  navigate('/player');
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {state.gameMode === 'admin' 
                  ? 'Open Player Panel' 
                  : hasClaimedSeat 
                    ? 'Player Portal' 
                    : 'Join Game'
                }
              </button>
            </div>

            {/* Display Screen - Available to all users */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <h3 className="text-2xl font-bold text-white mb-4">📺 Display Screen</h3>
              <p className="text-green-200 mb-6">
                Full-screen view for the poker table. Shows all players and current game status.
              </p>
              <button
                onClick={() => navigate('/display')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Open Display
              </button>
            </div>

            {/* Session Management - Only show for admins */}
            {state.gameMode === 'admin' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <h3 className="text-2xl font-bold text-white mb-4">⚙️ Session Settings</h3>
                <p className="text-green-200 mb-6">
                  Modify game settings or manage the current session.
                </p>
                <button
                  onClick={() => navigate('/session')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Manage Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Display Page for a Session */}
        <div className="mb-8 mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">View Display Page for a Session</h3>
          <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
            <input
              type="text"
              placeholder="Enter Session ID"
              value={displaySessionId}
              onChange={e => setDisplaySessionId(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg w-full md:w-64"
            />
            <button
              onClick={() => {
                if (displaySessionId.trim()) {
                  navigate(`/display?sessionId=${encodeURIComponent(displaySessionId.trim())}`);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg w-full md:w-auto"
            >
              📺 View Display
            </button>
          </div>
        </div>

        {/* Exit Session Button - Only show when session is active */}
        {hasActiveSession && (
          <div className="mt-8 text-center">
            <button
              onClick={disconnect}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚪 Exit Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 