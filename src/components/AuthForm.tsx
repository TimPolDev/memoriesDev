'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthForm() {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Veuillez entrer un pseudo');
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, username.trim());
        
        if (result.success) {
          setSuccess(result.error || 'Compte créé ! Vérifiez votre email.');
          setIsSignUp(false);
          setPassword('');
        } else {
          setError(result.error || 'Erreur lors de l\'inscription');
        }
      } else {
        const result = await signIn(email, password);
        
        if (!result.success) {
          setError(result.error || 'Erreur lors de la connexion');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-emoji">🎴</span>
          <h1 className="auth-title">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="auth-subtitle">Memory Game Multijoueur</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="username">Pseudo</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo"
                required={isSignUp}
                maxLength={20}
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-text">
                <span className="loader-small" />
                Chargement...
              </span>
            ) : (
              isSignUp ? 'S\'inscrire' : 'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={toggleMode} className="auth-toggle">
            {isSignUp 
              ? 'Déjà un compte ? Se connecter' 
              : 'Pas de compte ? S\'inscrire'}
          </button>
        </div>
      </div>
    </div>
  );
}

