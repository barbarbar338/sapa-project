import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useDebounce } from "react-use";

export const RealTimeChart = () => {
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
	const [lowPass, setLowPass] = useState(4000);
	const [debouncedLowPass, setDebouncedLowPass] = useState(lowPass);
	const [debouncedHighPass, setDebouncedHighPass] = useState(highPass);

	useDebounce(
		() => {
			setDebouncedLowPass(lowPass);
		},
		500,
		[lowPass],
	);

	useDebounce(
		() => {
			setDebouncedHighPass(highPass);
		},
		500,
		[highPass],
	);

	useEffect(() => {
		// Attach event listeners
		const micListener = listen("mic", (event) => {
			// Parse the mic data and update, already comes as a voltage value between 0V and 5V
			const micData = event.payload;

			const newDataPoint = {
				x: Date.now(),
				y: micData,
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

			// TODO: To much delay, need to fix
			// Calculate FFT
			invoke("apply_fft").then((fftData) => {
				const { frequencies, magnitudes } = fftData;
				setLabels(frequencies);
				setSpectrumData(magnitudes);
			});

			// TODO: To much delay, need to fix
			// Apply bandpass filter
			invoke("apply_filter", {
				lowPassFreq: debouncedLowPass,
				highPassFreq: debouncedHighPass,
				order: 4,
			}).then((filterData) => {
				const newDataPoint = {
					x: Date.now(),
					y: filterData.filtered_signal[
						filterData.filtered_signal.length - 1
					],
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
			});
		});

		// Cleanup event listeners
		return () => {
			micListener.then((unlisten) => unlisten());
		};
	}, [
		data.datasets,
		debouncedHighPass,
		debouncedLowPass,
		filteredData.datasets,
		highPass,
		lowPass,
	]);

	const options = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				type: "realtime",
				realtime: {
					duration: 1000 * 5, // save/show last 10 seconds of data
					refresh: 1000 * 0.0001,
					delay: 1000 * 0.0001,
					pause: false,
				},
			},
			y: {
				beginAtZero: true,
				/* min: 0,
				max: +5, */
			},
		},
		plugins: {
			streaming: {
				frameRate: 60,
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
				max: 50,
			},
		},
	};

	return (
		<div className="flex flex-col items-center space-y-6 p-6">
			{/* WebSocket Connection Indicator */}
			<div className="text-sm font-bold px-4 py-2 rounded-mdbg-green-500 text-white">
				Microphone Websocket Connected
			</div>

			{/* Input Controls */}
			<div className="grid grid-cols-2 gap-4 w-full max-w-md">
				{/* Bandpass Inputs */}
				<div className="col-span-2 text-center font-semibold">
					Bandpass Filter (Current: {debouncedHighPass} -{" "}
					{debouncedLowPass} Hz)
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
