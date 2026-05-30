const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });
const rooms = {};

function send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function broadcast(room, message) {
    room.players.forEach((client) => {
        send(client, message);
    });
}

function getRoom(code) {
    return rooms[code];
}

function validateRoomCode(code) {
    return typeof code === 'string' && /^[A-Z0-9]{4,6}$/.test(code);
}

function createRoom(roomCode, ws) {
    if (!validateRoomCode(roomCode)) {
        send(ws, { type: 'error', message: 'Invalid room code. Use 4-6 letters or numbers.' });
        return;
    }

    if (rooms[roomCode]) {
        send(ws, { type: 'error', message: 'Room already exists. Choose another code.' });
        return;
    }

    const room = {
        code: roomCode,
        board: Array(9).fill(''),
        currentTurn: 'X',
        gameActive: true,
        players: [ws]
    };

    ws.symbol = 'X';
    ws.roomCode = roomCode;
    rooms[roomCode] = room;

    send(ws, {
        type: 'room_created',
        roomCode,
        symbol: 'X',
        board: room.board,
        currentTurn: room.currentTurn,
        gameActive: room.gameActive
    });
}

function joinRoom(roomCode, ws) {
    if (!validateRoomCode(roomCode)) {
        send(ws, { type: 'error', message: 'Invalid room code.' });
        return;
    }

    const room = getRoom(roomCode);
    if (!room) {
        send(ws, { type: 'error', message: 'Room not found.' });
        return;
    }

    if (room.players.length >= 2) {
        send(ws, { type: 'error', message: 'Room is full.' });
        return;
    }

    ws.symbol = 'O';
    ws.roomCode = roomCode;
    room.players.push(ws);

    send(ws, {
        type: 'room_joined',
        roomCode,
        symbol: 'O',
        board: room.board,
        currentTurn: room.currentTurn,
        gameActive: room.gameActive
    });

    broadcast(room, {
        type: 'room_ready',
        roomCode,
        board: room.board,
        currentTurn: room.currentTurn,
        gameActive: room.gameActive,
        message: 'Opponent connected. Ready to play.'
    });
}

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function isBoardFull(board) {
    return board.every(cell => cell !== '');
}

function handleMove(room, ws, index) {
    if (!room.gameActive) {
        send(ws, { type: 'error', message: 'Game is over. Reset to start again.' });
        return;
    }

    if (ws.symbol !== room.currentTurn) {
        send(ws, { type: 'error', message: 'Not your turn.' });
        return;
    }

    if (typeof index !== 'number' || index < 0 || index > 8) {
        send(ws, { type: 'error', message: 'Invalid move index.' });
        return;
    }

    if (room.board[index] !== '') {
        send(ws, { type: 'error', message: 'Cell already taken.' });
        return;
    }

    room.board[index] = ws.symbol;
    const winner = checkWinner(room.board);
    const boardFull = isBoardFull(room.board);

    if (winner) {
        room.gameActive = false;
        broadcast(room, {
            type: 'move',
            board: room.board,
            currentTurn: room.currentTurn,
            gameOver: true,
            outcome: 'win',
            winner: winner,
            message: `${winner} wins!`
        });
        return;
    }

    if (boardFull) {
        room.gameActive = false;
        broadcast(room, {
            type: 'move',
            board: room.board,
            currentTurn: room.currentTurn,
            gameOver: true,
            outcome: 'draw',
            message: 'Draw game.'
        });
        return;
    }

    room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
    broadcast(room, {
        type: 'move',
        board: room.board,
        currentTurn: room.currentTurn,
        gameOver: false
    });
}

function resetRoom(room) {
    room.board = Array(9).fill('');
    room.currentTurn = 'X';
    room.gameActive = true;
    broadcast(room, {
        type: 'reset',
        board: room.board,
        currentTurn: room.currentTurn,
        gameActive: room.gameActive,
        message: 'Room has been reset.'
    });
}

function removeFromRoom(ws) {
    const room = getRoom(ws.roomCode);
    if (!room) return;

    room.players = room.players.filter(client => client !== ws);
    if (room.players.length === 1) {
        send(room.players[0], { type: 'opponent_left', message: 'Opponent disconnected.' });
    }

    if (room.players.length === 0) {
        delete rooms[room.code];
    }
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch {
            send(ws, { type: 'error', message: 'Invalid JSON.' });
            return;
        }

        const { type, roomCode, index } = data;

        if (type === 'create') {
            createRoom(roomCode, ws);
            return;
        }

        if (type === 'join') {
            joinRoom(roomCode, ws);
            return;
        }

        const room = getRoom(ws.roomCode);
        if (!room) {
            send(ws, { type: 'error', message: 'Not connected to any room.' });
            return;
        }

        if (type === 'move') {
            handleMove(room, ws, index);
            return;
        }

        if (type === 'reset') {
            resetRoom(room);
            return;
        }

        send(ws, { type: 'error', message: 'Unknown message type.' });
    });

    ws.on('close', () => {
        removeFromRoom(ws);
    });
});

console.log('WebSocket server listening on ws://localhost:3001');
