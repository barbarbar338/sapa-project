import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

export const RealTimeChart = () => {
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
		const interval = setInterval(() => {
			const newDataPoint = {
				x: Date.now(),
				y: Math.floor(Math.random() * 100),
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
		}, 10);

		return () => clearInterval(interval);
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
			<Line data={data} options={options} />
		</div>
	);
};
