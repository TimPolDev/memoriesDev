'use client';

import { useSocket } from '@/contexts/SocketContext';
import Card from './Card';

export default function GameBoard() {
  const { gameState, playerId, flipCard } = useSocket();

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === playerId;
  const canPlay = gameState.gameStatus === 'playing' && isMyTurn && gameState.flippedCards.length < 2;

  return (
    <div className="game-board-container">
      <div className="game-board">
        {gameState.cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={() => flipCard(card.id)}
            disabled={!canPlay}
          />
        ))}
      </div>
    </div>
  );
}

