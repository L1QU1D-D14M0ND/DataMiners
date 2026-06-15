import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer((req, res) => {
  // Handle HTTP POST request for broadcasting match ended
  if (req.method === 'POST' && req.url === '/broadcast-match-ended') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { matchId, winnerId, loserId } = JSON.parse(body);
        console.log(`[SocketServer] HTTP broadcast-match-ended received for match ${matchId}, winner ${winnerId}, loser ${loserId}`);
        
        // Broadcast to all clients in the match room
        io.to(`match-${matchId}`).emit('match-ended-update', {
          matchId,
          winnerId,
          loserId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[SocketServer] Broadcasted match-ended-update to match ${matchId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Match ended broadcast successful' }));
      } catch (error) {
        console.error('[SocketServer] Error processing broadcast-match-ended:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:3003', 'http://127.0.0.1:3003', 'http://localhost:3004', 'http://127.0.0.1:3004', 'http://localhost:3005', 'http://127.0.0.1:3005'],
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('[SocketServer] Client connected:', socket.id);

  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`[SocketServer] Socket ${socket.id} joined match ${matchId}`);
  });

  socket.on('sync-ready', (data) => {
    const { matchId, userId } = data;
    console.log(`[SocketServer] Received sync-ready from socket ${socket.id} for match ${matchId}, user ${userId}`);
    socket.to(`match-${matchId}`).emit('sync-ready-update', {
      matchId,
      userId,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketServer] Broadcasted sync-ready-update to match ${matchId}`);
  });

  socket.on('opponent-state', (data) => {
    const { matchId, userId, downloadSpeed, energyGenerated } = data;
    console.log(`[SocketServer] Received opponent-state from socket ${socket.id} for match ${matchId}, user ${userId}`);
    socket.to(`match-${matchId}`).emit('opponent-state-update', {
      userId,
      downloadSpeed,
      energyGenerated,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketServer] Broadcasted opponent-state-update to match ${matchId}`);
  });

  socket.on('card-used', (data) => {
    const { matchId, userId, cardId, cardName } = data;
    console.log(`[SocketServer] Received card-used from socket ${socket.id} for match ${matchId}, user ${userId}: ${cardName}`);
    socket.to(`match-${matchId}`).emit('card-used-update', {
      userId,
      cardId,
      cardName,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketServer] Broadcasted card-used-update to match ${matchId}`);
  });

  socket.on('match-ended', (data) => {
    const { matchId, winnerId, loserId } = data;
    console.log(`[SocketServer] Received match-ended from socket ${socket.id} for match ${matchId}`);
    io.to(`match-${matchId}`).emit('match-ended-update', {
      matchId,
      winnerId,
      loserId,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketServer] Broadcasted match-ended-update to match ${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log('[SocketServer] Client disconnected:', socket.id);
  });
});

const PORT = 6001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
