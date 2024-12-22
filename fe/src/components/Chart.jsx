import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { socket } from "../socket.js";

export const RealTimeChart = () => {
	// WebSocket connection state
	const [isConnected, setIsConnected] = useState(socket.connected);

	// Mic data state
	const [data, setData] = useState({
		datasets: [
			{
				label: "Mic Data",
				borderColor: "blue",
				fill: false,
				data: [], // Initial empty dataset
			},
		],
	});
	const [filteredData, setFilteredData] = useState({
		datasets: [
			{
				label: "Filtered Data",
				borderColor: "red",
				fill: false,
				data: [], // Initial empty dataset
			},
		],
	});

	// FFT data state
	const [spectrumData, setSpectrumData] = useState([]);
	const [filteredSpectrumData, setFilteredSpectrumData] = useState([]);

	// FFT labels state
	const [labels, setLabels] = useState([]);
	const [filteredLabels, setFilteredLabels] = useState([]);

	// Filter and spectrum region state
	const [highPass, setHighPass] = useState(20);
	const [lowPass, setLowPass] = useState(20000);
	const [spectrumStart, setSpectrumStart] = useState(20);
	const [spectrumEnd, setSpectrumEnd] = useState(20000);

	useEffect(() => {
		const onConnect = () => {
			setIsConnected(true);
		};
		const onDisconnect = () => {
			setIsConnected(false);
		};

		/**
		 * Handle incoming microphone data
		 *
		 * @param {Number} micData - The microphone data value
		 * @returns {void}
		 * @sideeffect Updates the mic data state
		 * @emits filter event with the mic data
		 * @emits fft event with the mic data
		 */
		const onMic = (micData) => {
			const newDataPoint = {
				x: Date.now(),
				y: (micData / 1023) * 5,
			};

			setData((prevData) => {
				const updatedDataset = [
					...prevData.datasets[0].data,
					newDataPoint,
				];
				return {
					datasets: [
						{
							...prevData.datasets[0],
							data: updatedDataset, // Update the dataset with new point
						},
					],
				};
			});

			// Emit the filter and FFT events
			const values = data.datasets[0].data.map((d) => d.y);
			socket.emit("filter", values, highPass, lowPass);
			socket.emit("fft", "normal", values, spectrumStart, spectrumEnd);
		};

		/**
		 * Handle incoming filtered data
		 *
		 * @param {Number[]} filterData - The filtered data values
		 * @returns {void}
		 * @sideeffect Updates the filtered data state
		 * @emits fft event with the filtered data
		 */
		const onFilter = (filterData) => {
			const newDataPoint = {
				x: Date.now(),
				y: filterData[filterData.length - 1] * 512 + 2.5,
			};

			setFilteredData((prevData) => {
				const updatedDataset = [
					...prevData.datasets[0].data,
					newDataPoint,
				];
				return {
					datasets: [
						{
							...prevData.datasets[0],
							data: updatedDataset, // Update the dataset with new point
						},
					],
				};
			});

			// Emit the FFT event
			const values = filteredData.datasets[0].data.map((d) => d.y);
			socket.emit("fft", "filtered", values, spectrumStart, spectrumEnd);
		};

		/**
		 * Handle incoming FFT data
		 *
		 * @param {"normal" | "filtered"} type - The type of FFT data (normal or filtered)
		 * @param {Object} spectrum - The FFT data object
		 * @returns {void}
		 * @sideeffect Updates the spectrum data state
		 * @sideeffect Updates the spectrum labels state
		 */
		const onFft = (type, spectrum) => {
			if (type === "normal") {
				setSpectrumData(spectrum.magnitudes);
				setLabels(spectrum.frequencies);
			}
			if (type === "filtered") {
				setFilteredSpectrumData(spectrum.magnitudes);
				setFilteredLabels(spectrum.frequencies);
			}
		};

		// Attach event listeners
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("mic", onMic);
		socket.on("fft", onFft);
		socket.on("filter", onFilter);

		// Cleanup event listeners
		return () => {
			socket.off("connect");
			socket.off("disconnect");
			socket.off("mic");
			socket.off("fft");
			socket.off("filter");
		};
	}, [
		data.datasets,
		filteredData.datasets,
		highPass,
		lowPass,
		spectrumEnd,
		spectrumStart,
	]);

	const options = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				type: "realtime",
				realtime: {
					duration: 1000 * 5, // save/show last 5 seconds of data
					refresh: 1000 * 0.0001,
					delay: 1000 * 0.0001,
					pause: false,
				},
			},
			y: {
				beginAtZero: true,
				min: 0,
				max: +5,
			},
		},
		plugins: {
			streaming: {
				frameRate: 144,
			},
		},
	};

	const spectrumChartData = {
		labels,
		datasets: [
			{
				label: "Frequency Spectrum",
				data: spectrumData,
				borderColor: "blue",
				fill: false,
			},
		],
	};

	const filteredSpectrumChartData = {
		labels: filteredLabels,
		datasets: [
			{
				label: "Filtered Frequency Spectrum",
				data: filteredSpectrumData,
				borderColor: "red",
				fill: false,
			},
		],
	};

	const spectrumChartOptions = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				title: {
					display: true,
					text: "Frequency (Hz)",
				},
			},
			y: {
				title: {
					display: true,
					text: "Magnitude",
				},
				beginAtZero: true,
				min: 0,
				max: 80,
			},
		},
	};

	return (
		<div className="flex flex-col items-center space-y-6 p-6">
			{/* WebSocket Connection Indicator */}
			<div
				className={`text-sm font-bold px-4 py-2 rounded-md ${
					isConnected
						? "bg-green-500 text-white"
						: "bg-red-500 text-white"
				}`}
			>
				Microphone Websocket{" "}
				{isConnected ? "Connected" : "Disconnected"}
			</div>

			{/* Input Controls */}
			<div className="grid grid-cols-2 gap-4 w-full max-w-md">
				{/* Bandpass Inputs */}
				<div className="col-span-2 text-center font-semibold">
					Bandpass Filter
				</div>

				<div className="flex flex-col items-start">
					<label
						htmlFor="bandpass-high"
						className="text-sm font-medium"
					>
						High-pass (Hz)
					</label>
					<input
						type="number"
						value={highPass}
						onChange={(e) => setHighPass(Number(e.target.value))}
						className="mt-1 w-full px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
					/>
				</div>
				<div className="flex flex-col items-start">
					<label
						htmlFor="bandpass-low"
						className="text-sm font-medium"
					>
						Low-pass (Hz)
					</label>
					<input
						id="bandpass-low"
						type="number"
						value={lowPass}
						onChange={(e) => setLowPass(Number(e.target.value))}
						className="mt-1 w-full px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
					/>
				</div>

				{/* Spectrum Region Inputs */}
				<div className="col-span-2 text-center font-semibold mt-4">
					Spectrum Region
				</div>
				<div className="flex flex-col items-start">
					<label
						htmlFor="spectrum-low"
						className="text-sm font-medium"
					>
						Low (Hz)
					</label>
					<input
						id="spectrum-low"
						type="number"
						value={spectrumStart}
						onChange={(e) =>
							setSpectrumStart(Number(e.target.value))
						}
						className="mt-1 w-full px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
					/>
				</div>
				<div className="flex flex-col items-start">
					<label
						htmlFor="spectrum-high"
						className="text-sm font-medium"
					>
						High (Hz)
					</label>
					<input
						id="spectrum-high"
						type="number"
						value={spectrumEnd}
						onChange={(e) => setSpectrumEnd(Number(e.target.value))}
						className="mt-1 w-full px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
					/>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
				<div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
					<Line
						className="h-full w-full"
						data={data}
						options={options}
						height={512}
						width={512}
					/>
				</div>
				<div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
					<Line
						className="h-full w-full"
						data={filteredData}
						options={options}
						height={512}
						width={512}
					/>
				</div>
				<div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
					<Line
						className="h-full w-full"
						data={spectrumChartData}
						options={spectrumChartOptions}
						height={512}
						width={512}
					/>
				</div>
				<div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
					<Line
						className="h-full w-full"
						data={filteredSpectrumChartData}
						options={spectrumChartOptions}
						height={512}
						width={512}
					/>
				</div>
			</div>
		</div>
	);
};
