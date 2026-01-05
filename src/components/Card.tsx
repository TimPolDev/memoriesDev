'use client';

import { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
}

export default function Card({ card, onClick, disabled }: CardProps) {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <button
      className={`card ${isRevealed ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
      onClick={onClick}
      disabled={disabled || card.isMatched || card.isFlipped}
      aria-label={isRevealed ? card.emoji : 'Carte cachée'}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="card-symbol">✦</span>
        </div>
        <div className="card-back">
          <span className="card-emoji">{card.emoji}</span>
        </div>
      </div>
    </button>
  );
}

