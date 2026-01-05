'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/types/game';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  createRoom: (playerName: string) => Promise<{ success: boolean; roomId?: string; error?: string }>;
  joinRoom: (roomId: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
  setReady: () => void;
  flipCard: (cardId: number) => void;
  restartGame: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io({
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.IO');
      setIsConnected(true);
      setPlayerId(socketInstance.id || null);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
      setIsConnected(false);
    });

    socketInstance.on('game-state-update', (state: GameState) => {
      console.log('📦 État du jeu mis à jour:', state);
      setGameState(state);
    });

    socketInstance.on('player-left', (playerName: string) => {
      console.log(`👋 ${playerName} a quitté la partie`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = (playerName: string): Promise<{ success: boolean; roomId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Non connecté' });
        return;
      }

      socket.emit('create-room', playerName, (response: { success: boolean; roomId?: string; gameState?: GameState; error?: string }) => {
        if (response.success && response.gameState) {
          setGameState(response.gameState);
        }
        resolve(response);
      });
    });
  };

  const joinRoom = (roomId: string, playerName: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Non connecté' });
        return;
      }

      socket.emit('join-room', { roomId, playerName }, (response: { success: boolean; gameState?: GameState; error?: string }) => {
        if (response.success && response.gameState) {
          setGameState(response.gameState);
        }
        resolve(response);
      });
    });
  };

  const setReady = () => {
    socket?.emit('player-ready');
  };

  const flipCard = (cardId: number) => {
    socket?.emit('flip-card', cardId);
  };

  const restartGame = () => {
    socket?.emit('restart-game');
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        gameState,
        playerId,
        createRoom,
        joinRoom,
        setReady,
        flipCard,
        restartGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

