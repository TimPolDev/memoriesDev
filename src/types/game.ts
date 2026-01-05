export interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

export interface GameState {
  roomId: string;
  cards: Card[];
  players: Player[];
  currentPlayerId: string | null;
  flippedCards: number[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  winnerId: string | null;
}

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
}

