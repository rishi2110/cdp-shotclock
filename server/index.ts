import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

// Read allowed CORS origins from environment variable (comma-separated)
const corsOriginsEnv = process.env.CORS_ORIGINS || '';
const allowedOrigins = corsOriginsEnv
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Game sessions storage
const gameSessions = new Map<string, any>();

// Device to player mapping for seat restoration
const devicePlayerMap = new Map<string, { sessionId: string; playerId: string; position: number; playerName: string }>();

// Logging function
function logAction(sessionId: string, action: string, playerId: string, deviceId: string, details?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    sessionId,
    action,
    playerId,
    deviceId,
    details
  };
  
  console.log('🎮 GAME ACTION:', JSON.stringify(logEntry, null, 2));
  
  // In a real app, you'd save this to a database
  // For now, we'll just console.log it
}

// Generate device ID
function generateDeviceId(): string {
  return `device_${uuidv4().substring(0, 8)}`;
}

// API Routes
app.post('/api/sessions', (req, res) => {
  const { sessionId, gameSettings, adminPassword } = req.body;
  
  if (gameSessions.has(sessionId)) {
    return res.status(400).json({ error: 'Session ID already exists' });
  }
  
  const session = {
    id: sessionId,
    settings: gameSettings,
    adminPassword: adminPassword || null,
    state: {
      players: gameSettings.playerNames.slice(0, gameSettings.playerCount).map((name: string, index: number) => ({
        id: `player-${index + 1}`,
        name: name || `Player ${index + 1}`,
        position: index + 1,
        timeBank: gameSettings.maxTimeBank,
        isActive: false, // Players are inactive until claimed
        isCurrentPlayer: false, // No current player until game starts
        remainingTime: gameSettings.timeLimit,
        isClaimed: false,
        claimedBy: undefined,
        canChangeName: false,
      })),
      currentPlayerIndex: 0,
      timeLimit: gameSettings.timeLimit,
      isRunning: false,
      isPaused: false,
      gameMode: 'admin',
      maxTimeBank: gameSettings.maxTimeBank,
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  gameSessions.set(sessionId, session);
  
  logAction(sessionId, 'SESSION_CREATED', 'admin', 'system', { gameSettings, hasPassword: !!adminPassword });
  
  res.json({ sessionId, success: true });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = gameSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

app.post('/api/sessions/:sessionId/join', (req, res) => {
  const { sessionId } = req.params;
  const { deviceId, password } = req.body;
  
  const session = gameSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check if user is trying to access admin mode
  // If no admin password is set on session, anyone can be admin
  // If admin password is set, only those with correct password can be admin
  const isAdmin = !session.adminPassword || (session.adminPassword && password === session.adminPassword);
  
  // Check if device has already claimed a seat in this session
  const existingClaim = devicePlayerMap.get(deviceId);
  let claimedPlayer = null;
  
  if (existingClaim && existingClaim.sessionId === sessionId) {
    // Device has already claimed a seat in this session
    const player = session.state.players.find((p: any) => p.id === existingClaim.playerId);
    if (player && player.isClaimed && player.claimedBy === deviceId) {
      claimedPlayer = {
        id: player.id,
        position: player.position,
        name: player.name
      };
    }
  }
  
  logAction(sessionId, 'PLAYER_JOINED', isAdmin ? 'admin' : 'player', deviceId, { isAdmin, hasClaimedSeat: !!claimedPlayer });
  
  res.json({ 
    sessionId, 
    success: true, 
    isAdmin,
    hasPassword: !!session.adminPassword,
    claimedPlayer // Include claimed player info if device has already claimed a seat
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  let currentSessionId: string | null = null;
  let deviceId: string | null = null;
  
  socket.on('join-session', (data: { sessionId: string; deviceId: string; isAdmin?: boolean }) => {
    currentSessionId = data.sessionId;
    deviceId = data.deviceId;
    
    socket.join(data.sessionId);
    
    const session = gameSessions.get(data.sessionId);
    if (session) {
      // Set game mode based on user role
      if (data.isAdmin) {
        session.state.gameMode = 'admin';
      } else {
        session.state.gameMode = 'player';
      }
      
      socket.emit('game-state', session.state);
      logAction(data.sessionId, 'SOCKET_JOINED', data.isAdmin ? 'admin' : 'player', data.deviceId);
    }
  });
  
  socket.on('update-settings', (data: { sessionId: string; settings: any; deviceId: string }) => {
    const session = gameSessions.get(data.sessionId);
    if (session) {
      session.settings = data.settings;
      session.state = {
        ...session.state,
        players: data.settings.playerNames.slice(0, data.settings.playerCount).map((name: string, index: number) => ({
          id: `player-${index + 1}`,
          name: name || `Player ${index + 1}`,
          position: index + 1,
          timeBank: data.settings.maxTimeBank,
          isActive: true,
          isCurrentPlayer: index === 0,
          remainingTime: data.settings.timeLimit,
        })),
        timeLimit: data.settings.timeLimit,
        maxTimeBank: data.settings.maxTimeBank,
        currentPlayerIndex: 0,
      };
      session.lastUpdated = new Date().toISOString();
      
      logAction(data.sessionId, 'SETTINGS_UPDATED', 'admin', data.deviceId, { settings: data.settings });
      
      io.to(data.sessionId).emit('game-state', session.state);
    }
  });
  
  socket.on('game-action', (data: { 
    sessionId: string; 
    action: string; 
    playerId?: string; 
    deviceId: string;
    details?: any;
    playerName?: string;
    fromIndex?: number;
    toIndex?: number;
  }) => {
    const session = gameSessions.get(data.sessionId);
    if (!session) return;
    
    // Skip logging for UPDATE_TIMER events to reduce log noise
    if (data.action !== 'UPDATE_TIMER') {
      logAction(data.sessionId, data.action, data.playerId || 'unknown', data.deviceId, data.details);
    }
    
    switch (data.action) {
      case 'START_GAME':
        // Only start if there are claimed players
        const claimedPlayers = session.state.players.filter((p: any) => p.isClaimed);
        if (claimedPlayers.length > 0) {
          session.state.isRunning = true;
          session.state.isPaused = false;
          // Set the first claimed player as current
          const firstClaimedIndex = session.state.players.findIndex((p: any) => p.isClaimed);
          session.state.currentPlayerIndex = firstClaimedIndex;
          session.state.players = session.state.players.map((player: any, index: number) => ({
            ...player,
            isCurrentPlayer: index === firstClaimedIndex,
          }));
        }
        break;
        
      case 'PAUSE_GAME':
        session.state.isPaused = true;
        break;
        
      case 'RESET_GAME':
        session.state.isRunning = false;
        session.state.isPaused = false;
        // Find first claimed player
        const firstClaimedIndex = session.state.players.findIndex((p: any) => p.isClaimed);
        session.state.currentPlayerIndex = firstClaimedIndex >= 0 ? firstClaimedIndex : 0;
        session.state.players = session.state.players.map((player: any, index: number) => ({
          ...player,
          remainingTime: session.state.timeLimit,
          isCurrentPlayer: index === session.state.currentPlayerIndex,
        }));
        break;
        
      case 'NEXT_PLAYER':
        // Find next claimed player
        const currentIndex = session.state.currentPlayerIndex;
        let nextIndex = currentIndex;
        let attempts = 0;
        
        do {
          nextIndex = (nextIndex + 1) % session.state.players.length;
          attempts++;
        } while (!session.state.players[nextIndex].isClaimed && attempts < session.state.players.length);
        
        // Only advance if we found a claimed player
        if (session.state.players[nextIndex].isClaimed) {
          session.state.currentPlayerIndex = nextIndex;
          session.state.players = session.state.players.map((player: any, index: number) => ({
            ...player,
            isCurrentPlayer: index === nextIndex,
            remainingTime: index === nextIndex ? session.state.timeLimit : player.remainingTime,
          }));
        }
        break;
        
      case 'UPDATE_TIMER':
        if (session.state.isRunning && !session.state.isPaused) {
          session.state.players = session.state.players.map((player: any) => {
            if (player.isCurrentPlayer && player.remainingTime > 0 && player.isClaimed) {
              return { ...player, remainingTime: player.remainingTime - 1 };
            }
            return player;
          });
          // Don't log UPDATE_TIMER events to reduce log noise
        }
        break;
        
      case 'CLAIM_SEAT':
        if (data.details && data.details.position && data.details.playerName) {
          const position = data.details.position;
          const playerName = data.details.playerName;
          
          // Check if device has already claimed a seat in this session
          const existingClaim = devicePlayerMap.get(data.deviceId);
          if (existingClaim && existingClaim.sessionId === data.sessionId) {
            socket.emit('claim-seat-response', { 
              success: false, 
              error: 'Device has already claimed a seat in this session' 
            });
            return;
          }
          
          // Find the player at the specified position
          const playerIndex = session.state.players.findIndex((p: any) => p.position === position);
          
          if (playerIndex !== -1 && !session.state.players[playerIndex].isClaimed) {
            // Claim the seat
            session.state.players[playerIndex] = {
              ...session.state.players[playerIndex],
              name: playerName,
              isClaimed: true,
              claimedBy: data.deviceId,
              canChangeName: true,
              isActive: true,
            };
            
            // Store device to player mapping
            devicePlayerMap.set(data.deviceId, {
              sessionId: data.sessionId,
              playerId: session.state.players[playerIndex].id,
              position: position,
              playerName: playerName
            });
            
            // Send success response to the claiming player
            socket.emit('claim-seat-response', { 
              success: true, 
              position, 
              playerName,
              playerId: session.state.players[playerIndex].id 
            });
          } else {
            // Send error response
            socket.emit('claim-seat-response', { 
              success: false, 
              error: 'Seat already claimed or invalid position' 
            });
          }
        }
        break;
        
      case 'USE_TIME_BANK':
        if (data.playerId) {
          session.state.players = session.state.players.map((player: any) => {
            if (player.id === data.playerId && player.timeBank > 0) {
              return { 
                ...player, 
                timeBank: player.timeBank - 1, 
                remainingTime: player.remainingTime + 30 // Add 30 seconds instead of resetting
              };
            }
            return player;
          });
        }
        break;
        
      case 'RESET_PLAYER_TIMER':
        if (data.playerId) {
          session.state.players = session.state.players.map((player: any) => {
            if (player.id === data.playerId) {
              return { ...player, remainingTime: session.state.timeLimit };
            }
            return player;
          });
        }
        break;
        
      case 'SET_CURRENT_PLAYER':
        if (data.playerId) {
          session.state.players = session.state.players.map((player: any) => ({
            ...player,
            isCurrentPlayer: player.id === data.playerId,
          }));
          session.state.currentPlayerIndex = session.state.players.findIndex((p: any) => p.id === data.playerId);
        }
        break;
        
      case 'UPDATE_PLAYER_NAME':
        if (data.playerId && data.playerName) {
          session.state.players = session.state.players.map((player: any) => {
            if (player.id === data.playerId) {
              return { ...player, name: data.playerName };
            }
            return player;
          });
        }
        break;
        
      case 'MOVE_PLAYER':
        if (data.fromIndex !== undefined && data.toIndex !== undefined) {
          const players = [...session.state.players];
          const [movedPlayer] = players.splice(data.fromIndex, 1);
          players.splice(data.toIndex, 0, movedPlayer);
          
          // Update positions
          players.forEach((player: any, index: number) => {
            player.position = index + 1;
          });
          
          session.state.players = players;
        }
        break;
        
      case 'DELETE_SESSION':
        gameSessions.delete(data.sessionId);
        break;
    }
    
    session.lastUpdated = new Date().toISOString();
    io.to(data.sessionId).emit('game-state', session.state);
  });
  
  socket.on('disconnect', () => {
    if (currentSessionId && deviceId) {
      logAction(currentSessionId, 'PLAYER_DISCONNECTED', 'unknown', deviceId);
    }
  });
});

// Clean up old sessions (older than 24 hours)
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of gameSessions.entries()) {
    const sessionAge = now.getTime() - new Date(session.createdAt).getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
      gameSessions.delete(sessionId);
      console.log(`🗑️ Cleaned up old session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // Check every hour

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Poker Shot Clock Server running on port ${PORT}`);
  console.log(`📊 Active sessions: ${gameSessions.size}`);
}); 