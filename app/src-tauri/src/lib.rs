use iir_filters::sos::zpk2sos;
use rustfft::{num_complex::Complex, FftPlanner};
use serde::Serialize;
use tauri::command;
use iir_filters::filter::{DirectForm2Transposed, Filter};
use iir_filters::filter_design::{FilterType, butter};


#[derive(Serialize)]
struct FFTResult {
    frequencies: Vec<f64>,
    magnitudes: Vec<f64>,
}

#[derive(Serialize)]
struct FilterResult {
    filtered_signal: Vec<f64>,
}

#[command]
fn apply_filter(
    signal: Vec<f64>,
    sample_rate_freq: Option<f64>,
    high_pass_freq: Option<f64>,
    low_pass_freq: Option<f64>,
    order: Option<u32>,
) -> FilterResult {
    let sample_rate = sample_rate_freq.unwrap_or_else(|| 44100.0);
    let high_pass = high_pass_freq.unwrap_or_else(|| 20.0);
    let low_pass = low_pass_freq.unwrap_or_else(|| 20000.0);
    let filter_order = order.unwrap_or_else(|| 4);

    // Validate frequencies
    if high_pass >= low_pass {
        panic!("High-pass frequency must be less than low-pass frequency");
    }

    // Create Butterworth filter
    let zpk = butter(
        filter_order,
        FilterType::BandPass(low_pass, high_pass),
        sample_rate,
    )
    .map_err(|e| format!("Failed to design filter: {}", e));

    let zpk = match zpk {
        Ok(zpk) => zpk,
        Err(e) => panic!("Failed to design filter: {}", e),
    };

    let sos = match zpk2sos(&zpk, None) {
        Ok(sos) => sos,
        Err(e) => panic!("Failed to convert ZPK to SOS: {}", e),
    };

    let mut filter = DirectForm2Transposed::new(&sos);

    // Apply filter to signal
    let filtered_signal: Vec<f64> = signal
        .into_iter()
        .map(|x| filter.filter(x))
        .collect();

    FilterResult {
        filtered_signal,
    }
}

#[command]
fn apply_fft(input: Vec<f64>, sample_rate: f64, max: f64, min: f64) -> FFTResult {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![apply_fft, apply_filter])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
