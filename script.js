class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.mode = 'ai';
        this.difficulty = 'hard';
        this.scores = { x: 0, o: 0, draw: 0 };
        this.roomId = '';
        this.playerSymbol = 'X';
        this.socket = null;
        this.remoteConnected = false;
        this.loadScores();
        this.setupEventListeners();
        this.resetBoard();
    }

    setupEventListeners() {
        this.cells = document.querySelectorAll('.cell');
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.onCellClick(index));
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (this.mode === 'remote' && this.remoteConnected) {
                this.sendMessage({ type: 'reset_game', roomId: this.roomId });
            } else {
                this.resetBoard();
            }
        });
        document.getElementById('resetScoreBtn').addEventListener('click', () => this.resetScore());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (this.mode === 'ai') {
                this.resetBoard();
            }
        });
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.setMode(e.target.value);
        });
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
    }

    setMode(mode) {
        if (this.socket) {
            this.closeSocket();
        }

        this.mode = mode;
        this.roomId = '';
        this.playerSymbol = 'X';
        this.remoteConnected = false;
        this.updateRemoteVisibility();
        this.resetBoard();
    }

    updateRemoteVisibility() {
        const remotePanel = document.getElementById('remotePanel');
        const difficultySelect = document.getElementById('difficulty');
        const playerOLabel = document.getElementById('playerOLabel');
        const subtitle = document.querySelector('.subtitle');

        if (this.mode === 'remote') {
            remotePanel.classList.remove('hidden');
            difficultySelect.disabled = true;
            playerOLabel.textContent = 'Player O';
            subtitle.textContent = 'Remote multiplayer room';
        } else {
            remotePanel.classList.add('hidden');
            difficultySelect.disabled = this.mode !== 'ai';
            playerOLabel.textContent = this.mode === 'ai' ? 'AI (O)' : 'Player O';
            subtitle.textContent = this.mode === 'ai' ? 'Challenge the AI' : 'Play Local Multiplayer';
        }
    }

    onCellClick(index) {
        if (this.mode === 'remote') {
            this.remoteMove(index);
        } else if (this.mode === 'multiplayer') {
            this.localMove(index);
        } else {
            this.aiMoveClick(index);
        }
    }

    localMove(index) {
        if (!this.gameActive || this.board[index] !== '') return;

        const symbol = this.currentPlayer;
        this.board[index] = symbol;
        this.updateBoard(index, symbol);

        if (this.checkWinner(symbol)) {
            this.scores[symbol.toLowerCase()]++;
            this.endGame(`${symbol} wins! 🎉`);
            return;
        }

        if (this.isBoardFull()) {
            this.scores.draw++;
            this.endGame("It's a draw! 🤝");
            return;
        }

        this.currentPlayer = symbol === 'X' ? 'O' : 'X';
        this.updateStatus();
    }

    aiMoveClick(index) {
        if (!this.gameActive || this.board[index] !== '') return;

        this.board[index] = 'X';
        this.updateBoard(index, 'X');

        if (this.checkWinner('X')) {
            this.scores.x++;
            this.endGame('You win! 🎉');
            return;
        }

        if (this.isBoardFull()) {
            this.scores.draw++;
            this.endGame("It's a draw! 🤝");
            return;
        }

        this.gameActive = false;
        this.updateStatus('AI is thinking...');
        setTimeout(() => this.aiMove(), 500);
    }

    aiMove() {
        let bestMove = -1;

        if (this.difficulty === 'hard') {
            bestMove = this.findBestMove();
        } else if (this.difficulty === 'medium') {
            bestMove = Math.random() > 0.3 ? this.findBestMove() : this.getRandomMove();
        } else {
            bestMove = this.getRandomMove();
        }

        if (bestMove < 0) return;

        this.board[bestMove] = 'O';
        this.updateBoard(bestMove, 'O');

        if (this.checkWinner('O')) {
            this.scores.o++;
            this.endGame('AI wins! 🤖');
            return;
        }

        if (this.isBoardFull()) {
            this.scores.draw++;
            this.endGame("It's a draw! 🤝");
            return;
        }

        this.gameActive = true;
        this.updateStatus();
    }

    createRoom() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        if (!serverUrl) {
            this.setRemoteStatus('Enter a valid WebSocket server address.', true);
            return;
        }

        this.connectToServer(serverUrl, () => {
            this.sendMessage({ type: 'create_room' });
        });
    }

    joinRoom() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const roomId = document.getElementById('roomIdInput').value.trim();
        if (!serverUrl || !roomId) {
            this.setRemoteStatus('Enter a server URL and room ID.', true);
            return;
        }

        this.connectToServer(serverUrl, () => {
            this.sendMessage({ type: 'join_room', roomId });
        });
    }

    connectToServer(serverUrl, onOpen) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }

        try {
            this.socket = new WebSocket(serverUrl);
        } catch (error) {
            this.setRemoteStatus('Failed to connect to server.', true);
            return;
        }

        this.socket.addEventListener('open', () => {
            this.setRemoteStatus('Connected to server. Waiting for room response.');
            onOpen();
        });

        this.socket.addEventListener('message', (event) => {
            this.handleServerMessage(event.data);
        });

        this.socket.addEventListener('close', () => {
            this.remoteConnected = false;
            this.setRemoteStatus('Disconnected from server.', true);
            this.updateStatus();
        });

        this.socket.addEventListener('error', () => {
            this.setRemoteStatus('WebSocket error. Check the server URL and network.', true);
        });
    }

    closeSocket() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.remoteConnected = false;
    }

    sendMessage(payload) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.setRemoteStatus('Connection is not open yet.', true);
            return;
        }
        this.socket.send(JSON.stringify(payload));
    }

    handleServerMessage(rawData) {
        let data;
        try {
            data = JSON.parse(rawData);
        } catch (error) {
            return;
        }

        switch (data.type) {
            case 'room_created':
                this.roomId = data.roomId;
                this.playerSymbol = data.symbol;
                this.remoteConnected = true;
                this.gameActive = true;
                this.setRemoteStatus(`Room created: ${data.roomId}. Waiting for an opponent.`);
                this.updateStatus(`Room ${data.roomId} created. Waiting for opponent...`);
                break;
            case 'room_joined':
                this.roomId = data.roomId;
                this.playerSymbol = data.symbol;
                this.remoteConnected = true;
                this.board = data.board.slice();
                this.currentPlayer = data.currentPlayer;
                this.gameActive = true;
                this.refreshBoard();
                this.setRemoteStatus(`Joined room ${data.roomId}. You are ${data.symbol}.`);
                this.updateStatus();
                break;
            case 'player_joined':
                this.setRemoteStatus('Opponent has joined the room. Game ready.');
                this.updateStatus('Your turn.');
                break;
            case 'move_made':
                this.board = data.board.slice();
                this.currentPlayer = data.currentPlayer;
                this.refreshBoard();

                if (data.winner) {
                    this.gameActive = false;
                    this.scores[data.winner.toLowerCase()]++;
                    this.endGame(`${data.winner} wins! 🎉`);
                } else if (data.draw) {
                    this.gameActive = false;
                    this.scores.draw++;
                    this.endGame("It's a draw! 🤝");
                } else {
                    this.gameActive = this.currentPlayer === this.playerSymbol;
                    this.updateStatus();
                }
                break;
            case 'room_reset':
                this.board = data.board.slice();
                this.currentPlayer = data.currentPlayer;
                this.gameActive = true;
                this.refreshBoard();
                this.setRemoteStatus('Room has been reset.');
                this.updateStatus();
                break;
            case 'room_error':
                this.setRemoteStatus(data.message || 'Room error occurred.', true);
                break;
            case 'opponent_left':
                this.setRemoteStatus('Opponent disconnected. Create or join another room.', true);
                this.remoteConnected = false;
                this.gameActive = false;
                this.updateStatus();
                break;
            default:
                break;
        }
    }

    remoteMove(index) {
        if (!this.remoteConnected) return;
        if (!this.gameActive) return;
        if (this.board[index] !== '') return;
        if (this.currentPlayer !== this.playerSymbol) return;

        this.sendMessage({ type: 'move', roomId: this.roomId, index });
        this.updateStatus('Waiting for opponent...');
    }

    refreshBoard() {
        this.cells.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.classList.remove('x', 'o', 'taken');
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase(), 'taken');
            }
        });
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = 0;

        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                const score = this.minimax(this.board, 0, false);
                this.board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.getWinner(board);

        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFullUtil(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        }

        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = this.minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }

    getRandomMove() {
        const emptyIndices = this.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    checkWinner(player) {
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

        return winPatterns.some(pattern =>
            pattern.every(index => this.board[index] === player)
        );
    }

    getWinner(board) {
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

        for (let pattern of winPatterns) {
            if (pattern.every(index => board[index] === 'O')) return 'O';
            if (pattern.every(index => board[index] === 'X')) return 'X';
        }
        return null;
    }

    isBoardFull() {
        return this.board.every(cell => cell !== '');
    }

    isBoardFullUtil(board) {
        return board.every(cell => cell !== '');
    }

    updateBoard(index, player) {
        const cells = document.querySelectorAll('.cell');
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase(), 'taken');
    }

    updateStatus(customMessage = null) {
        const statusEl = document.getElementById('status');
        statusEl.classList.remove('winner', 'loser', 'draw');

        if (customMessage) {
            statusEl.textContent = customMessage;
            return;
        }

        if (this.mode === 'remote') {
            if (!this.remoteConnected) {
                statusEl.textContent = 'Not connected. Create or join a room.';
            } else if (!this.gameActive) {
                statusEl.textContent = 'Waiting for opponent or game restart.';
            } else if (this.currentPlayer !== this.playerSymbol) {
                statusEl.textContent = `Waiting for opponent (${this.currentPlayer})`;
            } else {
                statusEl.textContent = `Your turn (${this.playerSymbol})`;
            }
        } else if (this.mode === 'multiplayer') {
            statusEl.textContent = this.gameActive ? `Player ${this.currentPlayer}'s turn` : 'Game over';
        } else {
            statusEl.textContent = this.gameActive ? 'Your Turn! (X)' : 'AI is thinking...';
        }
    }

    endGame(message) {
        this.gameActive = false;
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.classList.remove('winner', 'loser', 'draw');

        if (message.includes('draw')) {
            statusEl.classList.add('draw');
        } else if (this.mode === 'ai' && message.includes('AI wins')) {
            statusEl.classList.add('loser');
        } else {
            statusEl.classList.add('winner');
        }

        this.updateScores();
    }

    resetBoard() {
        this.board.fill('');
        this.currentPlayer = 'X';
        this.gameActive = this.mode !== 'remote' || this.remoteConnected;
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'taken');
        });
        this.updateStatus();
    }

    updateScores() {
        document.getElementById('playerScore').textContent = this.scores.x;
        document.getElementById('aiScore').textContent = this.scores.o;
        document.getElementById('drawScore').textContent = this.scores.draw;
        this.saveScores();
    }

    saveScores() {
        localStorage.setItem('tictactoeScores', JSON.stringify(this.scores));
    }

    loadScores() {
        const saved = localStorage.getItem('tictactoeScores');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.scores = {
                x: parsed.x ?? parsed.player ?? 0,
                o: parsed.o ?? parsed.ai ?? 0,
                draw: parsed.draw ?? 0
            };
        }
    }

    resetScore() {
        if (confirm('Are you sure you want to reset all scores?')) {
            this.scores = { x: 0, o: 0, draw: 0 };
            this.updateScores();
        }
    }

    setRemoteStatus(message, isError = false) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#b91c1c' : '#0f172a';
        statusEl.style.borderColor = isError ? '#fecaca' : '#d1d5db';
        statusEl.style.backgroundColor = isError ? '#fef2f2' : '#f5f7fa';
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
