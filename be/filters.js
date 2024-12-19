function lowPassFilter(signal, cutoff, sampleRate) {
    // Calculate the Nyquist frequency
    const nyquist = sampleRate / 2;
    const normalizedCutoff = cutoff / nyquist;

    // Generate the filter coefficients for a simple low-pass filter
    const N = 4; // Filter order (you can adjust this)
    const wc = Math.tan(Math.PI * normalizedCutoff);
    const alpha = wc / (1 + wc);

    // Apply the filter to the signal
    const output = [];
    let prevInput = 0;
    let prevOutput = 0;

    for (let i = 0; i < signal.length; i++) {
        // Simple low-pass filter formula
        const outputSample = alpha * (signal[i] + prevInput) - alpha * prevOutput;
        output.push(outputSample);

        // Update the previous values
        prevInput = signal[i];
        prevOutput = outputSample;
    }

    return output;
}

function highPassFilter(signal, cutoff, sampleRate) {
    // Calculate the Nyquist frequency
    const nyquist = sampleRate / 2;
    const normalizedCutoff = cutoff / nyquist;

    // Generate the filter coefficients for a simple high-pass filter
    const N = 4; // Filter order (you can adjust this)
    const wc = Math.tan(Math.PI * normalizedCutoff);
    const alpha = wc / (1 + wc);

    // Apply the filter to the signal
    const output = [];
    let prevInput = 0;
    let prevOutput = 0;

    for (let i = 0; i < signal.length; i++) {
        // Simple high-pass filter formula
        const outputSample = alpha * (signal[i] - prevInput) + alpha * prevOutput;
        output.push(outputSample);

        // Update the previous values
        prevInput = signal[i];
        prevOutput = outputSample;
    }

    return output;
}

function bandPassFilter(signal, lowCutoff, highCutoff, sampleRate) {
    // Apply low-pass filter
    const lowPassed = lowPassFilter(signal, highCutoff, sampleRate);

    // Apply high-pass filter
    return highPassFilter(lowPassed, lowCutoff, sampleRate);
}

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
