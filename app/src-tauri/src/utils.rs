use tauri::command;

use crate::globals;

#[command]
pub fn set_bandpass(low_pass: f64, high_pass: f64) -> (f64, f64) {
    let mut low_pass_hz = globals::LOW_PASS_HZ.lock().unwrap();
    let mut high_pass_hz = globals::HIGH_PASS_HZ.lock().unwrap();

    let sample_rate = 8000.0;
    let nyquist = (sample_rate / 2.0) - 1.0;

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
