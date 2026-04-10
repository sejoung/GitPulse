use super::*;
use crate::models::storage::LogEntryInput;
use std::fs;
use std::path::PathBuf;

#[test]
fn log_file_appends_entries_and_returns_recent_preview() {
    let path = temp_log_path("log-summary");

    append_entry_to_path(
        &path,
        LogEntryInput {
            level: "info".to_string(),
            source: "frontend:test".to_string(),
            message: "First message".to_string(),
            context: None,
        },
    )
    .expect("append first log entry");
    append_entry_to_path(
        &path,
        LogEntryInput {
            level: "error".to_string(),
            source: "frontend:test".to_string(),
            message: "Second message".to_string(),
            context: Some("{\"page\":\"overview\"}".to_string()),
        },
    )
    .expect("append second log entry");

    let summary = summary_from_path(&path).expect("log summary");

    assert_eq!(summary.log_path, path.display().to_string());
    assert_eq!(summary.latest_entries.len(), 2);
    assert!(summary.latest_entries[0].contains("First message"));
    assert!(summary.latest_entries[1].contains("Second message"));
    assert!(summary.latest_entries[1].contains("context={\"page\":\"overview\"}"));

    let _ = fs::remove_file(path);
}

fn temp_log_path(name: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!("gitpulse-{name}-{}.log", std::process::id()));
    let _ = fs::remove_file(&path);
    path
}
