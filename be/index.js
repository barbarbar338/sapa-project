const { Board, Pin } = require("johnny-five");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");
const { bandPassFilter } = require("./filters.js");
const { fftTest } = require("./fft.js");

const port = 3001;
const analog_pin = "A0";
const sampleRate = 44100;

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

	socket.on("fft", (type, data, startFreq, endFreq) => {
		const resp = fftTest(data, sampleRate, startFreq, endFreq);

		socket.emit("fft", type, resp);
	});

	socket.on("filter", (signal, lowCutoff, highCutoff) => {
		const resp = bandPassFilter(signal, lowCutoff, highCutoff, sampleRate);
		socket.emit("filter", resp);
	});

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
	});
});
