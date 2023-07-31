require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());

const user = require("./user.js");
const game = require("./game.js");
app.use((req, res, next) => {
	res.locals.game = game;
	res.locals.user = user;
	next();
});

const api = require("./api.js");
app.use("/", api);

app.listen(port, () => console.log(`on ${port}`));
