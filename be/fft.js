const DSP = require('dsp.js'); 

function fftTest(signal, sampleRate) {
    const pow = Math.pow(2, Math.ceil(Math.log(signal.length)/Math.log(2)));

    const fft = new DSP.FFT(pow, sampleRate);

    // fill the signal with 0s
    for (let i = signal.length; i < fft.bufferSize; i++) {
        signal.push(0);
    }

    fft.forward(signal);
    
    const spectrum = fft.spectrum;

    const frequencies = [];
    for (let i = 0; i < spectrum.length; i++) {
        frequencies.push(i * sampleRate / pow);
    }

    return { magnitudes: Array.from(spectrum), frequencies: frequencies };
}

module.exports = {
    fftTest
};
