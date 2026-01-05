'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserMenuProps {
  onShowStats: () => void;
}

export default function UserMenu({ onShowStats }: UserMenuProps) {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  console.log('📊 [UserMenu] Rendered, user:', !!user, 'isOpen:', isOpen);

  if (!user) {
    console.log('📊 [UserMenu] No user, returning null');
    return null;
  }

  const username = profile?.username || user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Joueur';

  return (
    <div className="user-menu">
      <button 
        className="user-menu-trigger"
        onClick={() => {
          console.log('📊 [UserMenu] Trigger clicked, toggling menu');
          setIsOpen(!isOpen);
        }}
      >
        <span className="user-avatar">
          {username.charAt(0).toUpperCase()}
        </span>
        <span className="user-name">{username}</span>
        <span className="user-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="user-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <span className="user-email">{user.email}</span>
            </div>
            <button 
              className="user-menu-item"
              onClick={() => {
                console.log('📊 [UserMenu] Stats button clicked');
                onShowStats();
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">📊</span>
              Mes statistiques
            </button>
            <button 
              className="user-menu-item logout"
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">🚪</span>
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
