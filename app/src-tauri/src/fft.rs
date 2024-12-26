use rustfft::{num_complex::Complex, FftPlanner};
use serde::Serialize;

use crate::{globals, utils::round};

#[derive(Serialize, Clone)]
pub struct FFTResult {
    pub frequencies: Vec<f64>,
    pub magnitudes: Vec<f64>,
}

pub fn apply_fft(signal: Vec<f64>) -> FFTResult {
    // Create FFT planner
    let len = signal.len();
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);

    // Convert input to complex numbers
    let mut buffer: Vec<Complex<f64>> = signal
        .into_iter()
        .map(|x| Complex { re: x as f64, im: 0.0 })
        .collect();

    // Perform FFT
    fft.process(&mut buffer);

    // Calculate magnitudes...
    let magnitudes: Vec<f64> = buffer
        .iter()
        .map(|x| round(x.norm(), Some(2)))
        .collect();

    //  ...and frequencies
    let frequencies: Vec<f64> = (0..len)
        .map(|i| round(i as f64 * *globals::SAMPLE_RATE / len as f64, Some(2)))
        .collect();

    // send frequencies lower than half sample rate
    let filtered = frequencies
        .iter()
        .zip(magnitudes.iter())
        .filter(|(f, _)| **f <= *globals::SAMPLE_RATE / 2.0 && **f > 0.0)
        .collect::<Vec<_>>();

    FFTResult {
        frequencies: filtered.iter().map(|(f, _)| **f).collect(),
        magnitudes: filtered.iter().map(|(_, m)| **m).collect(),
    }
}

