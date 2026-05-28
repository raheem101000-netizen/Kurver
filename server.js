'use strict';
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const MAX_PLAYERS = 6;
const rooms = {}; // code -> { hostId, players: [{id, name}] }

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function playerList(room) {
  return room.players.map(p => ({ id: p.id, name: p.name, isHost: p.id === room.hostId }));
}

function cleanup(socketId) {
  for (const [code, room] of Object.entries(rooms)) {
    const idx = room.players.findIndex(p => p.id === socketId);
    if (idx === -1) continue;
    room.players.splice(idx, 1);
    if (room.players.length === 0) { delete rooms[code]; return; }
    if (room.hostId === socketId) room.hostId = room.players[0].id;
    io.to(code).emit('mp:update', { players: playerList(room), hostId: room.hostId });
    return;
  }
}

io.on('connection', socket => {
  socket.on('mp:create', ({ name } = {}) => {
    if (!name || typeof name !== 'string') return;
    name = name.trim().slice(0, 16);
    if (!name) return;
    let code, tries = 0;
    do { code = genCode(); } while (rooms[code] && ++tries < 100);
    rooms[code] = { hostId: socket.id, players: [{ id: socket.id, name }] };
    socket.join(code);
    socket.emit('mp:created', { code, playerId: socket.id, players: playerList(rooms[code]) });
  });

  socket.on('mp:join', ({ code, name } = {}) => {
    if (!code || !name || typeof name !== 'string') return;
    code = code.trim().toUpperCase();
    name = name.trim().slice(0, 16);
    const room = rooms[code];
    if (!room) return socket.emit('mp:err', 'Room not found');
    if (room.players.length >= MAX_PLAYERS) return socket.emit('mp:err', 'Room full');
    room.players.push({ id: socket.id, name });
    socket.join(code);
    socket.emit('mp:joined', { code, playerId: socket.id, isHost: false, players: playerList(room) });
    io.to(code).emit('mp:update', { players: playerList(room), hostId: room.hostId });
  });

  socket.on('mp:start', () => {
    const entry = Object.entries(rooms).find(([, r]) => r.hostId === socket.id);
    if (!entry) return;
    const [code, room] = entry;
    if (room.players.length < 2) return socket.emit('mp:err', 'Need at least 2 players');
    io.to(code).emit('mp:start', { players: playerList(room) });
  });

  socket.on('disconnect', () => cleanup(socket.id));
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('listening on', PORT));
