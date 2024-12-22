/**
 * Perform the Fast Fourier Transform (FFT) and return magnitudes and frequencies.
 * @param {Array<number>} signal - The input time-domain signal (real numbers).
 * @param {number} sampleRate - The sampling rate of the signal in Hz.
 * @returns {{ magnitudes: number[], frequencies: number[] }} - The magnitudes and frequencies.
 */
function fftTest(signal, sampleRate, startFreq = 20, endFreq = 20000) {
    const pow = Math.pow(2, Math.ceil(Math.log(signal.length)/Math.log(2)));
    for (let i = signal.length; i < pow; i++) {
        signal.push(0);
    }

    const N = signal.length;

    // Ensure the input length is a power of 2
    if (N <= 1) return { magnitudes: [Math.abs(signal[0] || 0)], frequencies: [0] };
    if (N % 2 !== 0) throw new Error("Input array length must be a power of 2.");

    // Helper function to calculate FFT recursively
    function recursiveFFT(input) {
        const n = input.length;
        if (n === 1) return [{ real: input[0], imag: 0 }];

        // Separate input into even and odd indices
        const even = recursiveFFT(input.filter((_, i) => i % 2 === 0));
        const odd = recursiveFFT(input.filter((_, i) => i % 2 !== 0));

        const results = new Array(n);
        for (let k = 0; k < n / 2; k++) {
            const t = {
                real: Math.cos((-2 * Math.PI * k) / n) * odd[k].real -
                      Math.sin((-2 * Math.PI * k) / n) * odd[k].imag,
                imag: Math.cos((-2 * Math.PI * k) / n) * odd[k].imag +
                      Math.sin((-2 * Math.PI * k) / n) * odd[k].real,
            };

            results[k] = {
                real: even[k].real + t.real,
                imag: even[k].imag + t.imag,
            };

            results[k + n / 2] = {
                real: even[k].real - t.real,
                imag: even[k].imag - t.imag,
            };
        }
        return results;
    }

    // Perform FFT
    const fftResults = recursiveFFT(signal);

    // Calculate magnitudes and frequencies
    const magnitudes = fftResults.map(
        (complex) => Math.sqrt(complex.real ** 2 + complex.imag ** 2)
    );
    const frequencies = Array.from({ length: N }, (_, i) => i * (sampleRate / N));

    const filtered = frequencies
        .map((freq, index) => ({ freq, magnitude: magnitudes[index] }))
        //.filter(({ freq }) => freq >= startFreq && freq <= endFreq);


    return {
        magnitudes: filtered.map(({ magnitude }) => magnitude),
        frequencies: filtered.map(({ freq }) => freq),
    };
}

module.exports = {
    fftTest
};
