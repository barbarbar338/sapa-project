use iir_filters::sos::zpk2sos;
use serde::Serialize;
use iir_filters::filter::{DirectForm2Transposed, Filter};
use iir_filters::filter_design::{FilterType, butter};
use crate::globals;

#[derive(Serialize, Clone)]
pub struct FilterResult {
    pub filtered_signal: Vec<f64>,
}

pub fn apply_filter(signal: Vec<f64>) -> FilterResult {
    let high_pass_freq = *globals::HIGH_PASS_HZ.lock().unwrap();
    let low_pass_freq = *globals::LOW_PASS_HZ.lock().unwrap();
    let sample_rate = *globals::SAMPLE_RATE;

    let nyquist = sample_rate / 2.0;

    let mut high_pass = high_pass_freq.max(1.0); // Ensure its positive
    let mut low_pass = low_pass_freq.min(nyquist - 1.0); // Ensure its less than Nyquist frequency
    let filter_order = 2; //order.max(1); // Ensure its at least 1

    // Zero-center the signal
    let zero_centered_signal: Vec<f64> = signal.iter().map(|x| x - 2.5).collect();

    // Validate frequencies
    if high_pass >= low_pass {
        println!("High-pass frequency must be less than low-pass frequency");

        high_pass = 1.0;
        low_pass = nyquist - 1.0;
    }

    // Create Butterworth filter
    let zpk = butter(
        filter_order,
        FilterType::BandPass(
            low_pass / nyquist, 
            high_pass / nyquist
        ),
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
    let filtered_signal: Vec<f64> = zero_centered_signal
        .into_iter()
        .map(|x| filter.filter(x.into()))
        .collect();

    FilterResult {
        filtered_signal,
    }
}
