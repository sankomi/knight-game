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
		["", "K", "", "K", "", "K", ""],
		["", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		["", "k", "", "k", "", "k", ""],
		["", "", "", "", "", "", ""],
	],
}

function send(client, event, data) {
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
	if (players[0] === -1) players[0] = id;
	else if (players[1] === -1) players[1] = id;
	console.log("players", players);

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	req.on("close", () => {
		console.log(id, "close");
		if (players[0] === id) players[0] = -1;
		else if (players[1] === id) players[1] = -1;

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

app.put("/move/:id/:xi/:yi/:xf/:yf/", (req, res) => {
	const xi = req.params.xi;
	const yi = req.params.yi;
	const xf = req.params.xf;
	const yf = req.params.yf;
	const id = +req.params.id;
	if (players[game.player] !== id) return res.sendStatus(400);
	moveKnight(xi, yi, xf, yf);
	res.sendStatus(200);
});

function moveKnight(xi, yi, xf, yf) {
	const player = game.player;
	const board = game.board;
	if (player === 0 && board[yi][xi] !== "K") return;
	if (player === 1 && board[yi][xi] !== "k") return;

	let dx = Math.abs(xf - xi);
	let dy = Math.abs(yf - yi);

	if (dx + dy === 3 && dx > 0 && dy > 0) {
		board[yf][xf] = board[yi][xi];
		board[yi][xi] = "";
	} else {
		return;
	}

	game.turn++;
	game.player = 1 - game.player;

	clients.forEach((info, client) => sendGame(client));
}

app.listen(port, () => console.log(`on ${port}`));
