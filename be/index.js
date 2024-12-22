const { Board, Pin } = require("johnny-five");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");
const { bandPassFilter } = require("./filters.js");
const { CooleyTukeyFFT } = require("./fft.js");

// Constants
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
	console.log("GUI connected!");

	socket.on(
		"fft",
		/**
		 * Perform FFT on the incoming data
		 *
		 * @param {"normal" | "filtered"} type - The type of FFT data (normal or filtered)
		 * @param {*} data - The data to perform FFT on
		 * @param {*} startFreq - Spectrum start frequency
		 * @param {*} endFreq - Spectrum end frequency
		 * @returns {void}
		 * @emits fft event with the signal spectrum
		 */
		(type, data, startFreq, endFreq) => {
			const resp = CooleyTukeyFFT(data, sampleRate, startFreq, endFreq);

			socket.emit("fft", type, resp);
		},
	);

	socket.on(
		"filter",
		/**
		 * Perform band-pass filter on the incoming signal
		 *
		 * @param {number[]} signal - The signal to filter
		 * @param {number} lowCutoff - Low-pass cutoff frequency
		 * @param {number} highCutoff - High-pass cutoff frequency
		 * @returns {void}
		 * @emits filter event with the filtered signal
		 */
		(signal, lowCutoff, highCutoff) => {
			const resp = bandPassFilter(
				signal,
				lowCutoff,
				highCutoff,
				sampleRate,
			);
			socket.emit("filter", resp);
		},
	);

	socket.on("disconnect", () => {
		console.log("GUI disconnected!");
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
		// Emit microphone data directly to the GUI
		io.emit("mic", data);
	});
});
