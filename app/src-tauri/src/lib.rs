use tauri::{Emitter, Manager};
use firmata_rs::*;
use serialport::*;
use std::{thread, time::Duration};

mod dsp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();            
            let _ = window.set_title("Digital Stethoscope");

            let port = serialport::new("COM3", 57_600)
                .data_bits(DataBits::Eight)
                .parity(Parity::None)
                .stop_bits(StopBits::One)
                .flow_control(FlowControl::None)
                .timeout(Duration::from_millis(1000))
                .open()
                .expect("an opened serial port");

            let mut b = firmata_rs::Board::new(Box::new(port)).expect("new board");

            let pin = 14; // A0

            b.set_pin_mode(pin, firmata_rs::ANALOG)
                .expect("pin mode set");

            b.report_analog(pin, 1).expect("reporting state");

            let app_handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    b.read_and_decode().expect("a message");

                    // 10-bit ADC, 5V reference
                    let value = (b.pins[pin as usize].value as f32 / 1023.0) * 5.0;

                    println!("mic: {}", value);
                    app_handle.emit("mic", value).unwrap();

                    thread::sleep(Duration::from_micros(128)); // 128us, 8kHz sampling rate
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![dsp::fft::apply_fft, dsp::filter::apply_filter])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
