require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));

const clients = new Map();

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

function findClient(id) {
	for ([client, info] of clients.entries()) {
		if (info.id === id) return client;
	}
	return null;
}

function send(client, event, data) {
	if (typeof client === "number") client = findClient(client);

	if (!clients.has(client)) return;

	const info = clients.get(client);

	client.write(`event: ${event}\n`);
	client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendGame(client) {
	const info = clients.get(client);
	const id = info.id;
	const data = {
		playing: players[game.player] === id,
		...game,
	};
	send(client, "game", data);
}

app.get("/event/:name/", (req, res) => {
	const name = req.params.name;
	const id = String(Date.now() + String(Math.floor(Math.random() * 1000000)).padStart(6, "0"));

	clients.set(res, {name, id});

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	req.on("close", () => {
		if (players[0] === id) {
			players[0] = -1;
			game.users[0] = null;
		} else if (players[1] === id) {
			players[1] = -1;
			game.users[1] = null;
		}

		clients.delete(res);
		clients.forEach((info, client) => {
			send(client, "leave", {name});
			sendGame(client);
		});
	});

	send(res, "setid", id);
	clients.forEach((info, client) => {
		if (client === res) return;

		sendGame(client, "enter", {name});
	});

	sendGame(res);
});

setInterval(() => {
	clients.forEach((info, client) => {
		send(client, "ping", 1);
	});
}, 1000);

app.put("/sit/:id/:side/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.params.id;
	const side = +req.params.side;

	if (side !== 0 && side !== 1) return res.sendStatus(400);
	if (players[side] >= 0) return res.sendStatus(400)

	if (players[1 - side] === id) {
		players[1 - side] = -1;
		game.users[1 - side] = null;
	}
	players[side] = id;

	clients.forEach((info, client) => {
		if (info.id !== id) return;
		game.users[side] = info.name;
	});

	send(id, "sat", side);
	clients.forEach((info, client) => sendGame(client));

	res.sendStatus(200);
});

app.delete("/reset/", (req, res) => {
	if (game.player !== -1) return res.sendStatus(400);

	reset();
	clients.forEach((info, client) => sendGame(client));
	res.sendStatus(200);
});

app.delete("/end/:id/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.params.id;

	if (players[game.player] !== id) return res.sendStatus(400);

	pieces[game.player].forEach((state, piece) => {
		if (state === 0) pieces[game.player].set(piece, 2)
	});

	for (let i = 0; i < game.board.length; i++) {
		for (let j = 0; j < game.board[i].length; j++) {
			const piece = game.board[i][j];
			if (piece === "") continue;
			if (piece === piece.toUpperCase()) {
				if (pieces[0].get(piece) === 2) game.board[i][j] = "";
			} else if (piece === piece.toLowerCase()) {
				if (pieces[1].get(piece) === 2) game.board[i][j] = "";
			}
		}
	}

	let counts = [0, 0];
	PIECES.forEach(piece => {
		if (pieces[0].get(piece.toUpperCase()) !== 2) counts[0]++;
		if (pieces[1].get(piece.toLowerCase()) !== 2) counts[1]++;
	});

	if (counts[0] * counts[1] === 0) {
		game.player = -1;
		clients.forEach((info, client) => sendGame(client));
		if (counts[0] === 0 && counts[1] === 0) {
			clients.forEach((info, client) => send(client, "end", "draw"));
		} else if (counts[0] === 0) {
			clients.forEach((info, client) => send(client, "end", "lowercase"));
		} else if (counts[1] === 0) {
			clients.forEach((info, client) => send(client, "end", "uppercase"));
		}
		game.movable.length = 0;
		return res.sendStatus(200);
	}

	game.turn++;
	game.player = 1 - game.player;
	game.moved = 0;

	back = clone(game);

	game.movable.length = 0;
	pieces[game.player].forEach((state, piece) => {
		if (state !== 0 && state !== 1) return;
		pieces[game.player].set(piece, 0);
		game.movable.push(piece);
	});

	clients.forEach((info, client) => sendGame(client));

	res.sendStatus(200);
});

app.delete("/rollback/:id/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.params.id;
	if (players[game.player] !== id) return res.sendStatus(400);

	const users = game.users;
	game = clone(back);
	game.users = users;

	game.movable.length = 0;
	pieces[game.player].forEach((state, piece) => {
		pieces[game.player].set(piece, 0);
		game.movable.push(piece);
	});

	clients.forEach((info, client) => sendGame(client));

	res.sendStatus(200);
});

app.put("/block/:id/:x/:y/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.params.id;
	const x = +req.params.x;
	const y = +req.params.y;
	if (players[game.player] !== id) return res.sendStatus(400);
	if (game.moved !== 0) return res.sendStatus(400);
	if (game.board[y][x] !== "") return res.sendStatus(400);

	game.board[y][x] = "*";
	game.moved = Infinity;
	game.movable.length = 0;
	pieces[game.player].forEach((state, piece) => {
		if (state === 0) pieces[game.player].set(piece, 1)
	});

	clients.forEach((info, client) => sendGame(client));

	res.sendStatus(200);
});

app.put("/move/:id/:xi/:yi/:xf/:yf/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const xi = +req.params.xi;
	const yi = +req.params.yi;
	const xf = +req.params.xf;
	const yf = +req.params.yf;
	const id = req.params.id;
	if (players[game.player] !== id) return res.sendStatus(400);
	if (game.moved === Infinity) return res.sendStatus(400);

	const moved = move(xi, yi, xf, yf);
	if (moved) {
		game.moved += 1;
		clients.forEach((info, client) => sendGame(client));
		return res.sendStatus(200);
	}
	return res.sendStatus(400);
});

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

app.listen(port, () => console.log(`on ${port}`));
