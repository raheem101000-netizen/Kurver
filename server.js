'use strict';
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const W = 680, H = 420;
const STEP = 1.9;
const LINE_W = 3;
const HOLE_INT = 90;
const HOLE_RND = 90;
const HOLE_LEN = 12;
const SELF_IMM = 18;
const TICK_MS = 33;
const MAX_PLAYERS = 6;
const TOTAL_MATCHES = 20;
const ZONE_DELAY_TICKS = 909;   // ~30 s
const ZONE_SHRINK_TICKS = 364;  // ~12 s
const ZONE_SHRINK_AMT = 5;
const MATCH_POINTS = [6, 4, 3, 2, 1, 0];
const COLORS = ['#FF4444', '#4BA8FF', '#4CFF6C', '#FFD700', '#FF8C00', '#DA70D6'];

const PHASES = [
  { from: 1,  to: 3,  D: 0.032 },
  { from: 4,  to: 6,  D: 0.035 },
  { from: 7,  to: 12, D: 0.042 },
  { from: 13, to: 20, D: 0.050 },
];

function getPhase(matchNumber) {
  return PHASES.find(p => matchNumber >= p.from && matchNumber <= p.to) || PHASES[PHASES.length - 1];
}

function oob(x, y, zoneSize) {
  return x <= zoneSize + 2 || y <= zoneSize + 2 || x >= W - zoneSize - 2 || y >= H - zoneSize - 2;
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function pk(x, y) {
  return (Math.round(x) & 0x7FFF) * 100000 + (Math.round(y) & 0x7FFF);
}

const rooms = {};

function publicRoomList() {
  return Object.values(rooms)
    .filter(r => r.isPublic && r.state === 'lobby')
    .map(r => {
      const players = Object.values(r.players).filter(p => !p.spectator);
      const host = Object.values(r.players).find(p => p.id === r.hostId);
      return { code: r.code, host: host ? host.name : '?', count: players.length, max: MAX_PLAYERS };
    });
}

function broadcastRoomList() {
  io.emit('rooms:update', publicRoomList());
}

function playerList(room) {
  return Object.values(room.players).map(p => ({
    id: p.id, name: p.name, colorIdx: p.colorIdx,
    isHost: p.id === room.hostId, spectator: p.spectator
  }));
}

function cleanupSocket(socketId) {
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
    if (!room.players[socketId]) continue;

    const wasHost = room.hostId === socketId;
    delete room.players[socketId];

    if (Object.keys(room.players).length === 0) {
      if (room.intervalId) clearInterval(room.intervalId);
      delete rooms[code];
      broadcastRoomList();
      return;
    }

    if (wasHost) {
      room.hostId = Object.keys(room.players)[0];
      io.to(code).emit('newhost', { playerId: room.hostId });
    }

    io.to(code).emit('lobby:update', { players: playerList(room) });

    if (room.state === 'playing' && room.gameState) {
      const snake = room.gameState.snakes.find(s => s.id === socketId);
      if (snake) {
        snake.alive = false;
        snake.deathTick = room.gameState.tick;
        room.gameState.alivePlayers = room.gameState.alivePlayers.filter(id => id !== socketId);
        checkRoundEnd(room);
      }
    }

    broadcastRoomList();
    return;
  }
}

function spawnPlayers(players) {
  const margin = 80;
  return players.map(p => {
    const x = margin + Math.random() * (W - margin * 2);
    const y = margin + Math.random() * (H - margin * 2);
    const angle = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5) * Math.PI;
    return {
      id: p.id, colorIdx: p.colorIdx, name: p.name,
      x, y, prevX: x, prevY: y,
      angle, alive: true, deathTick: null,
      ownFrame: 0,
      holeCountdown: HOLE_INT + Math.floor(Math.random() * HOLE_RND),
      inHole: false, holeLen: 0
    };
  });
}

function startMatch(room) {
  room.state = 'playing';
  room.matchNumber = (room.matchNumber || 0) + 1;
  const matchNumber = room.matchNumber;
  const activePlayers = Object.values(room.players).filter(p => !p.spectator);
  const snakes = spawnPlayers(activePlayers);
  const prevScores = room.gameState ? room.gameState.scores : {};
  const scores = { ...prevScores };
  for (const p of activePlayers) {
    if (!(p.id in scores)) scores[p.id] = 0;
  }

  room.gameState = {
    matchNumber, tick: 0, pixelMap: {},
    snakes, alivePlayers: snakes.map(s => s.id),
    zoneSize: 0,
    currentPhase: getPhase(matchNumber),
    scores, inputs: {}
  };

  io.to(room.code).emit('match:start', {
    matchNumber, totalMatches: TOTAL_MATCHES, W, H,
    players: snakes.map(s => ({ id: s.id, name: s.name, colorIdx: s.colorIdx, x: s.x, y: s.y, angle: s.angle })),
    scores
  });

  broadcastRoomList();
  if (room.intervalId) clearInterval(room.intervalId);
  room.intervalId = setInterval(() => gameTick(room), TICK_MS);
}

function gameTick(room) {
  const gs = room.gameState;
  const t = ++gs.tick;

  // Zone shrink: starts at ZONE_DELAY_TICKS, repeats every ZONE_SHRINK_TICKS
  if (t >= ZONE_DELAY_TICKS && (t - ZONE_DELAY_TICKS) % ZONE_SHRINK_TICKS === 0) {
    gs.zoneSize += ZONE_SHRINK_AMT;
  }

  const D = gs.currentPhase.D;
  const newPixels = [];

  for (const snake of gs.snakes) {
    if (!snake.alive) continue;

    snake.ownFrame++;

    // Turn
    const inp = gs.inputs[snake.id] || { left: false, right: false };
    if (inp.left)  snake.angle -= D;
    if (inp.right) snake.angle += D;

    // Move (save previous position for client trail rendering)
    snake.prevX = snake.x;
    snake.prevY = snake.y;
    snake.x += Math.cos(snake.angle) * STEP;
    snake.y += Math.sin(snake.angle) * STEP;

    // Hole transition — runs before death checks so state is correct this frame
    if (!snake.inHole) {
      if (--snake.holeCountdown <= 0) {
        snake.inHole = true;
        snake.holeLen = HOLE_LEN;
      }
    } else {
      if (--snake.holeLen <= 0) {
        snake.inHole = false;
        snake.holeCountdown = HOLE_INT + Math.floor(Math.random() * HOLE_RND);
      }
    }

    // Death 1: zone wall (always, even during hole)
    let dead = oob(snake.x, snake.y, gs.zoneSize);

    // Death 2: trail collision (only when not in hole)
    if (!dead && !snake.inHole) {
      outer:
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const cell = gs.pixelMap[pk(snake.x + dx, snake.y + dy)];
          if (cell && !(cell.id === snake.id && (snake.ownFrame - cell.f) < SELF_IMM)) {
            dead = true;
            break outer;
          }
        }
      }
    }

    if (dead) {
      snake.alive = false;
      snake.deathTick = t;
      gs.alivePlayers = gs.alivePlayers.filter(id => id !== snake.id);
      continue;
    }

    // Paint 3×3 pixel block (only when not in hole)
    if (!snake.inHole) {
      const hw = Math.floor(LINE_W / 2); // = 1 for LINE_W=3
      for (let dx = -hw; dx <= hw; dx++) {
        for (let dy = -hw; dy <= hw; dy++) {
          gs.pixelMap[pk(snake.x + dx, snake.y + dy)] = { id: snake.id, f: snake.ownFrame };
        }
      }
      newPixels.push({
        x: Math.round(snake.x), y: Math.round(snake.y),
        px: Math.round(snake.prevX), py: Math.round(snake.prevY),
        colorIdx: snake.colorIdx
      });
    }
  }

  io.to(room.code).emit('tick', {
    players: gs.snakes.map(s => ({ id: s.id, x: s.x, y: s.y, angle: s.angle, alive: s.alive, inHole: s.inHole })),
    zoneSize: gs.zoneSize,
    pixels: newPixels
  });

  checkRoundEnd(room);
}

function checkRoundEnd(room) {
  const gs = room.gameState;
  if (!gs || room.state !== 'playing') return;

  const alive = gs.snakes.filter(s => s.alive);
  if (alive.length > 1) return;
  if (gs.snakes.length <= 1) return;

  clearInterval(room.intervalId);
  room.intervalId = null;
  room.state = 'between';

  const dead = gs.snakes.filter(s => !s.alive)
    .sort((a, b) => (b.deathTick || 0) - (a.deathTick || 0));
  const placements = [...alive, ...dead];

  for (let i = 0; i < placements.length; i++) {
    const pts = MATCH_POINTS[i] !== undefined ? MATCH_POINTS[i] : 0;
    gs.scores[placements[i].id] = (gs.scores[placements[i].id] || 0) + pts;
  }

  const matchResult = placements.map((s, i) => ({
    id: s.id, name: s.name, colorIdx: s.colorIdx,
    place: i + 1, pts: MATCH_POINTS[i] !== undefined ? MATCH_POINTS[i] : 0
  }));

  if (gs.matchNumber >= TOTAL_MATCHES) {
    room.state = 'lobby';
    room.matchNumber = 0;
    const final = Object.entries(gs.scores)
      .map(([id, pts]) => {
        const p = room.players[id];
        const sn = gs.snakes.find(s => s.id === id);
        return { id, name: p ? p.name : (sn ? sn.name : '?'), colorIdx: p ? p.colorIdx : (sn ? sn.colorIdx : 0), pts };
      })
      .sort((a, b) => b.pts - a.pts);
    room.gameState = null;
    io.to(room.code).emit('session:end', { final });
    broadcastRoomList();
  } else {
    io.to(room.code).emit('match:end', {
      matchNumber: gs.matchNumber, totalMatches: TOTAL_MATCHES,
      matchResult, scores: { ...gs.scores }
    });
    setTimeout(() => {
      if (rooms[room.code] && room.state === 'between') {
        const ap = Object.values(room.players).filter(p => !p.spectator);
        if (ap.length >= 2) startMatch(room); else room.state = 'lobby';
      }
    }, 5000);
  }
}

io.on('connection', socket => {
  console.log('+ connect', socket.id);
  socket.emit('rooms:update', publicRoomList());

  socket.on('create', ({ name, isPublic } = {}) => {
    if (!name || typeof name !== 'string') return socket.emit('err', 'Name required');
    name = name.trim().slice(0, 16);
    if (!name) return socket.emit('err', 'Name required');
    let code, tries = 0;
    do { code = genCode(); } while (rooms[code] && ++tries < 100);
    const room = {
      code, isPublic: !!isPublic, state: 'lobby',
      hostId: socket.id, players: {}, intervalId: null,
      gameState: null, matchNumber: 0
    };
    room.players[socket.id] = { id: socket.id, name, colorIdx: 0, spectator: false };
    rooms[code] = room;
    socket.join(code);
    socket.emit('joined', { code, playerId: socket.id, isHost: true, spectator: false, colorIdx: 0, players: playerList(room) });
    broadcastRoomList();
    console.log('room', code, 'by', name, isPublic ? '[public]' : '[private]');
  });

  socket.on('join', ({ code, name, spectator } = {}) => {
    if (!code || typeof code !== 'string') return socket.emit('err', 'Code required');
    code = code.trim().toUpperCase();
    const room = rooms[code];
    if (!room) return socket.emit('err', 'Room not found: ' + code);
    if (room.state !== 'lobby') return socket.emit('err', 'Game in progress');
    const isSpect = !!spectator;
    if (!isSpect) {
      if (!name || typeof name !== 'string') return socket.emit('err', 'Name required');
      name = name.trim().slice(0, 16);
      if (!name) return socket.emit('err', 'Name required');
      const count = Object.values(room.players).filter(p => !p.spectator).length;
      if (count >= MAX_PLAYERS) return socket.emit('err', 'Room full');
    }
    const colorIdx = isSpect ? -1 : Object.values(room.players).filter(p => !p.spectator).length % COLORS.length;
    room.players[socket.id] = { id: socket.id, name: isSpect ? 'Spectator' : name, colorIdx, spectator: isSpect };
    socket.join(code);
    socket.emit('joined', { code, playerId: socket.id, isHost: socket.id === room.hostId, spectator: isSpect, colorIdx, players: playerList(room) });
    io.to(code).emit('lobby:update', { players: playerList(room) });
    broadcastRoomList();
    console.log(isSpect ? '[spectator]' : name, 'joined', code);
  });

  socket.on('leave', () => cleanupSocket(socket.id));

  socket.on('start', () => {
    const room = Object.values(rooms).find(r => r.hostId === socket.id && r.state === 'lobby');
    if (!room) return socket.emit('err', 'Cannot start');
    const ap = Object.values(room.players).filter(p => !p.spectator);
    if (ap.length < 2) return socket.emit('err', 'Need at least 2 players');
    startMatch(room);
  });

  socket.on('input', ({ left, right } = {}) => {
    for (const room of Object.values(rooms)) {
      if (room.gameState && room.players[socket.id]) {
        room.gameState.inputs[socket.id] = { left: !!left, right: !!right };
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('- disconnect', socket.id);
    cleanupSocket(socket.id);
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/rooms', (req, res) => res.json(publicRoomList()));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Kurver listening on port', PORT));
