const socket = io();

const state = {
  room: null,
  myId: null,
};

const $ = (sel) => document.querySelector(sel);
const home = $('#home');
const roomScreen = $('#room');

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.style.display = 'none'), 2800);
}

function getMyPlayer() {
  return state.room?.players?.find((p) => p.id === state.myId);
}

function isMyTurnForClue() {
  return (
    state.room?.phase === 'clue' &&
    state.room.currentTurnPlayerId === state.myId
  );
}

function isMyTurnForVote() {
  return (
    state.room?.phase === 'vote' &&
    state.room.currentVotePlayerId === state.myId
  );
}

function renderPlayers() {
  const wrap = $('#playersList');
  wrap.innerHTML = '';

  for (const player of state.room.players) {
    const div = document.createElement('div');
    const isClueTurn = player.id === state.room.currentTurnPlayerId;
    const isVoteTurn = player.id === state.room.currentVotePlayerId;
    div.className = `player ${player.alive ? '' : 'dead'} ${isClueTurn || isVoteTurn ? 'active-turn' : ''}`;

    const marker = isClueTurn ? '🎤' : isVoteTurn ? '🗳️' : '';

    div.innerHTML = `
      <strong>${player.name}</strong>
      ${player.isHost ? '<span class="tag">HOST</span>' : '<span></span>'}
      <span>${player.alive ? '🟢' : '⚪'} ${marker}</span>
    `;

    wrap.appendChild(div);
  }
}

function renderClues() {
  const wrap = $('#cluesList');
  wrap.innerHTML = '';
  const entries = state.room.players.filter((p) => p.clue);
  if (!entries.length) {
    wrap.innerHTML = '<div class="log-item">Todavía no hay pistas.</div>';
    return;
  }
  entries.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.textContent = `${p.name}: ${p.clue}`;
    wrap.appendChild(div);
  });
}

function renderVotes() {
  const wrap = $('#votesList');
  wrap.innerHTML = '';
  const entries = state.room.players.filter((p) => p.vote);
  if (!entries.length) {
    wrap.innerHTML = '<div class="log-item">Sin votos mostrados todavía.</div>';
    return;
  }
  entries.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.textContent = `${p.name} votó a ${p.vote}`;
    wrap.appendChild(div);
  });
}

function renderDeadChat() {
  const me = getMyPlayer();
  const panel = $('#deadChatPanel');
  panel.classList.toggle('hidden', !me || me.alive);
  if (!me || me.alive) return;
  const wrap = $('#deadChatMessages');
  wrap.innerHTML = '';
  if (!state.room.deadChat.length) {
    wrap.innerHTML = '<div class="log-item">Todavía no hay mensajes.</div>';
    return;
  }
  state.room.deadChat.forEach((msg) => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.textContent = `${msg.author}: ${msg.text}`;
    wrap.appendChild(div);
  });
}

function renderVoteTargets() {
  const panel = $('#votePanel');
  const wrap = $('#voteTargets');
  const my = getMyPlayer();
  const canVote = isMyTurnForVote() && my?.alive;
  panel.classList.toggle('hidden', !canVote);
  wrap.innerHTML = '';
  if (!canVote) return;

  state.room.players
    .filter((p) => p.alive && p.id !== my.id)
    .forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'vote-btn';
      btn.textContent = `Votar a ${p.name}`;
      btn.onclick = () => {
        wrap.querySelectorAll('button').forEach((b) => (b.disabled = true));
        socket.emit('vote:submit', { code: state.room.code, targetId: p.id });
      };
      wrap.appendChild(btn);
    });
}

function renderCluePanel() {
  $('#cluePanel').classList.toggle('hidden', !isMyTurnForClue());
}

function updateConfigPanel() {
  const me = getMyPlayer();
  const isHost = me?.isHost && state.room.phase === 'lobby';
  [
    'difficultySelect',
    'impostorsInput',
    'clueSecondsInput',
    'debateSecondsInput',
    'maxRoundsInput',
    'saveConfigBtn',
    'startGameBtn',
  ].forEach((id) => ($('#' + id).disabled = !isHost));

  $('#difficultySelect').value = state.room.config.difficulty;
  $('#impostorsInput').value = state.room.config.impostors;
  $('#clueSecondsInput').value = state.room.config.clueSeconds;
  $('#debateSecondsInput').value = state.room.config.debateSeconds;
  $('#maxRoundsInput').value = state.room.config.maxRounds;
}

function renderRoom() {
  if (!state.room) return;

  home.classList.add('hidden');
  roomScreen.classList.remove('hidden');

  $('#roomCode').textContent = `Sala ${state.room.code}`;
  $('#roomMessage').textContent = state.room.message || '';

  if (state.room.phase === 'reveal' && state.room.lastEliminated) {
    const r = state.room.lastEliminated;
    $('#roomMessage').textContent =
      `${r.name} fue eliminado/a. Era ${r.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'}.`;
  }

  $('#phaseBadge').textContent = state.room.phase;
  $('#roundLabel').textContent = `Ronda ${state.room.currentRound}`;
  $('#commentator').textContent = state.room.commentatorMessage || '';
  $('#secretFootballer').textContent =
    state.room.footballer || 'Sos impostor o todavía no empezó la ronda.';

  const hero = document.querySelector('.hero');
  if (hero) {
    hero.classList.toggle('phase-reveal', state.room.phase === 'reveal');
  }

  renderPlayers();
  renderClues();
  renderVotes();
  renderCluePanel();
  renderVoteTargets();
  renderDeadChat();
  updateConfigPanel();

  if (state.room.gameOver) {
    toast(`Partida terminada. Ganaron: ${state.room.winner}`);
  }
}

setInterval(() => {
  if (!state.room?.timerEndsAt) {
    $('#timerText').textContent = '--';
    return;
  }
  const left = Math.max(
    0,
    Math.ceil((state.room.timerEndsAt - Date.now()) / 1000)
  );
  $('#timerText').textContent = `${left}s`;
}, 200);

$('#createRoomBtn').onclick = () => {
  const name = $('#playerName').value.trim();
  socket.emit('room:create', { name });
};

$('#joinRoomBtn').onclick = () => {
  const name = $('#playerName').value.trim();
  const code = $('#joinCode').value.trim().toUpperCase();
  socket.emit('room:join', { code, name });
};

$('#saveConfigBtn').onclick = () => {
  socket.emit('room:updateConfig', {
    code: state.room.code,
    config: {
      difficulty: $('#difficultySelect').value,
      impostors: $('#impostorsInput').value,
      clueSeconds: $('#clueSecondsInput').value,
      debateSeconds: $('#debateSecondsInput').value,
      maxRounds: $('#maxRoundsInput').value,
    },
  });
};

$('#startGameBtn').onclick = () => {
  socket.emit('game:start', { code: state.room.code });
};

$('#sendClueBtn').onclick = () => {
  const btn = $('#sendClueBtn');
  const clue = $('#clueInput').value.trim();
  if (!clue) return;
  btn.disabled = true;
  socket.emit('clue:submit', { code: state.room.code, clue });
  $('#clueInput').value = '';
  setTimeout(() => {
    btn.disabled = false;
  }, 500);
};

$('#sendDeadChatBtn').onclick = () => {
  const message = $('#deadChatInput').value.trim();
  socket.emit('deadchat:send', { code: state.room.code, message });
  $('#deadChatInput').value = '';
};

socket.on('connect', () => {
  state.myId = socket.id;
});

socket.on('room:update', (room) => {
  state.room = room;
  renderRoom();
});

socket.on('app:error', (message) => {
  toast(message);
});
