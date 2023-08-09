const clients = new Map();

setInterval(() => {
	clients.forEach((info, client) => {
		send(client, "ping", 1);
	});
}, 1000);

function find(id) {
	for ([client, info] of clients.entries()) {
		if (info.id === id) return client;
	}
	return null;
}

function info(id) {
	return clients.get(find(id));
}

function enter(res, name, game) {
	name = name.substring(0, 10);
	if (name.trim() === "") name = "user" + String(Math.floor(Math.random() * 999));
	const id = String(Date.now() + String(Math.floor(Math.random() * 1000000)).padStart(6, "0"));
	clients.set(res, {name,id});
	send(res, "setid", id);
	sendEnter(id, game);
}

function leave(res, id, game) {
	clients.delete(res);
	sendLeave(id, game)
}

function send(client, event, data) {
	if (typeof client === "number") client = find(client);

	if (!clients.has(client)) return;

	const info = clients.get(client);

	client.write(`event: ${event}\n`);
	client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendEnter(id, game) {
	const users = [];
	let name = null;
	clients.forEach((info, client) => {
		if (info.id === id) name = info.name;
		users.push(info.name);
	});
	clients.forEach((info, client) => {
		send(client, "enter", {name});
		send(client, "game", game);
		send(client, "users", users);
	});
}

function sendLeave(id, game) {
	const users = [];
	let name = null;
	clients.forEach((info, client) => {
		if (info.id === id) name = info.name;
		users.push(info.name);
	});
	clients.forEach((info, client) => {
		send(client, "leave", {name});
		send(client, "game", game);
		send(client, "users", users);
	});
}

function sendGame(game, playing) {
	clients.forEach((info, client) => {
		game.playing = info.id === playing;
		send(client, "game", game);
	});
}

function sendResult(result) {
	clients.forEach((info, client) => {
		send(client, "end", result);
	});
}

function sendChat(name, chat) {
	chat = chat.substring(0, 50);
	clients.forEach((info, client) => {
		send(client, "chat", `${name}: ${chat}`);
	});
}

function sendGame2(client, game, players) {
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
	find, info,
	enter, leave,
	sendChat, sendGame, sendResult,
};
