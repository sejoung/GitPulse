use tauri::AppHandle;

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
