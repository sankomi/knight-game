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
	const es = new EventSource(`/event/${name}/`);
	const out = document.getElementById("out");
	const game = document.getElementById("game");
	const cells = [];
	let div;
	const FROM = 0;
	const TO = 1;
	let status = FROM;
	let from = [0, 0];
	for (let i = 0; i < 56; i++) {
		const span = document.createElement("span");
		span.style.display = "inline-block";
		span.style.width = "2rem";
		span.style.height = "2rem";
		span.style.lineHeight = "2rem";
		span.style.textAlign = "center";
		if (i % 2 === 0) {
			span.style.background = "black";
			span.style.color = "white";
		} else {
			span.style.background = "#eee";
			span.style.color = "black";
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
			if (status === FROM) {
				from = [x, y];
				status = TO;
			} else if (status === TO) {
				const id = window.sessionStorage.getItem("id");
				fetch(`/move/${id}/${from[0]}/${from[1]}/${x}/${y}`, {method: "PUT"});
				status = FROM;
			}
		});
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
		const id = window.sessionStorage.getItem("id");
		fetch(`/end/${id}/`, {method: "DELETE"});
	});

	const reset = document.getElementById("reset");
	reset.addEventListener("click", event => {
		fetch(`/reset/`, {method: "DELETE"});
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
		window.sessionStorage.setItem("id", event.data);
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
				cells[i][j].textContent = board[i][j].slice(0, 1);
			}
		}
	});

}
