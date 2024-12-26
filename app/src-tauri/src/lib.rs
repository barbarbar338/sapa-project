use tauri::Emitter;
use firmata_rs::*;
use serialport::*;
use std::{thread, time::Duration};

mod fft;
mod filter;
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

            // Spawn an asyncronous thread to read and
            // decode the messages from the board every
            // 125 microseconds, which is the sample rate
            // of the audio signal, 8kHz
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    b.read_and_decode().expect("a message");

                    // 10-bit ADC, 5V reference
                    let value = (b.pins[pin as usize].value as f32 / 1024.0) * 5.0;

                    // Hold last 300 samples
                    let mut audio_data = globals::AUDIO_DATA.lock().unwrap();
                    audio_data.push(value);
                    if audio_data.len() > 300 {
                        audio_data.remove(0);
                    }
                    drop(audio_data); // Unlock the mutex
                    
                    // Emit audio data to the frontend
                    app_handle.emit("mic", value).unwrap();

                    // Apply FFT
                    let fft_result = fft::apply_fft(true);
                    app_handle.emit("fft-normal", fft_result).unwrap();

                    // TODO: Too much delay???
                    // Apply bandpass filter
                    let filter_result = filter::apply_filter();
                    let filtered_signal = filter_result.filtered_signal.last().unwrap(); // get the latest filtered signal element
                    app_handle.emit("filtered-signal", *filtered_signal).unwrap();

                    // Apply FFT to filtered signal
                    let fft_result = fft::apply_fft(false);
                    app_handle.emit("fft-filtered", fft_result).unwrap();

                    // Sleep for 125 microseconds, 8kHz sample rate
                    let period = 1.0 / *globals::SAMPLE_RATE; // 1 / 8000 = 0.000125 = 125microseconds
                    thread::sleep(Duration::from_secs_f64(period));
                }
            });


            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            utils::set_bandpass,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
