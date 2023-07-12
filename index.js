require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));

app.get("/event", (req, res) => {
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	setInterval(() => {
		res.write("data: hello " + String(Math.random()) + "\n\n");
	}, 500);

	req.on("close", () => {
		console.log("closed");
	});
});

app.listen(port, () => console.log(`on ${port}`));
