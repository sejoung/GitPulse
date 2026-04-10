use tauri::AppHandle;

use crate::models::storage::{
    AnalysisCacheEntry, AnalysisRunRecord, LocalDatabaseSnapshot, LocalDatabaseSummary,
    PersistedUiSettings,
};
use crate::storage::database;

#[tauri::command]
pub fn load_local_database(app_handle: AppHandle) -> Result<LocalDatabaseSnapshot, String> {
    database::load_snapshot(&app_handle)
}

#[tauri::command]
pub fn save_local_database_settings(
    app_handle: AppHandle,
    settings: PersistedUiSettings,
) -> Result<(), String> {
    database::save_settings(&app_handle, settings)
}

#[tauri::command]
pub fn save_local_database_analysis_runs(
    app_handle: AppHandle,
    runs: Vec<AnalysisRunRecord>,
) -> Result<(), String> {
    database::save_analysis_runs(&app_handle, runs)
}

#[tauri::command]
pub fn upsert_local_database_analysis_cache(
    app_handle: AppHandle,
    entry: AnalysisCacheEntry,
) -> Result<(), String> {
    database::upsert_analysis_cache(&app_handle, entry)
}

#[tauri::command]
pub fn get_local_database_summary(app_handle: AppHandle) -> Result<LocalDatabaseSummary, String> {
    database::summary(&app_handle)
}

#[tauri::command]
pub fn open_local_database_directory(app_handle: AppHandle) -> Result<(), String> {
    database::open_database_directory(&app_handle)
}
