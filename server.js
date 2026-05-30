const WebSocket = require('ws');
const port = process.env.PORT || 3000;
const rooms = new Map();

const server = new WebSocket.Server({ port });

function generateRoomId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(room, data) {
  room.players.forEach((player) => send(player, data));
}

function getOpponent(room, sender) {
  return room.players.find((player) => player !== sender);
}

function getWinner(board) {
  const patterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const pattern of patterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function leaveRoom(ws) {
  const roomId = ws.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter((player) => player !== ws);

  if (room.players.length === 1) {
    send(room.players[0], { type: 'opponent_left' });
  }

  if (room.players.length === 0) {
    rooms.delete(roomId);
  }
}

function handleMessage(ws, message) {
  let data;

  try {
    data = JSON.parse(message.toString());
  } catch (error) {
    send(ws, { type: 'room_error', message: 'Invalid JSON payload.' });
    return;
  }

  if (data.type === 'create_room') {
    let roomId = generateRoomId();
    while (rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const room = {
      id: roomId,
      players: [ws],
      board: Array(9).fill(''),
      currentPlayer: 'X',
    };
    rooms.set(roomId, room);
    ws.roomId = roomId;
    ws.symbol = 'X';

    send(ws, { type: 'room_created', roomId, symbol: 'X' });
    return;
  }

  if (data.type === 'join_room') {
    const room = rooms.get(data.roomId);
    if (!room) {
      send(ws, { type: 'room_error', message: 'Room not found.' });
      return;
    }

    if (room.players.length >= 2) {
      send(ws, { type: 'room_error', message: 'Room is full.' });
      return;
    }

    room.players.push(ws);
    ws.roomId = data.roomId;
    ws.symbol = 'O';

    send(ws, {
      type: 'room_joined',
      roomId: data.roomId,
      symbol: 'O',
      board: room.board,
      currentPlayer: room.currentPlayer,
    });

    const host = room.players.find((player) => player !== ws);
    if (host) {
      send(host, { type: 'player_joined' });
    }
    return;
  }

  if (data.type === 'move') {
    const room = rooms.get(data.roomId);
    if (!room) {
      send(ws, { type: 'room_error', message: 'Room not found.' });
      return;
    }

    if (room.currentPlayer !== ws.symbol) {
      send(ws, { type: 'room_error', message: 'Not your turn.' });
      return;
    }

    if (typeof data.index !== 'number' || data.index < 0 || data.index > 8) {
      send(ws, { type: 'room_error', message: 'Invalid move index.' });
      return;
    }

    if (room.board[data.index] !== '') {
      send(ws, { type: 'room_error', message: 'Cell already taken.' });
      return;
    }

    room.board[data.index] = ws.symbol;
    const winner = getWinner(room.board);
    const draw = !winner && room.board.every((cell) => cell !== '');
    room.currentPlayer = winner || draw ? null : ws.symbol === 'X' ? 'O' : 'X';

    broadcast(room, {
      type: 'move_made',
      index: data.index,
      symbol: ws.symbol,
      board: room.board,
      currentPlayer: room.currentPlayer,
      winner,
      draw,
    });
    return;
  }

  if (data.type === 'reset_game') {
    const room = rooms.get(data.roomId);
    if (!room) {
      send(ws, { type: 'room_error', message: 'Room not found.' });
      return;
    }

    room.board = Array(9).fill('');
    room.currentPlayer = 'X';

    broadcast(room, {
      type: 'room_reset',
      board: room.board,
      currentPlayer: room.currentPlayer,
    });
    return;
  }

  send(ws, { type: 'room_error', message: 'Unknown action type.' });
}

server.on('connection', (ws) => {
  ws.on('message', (message) => handleMessage(ws, message));
  ws.on('close', () => leaveRoom(ws));
});

console.log(`WebSocket Tic Tac Toe server listening on ws://localhost:${port}`);
