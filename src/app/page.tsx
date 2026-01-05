'use client';

import { useState } from 'react';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import AuthForm from '@/components/AuthForm';
import Lobby from '@/components/Lobby';
import Game from '@/components/Game';
import StatsPanel from '@/components/StatsPanel';

function GameApp() {
  const { user, loading, profile } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  console.log('🎮 [GameApp] Render:', { loading, hasUser: !!user, userId: user?.id, hasProfile: !!profile });

  const handleJoinGame = (roomId: string) => {
    console.log('🎮 [GameApp] handleJoinGame:', roomId);
    setCurrentRoom(roomId);
  };

  const handleLeaveGame = () => {
    console.log('🎮 [GameApp] handleLeaveGame - reloading page');
    setCurrentRoom(null);
    window.location.reload();
  };

  // Loading state
  if (loading) {
    console.log('🎮 [GameApp] Showing loading screen');
    return (
      <div className="app">
        <ThemeToggle />
        <div className="loading-screen">
          <div className="loader" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth form
  if (!user) {
    return (
      <div className="app">
        <ThemeToggle />
        <AuthForm />
      </div>
    );
  }

  // Authenticated - show game
  return (
    <SocketProvider>
      <div className="app">
        <ThemeToggle />
        <UserMenu onShowStats={() => {
          console.log('📊 [GameApp] onShowStats called, setting showStats to true');
          setShowStats(true);
        }} />
        
        {!currentRoom ? (
          <Lobby onJoinGame={handleJoinGame} />
        ) : (
          <Game roomId={currentRoom} onLeave={handleLeaveGame} />
        )}

        {showStats && <StatsPanel onClose={() => {
          console.log('📊 [GameApp] StatsPanel onClose called');
          setShowStats(false);
        }} />}
      </div>
    </SocketProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GameApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
