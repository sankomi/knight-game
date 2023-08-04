const login = document.getElementById("login");
const room = document.getElementById("room");
const username = document.getElementById("username");
const enter = document.getElementById("enter");
enter.addEventListener("click", event => {
	const name = username.value.trim();
	if (!name) return;

	login.style.display = "none";
	room.style.display = null;

	start(name);
});

function start(name) {
	const es = new EventSource(`/event/?name=${name}`);
	const out = document.getElementById("out");
	const game = document.getElementById("game");
	const users = document.getElementById("users");
	const cells = [];
	let div;
	const FROM = 0;
	const TO = 1;
	let playing = false;
	let status = FROM;
	let from = [0, 0];
	let movable = [];
	let coloured = [];
	for (let i = 0; i < 56; i++) {
		const span = document.createElement("span");
		span.classList.add("cell");
		if (i % 2 === 0) {
			span.classList.add("cell--black");
		} else {
			span.classList.add("cell--white");
		}
		if (i % 7 === 0) {
			cells.push([]);
			div = document.createElement("div");
			div.style.display = "flex";
			game.appendChild(div);
		}
		cells[cells.length - 1].push(span);
		div.appendChild(span);

		const x = i % 7;
		const y = Math.floor(i / 7);
		span.addEventListener("click", event => {
			if (!playing) return;
			if (status === FROM) {
				if (~movable.indexOf(cells[y][x].piece)) {
					from = [x, y];
					select(x, y);
					status = TO;
					const piece = cells[y][x].textContent;
					let side;
					if (!piece) side = -1;
					else if (piece.toUpperCase() === piece) side = 0;
					else if (piece.toLowerCase() === piece) side = 1;
					if (piece.toLowerCase() === "p") {
						move(x, y, -1,  0, side);
						move(x, y,  1,  0, side);
						move(x, y,  0, -1, side);
						move(x, y,  0,  1, side);
					} else if (piece.toLowerCase() === "k") {
						move(x, y, -1,  2, side, true);
						move(x, y, -1, -2, side, true);
						move(x, y,  1,  2, side, true);
						move(x, y,  1, -2, side, true);
						move(x, y,  2, -1, side, true);
						move(x, y, -2, -1, side, true);
						move(x, y,  2,  1, side, true);
						move(x, y, -2,  1, side, true);
					}
				} else if (cells[y][x].textContent === "") {
					const id = window.sessionStorage.getItem("id");
					fetch(`/block/`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							id,
						},
						body: JSON.stringify({x, y}),
					});
				}
			} else if (status === TO) {
				const id = window.sessionStorage.getItem("id");
				fetch(`/move/`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						id,
					},
					body: JSON.stringify({xi: from[0], yi: from[1], xf: x, yf: y}),
				});
				clear();
				status = FROM;
			}
		});
	}

	function select(x, y) {
		if (y < 0 || y >= cells.length) return;
		if (x < 0 || x >= cells[y].length) return;
		cells[y][x].classList.add("select");
		coloured.push(cells[y][x]);
	}

	function move(x, y, dx, dy, side, knight = false) {
		if (y + dy < 0 || y + dy >= cells.length) return;
		if (x + dx < 0 || x + dx >= cells[y + dy].length) return;

		if (knight) {
			let block = null;
			if (dx === 2) block = cells[y][x + 1].textContent;
			else if(dx === -2) block = cells[y][x - 1].textContent;
			else if (dy === 2) block = cells[y + 1][x].textContent;
			else if (dy === -2) block = cells[y - 1][x].textContent;

			if (block) {
				if (block === "*") return;
				else if (block.toUpperCase() === block && side === 1) return;
				else if (block.toLowerCase() === block && side === 0) return;
			}
		}

		const target = cells[y + dy][x + dx].textContent;
		if (target) {
			if (target.toUpperCase() === target && side === 0) return;
			else if (target.toLowerCase() === target && side === 1) return;
		}
		cells[y + dy][x + dx].classList.add("move");
		coloured.push(cells[y + dy][x + dx]);
	}

	function clear() {
		coloured.forEach(cell => {
			cell.classList.remove("select");
			cell.classList.remove("move");
		});
		coloured.length = 0;
	}

	const upper = document.getElementById("upper");
	const lower = document.getElementById("lower");
	upper.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/sit/`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				id,
			},
			body: JSON.stringify({side: 0}),
		});
	});
	lower.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/sit/`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				id,
			},
			body: JSON.stringify({side: 1}),
		});
	});

	const end = document.getElementById("end");
	end.addEventListener("click", event => {
		clear();
		const id = window.sessionStorage.getItem("id");
		fetch(`/end/`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				id,
			},
		});
	});

	const reset = document.getElementById("reset");
	reset.addEventListener("click", event => {
		fetch(`/reset/`, {method: "DELETE"});
	});

	const rollback = document.getElementById("rollback");
	rollback.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/rollback/`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				id,
			},
		});
	});

	function showMessage(message) {
		console.log(message);
		/* const p = document.createElement("p");
		p.textContent = message;
		out.appendChild(p);

		while(out.childElementCount > 5) {
			out.firstChild.remove();
		} */
	}

	["message", "enter", "leave", "ping"].forEach(type => {
		es.addEventListener(type, event => showMessage(`${type}: ${event.data}`));
	});

	es.addEventListener("users", event => {
		let json;
		try {
			json = JSON.parse(event.data);
		} catch (err) {
			console.error(err);
			return;
		}

		users.innerHTML = null;
		json.forEach(user => {
			const div = document.createElement("div");
			div.textContent = user;
			users.appendChild(div);
		});
	});

	es.addEventListener("end", event => {
		showMessage(`end  : ${JSON.parse(event.data)} win`);
		alert(`${JSON.parse(event.data)} win`);
	});

	es.addEventListener("sat", event => showMessage(`sat  : ${event.data === 0? "uppercase": "lowercase"}`));

	es.addEventListener("setid", event => {
		const id = JSON.parse(event.data);
		window.sessionStorage.setItem("id", id);
		showMessage(`setid: ${event.data}`);
	});

	const upperuser = document.getElementById("upperuser");
	const loweruser = document.getElementById("loweruser");

	es.addEventListener("game", event => {
		let json;
		try {
			json = JSON.parse(event.data);
		} catch (err) {
			console.error(err);
			return;
		}
		upperuser.textContent = json.users[0] || "(empty)";
		loweruser.textContent = json.users[1] || "(empty)";
		movable = json.movable;
		playing = json.playing;
		const board = json.board;
		switch (json.player) {
			case 0:
				upperuser.style.fontWeight = "bold";
				loweruser.style.fontWeight = "normal";
				break;
			case 1:
				upperuser.style.fontWeight = "normal";
				loweruser.style.fontWeight = "bold";
				break;
			default:
				upperuser.style.fontWeight = "bold";
				loweruser.style.fontWeight = "bold";
		}
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board[i].length; j++) {
				cells[i][j].piece = board[i][j];
				cells[i][j].textContent = board[i][j].slice(0, 1);
				cells[i][j].classList.remove("notmovable");
				if (playing && !~movable.indexOf(cells[i][j].piece)) {
					cells[i][j].classList.add("notmovable");
				}
			}
		}
	});

}
