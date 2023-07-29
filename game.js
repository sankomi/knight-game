const players = [-1, -1];
let game = {
	turn: 0,
	player: 0,
	moved: 0,
	users: [null, null],
	board: [
		["", "", "", "", "", "", ""],
		["", "K1", "", "K2", "", "K3", ""],
		["P1", "", "P2", "", "P3", "", "P4"],
		["", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		["p1", "", "p2", "", "p3", "", "p4"],
		["", "k1", "", "k2", "", "k3", ""],
		["", "", "", "", "", "", ""],
	],
	movable: ["K1", "K2", "K3", "P1", "P2", "P3", "P4"],
};
let back = clone(game);
const PIECES = ["k1", "k2", "k3", "p1", "p2", "p3", "p4"];
const pieces = [new Map(), new Map()];
PIECES.forEach(piece => {
	pieces[0].set(piece.toUpperCase(), 0);
	pieces[1].set(piece.toLowerCase(), 0);
});

function reset() {
	PIECES.forEach(piece => {
		pieces[0].set(piece.toUpperCase(), 0);
		pieces[1].set(piece.toLowerCase(), 0);
	});
	[players[0], players[1]] = [-1, -1];
	game.turn = 0;
	game.player = 0;
	game.moved = 0;
	game.users = [null, null];
	game.board = [
		["", "", "", "", "", "", ""],
		["", "K1", "", "K2", "", "K3", ""],
		["P1", "", "P2", "", "P3", "", "P4"],
		["", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		["p1", "", "p2", "", "p3", "", "p4"],
		["", "k1", "", "k2", "", "k3", ""],
		["", "", "", "", "", "", ""],
	];
	game.movable = ["K1", "K2", "K3", "P1", "P2", "P3", "P4"];
}

function move(xi, yi, xf, yf) {
	const piece = game.board[yi][xi];
	if (piece === "") return false;
	if (game.board[yf][xf] === "*") return false;
	const index = game.movable.indexOf(piece);
	if (~index) {
		if (piece[0].toLowerCase() === "k") {
			if (moveKnight(xi, yi, xf, yf)) {
				game.movable.splice(index, 1);
				return true;
			} else {
				return false;
			}
		}
		if (piece[0].toLowerCase() === "p") {
			if (movePawn(xi, yi, xf, yf)) {
				game.movable.splice(index, 1);
				return true;
			} else {
				return false;
			}
		}
	}
}

function moveKnight(xi, yi, xf, yf) {
	const player = game.player;
	const board = game.board;
	if (player === 0 && board[yi][xi][0] !== "K") return false;
	if (player === 1 && board[yi][xi][0] !== "k") return false;

	let dx = Math.abs(xf - xi);
	let dy = Math.abs(yf - yi);

	if (player === checkOwner(xf, yf)) return false;

	if (xf === xi + 2) {
		if (checkOwner(xi + 1, yi, player) !== player) return false;
	} else if (xf === xi - 2) {
		if (checkOwner(xi - 1, yi, player) !== player) return false;
	} else if (yf === yi + 2) {
		if (checkOwner(xi, yi + 1, player) !== player) return false;
	} else if (yf === yi - 2) {
		if (checkOwner(xi, yi - 1, player) !== player) return false;
	}

	const piece = board[yi][xi];
	if (!pieces[player].has(piece)) return false;
	if (pieces[player].get(piece) !== 0) return false;

	if (dx + dy === 3 && dx > 0 && dy > 0) {
		const removed = board[yf][xf];
		pieces[1 - player].set(player === 0? removed.toLowerCase(): removed.toUpperCase(), 2);
		board[yf][xf] = piece;
		board[yi][xi] = "";
		pieces[player].set(piece, 1);
	} else {
		return false;
	}

	return true;
}

function movePawn(xi, yi, xf, yf) {
	const player = game.player;
	const board = game.board;
	if (player === 0 && board[yi][xi][0] !== "P") return false;
	if (player === 1 && board[yi][xi][0] !== "p") return false;

	let dx = Math.abs(xf - xi);
	let dy = Math.abs(yf - yi);

	if (player === checkOwner(xf, yf)) return false;

	const piece = board[yi][xi];
	if (!pieces[player].has(piece)) return false;
	if (pieces[player].get(piece) === 1) return false;

	if (dx + dy === 1) {
		const removed = board[yf][xf];
		pieces[1 - player].set(player === 0? removed.toLowerCase(): removed.toUpperCase(), 2);
		board[yf][xf] = board[yi][xi];
		board[yi][xi] = "";
		pieces[player].set(piece, 1);
	} else {
		return false;
	}

	return true;
}

function checkOwner(x, y, player = -1) {
	const piece = game.board[y][x];
	if (piece === "") return player;
	if (piece === "*") return 2;
	if (piece === piece.toLowerCase()) return 1;
	if (piece === piece.toUpperCase()) return 0;
	return player;
}

function clone(object) {
	return JSON.parse(JSON.stringify(object));
}

module.exports = {
	players,
	game, back, PIECES, pieces,
	reset,
	move, moveKnight, movePawn,
	checkOwner,
	clone,
};
