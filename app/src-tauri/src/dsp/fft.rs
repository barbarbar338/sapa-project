use rustfft::{num_complex::Complex, FftPlanner};
use serde::Serialize;
use tauri::command;

use crate::globals;

#[derive(Serialize)]
pub struct FFTResult {
    frequencies: Vec<f64>,
    magnitudes: Vec<f64>,
}

#[command]
pub fn apply_fft() -> FFTResult {
    let input = globals::AUDIO_DATA.lock().unwrap();
    let sample_rate = 8_000.0;

    let len = input.len();
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);

    // Convert input to complex numbers
    let mut buffer: Vec<Complex<f64>> = input.clone()
        .into_iter()
        .map(|x| Complex { re: x as f64, im: 0.0 })
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

    FFTResult {
        frequencies,
        magnitudes,
    }
}
