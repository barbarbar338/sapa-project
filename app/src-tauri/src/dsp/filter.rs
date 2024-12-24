use iir_filters::sos::zpk2sos;
use serde::Serialize;
use tauri::command;
use iir_filters::filter::{DirectForm2Transposed, Filter};
use iir_filters::filter_design::{FilterType, butter};

#[derive(Serialize)]
pub struct FilterResult {
    filtered_signal: Vec<f64>,
}

#[command]
pub fn apply_filter(
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
