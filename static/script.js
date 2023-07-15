const es = new EventSource("event");
const out = document.getElementById("out");
const game = document.getElementById("game");
const cells = [];
let div;
for (let i = 0; i < 16; i++) {
	const span = document.createElement("span");
	span.style.display = "inline-block";
	span.style.width = "2rem";
	span.style.height = "2rem";
	span.style.lineHeight = "2rem";
	span.style.textAlign = "center";
	if ((i + Math.floor(i / 4)) % 2 === 0) {
		span.style.background = "black";
		span.style.color = "white";
	} else {
		span.style.background = "#eee";
		span.style.color = "black";
	}
	if (i % 4 === 0) {
		cells.push([]);
		div = document.createElement("div");
		div.style.display = "flex";
		game.appendChild(div);
	}
	cells[cells.length - 1].push(span);
	div.appendChild(span);

	const x = i % 4;
	const y = Math.floor(i / 4);
	span.addEventListener("click", event => {
		const id = window.sessionStorage.getItem("id");
		fetch(`/move/${id}/${x}/${y}`, {method: "PUT"});
	});
}

["message", "enter", "leave"].forEach(type => {
	es.addEventListener(type, event => {
		const p = document.createElement("p");
		p.textContent = `${type}: ${event.data}`;
		out.appendChild(p);
	});
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
	p.textContent = `turn : ${json.player} ${json.playing? "(your turn)": ""}`;
	out.appendChild(p);
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			cells[i][j].textContent = board[i][j];
		}
	}
});
