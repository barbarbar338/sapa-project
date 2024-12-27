import { useAtom } from "jotai";
import { Line } from "react-chartjs-2";
import { labelMaxAtom, labelsAtom, spectrumDataAtom } from "../atoms";

export const FFTChart = () => {
	const [spectrumData] = useAtom(spectrumDataAtom);
	const [labels] = useAtom(labelsAtom);
	const [labelMax] = useAtom(labelMaxAtom);

	const chartData = {
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
				max: labelMax,
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
