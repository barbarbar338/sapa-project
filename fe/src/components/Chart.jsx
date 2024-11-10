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

	useEffect(() => {
		const onConnect = () => {
			setIsConnected(true);
		};
		const onDisconnect = () => {
			setIsConnected(false);
		};
		const onMic = (data) => {
			const newDataPoint = {
				x: Date.now(),
				y: data,
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
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("mic", onMic);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("mic", onMic);
		};
	}, []);

	const options = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				type: "realtime",
				realtime: {
					duration: 1000 * 10, // Display the last 10 seconds of data
					refresh: 1000 * 1, // Refresh every second
					delay: 1000 * 0.1, // Delay of 0.1 second to keep it smooth
					pause: false,
				},
			},
			y: {
				beginAtZero: true,
			},
		},
		plugins: {
			streaming: {
				frameRate: 144,
			},
		},
	};

	return (
		<div>
			<h1>Real-time Mic Output</h1>
			<h1>{isConnected ? "Connected!" : "Awaiting connection"}</h1>
			<Line data={data} options={options} />
		</div>
	);
};
