use rustfft::{num_complex::Complex, FftPlanner};
use serde::Serialize;
use tauri::command;

#[derive(Serialize)]
pub struct FFTResult {
    frequencies: Vec<f64>,
    magnitudes: Vec<f64>,
}

#[command]
pub fn apply_fft(input: Vec<f64>, sample_rate: f64, max: f64, min: f64) -> FFTResult {
    let len = input.len();
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);

    // Convert input to complex numbers
    let mut buffer: Vec<Complex<f64>> = input
        .into_iter()
        .map(|x| Complex { re: x, im: 0.0 })
        .collect();

    // Perform FFT
    fft.process(&mut buffer);

    // Calculate magnitudes and frequencies
    let magnitudes: Vec<f64> = buffer
        .iter()
        .map(|x| (x.norm() * 1000.0).round() / 1000.0)
        .collect();
    let frequencies: Vec<f64> = (0..len)
        .map(|i| ((i as f64 * sample_rate / len as f64) * 1000.0).round() / 1000.0)
        .collect();

    // Filter magnitudes and frequencies
    let filtered: Vec<(f64, f64)> = frequencies
        .iter()
        .zip(magnitudes.iter())
        .filter(|(f, _)| **f >= min && **f <= max)
        .map(|(f, m)| (*f, *m))
        .collect();

    FFTResult {
        frequencies: filtered.iter().map(|(f, _)| *f).collect(), 
        magnitudes: filtered.iter().map(|(_, m)| *m).collect(), 
    }
}
