export interface Player {
  id: string;
  name: string;
  position: number;
  timeBank: number;
  isActive: boolean;
  isCurrentPlayer: boolean;
  remainingTime: number;
  isClaimed: boolean;
  claimedBy?: string;
  canChangeName: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  timeLimit: number;
  isRunning: boolean;
  isPaused: boolean;
  gameMode: 'admin' | 'player';
  maxTimeBank: number;
}

export interface TimerConfig {
  timeLimit: number;
  maxTimeBank: number;
  timeBankIncrement: number;
}

export interface GameSettings {
  playerCount: number;
  timeLimit: number;
  maxTimeBank: number;
  timeBankIncrement: number;
  playerNames: string[];
} 