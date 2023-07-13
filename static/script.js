const es = new EventSource("event");
const out = document.getElementById("out");

["message", "setid", "enter", "leave"].forEach(type => {
	es.addEventListener(type, event => {
		const p = document.createElement("p");
		p.textContent = `${type}: ${event.data}`;
		out.appendChild(p);
	});
});
