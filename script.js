class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.difficulty = 'hard';
        this.scores = { player: 0, ai: 0, draw: 0 };
        this.gameMode = 'ai';
        this.socket = null;
        this.mySymbol = null;
        this.currentTurn = 'X';
        this.isConnected = false;
        this.roomCode = '';
        this.movePending = false;
        this.loadScores();
        document.addEventListener('DOMContentLoaded', () => this.initializeGame());
    }

    initializeGame() {
        this.cells = document.querySelectorAll('.cell');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.roomCodeInput = document.getElementById('roomCodeInput');
        this.roomInfo = document.getElementById('roomInfo');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.playerBadge = document.getElementById('playerBadge');
        this.gameModeSelect = document.getElementById('gameMode');
        this.difficultySelect = document.getElementById('difficulty');
        this.resetBtn = document.getElementById('resetBtn');
        this.resetScoreBtn = document.getElementById('resetScoreBtn');
        this.statusEl = document.getElementById('status');
        this.multiplayerPanel = document.getElementById('multiplayerPanel');

        this.cells.forEach((cell, index) => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'taken');
            cell.addEventListener('click', () => this.playerMove(index));
        });

        this.gameModeSelect.value = this.gameMode;
        this.gameModeSelect.addEventListener('change', (e) => this.handleGameModeChange(e.target.value));
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.resetScoreBtn.addEventListener('click', () => this.resetScore());
        this.difficultySelect.value = this.difficulty;
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (this.gameMode === 'ai') {
                this.resetBoard();
            }
        });

        this.updateUI();
        this.updateStatus();
    }

    handleGameModeChange(mode) {
        if (this.gameMode === mode) return;
        this.gameMode = mode;
        if (mode === 'remote') {
            this.disconnectWebSocket();
            this.resetBoard();
            this.setConnectionStatus('Remote mode selected. Create or join a room.', 'warning');
        } else {
            this.disconnectWebSocket();
            this.resetBoard();
            this.setConnectionStatus('AI mode active.', 'success');
        }
        this.updateUI();
    }

    updateUI() {
        const multiplayerVisible = this.gameMode === 'remote';
        this.multiplayerPanel.style.display = multiplayerVisible ? 'block' : 'none';
        this.difficultySelect.disabled = this.gameMode === 'remote';
        this.playerBadge.textContent = this.isConnected && this.mySymbol ? `Your symbol: ${this.mySymbol}` : '';
        this.roomInfo.textContent = this.roomCode ? `Room code: ${this.roomCode}` : 'Room code: —';
    }

    createRoom() {
        const requestedCode = this.roomCodeInput.value.trim().toUpperCase();
        const roomCode = requestedCode || this.generateRoomCode();
        this.roomCodeInput.value = roomCode;
        this.connectWebSocket('create', roomCode);
    }

    joinRoom() {
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        if (!roomCode) {
            this.setConnectionStatus('Enter a room code to join.', 'error');
            return;
        }
        this.connectWebSocket('join', roomCode);
    }

    connectWebSocket(action, roomCode) {
        if (this.socket) {
            this.disconnectWebSocket();
        }

        this.setConnectionStatus('Connecting to remote server...', 'info');
        this.socket = new WebSocket('ws://localhost:3000');

        this.socket.onopen = () => {
            this.sendSocket({ type: action, roomCode });
        };

        this.socket.onmessage = (event) => this.handleSocketMessage(event.data);
        this.socket.onerror = () => this.setConnectionStatus('WebSocket error. Check the server.', 'error');
        this.socket.onclose = () => {
            this.isConnected = false;
            this.setConnectionStatus('Disconnected from server.', 'error');
            this.updateUI();
        };
    }

    disconnectWebSocket() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.roomCode = '';
        this.mySymbol = null;
        this.currentTurn = 'X';
        this.movePending = false;
        this.updateUI();
    }

    sendSocket(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    handleSocketMessage(rawData) {
        let data;
        try {
            data = JSON.parse(rawData);
        } catch {
            return;
        }

        switch (data.type) {
            case 'room_created':
                this.roomCode = data.roomCode;
                this.mySymbol = data.symbol;
                this.currentTurn = data.currentTurn;
                this.isConnected = true;
                this.board = data.board.slice();
                this.gameActive = true;
                this.movePending = false;
                this.updateUI();
                this.refreshBoard();
                this.setConnectionStatus(`Room ${data.roomCode} created. Waiting for opponent...`, 'warning');
                this.updateStatus();
                break;
            case 'room_joined':
                this.roomCode = data.roomCode;
                this.mySymbol = data.symbol;
                this.currentTurn = data.currentTurn;
                this.isConnected = true;
                this.board = data.board.slice();
                this.gameActive = data.gameActive;
                this.movePending = false;
                this.updateUI();
                this.refreshBoard();
                this.setConnectionStatus(`Joined room ${data.roomCode}. Waiting for opponent...`, 'warning');
                this.updateStatus();
                break;
            case 'room_ready':
                this.isConnected = true;
                this.board = data.board.slice();
                this.currentTurn = data.currentTurn;
                this.gameActive = data.gameActive;
                this.movePending = false;
                this.updateUI();
                this.refreshBoard();
                this.setConnectionStatus('Opponent connected. Ready to play.', 'success');
                this.updateStatus();
                break;
            case 'move':
                this.board = data.board.slice();
                this.currentTurn = data.currentTurn;
                this.gameActive = !data.gameOver;
                this.movePending = false;
                this.refreshBoard();
                if (data.gameOver) {
                    this.handleGameOver(data);
                } else {
                    this.updateStatus();
                }
                break;
            case 'reset':
                this.board = data.board.slice();
                this.currentTurn = data.currentTurn;
                this.gameActive = true;
                this.movePending = false;
                this.refreshBoard();
                this.setConnectionStatus('Room reset. Ready for next round.', 'success');
                this.updateStatus();
                break;
            case 'room_status':
                this.movePending = false;
                this.setConnectionStatus(data.message, data.status || 'info');
                break;
            case 'opponent_left':
                this.isConnected = true;
                this.gameActive = false;
                this.refreshBoard();
                this.setConnectionStatus('Opponent disconnected. Waiting for reconnection.', 'warning');
                this.updateStatus();
                break;
            case 'error':
                this.movePending = false;
                this.setConnectionStatus(data.message || 'Remote error occurred.', 'error');
                break;
            default:
                break;
        }
    }

    handleGameOver(data) {
        if (data.outcome === 'win') {
            const message = data.winner === this.mySymbol ? 'You win! 🎉' : 'Opponent wins!';
            this.endGame(message);
        } else if (data.outcome === 'draw') {
            this.endGame("It's a draw! 🤝");
        } else {
            this.endGame(data.message || 'Game over.');
        }
    }

    playerMove(index) {
        if (!this.gameActive) return;

        if (this.gameMode === 'remote') {
            this.remoteMove(index);
            return;
        }

        if (this.board[index] !== '') return;

        this.board[index] = 'X';
        this.updateBoard(index, 'X');

        if (this.checkWinner('X')) {
            this.endGame('You win! 🎉');
            this.scores.player++;
            return;
        }

        if (this.isBoardFull()) {
            this.endGame("It's a draw! 🤝");
            this.scores.draw++;
            return;
        }

        this.gameActive = false;
        this.updateStatus('AI is thinking...');
        setTimeout(() => this.aiMove(), 500);
    }

    remoteMove(index) {
        if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.setConnectionStatus('Not connected to a room.', 'error');
            return;
        }

        if (this.movePending) {
            this.setConnectionStatus('Move in progress, please wait.', 'warning');
            return;
        }

        if (this.currentTurn !== this.mySymbol) {
            this.setConnectionStatus('Not your turn yet.', 'warning');
            return;
        }

        if (this.board[index] !== '') return;

        this.movePending = true;
        this.sendSocket({ type: 'move', roomCode: this.roomCode, index });
        this.updateStatus('Waiting for opponent...');
    }

    requestRemoteReset() {
        if (this.gameMode === 'remote' && this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendSocket({ type: 'reset', roomCode: this.roomCode });
            return;
        }
        this.resetBoard();
    }

    resetGame() {
        if (this.gameMode === 'remote') {
            this.requestRemoteReset();
            return;
        }
        this.resetBoard();
    }

    resetBoard() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.movePending = false;
        this.refreshBoard();
        this.updateStatus();
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

        this.board[bestMove] = 'O';
        this.updateBoard(bestMove, 'O');

        if (this.checkWinner('O')) {
            this.endGame('AI wins! 🤖');
            this.scores.ai++;
            return;
        }

        if (this.isBoardFull()) {
            this.endGame("It's a draw! 🤝");
            this.scores.draw++;
            return;
        }

        this.gameActive = true;
        this.updateStatus();
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
        const cell = this.cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase(), 'taken');
    }

    refreshBoard() {
        this.cells.forEach((cell, index) => {
            const value = this.board[index];
            cell.textContent = value;
            cell.classList.remove('x', 'o', 'taken');
            if (value) {
                cell.classList.add(value.toLowerCase(), 'taken');
            }
        });
    }

    updateStatus(customMessage = null) {
        this.statusEl.classList.remove('winner', 'loser', 'draw');

        if (customMessage) {
            this.statusEl.textContent = customMessage;
            return;
        }

        if (this.gameMode === 'remote') {
            if (!this.isConnected) {
                this.statusEl.textContent = 'Connect to a room to begin.';
                return;
            }

            if (!this.gameActive) {
                this.statusEl.textContent = 'Game paused. Use New Game to reset.';
                return;
            }

            this.statusEl.textContent = this.currentTurn === this.mySymbol
                ? `Your turn (${this.mySymbol})`
                : `Waiting for opponent (${this.currentTurn})`;
            return;
        }

        this.statusEl.textContent = this.gameActive ? 'Your Turn! (X)' : 'AI is thinking...';
    }

    setConnectionStatus(message, statusType = 'info') {
        this.connectionStatus.textContent = message;
        this.connectionStatus.className = `connection-status ${statusType}`;
    }

    endGame(message) {
        this.gameActive = false;
        this.statusEl.textContent = message;
        this.statusEl.classList.remove('winner', 'loser', 'draw');

        if (message.includes('draw')) {
            this.statusEl.classList.add('draw');
        } else if (message.includes('AI wins') || message.includes('Opponent wins')) {
            this.statusEl.classList.add('loser');
        } else {
            this.statusEl.classList.add('winner');
        }

        if (this.gameMode === 'ai') {
            this.updateScores();
        }
    }

    updateScores() {
        document.getElementById('playerScore').textContent = this.scores.player;
        document.getElementById('aiScore').textContent = this.scores.ai;
        document.getElementById('drawScore').textContent = this.scores.draw;
        this.saveScores();
    }

    saveScores() {
        localStorage.setItem('tictactoeScores', JSON.stringify(this.scores));
    }

    loadScores() {
        const saved = localStorage.getItem('tictactoeScores');
        if (saved) {
            this.scores = JSON.parse(saved);
            this.updateScores();
        }
    }

    resetScore() {
        if (confirm('Are you sure you want to reset all scores?')) {
            this.scores = { player: 0, ai: 0, draw: 0 };
            this.updateScores();
        }
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
