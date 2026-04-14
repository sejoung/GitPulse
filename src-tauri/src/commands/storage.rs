use std::fs;
use std::path::Path;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

use crate::models::storage::{
    AnalysisCacheEntry, AnalysisRunRecord, LocalDatabaseSnapshot, LocalDatabaseSummary,
    LogEntryInput, LogFileSummary, PersistedUiSettings,
};
use crate::storage::database;
use crate::storage::log;

#[tauri::command]
pub async fn load_local_database(app_handle: AppHandle) -> Result<LocalDatabaseSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || database::load_snapshot(&app_handle))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn save_local_database_settings(
    app_handle: AppHandle,
    settings: PersistedUiSettings,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || database::save_settings(&app_handle, settings))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn save_local_database_analysis_runs(
    app_handle: AppHandle,
    runs: Vec<AnalysisRunRecord>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || database::save_analysis_runs(&app_handle, runs))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn upsert_local_database_analysis_cache(
    app_handle: AppHandle,
    entry: AnalysisCacheEntry,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        database::upsert_analysis_cache(&app_handle, entry)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn get_local_database_summary(
    app_handle: AppHandle,
) -> Result<LocalDatabaseSummary, String> {
    tauri::async_runtime::spawn_blocking(move || database::summary(&app_handle))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn open_local_database_directory(app_handle: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || database::open_database_directory(&app_handle))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn append_log_entry(app_handle: AppHandle, entry: LogEntryInput) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || log::append_entry(&app_handle, entry))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn get_log_file_summary(app_handle: AppHandle) -> Result<LogFileSummary, String> {
    tauri::async_runtime::spawn_blocking(move || log::summary(&app_handle))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn open_log_file(app_handle: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || log::open_log_file(&app_handle))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn save_export_file(
    app_handle: AppHandle,
    default_name: String,
    contents: String,
) -> Result<bool, String> {
    let file_path = app_handle
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter("All files", &["json", "md", "html"])
        .blocking_save_file();

    let Some(path) = file_path else {
        return Ok(false);
    };

    fs::write(path.as_path().ok_or("Invalid path")?, contents.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok(true)
}

#[tauri::command]
pub async fn reveal_file_in_explorer(
    app_handle: AppHandle,
    workspace_path: String,
    file_path: String,
) -> Result<bool, String> {
    let full_path = Path::new(&workspace_path).join(&file_path);

    if !full_path.exists() {
        return Ok(false);
    }

    app_handle
        .opener()
        .reveal_item_in_dir(&full_path)
        .map_err(|error| error.to_string())?;

    Ok(true)
}
