'use client';

import { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface LobbyProps {
  onJoinGame: (roomId: string) => void;
}

export default function Lobby({ onJoinGame }: LobbyProps) {
  const { isConnected, createRoom, joinRoom } = useSocket();
  const { user, profile } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get username from profile or auth
  const playerName = profile?.username || user?.user_metadata?.username || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Joueur';

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    const result = await createRoom(playerName);
    
    if (result.success && result.roomId) {
      onJoinGame(result.roomId);
    } else {
      setError(result.error || 'Erreur lors de la création');
    }
    
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Entrez le code de la partie');
      return;
    }

    setLoading(true);
    setError('');

    const result = await joinRoom(roomCode.trim().toUpperCase(), playerName);
    
    if (result.success) {
      onJoinGame(roomCode.trim().toUpperCase());
    } else {
      setError(result.error || 'Erreur lors de la connexion');
    }
    
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <div className="connecting">
            <div className="loader" />
            <span>Connexion au serveur...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-header">
          <h1 className="lobby-title">
            <span className="title-emoji">🎴</span>
            Memory
          </h1>
          <p className="lobby-subtitle">Bienvenue, <strong>{playerName}</strong> !</p>
        </div>

        {mode === 'select' && (
          <div className="mode-select">
            <button className="mode-btn create" onClick={() => setMode('create')}>
              <span className="btn-icon">✨</span>
              Créer une partie
            </button>
            <button className="mode-btn join" onClick={() => setMode('join')}>
              <span className="btn-icon">🔗</span>
              Rejoindre une partie
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="lobby-form">
            <button className="back-btn" onClick={() => { setMode('select'); setError(''); }}>
              ← Retour
            </button>

            <div className="create-info">
              <p>Vous allez créer une nouvelle partie.</p>
              <p className="create-hint">Partagez le code avec votre ami pour qu&apos;il puisse vous rejoindre !</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="submit-btn"
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="loader-small" />
                  Création...
                </span>
              ) : (
                'Créer la partie'
              )}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="lobby-form">
            <button className="back-btn" onClick={() => { setMode('select'); setError(''); }}>
              ← Retour
            </button>

            <div className="form-group">
              <label htmlFor="roomCode">Code de la partie</label>
              <input
                id="roomCode"
                type="text"
                placeholder="Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="submit-btn"
              onClick={handleJoinRoom}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="loader-small" />
                  Connexion...
                </span>
              ) : (
                'Rejoindre'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
