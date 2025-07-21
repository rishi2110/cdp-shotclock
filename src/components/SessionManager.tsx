import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { GameSettings } from '../types';

export function SessionManager() {
  const navigate = useNavigate();
  const { 
    state,
    sessionId, 
    deviceId, 
    isConnected, 
    joinSession, 
    createSession, 
    updateSettings,
    disconnect 
  } = useGame();
  
  const [sessionInput, setSessionInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    playerCount: 6,
    timeLimit: 30,
    maxTimeBank: 3,
    timeBankIncrement: 0,
    playerNames: Array(10).fill('').map((_, i) => `Player ${i + 1}`),
  });

  // Load current session settings if we're connected
  useEffect(() => {
    if (sessionId && isConnected && state.players.length > 0) {
      setGameSettings({
        playerCount: state.players.length,
        timeLimit: state.timeLimit,
        maxTimeBank: state.maxTimeBank,
        timeBankIncrement: 0,
        playerNames: state.players.map(p => p.name),
      });
    }
  }, [sessionId, isConnected, state.players, state.timeLimit, state.maxTimeBank]);

  const handleJoinSession = async () => {
    if (!sessionInput.trim()) {
      setError('Please enter a session ID');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      const result = await joinSession(sessionInput.trim(), joinPassword || undefined);
      if (result.success) {
        console.log('Join result:', result);
        // Add a small delay to ensure connection is established
        setTimeout(() => {
          if (result.isAdmin) {
            console.log('Navigating to admin panel');
            navigate('/admin');
          } else {
            // Check if player already has a claimed seat
            const hasClaimedSeat = result.claimedPlayer || localStorage.getItem('claimedPlayerId');
            if (hasClaimedSeat) {
              console.log('Player already has claimed seat, navigating to player home');
              navigate('/player');
            } else {
              console.log('Navigating to seat selection');
              navigate('/seats'); // Players go to seat selection first
            }
          }
        }, 200);
      } else {
        setError('Failed to join session. Please check the session ID and password.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionInput.trim()) {
      setError('Please enter a session ID');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const success = await createSession(sessionInput.trim(), gameSettings, adminPassword || undefined);
      if (success) {
        navigate('/seats'); // Admin goes to seat selection first
      } else {
        setError('Session ID already exists. Please choose a different one.');
      }
    } catch (err) {
      setError('Failed to create session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSessionInput('');
    setError('');
  };

  const handleSettingsChange = (field: keyof GameSettings, value: any) => {
    setGameSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...gameSettings.playerNames];
    newNames[index] = name;
    setGameSettings(prev => ({ ...prev, playerNames: newNames }));
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
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Session Management</h2>
        
        {/* Connection Status */}
        {sessionId && (
          <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Connected to: {sessionId}</p>
                <p className="text-green-200 text-sm">Device ID: {deviceId}</p>
                <p className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  Status: {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Session Input */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">
            Session ID
          </label>
          <input
            type="text"
            value={sessionInput}
            onChange={(e) => setSessionInput(e.target.value)}
            placeholder="Enter session ID (e.g., POKER123)"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
          />
        </div>

        {/* Join Password Input */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">
            Admin Password (Optional)
          </label>
          <input
            type="password"
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
            placeholder="Enter admin password to access admin controls"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
          />
          <p className="text-green-200 text-sm mt-2">
            Leave empty to join as a player (view-only mode)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleJoinSession}
            disabled={isJoining || isCreating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {sessionId && isConnected ? 'Edit Settings' : 'Create New Session'}
          </button>
        </div>

        {/* Create/Edit Session Form */}
        {showCreateForm && (
          <div className="mt-6 p-6 bg-white/10 rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              {sessionId && isConnected ? 'Edit Game Settings' : 'Game Settings'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Number of Players
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={gameSettings.playerCount}
                  onChange={(e) => handleSettingsChange('playerCount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 text-white"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Admin Password (Optional)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Leave empty for no password protection"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 text-white placeholder-white/50"
                />
                <p className="text-green-200 text-xs mt-1">
                  Protects admin access to this session
                </p>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={gameSettings.timeLimit}
                  onChange={(e) => handleSettingsChange('timeLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 text-white"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Max Time Bank
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={gameSettings.maxTimeBank}
                  onChange={(e) => handleSettingsChange('maxTimeBank', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
                Player Names
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className={`${i < gameSettings.playerCount ? 'block' : 'hidden'}`}>
                    <input
                      type="text"
                      value={gameSettings.playerNames[i]}
                      onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                      placeholder={`Player ${i + 1}`}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 text-white placeholder-white/50 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={sessionId && isConnected ? () => updateSettings(gameSettings) : () => handleCreateSession()}
              disabled={isCreating || isJoining}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isCreating ? 'Creating...' : (sessionId && isConnected ? 'Update Settings' : 'Create Session')}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-2">How to use:</h4>
          <ol className="text-green-200 text-sm space-y-1">
            <li>1. <strong>Admin:</strong> Create a new session with a unique ID, optional password, and configure game settings</li>
            <li>2. <strong>Players:</strong> Join using the session ID (leave password empty for view-only mode)</li>
            <li>3. <strong>Admin Access:</strong> Enter the admin password to access game controls (if password is set)</li>
            <li>4. <strong>No Password:</strong> If no admin password is set, anyone can access admin controls</li>
            <li>5. <strong>Share:</strong> Share the session ID and admin password with trusted players</li>
            <li>6. <strong>Play:</strong> Use Admin mode to control the game, players can view in Display mode</li>
            <li>7. <strong>Settings:</strong> Modify game settings anytime from the session manager</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 