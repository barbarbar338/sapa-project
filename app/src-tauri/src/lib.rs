use tauri::Emitter;
use firmata_rs::{self, Firmata};
use serialport::{self, DataBits, FlowControl, Parity, StopBits};
use std::{thread, time::Duration};
use iir_filters::{filter::{DirectForm2Transposed, Filter}, filter_design::{self, FilterType}, sos::zpk2sos};

mod fft;
mod globals;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Arduino board constants
            let pin = 14; // A0
            let path = "COM3";
            let baud_rate = 57_600;
            let sample_rate = *globals::SAMPLE_RATE;

            // Create a new serial port connection
            let port = serialport::new(path, baud_rate)
                .data_bits(DataBits::Eight)
                .parity(Parity::None)
                .stop_bits(StopBits::One)
                .flow_control(FlowControl::None)
                .timeout(Duration::from_millis(1000))
                .open()
                .expect("an opened serial port");

            // Create a new Firmata board and set the pin mode
            let mut b = firmata_rs::Board::new(Box::new(port)).expect("new board");
            
            // Set the pin mode
            b.set_pin_mode(pin, firmata_rs::ANALOG)
                .expect("pin mode set");
            b.report_analog(pin, 1).expect("reporting state");

            // Design bandpass filter
            let high_pass_freq = *globals::HIGH_PASS_HZ.lock().unwrap();
            let low_pass_freq = *globals::LOW_PASS_HZ.lock().unwrap();

            let nyquist = sample_rate / 2.0;

            let mut high_pass = high_pass_freq.max(1.0); // Ensure its positive
            let mut low_pass = low_pass_freq.min(nyquist - 1.0); // Ensure its less than Nyquist frequency
            let filter_order = 2;

            // Validate frequencies
            if high_pass >= low_pass {
                println!("High-pass frequency must be less than low-pass frequency");

                high_pass = 1.0;
                low_pass = nyquist - 1.0;
            }

            let zpk = match filter_design::butter(
                    filter_order,
                    FilterType::BandPass(low_pass, high_pass),
                    sample_rate
                ) {
                Ok(zpk) => zpk,
                Err(e) => panic!("Failed to design filter: {}", e),
            };

            let sos = match zpk2sos(&zpk, None) {
                Ok(sos) => sos,
                Err(e) => panic!("Failed to convert ZPK to SOS: {}", e),
            };

            let mut filter = DirectForm2Transposed::new(&sos);

            // Design DC blocker, high-pass filter with very low cutoff
            let dc_zpk = match filter_design::butter(
                1, 
                FilterType::HighPass(5.0),
                sample_rate
            ) {
                Ok(dc_zpk) => dc_zpk,
                Err(e) => panic!("Failed to design DC filter: {}", e),
            };

            let dc_sos = match zpk2sos(&dc_zpk, None) {
                Ok(dc_sos) => dc_sos,
                Err(e) => panic!("Failed to convert DC ZPK to SOS: {}", e),
            };

            let mut dc_filter = DirectForm2Transposed::new(&dc_sos);

            // Spawn an asyncronous thread to read and
            // decode the messages from the board every
            // 125 microseconds, which is the sample rate
            // of the audio signal, 8kHz
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    b.read_and_decode().expect("a message");

                    // 10-bit ADC, 5V reference
                    let value = (b.pins[pin as usize].value as f64 / 1024.0) * 5.0;

                    // Emit audio data to the frontend
                    app_handle.emit("mic", value).unwrap();

                    // Apply DC blocker filter FIRST!
                    let dc_blocked_value = dc_filter.filter(value);

                    // Apply filter to the audio signal and emit
                    let filtered_value = filter.filter(dc_blocked_value);
                    
                    app_handle.emit("filtered_mic", filtered_value).unwrap();

                    // Sleep for 125 microseconds, 8kHz sample rate
                    let period = 1.0 / sample_rate; // 1 / 8000 = 0.000125 = 125microseconds
                    thread::sleep(Duration::from_secs_f64(period));
                }
            });


            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            utils::set_bandpass,
            utils::apply_fft
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
