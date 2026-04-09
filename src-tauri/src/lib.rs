mod analysis;
mod commands;
mod git;
mod models;
mod storage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::analysis::get_overview_analysis,
            commands::analysis::get_hotspots_analysis,
            commands::analysis::get_ownership_analysis,
            commands::analysis::get_activity_analysis,
            commands::analysis::get_delivery_risk_analysis,
            commands::branch::list_git_branches,
            commands::branch::checkout_git_branch
        ])
        .run(tauri::generate_context!())
        .expect("error while running GitPulse");
}
