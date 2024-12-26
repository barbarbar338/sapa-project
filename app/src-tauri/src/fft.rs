use rustfft::{num_complex::Complex, FftPlanner};
use serde::Serialize;

use crate::{globals, utils::round};

#[derive(Serialize, Clone)]
pub struct FFTResult {
    pub frequencies: Vec<f64>,
    pub magnitudes: Vec<f64>,
}

pub fn apply_fft(is_normal: bool) -> FFTResult {
    let input = if is_normal {
        globals::AUDIO_DATA.lock().unwrap().clone() // No need to drop the mutex, it will be dropped when it goes out of scope
    } else {
        globals::FILTERED_DATA.lock().unwrap().clone() // Same here
    };

    // Create FFT planner
    let len = input.len();
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);

    // Convert input to complex numbers
    let mut buffer: Vec<Complex<f64>> = input
        .into_iter()
        .map(|x| Complex { re: x as f64, im: 0.0 })
        .collect();

    // Perform FFT
    fft.process(&mut buffer);

    // Calculate magnitudes...
    let magnitudes: Vec<f64> = buffer
        .iter()
        .map(|x| round(x.norm(), Some(4)))
        .collect();

    //  ...and frequencies
    let frequencies: Vec<f64> = (0..len)
        .map(|i| round(i as f64 * *globals::SAMPLE_RATE / len as f64, Some(4)))
        .collect();

    FFTResult {
        frequencies,
        magnitudes,
    }
}

