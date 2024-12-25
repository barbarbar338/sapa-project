use iir_filters::sos::zpk2sos;
use serde::Serialize;
use tauri::command;
use iir_filters::filter::{DirectForm2Transposed, Filter};
use iir_filters::filter_design::{FilterType, butter};
use crate::globals;

#[derive(Serialize)]
pub struct FilterResult {
    filtered_signal: Vec<f64>,
}

#[command]
pub fn apply_filter(
    order: u32,
) -> FilterResult {
    let high_pass_freq = *globals::HIGH_PASS_HZ.lock().unwrap();
    let low_pass_freq = *globals::LOW_PASS_HZ.lock().unwrap();

    let sample_rate = 8000.0;
    let mut high_pass = high_pass_freq.max(0.0); // Ensure its positive
    let mut low_pass = low_pass_freq.min((sample_rate / 2.0) - 1.0); // Ensure its less than Nyquist frequency
    let filter_order = order.max(1); // Ensure its at least 1
    let signal = globals::AUDIO_DATA.lock().unwrap().clone();

    // Validate frequencies
    if high_pass >= low_pass {
        println!("High-pass frequency must be less than low-pass frequency");

        high_pass = 1.0;
        low_pass = (sample_rate / 2.0) - 1.0;
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
    let filtered_signal = signal
        .into_iter()
        .map(|x| filter.filter(x.into()))
        .collect();

    FilterResult {
        filtered_signal,
    }
}
