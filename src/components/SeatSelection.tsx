import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function SeatSelection() {
  const { state, socket, sessionId, claimSeat, isConnected } = useGame();
  const navigate = useNavigate();
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  
  console.log('SeatSelection - Component loaded, state:', state);
  console.log('SeatSelection - sessionId:', sessionId, 'isConnected:', isConnected);

  const handleSeatSelect = (position: number) => {
    setSelectedSeat(position);
    const seat = state.players.find(p => p.position === position);
    if (seat && !seat.isClaimed) {
      setPlayerName(seat.name);
    }
  };

  const handleClaimSeat = async () => {
    if (!selectedSeat || !playerName.trim() || !socket) return;
    
    setIsClaiming(true);
    try {
      await claimSeat(selectedSeat, playerName.trim());
      // Small delay to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('SeatSelection - After claimSeat, localStorage:', {
        claimedPlayerId: localStorage.getItem('claimedPlayerId'),
        claimedPlayerName: localStorage.getItem('claimedPlayerName'),
        claimedPlayerPosition: localStorage.getItem('claimedPlayerPosition')
      });
      
      // All users go to player page after claiming a seat
      navigate('/player');
    } catch (error) {
      console.error('Failed to claim seat:', error);
      setIsClaiming(false);
    }
  };

  const getSeatPosition = (position: number, totalSeats: number) => {
    const angle = ((position - 1) * 360) / totalSeats - 90; // Start from top
    const radius = 200; // Distance from center
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y };
  };

  const totalSeats = state.players.length;

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎰 Central District Poker</h1>
          <p className="text-green-200 text-lg">
            Choose where you want to sit at the poker table
          </p>
        </div>

        {/* Poker Table */}
        <div className="relative w-full h-96 mb-12 mt-16">
          {/* Table */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 bg-green-800 rounded-full border-4 border-green-600 shadow-2xl">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-32 bg-green-700 rounded-full border-2 border-green-500"></div>
            {/* Poker Chips */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-300 shadow-lg"></div>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-blue-300 shadow-lg"></div>
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-green-300 shadow-lg"></div>
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-yellow-300 shadow-lg"></div>
                <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-purple-300 shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Seats */}
          {state.players.map((player) => {
            const { x, y } = getSeatPosition(player.position, totalSeats);
            const isSelected = selectedSeat === player.position;
            const isClaimed = player.isClaimed;
            
            return (
              <div
                key={player.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
                onClick={() => !isClaimed && handleSeatSelect(player.position)}
              >
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-center transition-all duration-200 ${
                  isClaimed 
                    ? 'bg-red-600 border-red-400 text-white' 
                    : isSelected 
                      ? 'bg-blue-600 border-blue-400 text-white' 
                      : 'bg-gray-600 border-gray-400 text-gray-300 hover:bg-gray-500'
                }`}>
                  <div>
                    <div className="text-xs font-bold">Seat {player.position}</div>
                    <div className="text-xs mt-1">
                      {isClaimed ? player.name : player.name}
                    </div>
                    {isClaimed && (
                      <div className="text-xs mt-1 text-red-200">Claimed</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seat Selection Info */}
        {selectedSeat && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              🪑 Seat {selectedSeat} Selected
            </h3>
            
            <div className="mb-4">
              <label htmlFor="playerName" className="block text-green-200 mb-2">
                Your Name (optional - you can change it once)
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name or keep the default"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-all duration-200"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleClaimSeat}
              disabled={isClaiming || !playerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isClaiming ? 'Claiming Seat...' : 'Claim This Seat'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-green-200 mt-8">
          <p className="mb-2">💡 <strong>How it works:</strong></p>
          <ul className="text-sm space-y-1">
            <li>• Click on an available seat (gray) to select it</li>
            <li>• Red seats are already claimed by other players</li>
            <li>• You can change your name once after claiming</li>
            <li>• Only claimed seats participate in the game</li>
            {state.gameMode === 'admin' && (
              <li>• As admin, you can access both admin panel and player mode</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 