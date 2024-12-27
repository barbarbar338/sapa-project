import { useAtom } from "jotai";
import { Line } from "react-chartjs-2";
import { filteredMicDataAtom } from "../atoms";

export const FilteredMicChart = () => {
	const [filteredMicData] = useAtom(filteredMicDataAtom);

	const chartData = {
		datasets: [
			{
				label: "Filtered Data",
				borderColor: "red",
				fill: false,
				data: filteredMicData,
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
