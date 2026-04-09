mod analysis;
mod commands;
mod git;
mod models;
mod storage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::analysis::get_overview_analysis
        ])
        .run(tauri::generate_context!())
        .expect("error while running GitPulse");
}
