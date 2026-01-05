const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Emojis pour les cartes
const CARD_EMOJIS = [
  '🦊', '🐼', '🦁', '🐸', '🦋', '🌸', '🍄', '🌺',
  '🎮', '🎲', '⭐', '🌙', '🔥', '💎', '🎯', '🎪'
];

// Stockage des rooms en mémoire
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createDeck() {
  const selectedEmojis = CARD_EMOJIS.slice(0, 8);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  
  // Mélanger les cartes (Fisher-Yates)
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  
  return pairs.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false
  }));
}

function createRoom(roomId) {
  return {
    roomId,
    cards: createDeck(),
    players: [],
    currentPlayerId: null,
    flippedCards: [],
    gameStatus: 'waiting',
    winnerId: null
  };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion:', socket.id);

    // Créer une nouvelle partie
    socket.on('create-room', (playerName, callback) => {
      const roomId = generateRoomId();
      const room = createRoom(roomId);
      
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        isReady: false
      };
      
      room.players.push(player);
      rooms.set(roomId, room);
      
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      
      console.log(`🎮 Room ${roomId} créée par ${playerName}`);
      
      callback({ success: true, roomId, gameState: room });
    });

    // Rejoindre une partie existante
    socket.on('join-room', (data, callback) => {
      const { roomId, playerName } = data;
      const room = rooms.get(roomId);
      
      if (!room) {
        callback({ success: false, error: 'Room introuvable' });
        return;
      }
      
      if (room.players.length >= 2) {
        callback({ success: false, error: 'La room est pleine' });
        return;
      }
      
      if (room.gameStatus !== 'waiting') {
        callback({ success: false, error: 'La partie a déjà commencé' });
        return;
      }
      
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        isReady: false
      };
      
      room.players.push(player);
      
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      
      console.log(`👤 ${playerName} a rejoint la room ${roomId}`);
      
      // Notifier tous les joueurs de la room
      io.to(roomId).emit('game-state-update', room);
      
      callback({ success: true, roomId, gameState: room });
    });

    // Marquer le joueur comme prêt
    socket.on('player-ready', () => {
      const roomId = socket.data.roomId;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = true;
        
        // Vérifier si tous les joueurs sont prêts
        if (room.players.length === 2 && room.players.every(p => p.isReady)) {
          room.gameStatus = 'playing';
          room.currentPlayerId = room.players[0].id;
          console.log(`🎯 Partie commencée dans la room ${roomId}`);
        }
        
        io.to(roomId).emit('game-state-update', room);
      }
    });

    // Retourner une carte
    socket.on('flip-card', (cardId) => {
      const roomId = socket.data.roomId;
      const room = rooms.get(roomId);
      
      if (!room) return;
      if (room.gameStatus !== 'playing') return;
      if (room.currentPlayerId !== socket.id) return;
      if (room.flippedCards.length >= 2) return;
      
      const card = room.cards.find(c => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;
      
      card.isFlipped = true;
      room.flippedCards.push(cardId);
      
      io.to(roomId).emit('game-state-update', room);
      
      // Si deux cartes sont retournées, vérifier la paire
      if (room.flippedCards.length === 2) {
        const [firstId, secondId] = room.flippedCards;
        const firstCard = room.cards.find(c => c.id === firstId);
        const secondCard = room.cards.find(c => c.id === secondId);
        
        setTimeout(() => {
          if (firstCard.emoji === secondCard.emoji) {
            // Paire trouvée !
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            
            const currentPlayer = room.players.find(p => p.id === socket.id);
            if (currentPlayer) {
              currentPlayer.score += 1;
            }
            
            console.log(`✅ Paire trouvée par ${socket.data.playerName}`);
            
            // Vérifier si la partie est terminée
            if (room.cards.every(c => c.isMatched)) {
              room.gameStatus = 'finished';
              
              // Vérifier s'il y a égalité
              const [player1, player2] = room.players;
              if (player1.score === player2.score) {
                room.winnerId = null; // Égalité
                console.log(`🤝 Partie terminée! Égalité (${player1.score} - ${player2.score})`);
              } else {
                const winner = room.players.reduce((a, b) => a.score > b.score ? a : b);
                room.winnerId = winner.id;
                console.log(`🏆 Partie terminée! Gagnant: ${winner.name}`);
              }
            }
            // Le joueur peut rejouer s'il trouve une paire
          } else {
            // Pas de paire, retourner les cartes
            firstCard.isFlipped = false;
            secondCard.isFlipped = false;
            
            // Changer de joueur
            const currentIndex = room.players.findIndex(p => p.id === room.currentPlayerId);
            const nextIndex = (currentIndex + 1) % room.players.length;
            room.currentPlayerId = room.players[nextIndex].id;
            
            console.log(`🔄 Tour de ${room.players[nextIndex].name}`);
          }
          
          room.flippedCards = [];
          io.to(roomId).emit('game-state-update', room);
        }, 1000);
      }
    });

    // Nouvelle partie
    socket.on('restart-game', () => {
      const roomId = socket.data.roomId;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      // Réinitialiser le jeu
      room.cards = createDeck();
      room.flippedCards = [];
      room.gameStatus = 'waiting';
      room.winnerId = null;
      room.players.forEach(p => {
        p.score = 0;
        p.isReady = false;
      });
      
      console.log(`🔄 Partie relancée dans la room ${roomId}`);
      io.to(roomId).emit('game-state-update', room);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      
      if (roomId) {
        const room = rooms.get(roomId);
        
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} supprimée`);
          } else {
            room.gameStatus = 'waiting';
            room.players.forEach(p => p.isReady = false);
            io.to(roomId).emit('player-left', socket.data.playerName);
            io.to(roomId).emit('game-state-update', room);
            console.log(`👋 ${socket.data.playerName} a quitté la room ${roomId}`);
          }
        }
      }
      
      console.log('❌ Déconnexion:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`
    🎮 Memory Game Server
    ━━━━━━━━━━━━━━━━━━━━━
    ✅ Serveur démarré sur http://${hostname}:${port}
    🔌 Socket.IO activé
    `);
  });
});

