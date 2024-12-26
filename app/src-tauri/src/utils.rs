use tauri::command;

use crate::globals;

#[command]
pub fn set_bandpass(low_pass: f64, high_pass: f64) -> (f64, f64) {
    // Lock the mutexes, no need to drop them as they will be dropped when they go out of scope
    let mut low_pass_hz = globals::LOW_PASS_HZ.lock().unwrap();
    let mut high_pass_hz = globals::HIGH_PASS_HZ.lock().unwrap();

    // Calculate Nyquist frequency
    let nyquist = (*globals::SAMPLE_RATE / 2.0) - 1.0;

    // Ensure that the low pass and high pass frequencies are within the Nyquist frequency range
    let low_pass = low_pass.max(1.0).min(nyquist);
    let high_pass = high_pass.max(1.0).min(nyquist);

    if low_pass > high_pass {
        *low_pass_hz = low_pass;
        *high_pass_hz = high_pass;
    } else {
        *low_pass_hz = nyquist;
        *high_pass_hz = 1.0;
    }

    (*low_pass_hz, *high_pass_hz)
}

pub fn round(input: f64, places: Option<i32>) -> f64 {
    // Default to 2 decimal places
    let places = places.unwrap_or(2);

    // Round the input to the specified number of decimal places
    (input * 10.0_f64.powi(places)).round() / 10.0_f64.powi(places)
}
