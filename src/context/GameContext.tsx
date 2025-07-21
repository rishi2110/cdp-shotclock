import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Player, GameSettings } from '../types';

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  timeLimit: number;
  isRunning: boolean;
  isPaused: boolean;
  gameMode: 'admin' | 'player' | 'display';
  maxTimeBank: number;
}

interface GameContextType {
  state: GameState;
  sessionId: string | null;
  deviceId: string | null;
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string, password?: string) => Promise<{ success: boolean; isAdmin: boolean; claimedPlayer?: any }>;
  createSession: (sessionId: string, settings: GameSettings, adminPassword?: string) => Promise<boolean>;
  claimSeat: (position: number, playerName: string) => Promise<void>;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  nextPlayer: () => void;
  useTimeBank: (playerId: string) => void;
  resetPlayerTimer: (playerId: string) => void;
  setCurrentPlayer: (playerId: string) => void;
  updatePlayerName: (playerId: string, playerName: string) => void;
  movePlayer: (fromIndex: number, toIndex: number) => void;
  deleteSession: () => void;
  updateSettings: (settings: GameSettings) => void;
  disconnect: () => void;
}

type GameAction =
  | { type: 'SET_SESSION'; sessionId: string; deviceId: string }
  | { type: 'SET_CONNECTION_STATUS'; isConnected: boolean }
  | { type: 'UPDATE_STATE'; state: GameState }
  | { type: 'SET_GAME_MODE'; gameMode: 'admin' | 'player' | 'display' }
  | { type: 'DISCONNECT' };

const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  timeLimit: 30,
  isRunning: false,
  isPaused: false,
  gameMode: 'admin',
  maxTimeBank: 3,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_STATE':
      return action.state;
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.gameMode };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [deviceId, setDeviceId] = React.useState<string | null>(null);
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  // Generate persistent device ID on mount
  useEffect(() => {
    const generatePersistentDeviceId = async () => {
      const storedDeviceId = localStorage.getItem('poker_device_id');
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
        return;
      }

      // Try to create a more persistent device ID using available browser APIs
      let deviceFingerprint = '';
      
      try {
        // Use screen resolution, user agent, and timezone as part of the fingerprint
        const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userAgent = navigator.userAgent;
        
        // Create a hash-like string from these values
        deviceFingerprint = btoa(`${screenInfo}-${timezone}-${userAgent}`).substring(0, 16);
      } catch (error) {
        // Fallback to random if fingerprinting fails
        deviceFingerprint = Math.random().toString(36).substr(2, 8);
      }
      
      const newDeviceId = `device_${deviceFingerprint}`;
      localStorage.setItem('poker_device_id', newDeviceId);
      setDeviceId(newDeviceId);
    };

    generatePersistentDeviceId();
  }, []);

  // Timer effect for local countdown
  useEffect(() => {
    if (!state.isRunning || state.isPaused || !socket) return;

    const interval = setInterval(() => {
      socket.emit('game-action', {
        sessionId,
        action: 'UPDATE_TIMER',
        deviceId,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused, socket, sessionId, deviceId]);

  // Auto-advance when time runs out
  useEffect(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.remainingTime <= 0 && state.isRunning && socket) {
      setTimeout(() => {
        socket.emit('game-action', {
          sessionId,
          action: 'NEXT_PLAYER',
          deviceId,
        });
      }, 1000);
    }
  }, [state.players, state.currentPlayerIndex, state.isRunning, socket, sessionId, deviceId]);

  const createSession = async (newSessionId: string, settings: GameSettings, adminPassword?: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          gameSettings: settings,
          adminPassword,
        }),
      });

      if (response.ok) {
        setSessionId(newSessionId);
        // Set game mode to admin for session creator
        dispatch({ type: 'SET_GAME_MODE', gameMode: 'admin' });
        
        // Store session info in localStorage for persistence
        localStorage.setItem('sessionId', newSessionId);
        localStorage.setItem('gameMode', 'admin');
        
        // Connect socket as admin
        connectSocket(newSessionId, true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create session:', error);
      return false;
    }
  };

  const joinSession = async (newSessionId: string, password?: string): Promise<{ success: boolean; isAdmin: boolean; claimedPlayer?: any }> => {
    try {
      const isDisplay = password === '__display__';
      const response = await fetch(`${API_BASE}/api/sessions/${newSessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          password: isDisplay ? undefined : password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(newSessionId);
        
        // Update game mode based on server response
        let gameMode: 'admin' | 'player' | 'display' = 'player';
        if (isDisplay) {
          gameMode = 'display';
        } else if (data.isAdmin) {
          gameMode = 'admin';
        }
        dispatch({ type: 'SET_GAME_MODE', gameMode });
        
        // Store session info in localStorage for persistence
        localStorage.setItem('sessionId', newSessionId);
        localStorage.setItem('gameMode', gameMode);
        
        // Store claimed player info if device has already claimed a seat
        if (data.claimedPlayer) {
          localStorage.setItem('claimedPlayerId', data.claimedPlayer.id);
          localStorage.setItem('claimedPlayerName', data.claimedPlayer.name);
          localStorage.setItem('claimedPlayerPosition', data.claimedPlayer.position.toString());
        }
        
        // Connect socket with correct role
        connectSocket(newSessionId, data.isAdmin, isDisplay);
        
        return { success: true, isAdmin: data.isAdmin, claimedPlayer: data.claimedPlayer };
      }
      return { success: false, isAdmin: false };
    } catch (error) {
      console.error('Failed to join session:', error);
      return { success: false, isAdmin: false };
    }
  };

  const connectSocket = (newSessionId: string, isAdmin: boolean = false, isDisplay: boolean = false) => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(API_BASE);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-session', {
        sessionId: newSessionId,
        deviceId,
        isAdmin,
        isDisplay,
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('game-state', (newState: GameState) => {
      // Preserve the local game mode when updating state from server
      const currentGameMode = state.gameMode;
      dispatch({ type: 'UPDATE_STATE', state: { ...newState, gameMode: currentGameMode } });
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setSessionId(null);
    setIsConnected(false);
    
    // Clear session data from localStorage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('gameMode');
    localStorage.removeItem('claimedPlayerId');
    localStorage.removeItem('claimedPlayerName');
    localStorage.removeItem('claimedPlayerPosition');
    
    dispatch({ type: 'UPDATE_STATE', state: initialState });
  };

  const startGame = () => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'START_GAME',
        deviceId,
      });
    }
  };

  const pauseGame = () => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'PAUSE_GAME',
        deviceId,
      });
    }
  };

  const resetGame = () => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'RESET_GAME',
        deviceId,
      });
    }
  };

  const nextPlayer = () => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'NEXT_PLAYER',
        deviceId,
      });
    }
  };

  const useTimeBank = (playerId: string) => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'USE_TIME_BANK',
        playerId,
        deviceId,
      });
    }
  };

  const resetPlayerTimer = (playerId: string) => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'RESET_PLAYER_TIMER',
        playerId,
        deviceId,
      });
    }
  };

  const setCurrentPlayer = (playerId: string) => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'SET_CURRENT_PLAYER',
        playerId,
        deviceId,
      });
    }
  };

  const updatePlayerName = (playerId: string, playerName: string) => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'UPDATE_PLAYER_NAME',
        playerId,
        playerName,
        deviceId,
      });
    }
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'MOVE_PLAYER',
        fromIndex,
        toIndex,
        deviceId,
      });
    }
  };

  const deleteSession = () => {
    if (socket && sessionId) {
      socket.emit('game-action', {
        sessionId,
        action: 'DELETE_SESSION',
        deviceId,
      });
    }
  };

  const claimSeat = async (position: number, playerName: string): Promise<void> => {
    if (!socket || !sessionId) {
      throw new Error('Not connected to session');
    }

    return new Promise((resolve, reject) => {
      socket.emit('game-action', {
        sessionId,
        action: 'CLAIM_SEAT',
        deviceId,
        details: { position, playerName },
      });

      // Listen for the response
      const timeout = setTimeout(() => {
        reject(new Error('Claim seat timeout'));
      }, 5000);

      const handleClaimResponse = (data: any) => {
        if (data.success) {
          clearTimeout(timeout);
          socket.off('claim-seat-response', handleClaimResponse);
          // Store the claimed player information
          if (data.playerId) {
            localStorage.setItem('claimedPlayerId', data.playerId);
            localStorage.setItem('claimedPlayerName', playerName);
            localStorage.setItem('claimedPlayerPosition', position.toString());
          }
          resolve();
        } else {
          clearTimeout(timeout);
          socket.off('claim-seat-response', handleClaimResponse);
          reject(new Error(data.error || 'Failed to claim seat'));
        }
      };

      socket.on('claim-seat-response', handleClaimResponse);
    });
  };

  const updateSettings = (settings: GameSettings) => {
    if (socket && sessionId) {
      socket.emit('update-settings', {
        sessionId,
        settings,
        deviceId,
      });
    }
  };

  // Connect socket when sessionId changes
  useEffect(() => {
    if (sessionId && deviceId) {
      connectSocket(sessionId, state.gameMode === 'admin');
    }
  }, [sessionId, deviceId, state.gameMode]);

  // Auto-rejoin session on page load if session exists in localStorage
  useEffect(() => {
    const autoRejoinSession = async () => {
      if (deviceId && !sessionId) {
        const storedSessionId = localStorage.getItem('sessionId');
        const storedGameMode = localStorage.getItem('gameMode') as 'admin' | 'player' | null;
        
        if (storedSessionId && storedGameMode) {
          console.log('Auto-rejoining session:', storedSessionId, 'as', storedGameMode);
          try {
            const result = await joinSession(storedSessionId);
            if (result.success) {
              console.log('Auto-rejoin successful');
            } else {
              console.log('Auto-rejoin failed, clearing stored session');
              localStorage.removeItem('sessionId');
              localStorage.removeItem('gameMode');
            }
          } catch (error) {
            console.error('Auto-rejoin error:', error);
            localStorage.removeItem('sessionId');
            localStorage.removeItem('gameMode');
          }
        }
      }
    };

    autoRejoinSession();
  }, [deviceId, sessionId]);

  const value = {
    state,
    sessionId,
    deviceId,
    socket,
    isConnected,
    joinSession,
    createSession,
    claimSeat,
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
    updateSettings,
    disconnect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 