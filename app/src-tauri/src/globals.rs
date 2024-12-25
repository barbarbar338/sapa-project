// globals.rs
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref AUDIO_DATA: Mutex<Vec<f32>> = Mutex::new(Vec::new());
    pub static ref LOW_PASS_HZ: Mutex<f64> = Mutex::new(1.0);
    pub static ref HIGH_PASS_HZ: Mutex<f64> = Mutex::new(4000.0);
}
