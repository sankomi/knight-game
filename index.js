require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));

let current = 0;
const clients = new Map();

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

	send(res, "setid", id);
	clients.forEach((info, client) => {
		if (client === res) return;

		send(client, "enter", {id});
	});
});

app.listen(port, () => console.log(`on ${port}`));
