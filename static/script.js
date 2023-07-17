const es = new EventSource("event");
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

["message", "enter", "leave"].forEach(type => {
	es.addEventListener(type, event => {
		const p = document.createElement("p");
		p.textContent = `${type}: ${event.data}`;
		out.appendChild(p);
	});
});

es.addEventListener("sat", event => {
	const p = document.createElement("p");
	p.textContent = `sat  : ${event.data === 0? "uppercase": "lowercase"}`;
	out.appendChild(p);
});

es.addEventListener("setid", event => {
	const p = document.createElement("p");
	p.textContent = `setid: ${event.data}`;
	window.sessionStorage.setItem("id", event.data);
	out.appendChild(p);
});

es.addEventListener("game", event => {
	let json;
	try {
		json = JSON.parse(event.data);
	} catch (err) {
		console.error(err);
		return;
	}
	const board = json.board;
	const p = document.createElement("p");
	p.textContent = `turn : ${json.player} ${json.player === 0? "uppercase": "lowercase"} ${json.playing? "(you)": ""}`;
	out.appendChild(p);
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			cells[i][j].textContent = board[i][j].slice(0, 1);
		}
	}
});
