import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function PlayerModeHome() {
  const navigate = useNavigate();
  const { state, disconnect } = useGame();
  
  // Get claimed player info from localStorage
  const claimedPlayerId = localStorage.getItem('claimedPlayerId');
  const claimedPlayerName = localStorage.getItem('claimedPlayerName');
  const claimedPlayerPosition = localStorage.getItem('claimedPlayerPosition');
  
  // Find the claimed player in the current state
  const claimedPlayer = state.players.find(p => p.id === claimedPlayerId);
  
  const handleGoToPlayerPortal = () => {
    navigate('/player-portal');
  };
  
  const handleGoToDisplayPage = () => {
    navigate('/display');
  };
  
  const handleExitSession = () => {
    disconnect();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            Central District Poker Shot Clock
          </h1>
        </div>
        
        {/* Welcome Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              👋 Welcome Back!
            </h2>
            
            {claimedPlayer && (
              <div className="mb-6">
                <div className="bg-blue-600/20 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">
                    Your Seat: {claimedPlayerPosition}
                  </h3>
                  <p className="text-blue-100 text-lg">
                    Player: <span className="font-bold">{claimedPlayerName}</span>
                  </p>
                  <div className="mt-3 text-sm text-blue-200">
                    <p>Time Bank: {claimedPlayer.timeBank} uses remaining</p>
                    <p>Time Limit: {state.timeLimit} seconds</p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-green-200 mb-8 text-lg">
              You're all set up! Choose where you'd like to go:
            </p>
            
            <button
              onClick={handleGoToPlayerPortal}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg mb-4"
            >
              🎮 Player Portal
            </button>
            
            <button
              onClick={handleGoToDisplayPage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg mb-4"
            >
              📺 Display Page
            </button>
            
            <button
              onClick={handleExitSession}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚪 Exit Session
            </button>
          </div>
        </div>
        
        {/* Game Status */}
        {state.players.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Game Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-300">Active Players:</span>
                <span className="ml-2 text-white font-semibold">
                  {state.players.filter(p => p.isClaimed).length}
                </span>
              </div>
              <div>
                <span className="text-green-300">Game Status:</span>
                <span className="ml-2 text-white font-semibold">
                  {state.isRunning ? (state.isPaused ? '⏸️ Paused' : '▶️ Running') : '⏹️ Stopped'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 