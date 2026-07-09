class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.init();
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Setup pieces
        const pieces = {
            'rook': '♜',
            'knight': '♞',
            'bishop': '♝',
            'queen': '♛',
            'king': '♚',
            'pawn': '♟'
        };

        // White pieces (bottom)
        board[7][0] = { type: 'rook', color: 'white', unicode: '♖' };
        board[7][1] = { type: 'knight', color: 'white', unicode: '♘' };
        board[7][2] = { type: 'bishop', color: 'white', unicode: '♗' };
        board[7][3] = { type: 'queen', color: 'white', unicode: '♕' };
        board[7][4] = { type: 'king', color: 'white', unicode: '♔' };
        board[7][5] = { type: 'bishop', color: 'white', unicode: '♗' };
        board[7][6] = { type: 'knight', color: 'white', unicode: '♘' };
        board[7][7] = { type: 'rook', color: 'white', unicode: '♖' };
        
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white', unicode: '♙' };
        }

        // Black pieces (top)
        board[0][0] = { type: 'rook', color: 'black', unicode: '♜' };
        board[0][1] = { type: 'knight', color: 'black', unicode: '♞' };
        board[0][2] = { type: 'bishop', color: 'black', unicode: '♝' };
        board[0][3] = { type: 'queen', color: 'black', unicode: '♛' };
        board[0][4] = { type: 'king', color: 'black', unicode: '♚' };
        board[0][5] = { type: 'bishop', color: 'black', unicode: '♝' };
        board[0][6] = { type: 'knight', color: 'black', unicode: '♞' };
        board[0][7] = { type: 'rook', color: 'black', unicode: '♜' };
        
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', unicode: '♟' };
        }

        return board;
    }

    init() {
        this.renderBoard();
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;

                if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
                    square.classList.add('selected');
                }

                const validMove = this.validMoves.find(m => m.row === row && m.col === col);
                if (validMove) {
                    if (validMove.capture) {
                        square.classList.add('valid-capture');
                    } else {
                        square.classList.add('valid-move');
                    }
                }

                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = piece.unicode;
                    square.classList.add('piece');
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }

        this.updateGameStatus();
    }

    handleSquareClick(row, col) {
        if (!this.gameActive) return;

        const piece = this.board[row][col];

        // If clicking on a valid move square
        if (this.selectedSquare && this.validMoves.some(m => m.row === row && m.col === col)) {
            this.movePiece(this.selectedSquare, { row, col });
            this.selectedSquare = null;
            this.validMoves = [];
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.renderBoard();
            return;
        }

        // If clicking on own piece
        if (piece && piece.color === this.currentPlayer) {
            this.selectedSquare = { row, col };
            this.validMoves = this.getValidMoves(row, col);
            this.renderBoard();
        } else {
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];

        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece.color));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }

        return moves;
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Forward move
        const nextRow = row + direction;
        if (nextRow >= 0 && nextRow < 8 && !this.board[nextRow][col]) {
            moves.push({ row: nextRow, col, capture: false });

            // Two squares forward from start
            if (row === startRow) {
                const twoRowsAhead = row + 2 * direction;
                if (!this.board[twoRowsAhead][col]) {
                    moves.push({ row: twoRowsAhead, col, capture: false });
                }
            }
        }

        // Capture diagonally
        for (let dcol of [-1, 1]) {
            const newCol = col + dcol;
            if (nextRow >= 0 && nextRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board[nextRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: nextRow, col: newCol, capture: true });
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col, color) {
        return this.getLineMoves(row, col, color, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
    }

    getBishopMoves(row, col, color) {
        return this.getLineMoves(row, col, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    }

    getQueenMoves(row, col, color) {
        return this.getLineMoves(row, col, color, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
    }

    getLineMoves(row, col, color, directions) {
        const moves = [];

        for (let [drow, dcol] of directions) {
            let newRow = row + drow;
            let newCol = col + dcol;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board[newRow][newCol];

                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, capture: false });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, capture: true });
                    break;
                } else {
                    break;
                }

                newRow += drow;
                newCol += dcol;
            }
        }

        return moves;
    }

    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

        for (let [drow, dcol] of knightMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, capture: !!targetPiece });
                }
            }
        }

        return moves;
    }

    getKingMoves(row, col, color) {
        const moves = [];
        for (let drow = -1; drow <= 1; drow++) {
            for (let dcol = -1; dcol <= 1; dcol++) {
                if (drow === 0 && dcol === 0) continue;

                const newRow = row + drow;
                const newCol = col + dcol;

                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = this.board[newRow][newCol];
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol, capture: !!targetPiece });
                    }
                }
            }
        }

        return moves;
    }

    movePiece(from, to) {
        const piece = this.board[from.row][from.col];
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        this.moveHistory.push({ from, to, piece });
    }

    updateGameStatus() {
        document.getElementById('currentTurn').textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.renderBoard();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});