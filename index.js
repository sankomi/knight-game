require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));

let current = 0;
const clients = new Map();

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

		clients.forEach((info, client) => {
			send(client, "leave", {id});
		});
	});

	moveKnight();

	send(res, "setid", id);
	clients.forEach((info, client) => {
		if (client === res) return;

		send(client, "enter", {id});
	});

	send(res, "game", game);
});

function moveKnight() {
	let oneone = game.board[1][1];
	let zerothree = game.board[0][3];
	if (oneone === "K") {
		game.board[0][3] = "K";
		game.board[1][1] = "";
	} else {
		game.board[0][3] = "";
		game.board[1][1] = "K";
	}

	clients.forEach((info, client) => {
		send(client, "game", game);
	});
}

app.listen(port, () => console.log(`on ${port}`));
