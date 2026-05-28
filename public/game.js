/* Kurve BR — client */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const screens = {
    home: $('home'),
    lobby: $('lobby'),
    game: $('game'),
    results: $('results'),
  };

  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    if (name === 'home') {
      loadRooms();
      if (!roomsInterval) roomsInterval = setInterval(loadRooms, 5000);
    } else {
      clearInterval(roomsInterval);
      roomsInterval = null;
    }
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let roomsInterval = null;
  let socket;
  let myId = null;
  let myCode = null;
  let isHost = false;
  let isSpectator = false;
  let myName = '';
  let keys = { left: false, right: false };
  let lastInput = { left: false, right: false };
  let inputInterval = null;
  let matchNumber = 0;
  let totalMatches = 10;
  let canvasClearTimer = null;

  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  let canvasW = 800, canvasH = 600;

  let gamePlayers = {};
  let currentZone = null;
  let lastZone = { left: -1, top: -1, right: -1, bottom: -1 };

  // ── Socket ────────────────────────────────────────────────────────────────
  function connect() {
    if (socket) {
      // Reuse existing socket — just reconnect it, handlers are already registered
      if (!socket.connected) socket.connect();
      return;
    }
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => { console.log('[socket] connected', socket.id); });
    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', reason);
      // Only show error for unexpected disconnects, not manual ones
      if (reason !== 'io client disconnect') setError('home', 'Disconnected from server.');
    });

    socket.on('game:error', ({ msg }) => {
      console.warn('[game:error]', msg);
      setError('home', msg);
      setError('lobby', msg);
    });

    socket.on('room:joined', (data) => {
      myId = data.playerId;
      myCode = data.code;
      isHost = data.isHost;
      isSpectator = data.spectator || false;
      $('room-code-display').textContent = data.code;
      $('room-code-display').onclick = () => copyCode(data.code);
      $('btn-start').style.display = isHost ? 'block' : 'none';
      $('spectator-banner').classList.toggle('active', isSpectator);
      updateLobbyList(data.players);
      show('lobby');
    });

    socket.on('lobby:update', ({ players }) => {
      updateLobbyList(players);
      updateStartButton(players);
    });

    socket.on('lobby:newhost', ({ playerId }) => {
      if (playerId === myId) {
        isHost = true;
        $('btn-start').style.display = 'block';
      }
    });

    socket.on('game:start', (data) => {
      // Cancel any pending canvas-clear from a previous match
      if (canvasClearTimer) { clearTimeout(canvasClearTimer); canvasClearTimer = null; }

      canvasW = data.canvasW;
      canvasH = data.canvasH;
      canvas.width = canvasW;
      canvas.height = canvasH;
      matchNumber = data.matchNumber;
      totalMatches = data.totalMatches;
      gamePlayers = data.players;
      lastZone = { left: -1, top: -1, right: -1, bottom: -1 };

      clearCanvas();
      updateHUD(gamePlayers);
      hideMatchOverlay();
      show('game');
      startInputLoop();
    });

    socket.on('game:spectate', (data) => {
      if (!data) return;
      canvasW = data.canvasW;
      canvasH = data.canvasH;
      canvas.width = canvasW;
      canvas.height = canvasH;
      gamePlayers = data.players;
      currentZone = data.zone;
      lastZone = { left: -1, top: -1, right: -1, bottom: -1 };
      clearCanvas();
      if (data.pixelMap) {
        for (const [key, ownerId] of Object.entries(data.pixelMap)) {
          const p = data.players[ownerId];
          if (!p) continue;
          const [x, y] = key.split(',').map(Number);
          ctx.fillStyle = p.color;
          ctx.fillRect(x - 1, y - 1, 3, 3);
        }
      }
      drawZoneBorder(currentZone);
      updateHUD(gamePlayers);
      show('game');
    });

    socket.on('state', (data) => {
      gamePlayers = data.players;
      currentZone = data.zone;

      if (data.newPixels) {
        for (const px of data.newPixels) {
          ctx.fillStyle = px.color;
          ctx.fillRect(px.x - Math.floor(px.w / 2), px.y - Math.floor(px.w / 2), px.w, px.w);
        }
      }

      drawZoneBorder(currentZone);
      updateHUD(gamePlayers);
    });

    socket.on('match:end', (data) => {
      stopInputLoop();
      matchNumber = data.matchNumber;
      showMatchOverlay(data);
      // Clear canvas after 3 s; next game:start will also clear but may arrive at 5 s
      canvasClearTimer = setTimeout(() => {
        clearCanvas();
        lastZone = { left: -1, top: -1, right: -1, bottom: -1 };
        canvasClearTimer = null;
      }, 3000);
    });

    socket.on('session:end', (data) => {
      if (canvasClearTimer) { clearTimeout(canvasClearTimer); canvasClearTimer = null; }
      hideMatchOverlay();
      showSessionResults(data);
    });

    socket.on('rematch:votes', ({ votes, needed }) => {
      $('rematch-status').textContent = `Rematch votes: ${votes} / ${needed}`;
    });

    socket.on('rematch:countdown', ({ seconds }) => {
      $('rematch-countdown').textContent = seconds > 0 ? seconds : '';
      if (seconds === 0) {
        clearCanvas();
        show('game');
        startInputLoop();
      }
    });
  }

  // ── Canvas ────────────────────────────────────────────────────────────────
  function clearCanvas() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  function drawZoneBorder(zone) {
    if (!zone) return;
    if (zone.left === lastZone.left && zone.top === lastZone.top &&
        zone.right === lastZone.right && zone.bottom === lastZone.bottom) return;

    lastZone = { ...zone };
    const { left, top, right, bottom } = zone;
    const w = right - left;
    const h = bottom - top;

    // Darken the four border strips that fell outside the new zone
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, canvasW, top);                   // top strip
    ctx.fillRect(0, bottom, canvasW, canvasH - bottom); // bottom strip
    ctx.fillRect(0, top, left, h);                      // left strip
    ctx.fillRect(right, top, canvasW - right, h);       // right strip

    // Red border rectangle
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, w, h);
  }

  function updateHUD(players) {
    const hudDiv = $('hud-players');
    hudDiv.innerHTML = '';
    const sorted = Object.values(players).sort((a, b) => a.name.localeCompare(b.name));
    for (const p of sorted) {
      if (p.spectator) continue;
      const div = document.createElement('div');
      div.className = 'hud-p' + (p.alive ? '' : ' dead');
      div.innerHTML = `<div class="dot" style="background:${p.color}"></div><span>${esc(p.name)}</span>`;
      hudDiv.appendChild(div);
    }
    $('zone-timer').textContent = `Match ${matchNumber} / ${totalMatches}`;
  }

  // ── Match overlay (between matches) ───────────────────────────────────────
  function showMatchOverlay(data) {
    const medals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    const isLast = data.matchNumber >= data.totalMatches;

    $('mo-title').textContent = `MATCH ${data.matchNumber} RESULTS`;

    const placDiv = $('mo-placements');
    placDiv.innerHTML = '';
    for (const p of data.placements) {
      const row = document.createElement('div');
      row.className = 'mo-row';
      row.innerHTML = `
        <span class="mo-place">${medals[p.placement - 1] || p.placement}</span>
        <span class="mo-dot" style="background:${p.color}"></span>
        <span class="mo-name">${esc(p.name)}</span>
        <span class="mo-pts">+${p.pointsEarned}pts</span>
      `;
      placDiv.appendChild(row);
    }

    const standDiv = $('mo-standings');
    standDiv.innerHTML = '';
    for (const [i, s] of data.standings.entries()) {
      const row = document.createElement('div');
      row.className = 'mo-row';
      row.innerHTML = `
        <span class="mo-place">${i + 1}</span>
        <span class="mo-dot" style="background:${s.color}"></span>
        <span class="mo-name">${esc(s.name)}</span>
        <span class="mo-pts">${s.points}pts</span>
      `;
      standDiv.appendChild(row);
    }

    $('mo-next').textContent = isLast ? 'Session ending...' : 'Next match in 5s';
    $('match-overlay').classList.add('active');
  }

  function hideMatchOverlay() {
    $('match-overlay').classList.remove('active');
  }

  // ── Session results ───────────────────────────────────────────────────────
  function showSessionResults(data) {
    $('results-title').textContent = 'SESSION COMPLETE';
    const list = $('result-list');
    list.innerHTML = '';
    for (const [i, s] of data.standings.entries()) {
      const row = document.createElement('div');
      row.className = 'result-row' + (i === 0 ? ' winner' : '');
      row.style.borderLeftColor = s.color;
      row.innerHTML = `
        <span class="place">${i + 1}</span>
        <span class="mo-dot" style="background:${s.color}"></span>
        <span class="rname">${esc(s.name)}${s.id === myId ? ' (you)' : ''}</span>
        <span class="r-pts">${s.points}pts</span>
      `;
      list.appendChild(row);
    }

    if (data.winner) {
      const prizeUSD = (data.prize / 100).toFixed(2);
      const status = data.payoutStatus === 'sent' ? '✓ paid'
                   : data.payoutStatus === 'failed' ? '(payout failed)' : '(payout pending)';
      $('winner-banner').innerHTML = `
        <div class="big" style="color:${data.winner.color}">${esc(data.winner.name)} wins the session!</div>
        <div class="prize">$${prizeUSD} prize ${status}</div>
      `;
    } else {
      $('winner-banner').innerHTML = '<div class="big">No winner</div>';
    }

    $('rematch-status').textContent = '';
    $('rematch-countdown').textContent = '';
    $('btn-rematch').disabled = false;
    $('btn-rematch').textContent = 'NEW SESSION';
    $('btn-rematch').style.display = isSpectator ? 'none' : 'inline-block';
    show('results');
  }

  // ── Lobby helpers ─────────────────────────────────────────────────────────
  function updateLobbyList(players) {
    const list = $('lobby-player-list');
    list.innerHTML = '';
    for (const [id, p] of Object.entries(players)) {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.style.borderLeftColor = p.color || '#555';
      const tags = [];
      if (p.isHost) tags.push('HOST');
      if (p.spectator) tags.push('SPECTATOR');
      row.innerHTML = `
        <div class="dot" style="background:${p.color || '#555'}"></div>
        <span class="pname">${esc(p.name)}${id === myId ? ' (you)' : ''}</span>
        ${tags.length ? `<span class="tag">${tags.join(' ')}</span>` : ''}
      `;
      list.appendChild(row);
    }
    updateStartButton(players);
    const nonSpec = Object.values(players).filter(p => !p.spectator);
    $('lobby-status').textContent = `${nonSpec.length} / 6 players — need at least 2 to start`;
  }

  function updateStartButton(players) {
    if (!isHost) return;
    const nonSpec = Object.values(players).filter(p => !p.spectator);
    $('btn-start').disabled = nonSpec.length < 2;
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  function startInputLoop() {
    if (isSpectator) return;
    stopInputLoop();
    inputInterval = setInterval(() => {
      if (keys.left !== lastInput.left || keys.right !== lastInput.right) {
        socket.emit('input', { left: keys.left, right: keys.right });
        lastInput = { ...keys };
      }
    }, 16);
  }

  function stopInputLoop() {
    if (inputInterval) { clearInterval(inputInterval); inputInterval = null; }
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { keys.left = true;  e.preventDefault(); }
    if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft')  keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // ── Room browser ──────────────────────────────────────────────────────────
  async function loadRooms() {
    try {
      const res = await fetch('/api/rooms');
      const rooms = await res.json();
      console.log('[loadRooms]', rooms.length, 'public rooms:', rooms.map(r => r.code));
      renderRooms(rooms);
    } catch (err) {
      console.error('[loadRooms] fetch failed:', err);
    }
  }

  function renderRooms(rooms) {
    const list = $('rooms-list');
    if (!rooms.length) {
      list.innerHTML = '<div id="rooms-empty">No open rooms right now</div>';
      return;
    }
    list.innerHTML = '';
    for (const r of rooms) {
      const full = r.players >= r.maxPlayers;
      const card = document.createElement('div');
      card.className = 'room-card' + (full ? ' full' : '');
      card.innerHTML = `
        <span class="rc-host">${esc(r.hostName)}'s room</span>
        <span class="rc-count${full ? ' full' : ''}">${r.players}/${r.maxPlayers}</span>
        <button class="btn sm" ${full ? 'disabled' : ''} data-code="${esc(r.code)}">JOIN</button>
      `;
      if (!full) {
        card.querySelector('button').addEventListener('click', () => {
          const name = $('home-name').value.trim();
          if (!name) return setError('home', 'Enter your name first');
          myName = name;
          connect();
          console.log('[rooms browser] joining', r.code);
          socket.emit('room:join', { code: r.code, name, spectator: false });
        });
      }
      list.appendChild(card);
    }
  }

  // ── Button handlers ───────────────────────────────────────────────────────
  $('btn-create-public').addEventListener('click', () => {
    const name = $('home-name').value.trim();
    if (!name) return setError('home', 'Enter your name');
    myName = name;
    connect();
    socket.emit('room:create', { name, isPublic: true });
  });

  $('btn-create-private').addEventListener('click', () => {
    const name = $('home-name').value.trim();
    if (!name) return setError('home', 'Enter your name');
    myName = name;
    connect();
    socket.emit('room:create', { name, isPublic: false });
  });

  $('btn-join').addEventListener('click', () => {
    const name = $('home-name').value.trim();
    const code = normaliseCode($('join-code').value);
    if (!name) return setError('home', 'Enter your name');
    if (!code) return setError('home', 'Enter a room code');
    myName = name;
    connect();
    console.log('[join] emitting room:join', code);
    socket.emit('room:join', { code, name, spectator: false });
  });

  $('btn-spectate').addEventListener('click', () => {
    const name = $('home-name').value.trim() || 'Spectator';
    const code = normaliseCode($('join-code').value);
    if (!code) return setError('home', 'Enter a room code to watch');
    myName = name;
    connect();
    socket.emit('room:join', { code, name, spectator: true });
  });

  $('btn-start').addEventListener('click', () => {
    if (socket) socket.emit('lobby:start');
  });

  $('btn-leave-lobby').addEventListener('click', () => {
    if (socket) { socket.disconnect(); socket = null; }
    show('home');
  });

  $('btn-rematch').addEventListener('click', () => {
    if (socket) socket.emit('rematch:vote');
    $('btn-rematch').disabled = true;
    $('btn-rematch').textContent = 'VOTED';
  });

  $('btn-home').addEventListener('click', () => {
    if (socket) socket.disconnect();
    socket = null;
    myId = null; myCode = null; isHost = false; isSpectator = false;
    matchNumber = 0; totalMatches = 10;
    $('btn-rematch').disabled = false;
    $('btn-rematch').textContent = 'NEW SESSION';
    $('spectator-banner').classList.remove('active');
    hideMatchOverlay();
    show('home'); // show() restarts the rooms poll
  });

  $('room-code-display').addEventListener('click', () => {
    if (myCode) copyCode(myCode);
  });

  $('rooms-refresh').addEventListener('click', loadRooms);

  // ── Misc ──────────────────────────────────────────────────────────────────
  function normaliseCode(raw) {
    let c = raw.trim().toUpperCase();
    if (c && !c.startsWith('KURVE-')) c = 'KURVE-' + c;
    return c;
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    const el = $('room-code-display');
    const orig = el.textContent;
    el.textContent = 'COPIED!';
    setTimeout(() => { el.textContent = orig; }, 1200);
  }

  function setError(screen, msg) {
    const el = $(screen + '-error');
    if (el) { el.textContent = msg; setTimeout(() => { el.textContent = ''; }, 4000); }
  }

  function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Start rooms poll immediately — home screen is the initial active screen
  loadRooms();
  roomsInterval = setInterval(loadRooms, 5000);

  // Handle Stripe redirect query params
  const params = new URLSearchParams(location.search);
  if (params.get('room') && params.get('player') && params.get('paid')) {
    const pName = params.get('player');
    const rCode = params.get('room');
    $('home-name').value = pName;
    $('join-code').value = rCode;
    history.replaceState({}, '', '/');
    connect();
    socket.emit('room:join', { code: rCode, name: pName, spectator: false });
  }
  if (params.get('cancelled')) {
    history.replaceState({}, '', '/');
    setError('home', 'Payment cancelled.');
  }

})();
