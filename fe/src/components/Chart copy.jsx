import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { socket } from "../socket.js";

export const RealTimeChart = () => {
	const [isConnected, setIsConnected] = useState(socket.connected);
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
	const [spectrumData, setSpectrumData] = useState([]);
	const [filteredSpectrumData, setFilteredSpectrumData] = useState([]);
	const [labels, setLabels] = useState([]);
	const [filteredLabels, setFilteredLabels] = useState([]);
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

			const values = data.datasets[0].data.map((d) => d.y);
			socket.emit("filter", values, highPass, lowPass);
			socket.emit("fft", "normal", values, spectrumStart, spectrumEnd);
		};

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

			const values = filteredData.datasets[0].data.map((d) => d.y);
			socket.emit("fft", "filtered", values, spectrumStart, spectrumEnd);
		};

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

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("mic", onMic);
		socket.on("fft", onFft);
		socket.on("filter", onFilter);

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

	function test() {
		const values = data.datasets[0].data.map((d) => d.y);
		socket.emit("fft", values);
	}

	const options = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				type: "realtime",
				realtime: {
					duration: 1000 * 5,
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
		labels: labels, // Frequency labels for the x-axis
		datasets: [
			{
				label: "Frequency Spectrum",
				data: spectrumData, // Magnitude values from FFT
				borderColor: "rgba(75,192,192,1)", // Line color
				backgroundColor: "rgba(75,192,192,0.2)", // Background color
				fill: false, // Do not fill the area under the curve
			},
		],
	};

	const filteredSpectrumChartData = {
		labels: filteredLabels, // Frequency labels for the x-axis
		datasets: [
			{
				label: "Filtered Frequency Spectrum",
				data: filteredSpectrumData, // Magnitude values from FFT
				borderColor: "rgba(75,192,192,1)", // Line color
				backgroundColor: "rgba(75,192,192,0.2)", // Background color
				fill: false, // Do not fill the area under the curve
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
			},
		},
	};

	return (
		<div>
			<h1>Real-time Mic Output</h1>
			<h1>{isConnected ? "Connected!" : "Awaiting connection"}</h1>
			<button onClick={test}>Test</button>
			<div className="w-screen flex-wrap h-screen flex items-center justify-around">
				<div className="mb-2 bg-gray-100 py-6 px-6 rounded-md flex justify-center">
					<Line
						className="h-full w-full"
						data={data}
						options={options}
						height={512}
						width={512}
					/>
				</div>
				<div className="mb-2 bg-gray-100 py-6 px-6 rounded-md flex flex-col justify-center">
					<Line
						className="h-full w-full"
						data={filteredData}
						options={options}
						height={512}
						width={512}
					/>
				</div>
				<div className="mb-2 bg-gray-100 py-6 px-6 rounded-md flex flex-col justify-center">
					<Line
						className="h-full w-full"
						data={spectrumChartData}
						options={spectrumChartOptions}
						height={512}
						width={512}
					/>
				</div>
				<div className="mb-2 bg-gray-100 py-6 px-6 rounded-md flex flex-col justify-center">
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
