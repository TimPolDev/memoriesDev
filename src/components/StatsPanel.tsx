'use client';

import { useAuth } from '@/contexts/AuthContext';

interface StatsPanelProps {
  onClose: () => void;
}

export default function StatsPanel({ onClose }: StatsPanelProps) {
  const { profile } = useAuth();

  console.log('📊 [StatsPanel] Rendered, profile:', profile);

  if (!profile) {
    console.log('📊 [StatsPanel] No profile, showing loading state');
    return (
      <div className="stats-overlay">
        <div className="stats-backdrop" onClick={onClose} />
        <div className="stats-panel">
          <button className="stats-close" onClick={onClose}>×</button>
          <div className="stats-loading">
            <div className="loader" />
            <span>Chargement des statistiques...</span>
          </div>
        </div>
      </div>
    );
  }

  const winRate = profile.games_played > 0 
    ? Math.round((profile.games_won / profile.games_played) * 100) 
    : 0;
  
  const avgPairsPerGame = profile.games_played > 0 
    ? (profile.total_pairs_found / profile.games_played).toFixed(1) 
    : '0';

  const ties = profile.games_played - profile.games_won - profile.games_lost;

  return (
    <div className="stats-overlay">
      <div className="stats-backdrop" onClick={onClose} />
      <div className="stats-panel">
        <button className="stats-close" onClick={onClose}>×</button>
        
        <div className="stats-header">
          <div className="stats-avatar">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="stats-title">{profile.username}</h2>
          <p className="stats-subtitle">Statistiques de jeu</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card main">
            <span className="stat-value">{profile.games_played}</span>
            <span className="stat-label">Parties jouées</span>
          </div>
          
          <div className="stat-card win">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">{profile.games_won}</span>
            <span className="stat-label">Victoires</span>
          </div>
          
          <div className="stat-card loss">
            <span className="stat-icon">😢</span>
            <span className="stat-value">{profile.games_lost}</span>
            <span className="stat-label">Défaites</span>
          </div>
          
          <div className="stat-card tie">
            <span className="stat-icon">🤝</span>
            <span className="stat-value">{ties}</span>
            <span className="stat-label">Égalités</span>
          </div>
        </div>

        <div className="stats-details">
          <div className="stat-row">
            <span className="stat-row-label">Taux de victoire</span>
            <div className="stat-row-value">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <span className="progress-text">{winRate}%</span>
            </div>
          </div>
          
          <div className="stat-row">
            <span className="stat-row-label">Paires trouvées (total)</span>
            <span className="stat-row-number">{profile.total_pairs_found}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-row-label">Moyenne par partie</span>
            <span className="stat-row-number">{avgPairsPerGame} paires</span>
          </div>
        </div>
      </div>
    </div>
  );
}

