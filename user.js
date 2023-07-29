const clients = new Map();

setInterval(() => {
	clients.forEach((info, client) => {
		send(client, "ping", 1);
	});
}, 1000);

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

function sendGame(client, game, players) {
	const info = clients.get(client);
	const id = info.id;
	const data = {
		playing: players[game.player] === id,
		...game,
	};
	send(client, "game", data);
}

function sendUsers() {
	const names = [];
	clients.forEach((info, client) => {
		names.push(info.name);
	});
	clients.forEach((info, client) => {
		send(client, "users", names);
	});
}

module.exports = {
	clients,
	findClient,
	send, sendGame, sendUsers,
};
