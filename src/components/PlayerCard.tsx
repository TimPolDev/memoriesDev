'use client';

import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  isYou: boolean;
}

export default function PlayerCard({ player, isCurrentTurn, isYou }: PlayerCardProps) {
  return (
    <div className={`player-card ${isCurrentTurn ? 'active' : ''} ${isYou ? 'is-you' : ''}`}>
      <div className="player-info">
        <span className="player-name">
          {player.name}
          {isYou && <span className="you-badge">Vous</span>}
        </span>
        <span className={`player-status ${player.isReady ? 'ready' : ''}`}>
          {player.isReady ? '✓ Prêt' : '○ En attente'}
        </span>
      </div>
      <div className="player-score">
        <span className="score-value">{player.score}</span>
        <span className="score-label">paires</span>
      </div>
      {isCurrentTurn && (
        <div className="turn-indicator">
          <span className="turn-dot" />
          À son tour
        </div>
      )}
    </div>
  );
}

