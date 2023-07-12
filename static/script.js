const es = new EventSource("event");
const out = document.getElementById("out");

es.onmessage = event => {
	const p = document.createElement("p");
	p.textContent = event.data;
	out.appendChild(p);
};
