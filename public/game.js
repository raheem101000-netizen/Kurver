/* Kurve BR — client */
(function () {
  'use strict';

  // ── DOM helpers ─────────────────────────────────────────────────────────
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
  }

  // ── State ────────────────────────────────────────────────────────────────
  let socket;
  let myId = null;
  let myCode = null;
  let isHost = false;
  let isSpectator = false;
  let myName = '';
  let keys = { left: false, right: false };
  let lastInput = { left: false, right: false };
  let inputInterval = null;

  // Canvas
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  let canvasW = 800, canvasH = 600;

  // Game render state
  let gamePlayers = {};
  let currentZone = null;
  let zoneDrawn = false;

  // ── Socket connection ────────────────────────────────────────────────────
  function connect() {
    if (socket && socket.connected) return;
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {});
    socket.on('disconnect', () => {
      setError('home', 'Disconnected from server.');
    });

    socket.on('error', ({ msg }) => {
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
      canvasW = data.canvasW;
      canvasH = data.canvasH;
      canvas.width = canvasW;
      canvas.height = canvasH;
      gamePlayers = data.players;
      clearCanvas();
      drawZoneBorder(null);
      updateHUD(gamePlayers);
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
      clearCanvas();
      // Draw full trail from pixelMap
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

      // Draw new pixels (delta)
      if (data.newPixels) {
        for (const px of data.newPixels) {
          ctx.fillStyle = px.color;
          ctx.fillRect(px.x - Math.floor(px.w / 2), px.y - Math.floor(px.w / 2), px.w, px.w);
        }
      }

      drawZoneBorder(currentZone);
      updateHUD(gamePlayers);
    });

    socket.on('game:results', (data) => {
      stopInputLoop();
      showResults(data);
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

  // ── Canvas rendering ─────────────────────────────────────────────────────
  function clearCanvas() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  let lastZoneR = -1;

  function drawZoneBorder(zone) {
    if (!zone) return;
    if (Math.abs(zone.r - lastZoneR) < 0.5) return; // skip if unchanged
    lastZoneR = zone.r;

    // We only draw the zone overlay without clearing the trail
    // Use destination-out compositing to "erase" outside zone
    // Actually: just draw a dark ring over the outside edge each time zone shrinks
    // This is a lightweight approach — draw a thick dark annulus
    ctx.save();
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dim the area outside the zone
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    ctx.restore();
  }

  function updateHUD(players) {
    const hudDiv = $('hud-players');
    hudDiv.innerHTML = '';
    const sorted = Object.values(players).sort((a, b) => a.name.localeCompare(b.name));
    for (const p of sorted) {
      if (p.spectator) continue;
      const div = document.createElement('div');
      div.className = 'hud-p' + (p.alive ? '' : ' dead');
      div.innerHTML = `<div class="dot" style="background:${p.color}"></div><span>${p.name}</span>`;
      hudDiv.appendChild(div);
    }
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

  // ── Results ───────────────────────────────────────────────────────────────
  function showResults(data) {
    const list = $('result-list');
    list.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉', '4th', '5th', '6th'];
    for (const p of data.players) {
      const row = document.createElement('div');
      row.className = 'result-row' + (p.placement === 1 ? ' winner' : '');
      row.style.borderLeftColor = p.color;
      row.innerHTML = `
        <span class="place">${medals[(p.placement || 1) - 1] || p.placement}</span>
        <span class="rname">${esc(p.name)}${p.id === myId ? ' (you)' : ''}</span>
      `;
      list.appendChild(row);
    }

    if (data.winner) {
      const prizeUSD = (data.prize / 100).toFixed(2);
      $('winner-banner').innerHTML = `
        <div class="big" style="color:${data.winner.color}">${esc(data.winner.name)} wins!</div>
        <div class="prize">$${prizeUSD} prize ${data.payoutStatus === 'sent' ? '✓ paid' : data.payoutStatus === 'failed' ? '(payout failed)' : '(payout pending)'}</div>
      `;
    } else {
      $('winner-banner').innerHTML = '<div class="big">No winner</div>';
    }

    $('rematch-status').textContent = '';
    $('rematch-countdown').textContent = '';
    $('btn-rematch').style.display = isSpectator ? 'none' : 'inline-block';
    show('results');
  }

  // ── Input loop ───────────────────────────────────────────────────────────
  function startInputLoop() {
    if (isSpectator) return;
    stopInputLoop();
    inputInterval = setInterval(() => {
      if (keys.left !== lastInput.left || keys.right !== lastInput.right) {
        socket.emit('input', { left: keys.left, right: keys.right });
        lastInput = { ...keys };
      }
    }, 16); // ~60hz input sampling
  }

  function stopInputLoop() {
    if (inputInterval) { clearInterval(inputInterval); inputInterval = null; }
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') { keys.left = false; }
    if (e.key === 'ArrowRight') { keys.right = false; }
  });

  // ── Button handlers ───────────────────────────────────────────────────────
  $('btn-create').addEventListener('click', () => {
    const name = $('home-name').value.trim();
    if (!name) return setError('home', 'Enter your name');
    myName = name;
    connect();
    socket.emit('room:create', { name });
  });

  $('btn-join').addEventListener('click', () => {
    const name = $('home-name').value.trim();
    const code = $('join-code').value.trim().toUpperCase();
    if (!name) return setError('home', 'Enter your name');
    if (!code) return setError('home', 'Enter a room code');
    myName = name;
    connect();
    socket.emit('room:join', { code, name, spectator: false });
  });

  $('btn-spectate').addEventListener('click', () => {
    const name = $('home-name').value.trim() || 'Spectator';
    const code = $('join-code').value.trim().toUpperCase();
    if (!code) return setError('home', 'Enter a room code to watch');
    myName = name;
    connect();
    socket.emit('room:join', { code, name, spectator: true });
  });

  $('btn-start').addEventListener('click', () => {
    if (!socket) return;
    socket.emit('lobby:start');
  });

  $('btn-leave-lobby').addEventListener('click', () => {
    if (socket) socket.disconnect();
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
    $('btn-rematch').disabled = false;
    $('btn-rematch').textContent = 'REMATCH';
    $('spectator-banner').classList.remove('active');
    show('home');
  });

  $('room-code-display').addEventListener('click', () => {
    if (myCode) copyCode(myCode);
  });

  // ── Misc ──────────────────────────────────────────────────────────────────
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

  // Handle ?room= and ?paid= query params for Stripe redirect
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
