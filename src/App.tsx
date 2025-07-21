import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { Timer } from './components/Timer';
import { DisplayScreen } from './components/DisplayScreen';
import { HomeScreen } from './components/HomeScreen';
import { SessionManager } from './components/SessionManager';
import { AdminDashboard } from './components/AdminDashboard';
import { SeatSelection } from './components/SeatSelection';
import { PlayerModeHome } from './components/PlayerModeHome';

// Protected Route Component for Admin Access
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  
  // Check if user is admin
  if (state.gameMode !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Player Route Component that handles seat claiming logic
function PlayerRoute() {
  const { state, deviceId, sessionId } = useGame();
  const claimedPlayerId = localStorage.getItem('claimedPlayerId');
  
  console.log('PlayerRoute - gameMode:', state.gameMode, 'claimedPlayerId:', claimedPlayerId);
  console.log('PlayerRoute - localStorage keys:', Object.keys(localStorage));
  console.log('PlayerRoute - deviceId:', deviceId);
  console.log('PlayerRoute - players:', state.players);
  
  // Check if this device has a claimed player in the current game state
  const hasClaimedPlayerInState = state.players.some(player => 
    player.claimedBy === deviceId && player.isClaimed
  );
  
  console.log('PlayerRoute - hasClaimedPlayerInState:', hasClaimedPlayerInState);
  
  // Debug: Log each player's claimedBy and isClaimed status
  state.players.forEach((player, index) => {
    console.log(`PlayerRoute - Player ${index}: id=${player.id}, name=${player.name}, claimedBy=${player.claimedBy}, isClaimed=${player.isClaimed}`);
  });
  
  // If player has claimed a seat (either in localStorage or in current state), show player mode home
  if ((claimedPlayerId || hasClaimedPlayerInState) && state.gameMode === 'player') {
    console.log('PlayerRoute - showing PlayerModeHome');
    return <PlayerModeHome />;
  }
  
  // If player hasn't claimed a seat and is in player mode, redirect to seat selection
  if (state.gameMode === 'player' && !claimedPlayerId && !hasClaimedPlayerInState) {
    console.log('PlayerRoute - redirecting to seat selection');
    return <Navigate to="/seats" replace />;
  }
  
  // If player is in player mode but no session is active, redirect to home
  if (state.gameMode === 'player' && !sessionId) {
    console.log('PlayerRoute - no active session, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  // For admin mode, show timer
  console.log('PlayerRoute - showing Timer for admin');
  return <Timer />;
}

function AppContent() {
  const { state } = useGame();
  
  console.log('AppContent - Current state:', state);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/session" element={<ProtectedAdminRoute><SessionManager /></ProtectedAdminRoute>} />
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/player" element={<PlayerRoute />} />
        <Route path="/player-portal" element={<Timer />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/seats" element={<SeatSelection />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </Router>
  );
}

export default App;
