const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Constants ──────────────────────────────────────────────────────────────
const STEP = 1.9;
const LINE_W = 3;
const HOLE_INT = 90;
const HOLE_RND = 90;
const HOLE_LEN = 12;
const SELF_IMM = 18;
const CANVAS_W = 800;
const CANVAS_H = 600;
const TICK_MS = Math.round(1000 / 30);
const MAX_PLAYERS = 6;
const ENTRY_FEE = 200; // cents
const PRIZE_POOL = 1000; // cents to winner
const ZONE_INITIAL_DELAY = 30 * 30; // ticks
const ZONE_SHRINK_INTERVAL = 12 * 30; // ticks
const ZONE_SHRINK_AMOUNT = 5;
const TOTAL_MATCHES = 10;
const PLACEMENT_POINTS = [6, 4, 3, 2, 1, 0]; // indexed by (placement - 1)

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

// ── Room storage ──────────────────────────────────────────────────────────
const rooms = {}; // code -> Room

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'KURVE-';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function saveResult(result) {
  let results = [];
  if (fs.existsSync(RESULTS_FILE)) {
    try { results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch {}
  }
  results.push(result);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

// ── Pixel map for collision ───────────────────────────────────────────────
function pk(x, y) {
  return `${Math.round(x)},${Math.round(y)}`;
}

// ── Game logic ────────────────────────────────────────────────────────────
function createPlayer(id, name, colorIndex) {
  return {
    id,
    name,
    colorIndex,
    color: COLORS[colorIndex],
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    angle: 0,
    alive: true,
    placement: 0,
    holeTimer: HOLE_INT + Math.floor(Math.random() * HOLE_RND),
    inHole: false,
    holeLen: 0,
    immTimer: SELF_IMM,
    trail: [],
    left: false,
    right: false,
  };
}

function freshZone() {
  return { left: 0, top: 0, right: CANVAS_W, bottom: CANVAS_H };
}

function createRoom(hostSocketId, hostName, isPublic = false) {
  const code = genCode();
  return {
    code,
    hostId: hostSocketId,
    hostName,
    isPublic,
    state: 'lobby', // lobby | playing | results
    players: {},
    spectators: new Set(),
    gameLoop: null,
    pixelMap: {},
    tick: 0,
    aliveCount: 0,
    zone: freshZone(),
    zoneNextShrink: ZONE_INITIAL_DELAY,
    placements: [],
    rematchVotes: new Set(),
    // session state
    matchNumber: 0,
    totalMatches: TOTAL_MATCHES,
    scores: {},
  };
}

function startGame(room) {
  room.state = 'playing';
  room.pixelMap = {};
  room.tick = 0;
  room.placements = [];
  room.zone = freshZone();
  room.zoneNextShrink = ZONE_INITIAL_DELAY;
  room.matchNumber++;

  const playerIds = Object.keys(room.players).filter(id => !room.spectators.has(id));
  room.aliveCount = playerIds.length;

  // Initialise score entry for any new player
  for (const id of playerIds) {
    if (!(id in room.scores)) room.scores[id] = 0;
  }

  // Spawn inside safe centre area, angle pointing toward canvas centre
  playerIds.forEach((id) => {
    const p = room.players[id];
    p.x = CANVAS_W * 0.3 + Math.random() * CANVAS_W * 0.4;
    p.y = CANVAS_H * 0.3 + Math.random() * CANVAS_H * 0.4;
    p.angle = Math.atan2(CANVAS_H / 2 - p.y, CANVAS_W / 2 - p.x)
            + (Math.random() - 0.5) * (Math.PI / 3);
    p.alive = true;
    p.placement = 0;
    p.holeTimer = HOLE_INT + Math.floor(Math.random() * HOLE_RND);
    p.inHole = false;
    p.holeLen = 0;
    p.immTimer = SELF_IMM;
    p.trail = [];
    p.left = false;
    p.right = false;
  });

  io.to(room.code).emit('game:start', {
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    players: serializePlayers(room),
    matchNumber: room.matchNumber,
    totalMatches: room.totalMatches,
  });

  room.gameLoop = setInterval(() => gameTick(room), TICK_MS);
}

function serializePlayers(room) {
  const out = {};
  for (const [id, p] of Object.entries(room.players)) {
    out[id] = {
      id: p.id,
      name: p.name,
      color: p.color,
      colorIndex: p.colorIndex,
      x: p.x,
      y: p.y,
      angle: p.angle,
      alive: p.alive,
      placement: p.placement,
      inHole: p.inHole,
    };
  }
  return out;
}

function eliminatePlayer(room, p, placement) {
  if (!p.alive) return;
  p.alive = false;
  p.placement = placement;
  room.aliveCount--;
}

function gameTick(room) {
  room.tick++;
  const t = room.tick;

  // Zone shrink — rectangular, closes in 5px per side each interval
  if (t >= room.zoneNextShrink) {
    room.zone.left  = Math.min(room.zone.left  + ZONE_SHRINK_AMOUNT, CANVAS_W / 2);
    room.zone.top   = Math.min(room.zone.top   + ZONE_SHRINK_AMOUNT, CANVAS_H / 2);
    room.zone.right = Math.max(room.zone.right - ZONE_SHRINK_AMOUNT, CANVAS_W / 2);
    room.zone.bottom = Math.max(room.zone.bottom - ZONE_SHRINK_AMOUNT, CANVAS_H / 2);
    room.zoneNextShrink += ZONE_SHRINK_INTERVAL;
  }

  const alivePlayers = Object.values(room.players).filter(p => p.alive);

  for (const p of alivePlayers) {
    const TURN = 0.04;
    if (p.left)  p.angle -= TURN;
    if (p.right) p.angle += TURN;

    const nx = p.x + Math.cos(p.angle) * STEP;
    const ny = p.y + Math.sin(p.angle) * STEP;

    // Rectangular zone collision
    if (nx < room.zone.left || nx > room.zone.right ||
        ny < room.zone.top  || ny > room.zone.bottom) {
      eliminatePlayer(room, p, room.aliveCount);
      continue;
    }

    // Hole logic
    p.holeTimer--;
    if (p.holeTimer <= 0 && !p.inHole) {
      p.inHole = true;
      p.holeLen = HOLE_LEN;
      p.holeTimer = HOLE_INT + Math.floor(Math.random() * HOLE_RND);
    }
    if (p.inHole) {
      p.holeLen--;
      if (p.holeLen <= 0) p.inHole = false;
    }

    // Trail collision (skip while in hole)
    if (!p.inHole) {
      const checkRadius = Math.ceil(LINE_W / 2);
      let hit = false;
      for (let cx = -checkRadius; cx <= checkRadius && !hit; cx++) {
        for (let cy = -checkRadius; cy <= checkRadius && !hit; cy++) {
          const owner = room.pixelMap[pk(nx + cx, ny + cy)];
          if (owner !== undefined) {
            if (owner === p.id && p.immTimer > 0) continue;
            hit = true;
          }
        }
      }
      if (hit) {
        eliminatePlayer(room, p, room.aliveCount);
        continue;
      }
    }

    p.x = nx;
    p.y = ny;
    if (p.immTimer > 0) p.immTimer--;

    if (!p.inHole) {
      for (let cx = -Math.floor(LINE_W / 2); cx <= Math.floor(LINE_W / 2); cx++) {
        for (let cy = -Math.floor(LINE_W / 2); cy <= Math.floor(LINE_W / 2); cy++) {
          room.pixelMap[pk(p.x + cx, p.y + cy)] = p.id;
        }
      }
      p.trail.push({ x: p.x, y: p.y });
    }
  }

  // Win condition
  const stillAlive = Object.values(room.players).filter(p => p.alive && !room.spectators.has(p.id));
  if (stillAlive.length <= 1) {
    if (stillAlive.length === 1) stillAlive[0].placement = 1;
    endGame(room);
    return;
  }

  io.to(room.code).emit('state', {
    tick: t,
    zone: room.zone,
    players: serializePlayers(room),
    newPixels: buildNewPixels(room),
  });
}

function buildNewPixels(room) {
  const pixels = [];
  for (const p of Object.values(room.players)) {
    if (!p.alive || p.inHole || room.spectators.has(p.id)) continue;
    if (p.trail.length > 0) {
      const last = p.trail[p.trail.length - 1];
      pixels.push({ x: last.x, y: last.y, color: p.color, w: LINE_W });
    }
  }
  return pixels;
}

async function endGame(room) {
  clearInterval(room.gameLoop);
  room.gameLoop = null;
  room.state = 'results';

  const playerList = Object.values(room.players).filter(p => !room.spectators.has(p.id));
  playerList.sort((a, b) => (a.placement || 99) - (b.placement || 99));

  // Award match points
  for (const p of playerList) {
    const idx = Math.max(0, (p.placement || playerList.length) - 1);
    const pts = PLACEMENT_POINTS[idx] ?? 0;
    room.scores[p.id] = (room.scores[p.id] || 0) + pts;
  }

  // Build cumulative standings sorted by points desc
  const standings = Object.entries(room.scores)
    .map(([id, points]) => {
      const p = room.players[id];
      return { id, name: p ? p.name : '?', color: p ? p.color : '#aaa', points };
    })
    .sort((a, b) => b.points - a.points);

  // Emit per-match result (brief overlay)
  io.to(room.code).emit('match:end', {
    matchNumber: room.matchNumber,
    totalMatches: room.totalMatches,
    placements: playerList.map(p => {
      const idx = Math.max(0, (p.placement || playerList.length) - 1);
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        placement: p.placement || playerList.length,
        pointsEarned: PLACEMENT_POINTS[idx] ?? 0,
      };
    }),
    standings,
  });

  if (room.matchNumber < room.totalMatches) {
    // 5-second pause, then auto-start next match
    setTimeout(() => {
      if (rooms[room.code]) startGame(room);
    }, 5000);
  } else {
    // Session complete — payout and final results
    const sessionWinner = standings[0] || null;
    const winnerPlayer = sessionWinner ? room.players[sessionWinner.id] : null;

    saveResult({
      roomCode: room.code,
      timestamp: new Date().toISOString(),
      standings,
      winner: sessionWinner,
    });

    let payoutStatus = 'pending';
    if (winnerPlayer && winnerPlayer.stripeAccountId && process.env.STRIPE_SECRET_KEY) {
      try {
        await stripe.transfers.create({
          amount: PRIZE_POOL,
          currency: 'usd',
          destination: winnerPlayer.stripeAccountId,
          transfer_group: room.code,
        });
        payoutStatus = 'sent';
      } catch {
        payoutStatus = 'failed';
      }
    }

    io.to(room.code).emit('session:end', {
      standings,
      winner: sessionWinner,
      prize: PRIZE_POOL,
      payoutStatus,
    });
  }
}

// ── Room browser ─────────────────────────────────────────────────────────
app.get('/api/rooms', (_req, res) => {
  const list = Object.values(rooms)
    .filter(r => r.isPublic && r.state === 'lobby')
    .map(r => ({
      code: r.code,
      hostName: r.hostName,
      players: Object.keys(r.players).filter(id => !r.spectators.has(id)).length,
      maxPlayers: MAX_PLAYERS,
    }));
  res.json(list);
});

// ── Stripe payment session ────────────────────────────────────────────────
app.post('/api/create-payment', async (req, res) => {
  const { roomCode, playerName } = req.body;
  if (!roomCode || !playerName) return res.status(400).json({ error: 'missing fields' });

  const room = Object.values(rooms).find(r => r.code === roomCode);
  if (!room) return res.status(404).json({ error: 'room not found' });
  if (room.state !== 'lobby') return res.status(400).json({ error: 'game already started' });

  const playerCount = Object.keys(room.players).filter(id => !room.spectators.has(id)).length;
  if (playerCount >= MAX_PLAYERS) return res.status(400).json({ error: 'room full' });

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return res.json({ sessionId: null, devMode: true });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Kurve BR Entry — Room ${roomCode}` },
          unit_amount: ENTRY_FEE,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'http://localhost:' + PORT}/join?room=${roomCode}&player=${encodeURIComponent(playerName)}&paid=1`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:' + PORT}/?cancelled=1`,
      metadata: { roomCode, playerName },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stripe webhook
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch {
    return res.sendStatus(400);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { roomCode } = session.metadata;
    const room = Object.values(rooms).find(r => r.code === roomCode);
    if (room) {
      room.paidSessions = room.paidSessions || new Set();
      room.paidSessions.add(session.id);
    }
  }
  res.sendStatus(200);
});

// ── Socket.io ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('room:create', ({ name, isPublic }) => {
    const room = createRoom(socket.id, name, !!isPublic);
    rooms[room.code] = room;
    room.players[socket.id] = createPlayer(socket.id, name, 0);
    room.players[socket.id].isHost = true;
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.name = name;

    socket.emit('room:joined', {
      code: room.code,
      isHost: true,
      playerId: socket.id,
      colorIndex: 0,
      players: serializeLobby(room),
    });
  });

  socket.on('room:join', ({ code, name, spectator }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', { msg: 'Room not found' });
    if (room.state === 'playing' && !spectator)
      return socket.emit('error', { msg: 'Game in progress — join as spectator?' });

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name;

    if (spectator || room.state === 'playing') {
      room.spectators.add(socket.id);
      room.players[socket.id] = { id: socket.id, name, color: '#aaaaaa', colorIndex: -1, spectator: true };
      socket.emit('room:joined', {
        code, isHost: false, spectator: true,
        playerId: socket.id,
        players: serializeLobby(room),
      });
      socket.emit('game:spectate', buildSpectatePacket(room));
    } else {
      const playerCount = Object.keys(room.players).filter(id => !room.spectators.has(id)).length;
      if (playerCount >= MAX_PLAYERS) return socket.emit('error', { msg: 'Room is full' });

      const usedColors = Object.values(room.players).map(p => p.colorIndex);
      const colorIndex = [0,1,2,3,4,5].find(i => !usedColors.includes(i)) ?? 0;

      room.players[socket.id] = createPlayer(socket.id, name, colorIndex);

      socket.emit('room:joined', {
        code,
        isHost: room.hostId === socket.id,
        playerId: socket.id,
        colorIndex,
        players: serializeLobby(room),
      });
      socket.to(code).emit('lobby:update', { players: serializeLobby(room) });
    }
  });

  socket.on('lobby:start', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    if (room.hostId !== socket.id) return socket.emit('error', { msg: 'Only host can start' });

    const playerCount = Object.keys(room.players).filter(id => !room.spectators.has(id)).length;
    if (playerCount < 2) return socket.emit('error', { msg: 'Need at least 2 players' });

    startGame(room);
  });

  socket.on('input', ({ left, right }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.state !== 'playing') return;
    const p = room.players[socket.id];
    if (!p || !p.alive || room.spectators.has(socket.id)) return;
    p.left = !!left;
    p.right = !!right;
  });

  socket.on('rematch:vote', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.state !== 'results') return;
    room.rematchVotes.add(socket.id);
    const nonSpectators = Object.keys(room.players).filter(id => !room.spectators.has(id));
    io.to(code).emit('rematch:votes', { votes: room.rematchVotes.size, needed: nonSpectators.length });

    if (room.rematchVotes.size >= nonSpectators.length) {
      room.rematchVotes.clear();
      // Reset session state for a fresh 10-match run
      room.matchNumber = 0;
      room.scores = {};
      io.to(code).emit('rematch:countdown', { seconds: 10 });
      let count = 10;
      const cd = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(cd);
          startGame(room);
        } else {
          io.to(code).emit('rematch:countdown', { seconds: count });
        }
      }, 1000);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    const wasSpectator = room.spectators.has(socket.id);
    const leavingPlayer = room.players[socket.id];
    room.spectators.delete(socket.id);

    if (room.state === 'playing' && !wasSpectator && leavingPlayer && leavingPlayer.alive) {
      eliminatePlayer(room, leavingPlayer, room.aliveCount);
    }

    delete room.players[socket.id];

    const remaining = Object.keys(room.players);
    if (remaining.length === 0) {
      if (room.gameLoop) clearInterval(room.gameLoop);
      delete rooms[code];
      return;
    }

    if (room.hostId === socket.id && room.state === 'lobby') {
      const newHost = remaining.find(id => !room.spectators.has(id));
      if (newHost) {
        room.hostId = newHost;
        room.players[newHost].isHost = true;
        io.to(code).emit('lobby:newhost', { playerId: newHost });
      }
    }

    io.to(code).emit('lobby:update', { players: serializeLobby(room) });
  });
});

function serializeLobby(room) {
  const out = {};
  for (const [id, p] of Object.entries(room.players)) {
    out[id] = {
      id,
      name: p.name,
      color: p.color,
      colorIndex: p.colorIndex,
      isHost: room.hostId === id,
      spectator: room.spectators.has(id),
    };
  }
  return out;
}

function buildSpectatePacket(room) {
  if (room.state !== 'playing') return null;
  return {
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    players: serializePlayers(room),
    zone: room.zone,
    pixelMap: room.pixelMap,
  };
}

httpServer.listen(PORT, () => {
  console.log(`Kurve server running on port ${PORT}`);
});
