require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));

let current = 0;
const clients = new Map();

const players = [-1, -1];
const game = {
	turn: 0,
	player: 0,
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

app.get("/event", (req, res) => {
	const id = current++;

	console.log(id, "connect");
	clients.set(res, {id});

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	req.on("close", () => {
		console.log(id, "close");
		if (players[0] === id) players[0] = -1;
		else if (players[1] === id) players[1] = -1;
		console.log("players", players);

		clients.forEach((info, client) => {
			send(client, "leave", {id});
		});
	});

	send(res, "setid", id);
	clients.forEach((info, client) => {
		if (client === res) return;

		sendGame(client, "enter", {id});
	});

	sendGame(res);
});

app.put("/sit/:id/:side/", (req, res) => {
	const id = +req.params.id;
	const side = +req.params.side;

	if (side !== 0 && side !== 1) return res.sendStatus(400);
	if (players[side] >= 0) return res.sendStatus(400)

	if (players[1 - side] === id) players[1 - side] = -1;
	players[side] = id;
	console.log("players", players);

	send(id, "sat", side);
	clients.forEach((info, client) => sendGame(client));

	res.sendStatus(200);
});

app.put("/move/:id/:xi/:yi/:xf/:yf/", (req, res) => {
	const xi = +req.params.xi;
	const yi = +req.params.yi;
	const xf = +req.params.xf;
	const yf = +req.params.yf;
	const id = +req.params.id;
	if (players[game.player] !== id) return res.sendStatus(400);

	const moved = move(xi, yi, xf, yf);
	if (moved) return res.sendStatus(200);
	return res.sendStatus(400);
});

function move(xi, yi, xf, yf) {
	const piece = game.board[yi][xi];
	if (piece === "") return false;
	if (piece[0].toLowerCase() === "k") return moveKnight(xi, yi, xf, yf);
	if (piece[0].toLowerCase() === "p") return movePawn(xi, yi, xf, yf);
}

function moveKnight(xi, yi, xf, yf) {
	const player = game.player;
	const board = game.board;
	if (player === 0 && board[yi][xi][0] !== "K") return false;
	if (player === 1 && board[yi][xi][0] !== "k") return false;

	let dx = Math.abs(xf - xi);
	let dy = Math.abs(yf - yi);

	const owner = checkOwner(xf, yf);
	if (player === owner) return false;

	if (dx + dy === 3 && dx > 0 && dy > 0) {
		board[yf][xf] = board[yi][xi];
		board[yi][xi] = "";
	} else {
		return false;
	}

	game.turn++;
	game.player = 1 - game.player;

	clients.forEach((info, client) => sendGame(client));

	return true;
}

function movePawn(xi, yi, xf, yf) {
	const player = game.player;
	const board = game.board;
	if (player === 0 && board[yi][xi][0] !== "P") return false;
	if (player === 1 && board[yi][xi][0] !== "p") return false;

	let dx = Math.abs(xf - xi);
	let dy = Math.abs(yf - yi);

	const owner = checkOwner(xf, yf);
	if (player === owner) return false;

	if (dx + dy === 1) {
		board[yf][xf] = board[yi][xi];
		board[yi][xi] = "";
	} else {
		return false;
	}

	game.turn++;
	game.player = 1 - game.player;

	clients.forEach((info, client) => sendGame(client));

	return true;
}

function checkOwner(x, y) {
	const piece = game.board[y][x];
	if (piece === "") return -1;
	if (piece === piece.toLowerCase()) return 1;
	if (piece === piece.toUpperCase()) return 0;
	return -1;
}

app.listen(port, () => console.log(`on ${port}`));
