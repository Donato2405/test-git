const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 5;
const MAX_ROUNDS_LIMIT = 30;

const commentator = {
  lobby: [
    'La sala está tomando forma.',
    'Todo listo para una ronda bien streamera.',
    'Se siente la tensión antes del arranque.',
  ],
  clue: [
    'Se viene una pista que puede delatar.',
    'Ojo con repetir, que acá todo se mira.',
    'Cada palabra pesa en esta ronda.',
  ],
  debate: [
    'Ahora sí, momento de desconfiar de todos.',
    'Empieza el debate: acá se separan los inocentes de los vendehumo.',
    'Hablen ahora, después no lloren en la votación.',
  ],
  vote: [
    'Llegó la hora de votar.',
    'Cada voto puede romper la ronda.',
    'Silencio tenso antes del veredicto.',
  ],
  reveal: [
    'La mesa quedó dada vuelta.',
    'La ronda acaba de cambiar por completo.',
    'Esto ya tiene aroma a clip de stream.',
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const footballers = [
  ...[
    'Lionel Messi', 'Cristiano Ronaldo', 'Neymar', 'Kylian Mbappe', 'Erling Haaland',
    'Luka Modric', 'Karim Benzema', 'Mohamed Salah', 'Robert Lewandowski', 'Vinicius Junior',
    'Jude Bellingham', 'Kevin De Bruyne', 'Harry Kane', 'Antoine Griezmann', 'Sergio Ramos',
    'Luis Suarez', 'Angel Di Maria', 'Paulo Dybala', 'Lautaro Martinez', 'Emiliano Martinez',
    'Pedri', 'Gavi', 'Rodri', 'Julian Alvarez', 'Son Heung-min', 'Bruno Fernandes',
    'Federico Valverde', 'Riyad Mahrez', 'Sadio Mane', 'Casemiro', 'Toni Kroos',
    'Gerard Pique', 'Xavi', 'Andres Iniesta', 'Ronaldinho', 'Zinedine Zidane',
    'David Beckham', 'Thierry Henry', 'Kaka', 'Ronaldo Nazario', 'Ronald Koeman',
    'Gianluigi Buffon', 'Iker Casillas', 'Sergio Aguero', 'Carlos Tevez', 'Didier Drogba',
    'Wayne Rooney', 'Francesco Totti', 'Andrea Pirlo', 'Edinson Cavani',
  ].map((name) => ({ name, difficulty: 'casual' })),
  ...[
    'Alexis Mac Allister', 'Joshua Kimmich', 'Nicolo Barella', 'Rodrygo', 'Martin Odegaard',
    'Joao Felix', 'Ruben Dias', 'Bernardo Silva', 'Declan Rice', 'Phil Foden',
    'Bukayo Saka', 'Martinelli', 'Gabriel Jesus', 'Enzo Fernandez', 'Leandro Paredes',
    'Giovani Lo Celso', 'Marcos Acuna', 'Cristian Romero', 'Nahuel Molina', 'Mikel Merino',
    'Dani Carvajal', 'Achraf Hakimi', 'Theo Hernandez', 'Mike Maignan', 'Marcus Rashford',
    'Jamal Musiala', 'Leroy Sane', 'Ilkay Gundogan', 'Hakan Calhanoglu', 'Hugo Lloris',
    'Aurelien Tchouameni', 'Eduardo Camavinga', 'Frenkie de Jong', 'Memphis Depay', 'Cody Gakpo',
    'Virgil van Dijk', 'Alphonso Davies', 'Joao Cancelo', 'Raphinha', 'Ferran Torres',
    'Niclas Fullkrug', 'Kai Havertz', 'Dusan Vlahovic', 'Federico Chiesa', 'Adrien Rabiot',
    'Piotr Zielinski', 'Khvicha Kvaratskhelia', 'Victor Osimhen', 'Kim Min-jae', 'Takefusa Kubo',
    'Isco', 'Mason Mount', 'Conor Gallagher', 'Dominik Livakovic', 'Yassine Bounou',
    'Giovanni Di Lorenzo', 'Jonathan David', 'Romelu Lukaku', 'Christian Pulisic',
    'Weston McKennie', 'Tyler Adams', 'Leon Goretzka', 'Marquinhos', 'Gabriel Magalhaes',
    'Ederson', 'Alisson Becker', 'Raphael Varane', 'Mats Hummels', 'Alejandro Garnacho',
  ].map((name) => ({ name, difficulty: 'futbolero' })),
  ...[
    'Jeremie Frimpong', 'Joao Palhinha', 'Dani Olmo', 'Dominik Szoboszlai', 'Leonardo Balerdi',
    'Thiago Almada', 'Alexander Sorloth', 'Santiago Hezze', 'Anibal Moreno', 'Kevin Zenon',
    'Cristian Medina', 'Claudio Echeverri', 'Ian Maatsen', 'Tijjani Reijnders', 'Teun Koopmeiners',
    'Morten Hjulmand', 'Jesper Lindstrom', 'Mikkel Damsgaard', 'Albert Gudmundsson',
    'Riccardo Calafiori', 'Giorgio Scalvini', 'Sam Beukema', 'Piero Hincapie', 'Facundo Medina',
    'Kevin Mier', 'Jhon Arias', 'Richard Rios', 'Yerson Mosquera', 'Johan Carbonero', 'Kevin Lomonato',
    'Valentin Barco', 'Esequiel Barco', 'Santiago Simon', 'Ignacio Fernandez', 'Facundo Farías',
    'Luca Langoni', 'Adonis Frias', 'Alan Velasco', 'Santiago Castro', 'Luciano Gondou',
    'Mateo Retegui', 'Valentin Castellanos', 'Santiago Gimenez', 'Orkun Kokcu', 'Kerem Akturkoglu',
    'Arda Guler', 'Yunus Musah', 'Malick Thiaw', 'Benjamin Sesko', 'Lois Openda',
    'Castello Lukeba', 'Jorrel Hato', 'Quinten Timber', 'Mats Wieffer', 'Vangelis Pavlidis',
    'Georges Mikautadze', 'Youssef En-Nesyri', 'Bilal El Khannouss', 'Ayyoub Bouaddi',
    'Mamadou Sarr', 'Julian Carranza', 'Ramiro Enrique', 'Juan Nardoni', 'Juanfer Quintero',
    'Facundo Colidio', 'Pablo Solari', 'Miguel Borja', 'Maxi Salas', 'Braian Aguirre', 'Augustin Giay',
  ].map((name) => ({ name, difficulty: 'hardcore' })),
];

function makeId(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function maxImpostors(playerCount) {
  return Math.max(1, Math.floor(playerCount * 0.3));
}

function createPlayer(socket, name) {
  return {
    id: socket.id,
    name,
    alive: true,
    isHost: false,
    role: 'innocent',
    clue: '',
    vote: null,
  };
}

function currentCluePlayer(room) {
  return room.turnOrder[room.currentTurnIndex] || null;
}

function currentVotePlayer(room) {
  return room.voteOrder[room.currentVoteIndex] || null;
}

function tallyVotes(room) {
  const tally = new Map();
  room.players
    .filter((p) => p.alive)
    .forEach((p) => {
      if (p.vote) tally.set(p.vote, (tally.get(p.vote) || 0) + 1);
    });
  let maxVotes = 0;
  let winners = [];
  for (const [id, count] of tally.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [id];
    } else if (count === maxVotes) {
      winners.push(id);
    }
  }
  return winners;
}

function publicRoomState(room, viewerId) {
  const viewer = room.players.find((p) => p.id === viewerId);
  const currentTurnPlayerId =
    room.phase === 'clue' ? room.turnOrder[room.currentTurnIndex] || null : null;
  const currentVotePlayerId =
    room.phase === 'vote' ? room.voteOrder[room.currentVoteIndex] || null : null;

  return {
    code: room.code,
    phase: room.phase,
    config: room.config,
    currentRound: room.currentRound,
    currentTurnIndex: room.currentTurnIndex,
    currentVoteIndex: room.currentVoteIndex,
    roundStarterIndex: room.roundStarterIndex,
    timerEndsAt: room.timerEndsAt,
    message: room.message,
    commentatorMessage: room.commentatorMessage,
    footballer:
      viewer && viewer.role === 'innocent' ? room.currentFootballer : null,
    currentTurnPlayerId,
    currentVotePlayerId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      alive: p.alive,
      isHost: p.isHost,
      clue: room.revealedClues[p.id] || '',
      vote: room.revealedVotes[p.id] || null,
    })),
    eliminated: room.players
      .filter((p) => !p.alive)
      .map((p) => ({ id: p.id, name: p.name })),
    deadChat: room.deadChat,
    gameOver: room.gameOver,
    winner: room.winner,
    lastEliminated: room.lastEliminated,
  };
}

function broadcastRoom(room) {
  room.players.forEach((player) => {
    io.to(player.id).emit('room:update', publicRoomState(room, player.id));
  });
}

function resetRoundFields(room) {
  room.players.forEach((p) => {
    p.clue = '';
    p.vote = null;
  });
  room.revealedClues = {};
  room.revealedVotes = {};
}

function chooseFootballer(room) {
  const pool = footballers.filter(
    (f) => f.difficulty === room.config.difficulty
  );
  const recent = room.recentFootballers;
  const candidates = pool.filter((f) => !recent.includes(f.name));
  const source = candidates.length > 0 ? candidates : pool;
  const chosen = pick(source);
  room.currentFootballer = chosen.name;
  room.recentFootballers.push(chosen.name);
  if (room.recentFootballers.length > 8) room.recentFootballers.shift();
}

function assignRoles(room) {
  const alivePlayers = room.players.filter((p) => p.alive);
  alivePlayers.forEach((p) => (p.role = 'innocent'));
  const ids = alivePlayers.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const impostorIds = ids.slice(0, room.config.impostors);
  room.players.forEach((p) => {
    if (impostorIds.includes(p.id)) p.role = 'impostor';
  });
}

function getAliveTurnOrder(room) {
  const alive = room.players.filter((p) => p.alive);
  const len = alive.length;
  if (!len) return [];
  const start = room.roundStarterIndex % len;
  return [...alive.slice(start), ...alive.slice(0, start)].map((p) => p.id);
}

function validateClue(footballer, clue) {
  const text = normalize(clue);
  if (!text) return 'La pista no puede estar vacía.';
  if (text.length > 30) return 'La pista supera los 30 caracteres.';
  const nameParts = normalize(footballer).split(/\s+/).filter(Boolean);
  for (const part of nameParts) {
    if (part.length >= 3 && text.includes(part)) {
      return 'La pista no puede incluir nombre o apellido.';
    }
  }
  return null;
}

function applyElimination(room, playerId) {
  const target = room.players.find((p) => p.id === playerId);
  if (!target) return null;
  target.alive = false;
  room.phase = 'reveal';
  room.message = `${target.name} fue eliminado/a.`;
  room.commentatorMessage = pick(commentator.reveal);
  room.lastEliminated = {
    id: target.id,
    name: target.name,
    role: target.role,
  };
  return target;
}

function checkVictory(room) {
  const alive = room.players.filter((p) => p.alive);
  const impostors = alive.filter((p) => p.role === 'impostor');
  const innocents = alive.filter((p) => p.role !== 'impostor');

  if (impostors.length === 0) {
    room.gameOver = true;
    room.phase = 'gameover';
    room.winner = 'inocentes';
    room.message = 'Los inocentes eliminaron a todos los impostores.';
    room.timerEndsAt = null;
    return true;
  }

  if (impostors.length >= innocents.length) {
    room.gameOver = true;
    room.phase = 'gameover';
    room.winner = 'impostores';
    room.message = 'Los impostores igualaron o superaron a los inocentes.';
    room.timerEndsAt = null;
    return true;
  }

  return false;
}

function resolveVoting(room) {
  const winners = tallyVotes(room);

  if (winners.length !== 1) {
    room.message = 'Empate en la votación. Se repite.';
    room.players.forEach((p) => (p.vote = null));
    room.revealedVotes = {};
    room.currentVoteIndex = 0;
    room.commentatorMessage = 'Empate total. Se viene una nueva votación.';
    broadcastRoom(room);
    return;
  }

  applyElimination(room, winners[0]);

  if (checkVictory(room)) {
    broadcastRoom(room);
    return;
  }

  broadcastRoom(room);

  setTimeout(() => {
    room.lastEliminated = null;
    startRound(room);
  }, 1800);
}

function startClueTimer(room) {
  room.phase = 'clue';
  room.commentatorMessage = pick(commentator.clue);
  room.currentTurnIndex = 0;
  room.turnOrder = getAliveTurnOrder(room);
  room.message = 'Fase de pistas';
  room.timerEndsAt = Date.now() + room.config.clueSeconds * 1000;
  clearExistingTimer(room);
  room.timeout = setTimeout(
    () => {
      room.message = 'Tiempo agotado, turno saltado.';
      advanceClueTurn(room);
    },
    room.config.clueSeconds * 1000 + 50
  );
  broadcastRoom(room);
}

function startDebate(room) {
  room.phase = 'debate';
  room.commentatorMessage = pick(commentator.debate);
  room.message = 'Fase de debate';
  room.timerEndsAt = Date.now() + room.config.debateSeconds * 1000;
  clearExistingTimer(room);
  room.timeout = setTimeout(
    () => startVote(room),
    room.config.debateSeconds * 1000 + 50
  );
  broadcastRoom(room);
}

function startVote(room) {
  room.phase = 'vote';
  room.commentatorMessage = pick(commentator.vote);
  room.voteOrder = room.turnOrder.filter(
    (id) => room.players.find((p) => p.id === id)?.alive
  );
  room.currentVoteIndex = 0;
  room.message = 'Fase de votación';
  room.timerEndsAt = null;
  clearExistingTimer(room);
  broadcastRoom(room);
}

function clearExistingTimer(room) {
  if (room.timeout) {
    clearTimeout(room.timeout);
    room.timeout = null;
  }
}

function advanceClueTurn(room) {
  clearExistingTimer(room);
  room.currentTurnIndex += 1;
  if (room.currentTurnIndex >= room.turnOrder.length) {
    startDebate(room);
    return;
  }
  room.timerEndsAt = Date.now() + room.config.clueSeconds * 1000;
  room.commentatorMessage = pick(commentator.clue);
  room.timeout = setTimeout(
    () => {
      room.message = 'Tiempo agotado, turno saltado.';
      advanceClueTurn(room);
    },
    room.config.clueSeconds * 1000 + 50
  );
  broadcastRoom(room);
}

function startRound(room) {
  if (room.currentRound >= room.config.maxRounds) {
    room.gameOver = true;
    room.phase = 'gameover';
    room.winner = 'sin ganador';
    room.message = 'Se alcanzó el máximo de rondas.';
    room.timerEndsAt = null;
    broadcastRoom(room);
    return;
  }

  resetRoundFields(room);
  room.lastEliminated = null;
  room.currentRound += 1;
  room.players.forEach((p) => {
    if (room.currentRound === 1) p.alive = true;
  });
  chooseFootballer(room);
  assignRoles(room);
  room.phase = 'round-start';
  room.commentatorMessage = pick(commentator.lobby);
  room.message = `Comienza la ronda ${room.currentRound}.`;
  room.roundStarterIndex = room.players.filter((p) => p.alive).length
    ? (room.roundStarterIndex + 1) % room.players.filter((p) => p.alive).length
    : 0;
  setTimeout(() => startClueTimer(room), 800);
  broadcastRoom(room);
}

const rooms = new Map();

function createRoom(socket, playerName) {
  let code = makeId();
  while (rooms.has(code)) code = makeId();

  const player = createPlayer(socket, playerName);
  player.isHost = true;

  const room = {
    code,
    hostId: socket.id,
    players: [player],
    phase: 'lobby',
    config: {
      difficulty: 'casual',
      impostors: 1,
      clueSeconds: 30,
      debateSeconds: 60,
      maxRounds: 10,
    },
    currentRound: 0,
    currentFootballer: null,
    recentFootballers: [],
    currentTurnIndex: 0,
    currentVoteIndex: 0,
    roundStarterIndex: -1,
    turnOrder: [],
    voteOrder: [],
    revealedClues: {},
    revealedVotes: {},
    timerEndsAt: null,
    timeout: null,
    message: 'Sala creada.',
    commentatorMessage: pick(commentator.lobby),
    deadChat: [],
    gameOver: false,
    winner: null,
    lastEliminated: null,
  };

  rooms.set(code, room);
  socket.join(code);
  broadcastRoom(room);
}

function joinRoom(socket, code, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Sala inexistente.' };
  if (room.players.length >= MAX_PLAYERS)
    return { error: 'La sala está llena.' };
  if (room.phase !== 'lobby') return { error: 'La partida ya comenzó.' };
  if (room.players.some((p) => normalize(p.name) === normalize(playerName))) {
    return { error: 'Ese nombre ya está en uso.' };
  }
  const player = createPlayer(socket, playerName);
  room.players.push(player);
  socket.join(code);
  broadcastRoom(room);
  return { ok: true };
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name }) => {
    if (!name?.trim()) {
      socket.emit('app:error', 'Tenés que ingresar un nombre.');
      return;
    }
    createRoom(socket, name.trim());
  });

  socket.on('room:join', ({ code, name }) => {
    if (!name?.trim() || !code?.trim()) {
      socket.emit('app:error', 'Código y nombre son obligatorios.');
      return;
    }
    const result = joinRoom(socket, code.trim().toUpperCase(), name.trim());
    if (result?.error) socket.emit('app:error', result.error);
  });

  socket.on('room:updateConfig', ({ code, config }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;

    const playerCount = room.players.length;
    const maxImp = maxImpostors(playerCount);
    room.config = {
      difficulty: ['casual', 'futbolero', 'hardcore'].includes(config.difficulty)
        ? config.difficulty
        : 'casual',
      impostors: Math.max(1, Math.min(Number(config.impostors) || 1, maxImp)),
      clueSeconds: Math.max(10, Math.min(Number(config.clueSeconds) || 30, 90)),
      debateSeconds: Math.max(
        20,
        Math.min(Number(config.debateSeconds) || 60, 180)
      ),
      maxRounds: Math.max(
        1,
        Math.min(Number(config.maxRounds) || 10, MAX_ROUNDS_LIMIT)
      ),
    };
    room.message = 'Configuración actualizada.';
    broadcastRoom(room);
  });

  socket.on('game:start', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (room.players.length < MIN_PLAYERS) {
      socket.emit(
        'app:error',
        `Se necesitan al menos ${MIN_PLAYERS} jugadores.`
      );
      return;
    }
    if (room.players.length > MAX_PLAYERS) {
      socket.emit('app:error', `Máximo ${MAX_PLAYERS} jugadores.`);
      return;
    }
    room.gameOver = false;
    room.winner = null;
    room.players.forEach((p) => (p.alive = true));
    startRound(room);
  });

  socket.on('clue:submit', ({ code, clue }) => {
    const room = rooms.get(code);
    if (!room || room.phase !== 'clue') return;
    if (currentCluePlayer(room) !== socket.id) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.alive) return;
    if (player.clue) return;

    const error = validateClue(room.currentFootballer, String(clue || ''));
    if (error) {
      socket.emit('app:error', error);
      return;
    }

    player.clue = String(clue).trim();
    room.revealedClues[player.id] = player.clue;
    room.message = `${player.name} dio su pista.`;
    advanceClueTurn(room);
  });

  socket.on('vote:submit', ({ code, targetId }) => {
    const room = rooms.get(code);
    if (!room || room.phase !== 'vote') return;
    if (currentVotePlayer(room) !== socket.id) return;

    const voter = room.players.find((p) => p.id === socket.id);
    const target = room.players.find((p) => p.id === targetId);
    if (!voter || !voter.alive || !target || !target.alive) return;
    if (voter.vote) return;

    voter.vote = target.id;
    room.revealedVotes[voter.id] = target.name;
    room.currentVoteIndex += 1;

    if (room.currentVoteIndex >= room.voteOrder.length) {
      resolveVoting(room);
      return;
    }

    broadcastRoom(room);
  });

  socket.on('deadchat:send', ({ code, message }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.alive) return;
    const text = String(message || '').trim();
    if (!text) return;
    room.deadChat.push({ author: player.name, text, at: Date.now() });
    if (room.deadChat.length > 40) room.deadChat.shift();
    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx === -1) continue;
      const leaving = room.players[idx];
      room.players.splice(idx, 1);

      if (room.players.length === 0) {
        clearExistingTimer(room);
        rooms.delete(code);
        return;
      }

      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }
      room.players.forEach((p) => {
        if (p.id !== room.hostId) p.isHost = false;
      });

      room.message = `${leaving.name} salió de la sala.`;

      if (room.phase === 'clue' && currentCluePlayer(room) === socket.id) {
        room.message = 'El jugador activo se desconectó. Turno saltado.';
        room.commentatorMessage = 'La ronda sigue pese a la desconexión.';
        advanceClueTurn(room);
        return;
      }

      if (room.phase === 'vote' && currentVotePlayer(room) === socket.id) {
        room.message = 'El votante actual se desconectó. Se avanza al siguiente.';
        room.commentatorMessage = 'La votación continúa.';
        room.currentVoteIndex += 1;

        if (room.currentVoteIndex >= room.voteOrder.length) {
          resolveVoting(room);
        } else {
          broadcastRoom(room);
        }
        return;
      }

      if (room.phase !== 'lobby' && leaving.alive) {
        leaving.alive = false;
        if (!checkVictory(room)) {
          room.commentatorMessage = 'Hubo una desconexión durante la partida.';
        }
      }

      broadcastRoom(room);
      return;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
