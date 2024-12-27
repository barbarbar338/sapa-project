import { useAtom } from "jotai";
import { Line } from "react-chartjs-2";
import { micDataAtom } from "../atoms";

export const MicChart = () => {
	const [micData] = useAtom(micDataAtom);

	const chartData = {
		datasets: [
			{
				label: "Mic Data",
				borderColor: "blue",
				fill: false,
				data: micData,
			},
		],
	};

	const chartOptions = {
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
				frameRate: 60,
			},
		},
	};

	return (
		<Line
			className="h-full w-full"
			data={chartData}
			options={chartOptions}
			height={512}
			width={512}
		/>
	);
};
