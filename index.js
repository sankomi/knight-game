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
		["", "", "", ""],
		["", "K", "", ""],
		["", "", "", ""],
		["", "", "", ""],
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
	console.log("playeres", players);

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

app.put("/move/:id/:x/:y/", (req, res) => {
	const x = req.params.x;
	const y = req.params.y;
	const id = +req.params.id;
	if (players[game.player] !== id) return res.sendStatus(400);
	moveKnight(x, y);
	res.sendStatus(200);
});

function moveKnight(x, y) {
	const board = game.board;
	let cx, cy;

	search:
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			if (board[i][j] === "K") {
				cx = j;
				cy = i;
				break search;
			}
		}
	}

	let dx = Math.abs(cx - x);
	let dy = Math.abs(cy - y);

	if (dx + dy === 3 && dx > 0 && dy > 0) {
		board[cy][cx] = "";
		board[y][x] = "K";
	} else {
		return;
	}

	game.turn++;
	game.player = 1 - game.player;

	clients.forEach((info, client) => sendGame(client));
}

app.listen(port, () => console.log(`on ${port}`));
