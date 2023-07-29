require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());

let {clients, findClient, send, sendGame, sendUsers} = require("./user.js");
let {players, game, back, PIECES, pieces, reset, move, clone} = require("./game.js");

app.get("/event/", (req, res) => {
	const name = req.query.name;
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
			sendGame(client, game, players);
		});
		sendUsers();
	});

	send(res, "setid", id);
	clients.forEach((info, client) => {
		if (client === res) return;

		send(client, "enter", {name});
	});

	sendGame(res, game, players);
	sendUsers();
});

app.put("/sit/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.headers["id"];
	const side = +req.body.side;

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
	clients.forEach((info, client) => sendGame(client, game, players));

	res.sendStatus(200);
});

app.delete("/reset/", (req, res) => {
	if (game.player !== -1) return res.sendStatus(400);

	reset();
	clients.forEach((info, client) => sendGame(client, game, players));
	res.sendStatus(200);
});

app.delete("/end/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.headers["id"];

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
		clients.forEach((info, client) => sendGame(client, game, players));
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

	clients.forEach((info, client) => sendGame(client, game, players));

	res.sendStatus(200);
});

app.delete("/rollback/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.headers["id"];
	if (players[game.player] !== id) return res.sendStatus(400);

	const users = game.users;
	game = clone(back);
	game.users = users;

	game.movable.length = 0;
	pieces[game.player].forEach((state, piece) => {
		pieces[game.player].set(piece, 0);
		game.movable.push(piece);
	});

	clients.forEach((info, client) => sendGame(client, game, players));

	res.sendStatus(200);
});

app.put("/block/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const id = req.headers["id"];
	const x = +req.body.x;
	const y = +req.body.y;
	if (players[game.player] !== id) return res.sendStatus(400);
	if (game.moved !== 0) return res.sendStatus(400);
	if (game.board[y][x] !== "") return res.sendStatus(400);

	game.board[y][x] = "*";
	game.moved = Infinity;
	game.movable.length = 0;
	pieces[game.player].forEach((state, piece) => {
		if (state === 0) pieces[game.player].set(piece, 1)
	});

	clients.forEach((info, client) => sendGame(client, game, players));

	res.sendStatus(200);
});

app.put("/move/", (req, res) => {
	if (game.player === -1) return res.sendStatus(400);

	const xi = +req.body.xi;
	const yi = +req.body.yi;
	const xf = +req.body.xf;
	const yf = +req.body.yf;
	const id = req.headers["id"];
	if (players[game.player] !== id) return res.sendStatus(400);
	if (game.moved === Infinity) return res.sendStatus(400);

	const moved = move(xi, yi, xf, yf);
	if (moved) {
		game.moved += 1;
		clients.forEach((info, client) => sendGame(client, game, players));
		return res.sendStatus(200);
	}
	return res.sendStatus(400);
});

app.listen(port, () => console.log(`on ${port}`));
