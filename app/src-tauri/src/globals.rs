// globals.rs
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref AUDIO_DATA: Mutex<Vec<f32>> = Mutex::new(Vec::new());
}
