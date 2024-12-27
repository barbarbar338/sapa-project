import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
	bpmAtom,
	filteredLabelMaxAtom,
	filteredLabelsAtom,
	filteredMicDataAtom,
	filteredSpectrumDataAtom,
	highPassAtom,
	labelMaxAtom,
	labelsAtom,
	lowPassAtom,
	micDataAtom,
	spectrumDataAtom,
} from "./atoms";
import { FFTChart } from "./charts/fftChart";
import { FilteredFFTChart } from "./charts/filteredFftChart";
import { FilteredMicChart } from "./charts/filteredMicChart";
import { MicChart } from "./charts/micChart";

export const RealTimeChart = () => {
	// Signal data states
	const [micData, setMicData] = useAtom(micDataAtom);
	const [filteredMicData, setFilteredMicData] = useAtom(filteredMicDataAtom);

	// FFT data state
	const [, setSpectrumData] = useAtom(spectrumDataAtom);
	const [, setFilteredSpectrumData] = useAtom(
		filteredSpectrumDataAtom,
	);

	// FFT labels state
	const [, setLabels] = useAtom(labelsAtom);
	const [, setFilteredLabels] = useAtom(filteredLabelsAtom);

	// FFT Label Max
	const [, setLabelMax] = useAtom(labelMaxAtom);
	const [, setFilteredLabelMax] =
		useAtom(filteredLabelMaxAtom);

	// Filter and spectrum region state
	const [lowPass, setLowPass] = useAtom(lowPassAtom);
	const [highPass, setHighPass] = useAtom(highPassAtom);
	const [debouncedLowPass, setDebouncedLowPass] = useState(lowPass);
	const [debouncedHighPass, setDebouncedHighPass] = useState(highPass);

	// BPM state
	const [bpm, setBpm] = useAtom(bpmAtom);

	useDebounce(
		() => {
			invoke("set_bandpass", {
				lowPass: lowPass,
				highPass: highPass,
			}).then(([lp, hp]) => {
				setDebouncedHighPass(hp);
				setDebouncedLowPass(lp);
			});
		},
		1000,
		[lowPass],
	);

	useDebounce(
		() => {
			invoke("set_bandpass", {
				lowPass: lowPass,
				highPass: highPass,
			}).then(([lp, hp]) => {
				setDebouncedHighPass(hp);
				setDebouncedLowPass(lp);
			});
		},
		1000,
		[highPass],
	);

	useEffect(() => {
		// Attach event listeners
		const micListener = listen("mic", (event) => {
			// Parse the mic data and update, already comes as a voltage value between 0V and 5V
			const { payload } = event;

			const newDataPoint = {
				x: Date.now(),
				y: payload,
			};

			setMicData((prevData) => {
				const updatedSignal = [...prevData, newDataPoint];
				return updatedSignal;
			});

			// Apply FFT to the mic data
			const values = micData.map((point) => point.y);
			invoke("apply_fft", {
				signal: values,
			}).then((fftData) => {
				const { frequencies, magnitudes } = fftData;

				// Update the FFT data
				setSpectrumData(magnitudes);
				setLabels(frequencies);

				// Update the FFT label max
				const max = Math.ceil(Math.max(...magnitudes) / 10) * 10;
				setLabelMax(max + 5);
			});
		});

		const filteredMicListener = listen("filtered_mic", (event) => {
			// Parse the filtered data and update, already comes as a voltage value between 0V and 5V
			const { payload } = event;

			const newDataPoint = {
				x: Date.now(),
				y: payload,
			};

			setFilteredMicData((prevData) => {
				const updatedSignal = [...prevData, newDataPoint];
				return updatedSignal;
			});

			// Apply FFT to the filtered data
			const values = filteredMicData.map((point) => point.y);
			invoke("apply_fft", {
				signal: values,
			}).then((fftData) => {
				const { frequencies, magnitudes } = fftData;

				// Update the filtered FFT data
				setFilteredSpectrumData(magnitudes);
				setFilteredLabels(frequencies);

				// Update the filtered FFT label max
				const max = Math.ceil(Math.max(...magnitudes) / 10) * 10;
				setFilteredLabelMax(max + 5);
			});
		});

		// Cleanup event listeners
		return () => {
			micListener.then((unlisten) => unlisten());
			filteredMicListener.then((unlisten) => unlisten());
		};
	}, [filteredMicData, micData, setFilteredLabelMax, setFilteredLabels, setFilteredMicData, setFilteredSpectrumData, setLabelMax, setLabels, setMicData, setSpectrumData]);

	const calculateBPM = () => {
		const values = filteredMicData.map((point) => point.y);
		invoke("bpm", {
			signal: values,
		}).then((bpm) => {
			setBpm(bpm);
		});
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
					{debouncedLowPass} Hz) - BPM: {bpm}
				</div>

				<button
					className="col-span-2 bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600"
					onClick={calculateBPM}
				>
					Calculate BPM
				</button>

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
				{[MicChart, FilteredMicChart, FFTChart, FilteredFFTChart].map(
					(Chart, index) => (
						<div
							key={index}
							className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
						>
							<Chart />
						</div>
					),
				)}
			</div>
		</div>
	);
};
