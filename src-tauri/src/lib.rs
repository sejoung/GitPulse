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
            commands::analysis::get_hotspot_commit_details,
            commands::analysis::get_ownership_analysis,
            commands::analysis::get_activity_analysis,
            commands::analysis::get_delivery_risk_analysis,
            commands::analysis::get_settings_match_preview,
            commands::branch::list_git_branches,
            commands::branch::checkout_git_branch,
            commands::branch::get_git_repository_state,
            commands::branch::check_git_remote_status,
            commands::branch::pull_git_remote_updates,
            commands::storage::load_local_database,
            commands::storage::save_local_database_settings,
            commands::storage::save_local_database_analysis_runs,
            commands::storage::upsert_local_database_analysis_cache,
            commands::storage::get_local_database_summary,
            commands::storage::open_local_database_directory,
            commands::storage::append_log_entry,
            commands::storage::get_log_file_summary,
            commands::storage::open_log_file,
            commands::update::check_app_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running GitPulse");
}
