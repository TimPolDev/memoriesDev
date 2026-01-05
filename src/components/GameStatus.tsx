'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import PlayerCard from './PlayerCard';

export default function GameStatus() {
  const { gameState, playerId, setReady, restartGame } = useSocket();
  const { updateStats } = useAuth();
  const statsUpdatedRef = useRef(false);

  // Update stats when game finishes
  useEffect(() => {
    const saveStats = async () => {
      if (!gameState || gameState.gameStatus !== 'finished' || statsUpdatedRef.current) {
        return;
      }

      const me = gameState.players.find(p => p.id === playerId);
      if (!me) return;

      statsUpdatedRef.current = true;

      const isWinner = gameState.winnerId === playerId;
      const isTie = gameState.winnerId === null;

      await updateStats(isWinner && !isTie, !isWinner && !isTie, me.score);
    };

    saveStats();
  }, [gameState, playerId, updateStats]);

  // Reset flag when game restarts
  useEffect(() => {
    if (gameState?.gameStatus === 'waiting') {
      statsUpdatedRef.current = false;
    }
  }, [gameState?.gameStatus]);

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isReady = currentPlayer?.isReady ?? false;

  return (
    <div className="game-status">
      <div className="players-container">
        {gameState.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentTurn={gameState.currentPlayerId === player.id}
            isYou={player.id === playerId}
          />
        ))}
        
        {gameState.players.length < 2 && (
          <div className="waiting-player">
            <div className="waiting-animation">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span>En attente d&apos;un autre joueur...</span>
          </div>
        )}
      </div>

      {gameState.gameStatus === 'waiting' && gameState.players.length === 2 && !isReady && (
        <button className="ready-btn" onClick={setReady}>
          Je suis prêt !
        </button>
      )}

      {gameState.gameStatus === 'waiting' && isReady && (
        <div className="waiting-message">
          En attente que l&apos;autre joueur soit prêt...
        </div>
      )}

      {gameState.gameStatus === 'finished' && (
        <div className="game-over">
          {gameState.winnerId === null ? (
            <>
              <h2 className="game-over-title">🤝 Égalité !</h2>
              <p className="game-over-text">
                Les deux joueurs ont trouvé {gameState.players[0]?.score} paires !
              </p>
            </>
          ) : (
            <>
              <h2 className="game-over-title">
                {gameState.winnerId === playerId ? '🎉 Victoire !' : '😢 Défaite'}
              </h2>
              <p className="game-over-text">
                {gameState.players.find(p => p.id === gameState.winnerId)?.name} a gagné !
              </p>
            </>
          )}
          <button className="restart-btn" onClick={restartGame}>
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
