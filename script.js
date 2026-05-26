class TicTacToe {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.difficulty = 'hard';
        this.scores = { player: 0, ai: 0, draw: 0 };
        this.loadScores();
        this.initializeGame();
    }

    initializeGame() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'taken');
            cell.addEventListener('click', () => this.playerMove(index));
        });

        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('resetScoreBtn').addEventListener('click', () => this.resetScore());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.resetGame();
        });

        this.updateStatus();
    }

    playerMove(index) {
        if (!this.gameActive || this.board[index] !== '') return;

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
        } else {
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
        statusEl.textContent = customMessage || (this.gameActive ? 'Your Turn! (X)' : 'AI is thinking...');
    }

    endGame(message) {
        this.gameActive = false;
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        
        if (message.includes('win')) {
            statusEl.classList.add('winner');
        } else if (message.includes('AI wins')) {
            statusEl.classList.add('loser');
        } else {
            statusEl.classList.add('draw');
        }

        this.updateScores();
    }

    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.initializeGame();
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
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
