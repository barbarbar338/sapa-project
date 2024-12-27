use core::f64;

use crate::{globals, utils};

pub fn bpm(signal: Vec<f64>) -> f64 {
    let sample_rate = *globals::SAMPLE_RATE;
    let signal_center = 2.5;
    let thresh = 0.1;
    let duration_secs: f64 = 5.0;

    // Subtract the signal center to center around 0
    let centered_signal: Vec<f64> = signal.iter().map(|&x| x - signal_center).collect();

    let step = (sample_rate / 100.0).round() as usize;
    let tlen = duration_secs.min(centered_signal.len() as f64 / sample_rate);
    let num_samples = (tlen * sample_rate) as usize;

    let mut count = 0;
    let mut flag = false;

    for chunk in centered_signal.chunks(step).take(num_samples / step) {
        let max_val = chunk.iter().cloned().fold(0.0_f64, f64::max);

        if !flag && max_val > thresh {
            count += 1;
            flag = true;
        } else if flag && max_val <= thresh {
            flag = false;
        }
    }

    let bpm = utils::round(60.0 * count as f64 / tlen, Some(2)) / 10.0;

    bpm
}
