import { useAtom } from "jotai";
import { Line } from "react-chartjs-2";
import {
	filteredLabelMaxAtom,
	filteredLabelsAtom,
	filteredSpectrumDataAtom,
} from "../atoms";

export const FilteredFFTChart = () => {
	const [filteredSpectrumData] = useAtom(filteredSpectrumDataAtom);
	const [filteredLabels] = useAtom(filteredLabelsAtom);
	const [filteredLabelMax] = useAtom(filteredLabelMaxAtom);

	const chartData = {
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

	const chartOptions = {
		responsive: true,
		animation: false,
		scales: {
			x: {
				title: {
					display: true,
					text: "Frequency (Hz)",
				},
				beginAtZero: true,
			},
			y: {
				title: {
					display: true,
					text: "Magnitude",
				},
				max: filteredLabelMax,
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
