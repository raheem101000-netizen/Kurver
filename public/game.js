'use strict';

const COLORS = ['#FF4444', '#4BA8FF', '#4CFF6C', '#FFD700', '#FF8C00', '#DA70D6'];
const LINE_W = 3;
const CW = 680, CH = 430;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let socket = null;
let myId = null;
let myCode = null;
let isHost = false;
let isSpectator = false;
let playerStates = {};
let allPlayers = {};
let lastZone = null;
let moTimer = null;

// ── Screens ──────────────────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('#screens > div').forEach(el => {
    el.classList.toggle('active', el.id === name);
  });
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || '';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Socket ───────────────────────────────────────────────────────────────
function ensureSocket() {
  if (socket && socket.connected) return;
  if (socket) { socket.connect(); return; }
  socket = io();
  socket.on('connect', () => console.log('connected', socket.id));
  socket.on('err', onErr);
  socket.on('rooms:update', renderRoomList);
  socket.on('joined', onJoined);
  socket.on('lobby:update', onLobbyUpdate);
  socket.on('newhost', onNewHost);
  socket.on('match:start', onMatchStart);
  socket.on('tick', onTick);
  socket.on('match:end', onMatchEnd);
  socket.on('session:end', onSessionEnd);
}

function onErr(msg) {
  setErr('home-error', msg);
  setErr('lobby-error', msg);
}

// ── Room browser ─────────────────────────────────────────────────────────
function renderRoomList(rooms) {
  const list = document.getElementById('rooms-list');
  if (!rooms || rooms.length === 0) {
    list.innerHTML = '<div id="rooms-empty">No open rooms right now</div>';
    return;
  }
  list.innerHTML = rooms.map(r => {
    const full = r.count >= r.max;
    return `<div class="room-card${full ? ' full' : ''}">
      <span class="rc-host">${esc(r.host)}</span>
      <span class="rc-count${full ? ' full' : ''}">${r.count}/${r.max}</span>
      <button class="btn sm"${full ? ' disabled' : ''} onclick="quickJoin('${esc(r.code)}')">JOIN</button>
    </div>`;
  }).join('');
}

window.quickJoin = function(code) {
  const name = document.getElementById('home-name').value.trim();
  if (!name) { setErr('home-error', 'Enter your name first'); return; }
  setErr('home-error', '');
  doJoin(code, name, false);
};

function fetchRooms() {
  fetch('/api/rooms').then(r => r.json()).then(renderRoomList).catch(() => {});
}

// ── Lobby ────────────────────────────────────────────────────────────────
function onJoined({ code, playerId, isHost: host, spectator, colorIdx, players }) {
  myId = playerId; myCode = code; isHost = host; isSpectator = spectator;
  document.getElementById('room-code-display').textContent = code;
  document.getElementById('btn-start').style.display = host ? 'block' : 'none';
  document.getElementById('spectator-banner').classList.toggle('active', spectator);
  renderLobbyPlayers(players);
  setErr('lobby-error', '');
  showScreen('lobby');
}

function onLobbyUpdate({ players }) {
  renderLobbyPlayers(players);
  const me = players.find(p => p.id === myId);
  if (me) { isHost = me.isHost; document.getElementById('btn-start').style.display = me.isHost ? 'block' : 'none'; }
}

function onNewHost({ playerId }) {
  if (playerId === myId) {
    isHost = true;
    document.getElementById('btn-start').style.display = 'block';
  }
}

function renderLobbyPlayers(players) {
  const list = document.getElementById('lobby-player-list');
  list.innerHTML = players.map(p => {
    const color = p.colorIdx >= 0 ? COLORS[p.colorIdx] : '#555';
    const tags = [
      p.isHost ? '<span class="tag">HOST</span>' : '',
      p.id === myId ? '<span class="tag">YOU</span>' : '',
      p.spectator ? '<span class="tag">SPECTATOR</span>' : ''
    ].join('');
    return `<div class="player-row" style="border-left-color:${color}">
      <div class="dot" style="background:${color}"></div>
      <span class="pname">${esc(p.name)}</span>
      ${tags}
    </div>`;
  }).join('');
  const count = players.filter(p => !p.spectator).length;
  document.getElementById('lobby-status').textContent = `${count} player${count !== 1 ? 's' : ''} in lobby`;
}

// ── Canvas ───────────────────────────────────────────────────────────────
function clearCanvas() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, CW, CH);
}

function drawZone(zone) {
  if (!zone) return;
  const changed = !lastZone ||
    lastZone.left !== zone.left || lastZone.top !== zone.top ||
    lastZone.right !== zone.right || lastZone.bottom !== zone.bottom;

  if (changed) {
    lastZone = { ...zone };
    ctx.fillStyle = 'rgba(200, 20, 20, 0.18)';
    if (zone.top > 0)      ctx.fillRect(0, 0, CW, zone.top);
    if (zone.bottom < CH)  ctx.fillRect(0, zone.bottom, CW, CH - zone.bottom);
    if (zone.left > 0)     ctx.fillRect(0, zone.top, zone.left, zone.bottom - zone.top);
    if (zone.right < CW)   ctx.fillRect(zone.right, zone.top, CW - zone.right, zone.bottom - zone.top);
  }

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 1;
  ctx.strokeRect(zone.left + 0.5, zone.top + 0.5, zone.right - zone.left - 1, zone.bottom - zone.top - 1);
}

// ── Game events ──────────────────────────────────────────────────────────
function onMatchStart({ matchNumber, totalMatches, players, scores }) {
  if (moTimer) { clearInterval(moTimer); moTimer = null; }
  document.getElementById('match-overlay').classList.remove('active');
  lastZone = null;
  playerStates = {};
  allPlayers = {};
  for (const p of players) {
    playerStates[p.id] = { ...p };
    allPlayers[p.id] = { name: p.name, colorIdx: p.colorIdx };
  }
  clearCanvas();
  renderHUD(players, scores);
  document.getElementById('zone-timer').textContent = `Match ${matchNumber}/${totalMatches}`;
  showScreen('game');
}

function onTick({ players, zone, pixels }) {
  for (const px of pixels) {
    ctx.fillStyle = COLORS[px.colorIdx] || '#fff';
    ctx.fillRect(px.x - 1, px.y - 1, LINE_W, LINE_W);
  }
  drawZone(zone);
  for (const p of players) {
    if (playerStates[p.id]) Object.assign(playerStates[p.id], p);
  }
  updateHUDDead();
}

function renderHUD(players, scores) {
  document.getElementById('hud-players').innerHTML = players.map(p => {
    const color = COLORS[p.colorIdx] || '#fff';
    const pts = scores ? (scores[p.id] || 0) : 0;
    return `<div class="hud-p" id="hudp-${p.id}">
      <div class="dot" style="background:${color}"></div>
      <span>${esc(p.name)}&nbsp;<small style="color:#555">${pts}</small></span>
    </div>`;
  }).join('');
}

function updateHUDDead() {
  for (const [id, p] of Object.entries(playerStates)) {
    const el = document.getElementById('hudp-' + id);
    if (el) el.classList.toggle('dead', !p.alive);
  }
}

function onMatchEnd({ matchNumber, totalMatches, matchResult, scores }) {
  document.getElementById('mo-title').textContent = `MATCH ${matchNumber} / ${totalMatches}`;

  document.getElementById('mo-placements').innerHTML = matchResult.map((p, i) => {
    const color = COLORS[p.colorIdx] || '#fff';
    return `<div class="mo-row">
      <span class="mo-place">${ordinal(i + 1)}</span>
      <div class="mo-dot" style="background:${color}"></div>
      <span class="mo-name">${esc(p.name)}</span>
      <span class="mo-pts">+${p.pts}</span>
    </div>`;
  }).join('');

  const standings = Object.entries(scores)
    .map(([id, pts]) => {
      const info = allPlayers[id] || matchResult.find(r => r.id === id) || { name: '?', colorIdx: 0 };
      return { id, name: info.name, colorIdx: info.colorIdx, pts };
    })
    .sort((a, b) => b.pts - a.pts);

  document.getElementById('mo-standings').innerHTML = standings.map((p, i) => {
    const color = COLORS[p.colorIdx] || '#fff';
    return `<div class="mo-row">
      <span class="mo-place">${i + 1}</span>
      <div class="mo-dot" style="background:${color}"></div>
      <span class="mo-name">${esc(p.name)}</span>
      <span class="mo-pts">${p.pts}</span>
    </div>`;
  }).join('');

  let secs = 5;
  document.getElementById('mo-next').textContent = `Next match in ${secs}s`;
  if (moTimer) clearInterval(moTimer);
  moTimer = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(moTimer); moTimer = null;
      document.getElementById('mo-next').textContent = 'Starting…';
    } else {
      document.getElementById('mo-next').textContent = `Next match in ${secs}s`;
    }
  }, 1000);

  document.getElementById('match-overlay').classList.add('active');
}

function onSessionEnd({ final }) {
  if (moTimer) { clearInterval(moTimer); moTimer = null; }
  document.getElementById('match-overlay').classList.remove('active');
  document.getElementById('spectator-banner').classList.remove('active');

  const winner = final[0];
  document.getElementById('winner-banner').innerHTML = winner
    ? `<div class="big">${esc(winner.name)} wins the session!</div>` : '';

  const medals = ['🥇', '🥈', '🥉'];
  document.getElementById('result-list').innerHTML = final.map((p, i) => {
    const color = COLORS[p.colorIdx] || '#fff';
    const place = medals[i] || `${i + 1}.`;
    return `<div class="result-row${i === 0 ? ' winner' : ''}">
      <span class="place">${place}</span>
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
      <span class="rname">${esc(p.name)}</span>
      <span class="r-pts">${p.pts} pts</span>
    </div>`;
  }).join('');

  showScreen('results');
}

// ── Input ────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  if (!keys[e.key]) { keys[e.key] = true; sendInput(); }
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; sendInput(); });

function sendInput() {
  if (!socket || !socket.connected || isSpectator) return;
  socket.emit('input', {
    left:  !!(keys['ArrowLeft']  || keys['a'] || keys['A']),
    right: !!(keys['ArrowRight'] || keys['d'] || keys['D'])
  });
}

// ── Buttons ───────────────────────────────────────────────────────────────
function doJoin(code, name, spectator) {
  ensureSocket();
  socket.emit('join', { code, name, spectator });
}

document.getElementById('btn-create-public').addEventListener('click', () => {
  const name = document.getElementById('home-name').value.trim();
  if (!name) { setErr('home-error', 'Enter your name'); return; }
  setErr('home-error', '');
  ensureSocket();
  socket.emit('create', { name, isPublic: true });
});

document.getElementById('btn-create-private').addEventListener('click', () => {
  const name = document.getElementById('home-name').value.trim();
  if (!name) { setErr('home-error', 'Enter your name'); return; }
  setErr('home-error', '');
  ensureSocket();
  socket.emit('create', { name, isPublic: false });
});

document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('home-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { setErr('home-error', 'Enter your name'); return; }
  if (!code) { setErr('home-error', 'Enter a room code'); return; }
  setErr('home-error', '');
  doJoin(code, name, false);
});

document.getElementById('btn-spectate').addEventListener('click', () => {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!code) { setErr('home-error', 'Enter a room code'); return; }
  setErr('home-error', '');
  doJoin(code, '', true);
});

document.getElementById('btn-start').addEventListener('click', () => {
  if (socket) { setErr('lobby-error', ''); socket.emit('start'); }
});

document.getElementById('btn-leave-lobby').addEventListener('click', () => {
  if (socket) { socket.emit('leave'); socket.disconnect(); socket = null; }
  myId = myCode = null; isHost = isSpectator = false;
  document.getElementById('spectator-banner').classList.remove('active');
  setErr('lobby-error', '');
  showScreen('home');
});

document.getElementById('room-code-display').addEventListener('click', () => {
  const code = document.getElementById('room-code-display').textContent;
  if (code) navigator.clipboard.writeText(code).catch(() => {});
});

document.getElementById('rooms-refresh').addEventListener('click', fetchRooms);

document.getElementById('btn-home').addEventListener('click', () => {
  if (socket) { socket.emit('leave'); socket.disconnect(); socket = null; }
  myId = myCode = null; isHost = isSpectator = false;
  document.getElementById('spectator-banner').classList.remove('active');
  showScreen('home');
});

document.getElementById('btn-rematch').addEventListener('click', () => {
  if (socket && socket.connected && myCode) {
    showScreen('lobby');
  } else {
    showScreen('home');
  }
});

// ── Init ──────────────────────────────────────────────────────────────────
clearCanvas();
ensureSocket();
fetchRooms();
