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
	const style = document.createElement("style");
	style.innerHTML = `
		.cell {
			display: inline-block;
			width: 2rem;
			height: 2rem;
			line-height: 2rem;
			text-align: center;
			cursor: pointer;
		}
		.cell--black {
			color: white;
			background: black;
		}
		.cell--black:hover {
			background: #333;
		}
		.cell--white {
			color: black;
			background: #eee;
		}
		.cell--white:hover {
			background: #bbb;
		}
		.select {
			color:white !important;
			background:#a44 !important;
		}
		.move {
			color: white !important;
			background: #4a4 !important;
		}
		.notmovable {
			color: #888 !important;
		}
	`;
	document.head.appendChild(style);

	const es = new EventSource(`/event/${name}/`);
	const out = document.getElementById("out");
	const game = document.getElementById("game");
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
						move(x - 1, y, side);
						move(x + 1, y, side);
						move(x, y - 1, side);
						move(x, y + 1, side);
					} else if (piece.toLowerCase() === "k") {
						move(x - 1, y + 2, side);
						move(x - 1, y - 2, side);
						move(x + 1, y + 2, side);
						move(x + 1, y - 2, side);
						move(x + 2, y - 1, side);
						move(x - 2, y - 1, side);
						move(x + 2, y + 1, side);
						move(x - 2, y + 1, side);
					}
				}
			} else if (status === TO) {
				const id = window.sessionStorage.getItem("id");
				fetch(`/move/${id}/${from[0]}/${from[1]}/${x}/${y}`, {method: "PUT"});
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

	function move(x, y, side) {
		if (y < 0 || y >= cells.length) return;
		if (x < 0 || x >= cells[y].length) return;
		const target = cells[y][x].textContent;
		if (target) {
			if (target.toUpperCase() === target && side === 0) return;
			else if (target.toLowerCase() === target && side === 1) return;
		}
		cells[y][x].classList.add("move");
		coloured.push(cells[y][x]);
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
		fetch(`/sit/${id}/0/`, {method: "PUT"});
	});
	lower.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/sit/${id}/1/`, {method: "PUT"});
	});

	const end = document.getElementById("end");
	end.addEventListener("click", event => {
		clear();
		const id = window.sessionStorage.getItem("id");
		fetch(`/end/${id}/`, {method: "DELETE"});
	});

	const reset = document.getElementById("reset");
	reset.addEventListener("click", event => {
		fetch(`/reset/`, {method: "DELETE"});
	});

	const rollback = document.getElementById("rollback");
	rollback.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/rollback/${id}/`, {method: "DELETE"});
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

	["message", "enter", "leave"].forEach(type => {
		es.addEventListener(type, event => showMessage(`${type}: ${event.data}`));
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
