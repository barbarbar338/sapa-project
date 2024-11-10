const { Board, Pin } = require("johnny-five");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

const port = 3001;
const analog_pin = "A0";

const board = new Board();
const app = express();
app.use(
	cors({
		origin: "*",
	}),
);
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

app.get("/", (_, res) => {
	res.send("Hello World!");
});

io.on("connection", (socket) => {
	console.log("A user connected!");

	socket.on("disconnect", () => {
		console.log("A user disconnected!");
	});
});

board.on("ready", () => {
	console.log("Board is ready!");

	const mic = new Pin({
		pin: analog_pin,
		board,
		type: "analog",
	});

	const listener = server.listen(port, () => {
		const addres = listener.address();
		console.log(
			`Server listening on port ${addres.address}:${addres.port}`,
		);
	});

	mic.on("data", (data) => {
		io.emit("mic", data);
		console.log(data);
	});
});
