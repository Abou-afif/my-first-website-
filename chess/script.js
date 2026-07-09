class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.boardHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.halfmoveClock = 0;
        this.init();
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
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
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
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

                // Check highlighting
                if (this.isInCheck(this.currentPlayer)) {
                    const kingPos = this.findKing(this.currentPlayer);
                    if (kingPos && kingPos.row === row && kingPos.col === col) {
                        square.classList.add('check');
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
        this.updateCapturedPieces();
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
            
            // Check game end conditions
            this.checkGameEnd();
            
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

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        // Filter out moves that would leave king in check
        moves = moves.filter(move => {
            const testBoard = JSON.parse(JSON.stringify(this.board));
            testBoard[move.row][move.col] = testBoard[row][col];
            testBoard[row][col] = null;
            
            const tempBoard = this.board;
            this.board = testBoard;
            const inCheck = this.isInCheck(piece.color);
            this.board = tempBoard;
            
            return !inCheck;
        });

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
                    moves.push({ row: twoRowsAhead, col, capture: false, enPassantTarget: { row: twoRowsAhead, col } });
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

        // En passant
        if (this.enPassantTarget) {
            for (let dcol of [-1, 1]) {
                const newCol = col + dcol;
                if (newCol === this.enPassantTarget.col && nextRow === this.enPassantTarget.row) {
                    moves.push({ row: nextRow, col: newCol, capture: true, enPassant: true });
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

        // Regular king moves
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

        // Castling
        if (!this.isInCheck(color)) {
            const rights = this.castlingRights[color];
            const backRow = color === 'white' ? 7 : 0;

            // Kingside castling
            if (rights.kingside) {
                const rook = this.board[backRow][7];
                if (rook && rook.type === 'rook' && !this.board[backRow][5] && !this.board[backRow][6]) {
                    if (!this.isSquareAttacked(backRow, 5, color) && !this.isSquareAttacked(backRow, 6, color)) {
                        moves.push({ row: backRow, col: 6, castling: 'kingside' });
                    }
                }
            }

            // Queenside castling
            if (rights.queenside) {
                const rook = this.board[backRow][0];
                if (rook && rook.type === 'rook' && !this.board[backRow][1] && !this.board[backRow][2] && !this.board[backRow][3]) {
                    if (!this.isSquareAttacked(backRow, 2, color) && !this.isSquareAttacked(backRow, 3, color)) {
                        moves.push({ row: backRow, col: 2, castling: 'queenside' });
                    }
                }
            }
        }

        return moves;
    }

    movePiece(from, to) {
        const piece = this.board[from.row][from.col];
        const captured = this.board[to.row][to.col];
        const move = this.validMoves.find(m => m.row === to.row && m.col === to.col);

        // Save board state for undo
        this.boardHistory.push(JSON.parse(JSON.stringify(this.board)));
        this.enPassantTarget = null;

        // Handle en passant
        if (move && move.enPassant) {
            const capturedPawn = this.board[from.row][to.col];
            this.capturedPieces[this.currentPlayer].push(capturedPawn);
            this.board[from.row][to.col] = null;
        }

        // Handle captures
        if (captured) {
            this.capturedPieces[this.currentPlayer].push(captured);
        }

        // Handle pawn promotion
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
            this.showPromotionDialog(piece.color, to);
        }

        // Handle castling
        if (move && move.castling) {
            const backRow = piece.color === 'white' ? 7 : 0;
            if (move.castling === 'kingside') {
                const rook = this.board[backRow][7];
                this.board[backRow][5] = rook;
                this.board[backRow][7] = null;
            } else if (move.castling === 'queenside') {
                const rook = this.board[backRow][0];
                this.board[backRow][3] = rook;
                this.board[backRow][0] = null;
            }
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'rook') {
            if (from.col === 0) this.castlingRights[piece.color].queenside = false;
            if (from.col === 7) this.castlingRights[piece.color].kingside = false;
        }

        // Move piece
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;

        // Store en passant target
        if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
            this.enPassantTarget = { row: (from.row + to.row) / 2, col: to.col };
        }

        // Record move
        this.recordMove(from, to, piece, captured);
    }

    showPromotionDialog(color, position) {
        const modal = document.getElementById('promotionModal') || this.createPromotionModal();
        const piece = this.board[position.row][position.col];
        const pieces = ['♕', '♖', '♗', '♘']; // Queen, Rook, Bishop, Knight
        const types = ['queen', 'rook', 'bishop', 'knight'];
        
        const buttonsContainer = modal.querySelector('.promotion-buttons');
        buttonsContainer.innerHTML = '';

        types.forEach((type, index) => {
            const btn = document.createElement('button');
            btn.className = 'promotion-btn';
            btn.textContent = pieces[index];
            btn.onclick = () => {
                piece.type = type;
                piece.unicode = pieces[index];
                modal.classList.remove('active');
                this.renderBoard();
            };
            buttonsContainer.appendChild(btn);
        });

        modal.classList.add('active');
    }

    createPromotionModal() {
        const modal = document.createElement('div');
        modal.id = 'promotionModal';
        modal.className = 'promotion-modal';
        modal.innerHTML = `
            <div class="promotion-content">
                <h2>Promote Pawn</h2>
                <div class="promotion-buttons"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        return this.isSquareAttacked(kingPos.row, kingPos.col, color);
    }

    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackingColor) {
                    const moves = this.getAttackMoves(r, c, piece);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getAttackMoves(row, col, piece) {
        let moves = [];
        const color = piece.color;

        switch (piece.type) {
            case 'pawn':
                const direction = color === 'white' ? -1 : 1;
                for (let dcol of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + dcol;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, color);
                break;
            case 'king':
                for (let drow = -1; drow <= 1; drow++) {
                    for (let dcol = -1; dcol <= 1; dcol++) {
                        if (drow === 0 && dcol === 0) continue;
                        const newRow = row + drow;
                        const newCol = col + dcol;
                        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                            moves.push({ row: newRow, col: newCol });
                        }
                    }
                }
                break;
        }
        return moves;
    }

    checkGameEnd() {
        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
        const inCheck = this.isInCheck(opponent);
        
        // Check for checkmate or stalemate
        let hasLegalMove = false;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponent) {
                    if (this.getValidMoves(row, col).length > 0) {
                        hasLegalMove = true;
                        break;
                    }
                }
            }
            if (hasLegalMove) break;
        }

        if (!hasLegalMove) {
            if (inCheck) {
                document.getElementById('gameStatus').textContent = 'Checkmate! ' + this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1) + ' wins!';
                this.gameActive = false;
            } else {
                document.getElementById('gameStatus').textContent = 'Stalemate - Draw!';
                this.gameActive = false;
            }
        }
    }

    recordMove(from, to, piece, captured) {
        const fromSquare = String.fromCharCode(97 + from.col) + (8 - from.row);
        const toSquare = String.fromCharCode(97 + to.col) + (8 - to.row);
        const move = `${piece.type[0].toUpperCase()}${fromSquare}-${toSquare}${captured ? 'x' : ''}`;
        this.moveHistory.push(move);
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const moveHistoryDiv = document.getElementById('moveHistory');
        moveHistoryDiv.innerHTML = this.moveHistory.map((move, index) => 
            `<span class="move-item">${index + 1}. ${move}</span>`
        ).join('');
        moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight;
    }

    updateCapturedPieces() {
        const capturedBlackDiv = document.getElementById('capturedBlack');
        const capturedWhiteDiv = document.getElementById('capturedWhite');

        capturedBlackDiv.innerHTML = this.capturedPieces.black.map(p => 
            `<span class="captured-piece">${p.unicode}</span>`
        ).join('');

        capturedWhiteDiv.innerHTML = this.capturedPieces.white.map(p => 
            `<span class="captured-piece">${p.unicode}</span>`
        ).join('');
    }

    updateGameStatus() {
        const turnDisplay = document.getElementById('currentTurn');
        const checkWarning = document.getElementById('checkWarning');
        
        turnDisplay.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        
        if (this.isInCheck(this.currentPlayer)) {
            checkWarning.style.display = 'block';
        } else {
            checkWarning.style.display = 'none';
        }

        const undoBtn = document.getElementById('undoBtn');
        undoBtn.disabled = this.moveHistory.length === 0;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        this.board = this.boardHistory.pop();
        this.moveHistory.pop();
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.gameActive = true;
        
        this.updateMoveHistory();
        this.renderBoard();
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.gameActive = true;
        this.moveHistory = [];
        this.boardHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        document.getElementById('gameStatus').textContent = 'In Progress';
        this.updateMoveHistory();
        this.renderBoard();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});