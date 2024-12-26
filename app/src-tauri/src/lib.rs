use tauri::Emitter;
use firmata_rs::{self, Firmata};
use serialport::{self, DataBits, FlowControl, Parity, StopBits};
use std::{thread, time::Duration};
use biquad::{Biquad, Coefficients, DirectForm1, ToHertz, Type};

mod bpm;
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

            // Validate frequencies
            if high_pass >= low_pass {
                println!("High-pass frequency must be less than low-pass frequency");

                high_pass = 1.0;
                low_pass = nyquist - 1.0;
            }

            // Create high-pass filter coefficients
            let highpass_coeffs = Coefficients::<f64>::from_params(
                Type::HighPass,
                sample_rate.hz(),
                high_pass.hz(),
                2.0
            ).expect("valid high-pass filter coefficients");

            // Create low-pass filter coefficients (4000 Hz)
            let lowpass_coeffs = Coefficients::<f64>::from_params(
                Type::LowPass,
                sample_rate.hz(),
                low_pass.hz(),
                1.0, // Q-Factor (default to 1.0)
            ).expect("valid low-pass filter coefficients");

            // Create Biquad filter instances
            let mut highpass_filter = DirectForm1::new(highpass_coeffs);
            let mut lowpass_filter = DirectForm1::new(lowpass_coeffs);

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

                    // Apply filter to the audio signal and emit
                    let highpass_value = highpass_filter.run(value - 2.5);
                    let filtered_value = lowpass_filter.run(highpass_value);
                    app_handle.emit("filtered_mic", filtered_value + 2.5).unwrap();

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
            utils::apply_fft,
            utils::bpm,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
