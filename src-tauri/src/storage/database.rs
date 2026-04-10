use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

use crate::models::storage::{
    AnalysisCacheEntry, AnalysisRunRecord, LocalDatabaseFile, LocalDatabaseSnapshot,
    LocalDatabaseSummary, PersistedUiSettings,
};

const DATABASE_FILENAME: &str = "gitpulse-db.json";
const DATABASE_VERSION: u32 = 1;
pub const ANALYSIS_RUN_LIMIT: usize = 20;
pub const ANALYSIS_CACHE_LIMIT: usize = 50;

fn default_database() -> LocalDatabaseFile {
    LocalDatabaseFile {
        version: DATABASE_VERSION,
        settings: None,
        analysis_runs: Vec::new(),
        analysis_cache: Vec::new(),
    }
}

fn read_database_file(path: &Path) -> LocalDatabaseFile {
    let Ok(contents) = fs::read_to_string(path) else {
        return default_database();
    };

    serde_json::from_str::<LocalDatabaseFile>(&contents).unwrap_or_else(|_| default_database())
}

fn write_database_file(path: &Path, database: &LocalDatabaseFile) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let payload = serde_json::to_string_pretty(database).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())
}

fn database_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    Ok(app_data_dir.join(DATABASE_FILENAME))
}

pub fn load_snapshot(app_handle: &AppHandle) -> Result<LocalDatabaseSnapshot, String> {
    let path = database_path(app_handle)?;
    let database = read_database_file(&path);

    Ok(LocalDatabaseSnapshot {
        settings: database.settings,
        analysis_runs: database.analysis_runs,
    })
}

pub fn save_settings(app_handle: &AppHandle, settings: PersistedUiSettings) -> Result<(), String> {
    let path = database_path(app_handle)?;
    let mut database = read_database_file(&path);
    database.version = DATABASE_VERSION;
    database.settings = Some(settings);
    write_database_file(&path, &database)
}

pub fn save_analysis_runs(
    app_handle: &AppHandle,
    runs: Vec<AnalysisRunRecord>,
) -> Result<(), String> {
    let path = database_path(app_handle)?;
    let mut database = read_database_file(&path);
    database.version = DATABASE_VERSION;
    database.analysis_runs = runs;
    write_database_file(&path, &database)
}

pub fn upsert_analysis_cache(
    app_handle: &AppHandle,
    entry: AnalysisCacheEntry,
) -> Result<(), String> {
    let path = database_path(app_handle)?;
    let mut database = read_database_file(&path);
    database.version = DATABASE_VERSION;

    if let Some(index) = database.analysis_cache.iter().position(|item| {
        item.workspace_path == entry.workspace_path
            && item.branch == entry.branch
            && item.period == entry.period
            && item.head_sha == entry.head_sha
    }) {
        database.analysis_cache[index] = entry;
    } else {
        database.analysis_cache.insert(0, entry);
        database.analysis_cache.truncate(ANALYSIS_CACHE_LIMIT);
    }

    write_database_file(&path, &database)
}

pub fn summary(app_handle: &AppHandle) -> Result<LocalDatabaseSummary, String> {
    let path = database_path(app_handle)?;
    let database = read_database_file(&path);
    let cached_repository_count = database
        .analysis_cache
        .iter()
        .map(|item| item.workspace_path.clone())
        .collect::<BTreeSet<_>>()
        .len() as u32;

    Ok(LocalDatabaseSummary {
        settings_stored: database.settings.is_some(),
        analysis_run_count: database.analysis_runs.len() as u32,
        analysis_cache_count: database.analysis_cache.len() as u32,
        cached_repository_count,
        database_path: path.display().to_string(),
        analysis_run_limit: ANALYSIS_RUN_LIMIT as u32,
        analysis_cache_limit: ANALYSIS_CACHE_LIMIT as u32,
    })
}

pub fn open_database_directory(app_handle: &AppHandle) -> Result<(), String> {
    let path = database_path(app_handle)?;
    if !path.exists() {
        write_database_file(&path, &default_database())?;
    }

    app_handle
        .opener()
        .reveal_item_in_dir(&path)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
#[path = "../../tests/unit/storage/database_tests.rs"]
mod database_tests;

#[cfg(test)]
pub fn load_snapshot_from_path(path: &Path) -> LocalDatabaseSnapshot {
    let database = read_database_file(path);

    LocalDatabaseSnapshot {
        settings: database.settings,
        analysis_runs: database.analysis_runs,
    }
}

#[cfg(test)]
pub fn save_settings_to_path(path: &Path, settings: PersistedUiSettings) -> Result<(), String> {
    let mut database = read_database_file(path);
    database.version = DATABASE_VERSION;
    database.settings = Some(settings);
    write_database_file(path, &database)
}

#[cfg(test)]
pub fn save_analysis_runs_to_path(path: &Path, runs: Vec<AnalysisRunRecord>) -> Result<(), String> {
    let mut database = read_database_file(path);
    database.version = DATABASE_VERSION;
    database.analysis_runs = runs;
    write_database_file(path, &database)
}

#[cfg(test)]
pub fn upsert_analysis_cache_to_path(path: &Path, entry: AnalysisCacheEntry) -> Result<(), String> {
    let mut database = read_database_file(path);
    database.version = DATABASE_VERSION;

    if let Some(index) = database.analysis_cache.iter().position(|item| {
        item.workspace_path == entry.workspace_path
            && item.branch == entry.branch
            && item.period == entry.period
            && item.head_sha == entry.head_sha
    }) {
        database.analysis_cache[index] = entry;
    } else {
        database.analysis_cache.insert(0, entry);
        database.analysis_cache.truncate(ANALYSIS_CACHE_LIMIT);
    }

    write_database_file(path, &database)
}

#[cfg(test)]
pub fn summary_from_path(path: &Path) -> LocalDatabaseSummary {
    let database = read_database_file(path);
    let cached_repository_count = database
        .analysis_cache
        .iter()
        .map(|item| item.workspace_path.clone())
        .collect::<BTreeSet<_>>()
        .len() as u32;

    LocalDatabaseSummary {
        settings_stored: database.settings.is_some(),
        analysis_run_count: database.analysis_runs.len() as u32,
        analysis_cache_count: database.analysis_cache.len() as u32,
        cached_repository_count,
        database_path: path.display().to_string(),
        analysis_run_limit: ANALYSIS_RUN_LIMIT as u32,
        analysis_cache_limit: ANALYSIS_CACHE_LIMIT as u32,
    }
}
