use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

use crate::models::storage::{LogEntryInput, LogFileSummary};

const LOG_DIRECTORY: &str = "logs";
const LOG_FILENAME: &str = "gitpulse.log";
const LOG_ROTATE_LIMIT_BYTES: u64 = 1024 * 1024;
const LOG_ROTATE_FILES: usize = 3;
const LOG_PREVIEW_LINES: usize = 80;

fn log_directory_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    Ok(app_data_dir.join(LOG_DIRECTORY))
}

fn log_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    Ok(log_directory_path(app_handle)?.join(LOG_FILENAME))
}

fn ensure_parent(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn rotate_logs(base_path: &Path) -> Result<(), String> {
    let Ok(metadata) = fs::metadata(base_path) else {
        return Ok(());
    };

    if metadata.len() < LOG_ROTATE_LIMIT_BYTES {
        return Ok(());
    }

    for index in (1..LOG_ROTATE_FILES).rev() {
        let source = base_path.with_extension(format!("log.{index}"));
        let target = base_path.with_extension(format!("log.{}", index + 1));

        if source.exists() {
            let _ = fs::remove_file(&target);
            fs::rename(source, target).map_err(|error| error.to_string())?;
        }
    }

    let rotated = base_path.with_extension("log.1");
    let _ = fs::remove_file(&rotated);
    fs::rename(base_path, rotated).map_err(|error| error.to_string())?;

    Ok(())
}

fn format_log_line(entry: &LogEntryInput) -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string());
    match &entry.context {
        Some(context) if !context.trim().is_empty() => {
            format!(
                "[{timestamp}] {} {} - {} | context={context}\n",
                entry.level.to_uppercase(),
                entry.source,
                entry.message
            )
        }
        _ => format!(
            "[{timestamp}] {} {} - {}\n",
            entry.level.to_uppercase(),
            entry.source,
            entry.message
        ),
    }
}

fn read_log_tail(path: &Path) -> Result<Vec<String>, String> {
    let Ok(mut file) = fs::File::open(path) else {
        return Ok(Vec::new());
    };

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|error| error.to_string())?;

    Ok(contents
        .lines()
        .rev()
        .take(LOG_PREVIEW_LINES)
        .map(str::to_string)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect())
}

pub fn append_entry(app_handle: &AppHandle, entry: LogEntryInput) -> Result<(), String> {
    let path = log_path(app_handle)?;
    ensure_parent(&path)?;
    rotate_logs(&path)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|error| error.to_string())?;

    file.write_all(format_log_line(&entry).as_bytes())
        .map_err(|error| error.to_string())
}

pub fn summary(app_handle: &AppHandle) -> Result<LogFileSummary, String> {
    let path = log_path(app_handle)?;
    ensure_parent(&path)?;

    Ok(LogFileSummary {
        log_path: path.display().to_string(),
        log_directory: path
            .parent()
            .map(|parent| parent.display().to_string())
            .unwrap_or_default(),
        latest_entries: read_log_tail(&path)?,
    })
}

pub fn open_log_file(app_handle: &AppHandle) -> Result<(), String> {
    let path = log_path(app_handle)?;
    ensure_parent(&path)?;
    if !path.exists() {
        OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .map_err(|error| error.to_string())?;
    }

    app_handle
        .opener()
        .reveal_item_in_dir(&path)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
pub fn append_entry_to_path(path: &Path, entry: LogEntryInput) -> Result<(), String> {
    ensure_parent(path)?;
    rotate_logs(path)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|error| error.to_string())?;

    file.write_all(format_log_line(&entry).as_bytes())
        .map_err(|error| error.to_string())
}

#[cfg(test)]
pub fn summary_from_path(path: &Path) -> Result<LogFileSummary, String> {
    ensure_parent(path)?;

    Ok(LogFileSummary {
        log_path: path.display().to_string(),
        log_directory: path
            .parent()
            .map(|parent| parent.display().to_string())
            .unwrap_or_default(),
        latest_entries: read_log_tail(path)?,
    })
}

#[cfg(test)]
#[path = "../../tests/unit/storage/log_tests.rs"]
mod log_tests;
