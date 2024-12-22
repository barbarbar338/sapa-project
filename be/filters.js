/**
 * Apply a simple low-pass filter to a signal.
 * 
 * @param {number[]} signal - The input signal.
 * @param {number} cutoff - The cutoff frequency.
 * @param {number} sampleRate - The sample rate of the signal.
 * @returns {number[]} - The filtered signal.
 */
function lowPassFilter(signal, cutoff, sampleRate) {
	// Calculate the Nyquist frequency
	const nyquist = sampleRate / 2;
	const normalizedCutoff = cutoff / nyquist;

	// Generate the filter coefficients for a simple low-pass filter
	const wc = Math.tan(Math.PI * normalizedCutoff);
	const alpha = wc / (1 + wc);

	// Apply the filter to the signal
	const output = [];
	let prevInput = 0;
	let prevOutput = 0;

	for (let i = 0; i < signal.length; i++) {
		// Simple low-pass filter formula
		const outputSample =
			alpha * (signal[i] + prevInput) - alpha * prevOutput;
		output.push(outputSample);

		// Update the previous values
		prevInput = signal[i];
		prevOutput = outputSample;
	}

	return output;
}

/**
 * Apply a simple high-pass filter to a signal.
 * 
 * @param {number[]} signal - The input signal.
 * @param {number} cutoff - The cutoff frequency.
 * @param {number} sampleRate - The sample rate of the signal.
 * @returns {number[]} - The filtered signal.
 */
function highPassFilter(signal, cutoff, sampleRate) {
	// Calculate the Nyquist frequency
	const nyquist = sampleRate / 2;
	const normalizedCutoff = cutoff / nyquist;

	// Generate the filter coefficients for a simple high-pass filter
	const wc = Math.tan(Math.PI * normalizedCutoff);
	const alpha = wc / (1 + wc);

	// Apply the filter to the signal
	const output = [];
	let prevInput = 0;
	let prevOutput = 0;

	for (let i = 0; i < signal.length; i++) {
		// Simple high-pass filter formula
		const outputSample =
			alpha * (signal[i] - prevInput) + alpha * prevOutput;
		output.push(outputSample);

		// Update the previous values
		prevInput = signal[i];
		prevOutput = outputSample;
	}

	return output;
}

/**
 * Apply a band-pass filter to a signal.
 * 
 * @param {number[]} signal - The input signal.
 * @param {number} lowCutoff - The low cutoff frequency.
 * @param {number} highCutoff - The high cutoff frequency.
 * @param {number} sampleRate - The sample rate of the signal.
 * @returns {number[]} - The filtered signal.
 */
function bandPassFilter(signal, lowCutoff, highCutoff, sampleRate) {
	// Apply low-pass filter
	const lowPassed = lowPassFilter(signal, highCutoff, sampleRate);

	// Apply high-pass filter
	return highPassFilter(lowPassed, lowCutoff, sampleRate);
}

/**
 * Apply a band-stop filter to a signal.
 * 
 * @param {number[]} signal - The input signal.
 * @param {number} lowCutoff - The low cutoff frequency.
 * @param {number} highCutoff - The high cutoff frequency.
 * @param {number} sampleRate - The sample rate of the signal.
 * @returns {number[]} - The filtered signal.
 */
function bandStopFilter(signal, lowCutoff, highCutoff, sampleRate) {
	// Apply high-pass filter to remove frequencies below the low cutoff
	const highPassed = highPassFilter(signal, lowCutoff, sampleRate);

	// Apply low-pass filter to remove frequencies above the high cutoff
	return lowPassFilter(highPassed, highCutoff, sampleRate);
}

module.exports = {
	lowPassFilter,
	highPassFilter,
	bandPassFilter,
	bandStopFilter,
};
