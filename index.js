require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());

const user = require("./user.js");
const game = require("./game.js");

app.get("/event/", (req, res) => {
	const name = req.query.name;

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	const id = user.enter(res, name, game.get());

	req.on("close", () => {
		game.unsit(id, null);
		user.leave(res, id, game.get());
	});
});

app.put("/sit/", (req, res) => {
	if (game.hasEnded()) return res.sendStatus(400);

	const id = req.headers["id"];
	const side = +req.body.side;

	const info = user.info(id);
	const sat = game.sit(info.id, info.name, side);
	if (!sat) return res.sendStatus(400);

	user.sendGame(game.get());

	res.sendStatus(200);
});

app.delete("/reset/", (req, res) => {
	if (!game.hasEnded()) return res.sendStatus(400);

	game.reset();
	user.sendGame(game.get());

	res.sendStatus(200);
});

app.delete("/end/", (req, res) => {
	if (game.hasEnded()) return res.sendStatus(400);

	const id = req.headers["id"];
	if (!game.isPlaying(id)) return res.sendStatus(400);

	const result = game.endTurn();
	user.sendGame(game.get());

	if (result === null) return res.sendStatus(200);
	user.sendResult(result);
	return res.sendStatus(200);
});

app.delete("/rollback/", (req, res) => {
	if (game.hasEnded()) return res.sendStatus(400);

	const id = req.headers["id"];
	if (!game.isPlaying(id)) return res.sendStatus(400);

	game.rollback();
	user.sendGame(game.get());

	res.sendStatus(200);
});

app.put("/block/", (req, res) => {
	if (game.hasEnded()) return res.sendStatus(400);

	const id = req.headers["id"];
	const x = +req.body.x;
	const y = +req.body.y;
	if (!game.isPlaying(id)) return res.sendStatus(400);

	const blocked = game.block(x, y);
	if (!blocked) return res.sendStatus(400);
	user.sendGame(game.get());

	res.sendStatus(200);
});

app.put("/move/", (req, res) => {
	if (game.hasEnded()) return res.sendStatus(400);

	const id = req.headers["id"];
	const xi = +req.body.xi;
	const yi = +req.body.yi;
	const xf = +req.body.xf;
	const yf = +req.body.yf;
	if (!game.isPlaying(id)) return res.sendStatus(400);

	const moved = game.move(xi, yi, xf, yf);
	if (!moved) return res.sendStatus(400);

	user.sendGame(game.get());
	return res.sendStatus(200);
});

app.listen(port, () => console.log(`on ${port}`));
