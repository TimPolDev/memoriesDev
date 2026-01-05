'use client';

import { useSocket } from '@/contexts/SocketContext';
import GameBoard from './GameBoard';
import GameStatus from './GameStatus';

interface GameProps {
  roomId: string;
  onLeave: () => void;
}

export default function Game({ roomId, onLeave }: GameProps) {
  const { gameState, playerId } = useSocket();

  const isMyTurn = gameState?.currentPlayerId === playerId;

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="room-info">
          <span className="room-label">Code de la partie</span>
          <span className="room-code">{roomId}</span>
        </div>
        
        {gameState?.gameStatus === 'playing' && (
          <div className={`turn-banner ${isMyTurn ? 'your-turn' : 'opponent-turn'}`}>
            {isMyTurn ? '🎯 À vous de jouer !' : '⏳ Tour de l\'adversaire'}
          </div>
        )}

        <button className="leave-btn" onClick={onLeave}>
          Quitter
        </button>
      </header>

      <main className="game-main">
        <GameStatus />
        {gameState?.gameStatus === 'playing' && <GameBoard />}
        
        {gameState?.gameStatus === 'waiting' && gameState.players.length === 2 && (
          <div className="waiting-to-start">
            <div className="cards-preview">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="preview-card">
                  <span>✦</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

