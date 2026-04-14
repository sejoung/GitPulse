use super::*;
use crate::models::overview::EmergencyPatternConfig;
use crate::models::storage::{
    AnalysisCacheEntry, AnalysisRunRecord, PersistedUiSettings, RepositoryOverrideSettings,
};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

#[test]
fn database_round_trips_settings_runs_and_cache_summary() {
    let path = temp_database_path("local-db");
    let mut repository_overrides = BTreeMap::new();
    repository_overrides.insert(
        "/repo".to_string(),
        RepositoryOverrideSettings {
            excluded_paths: "dist/".to_string(),
            bug_keywords: "fix, bug".to_string(),
            emergency_patterns: vec![EmergencyPatternConfig {
                pattern: "revert".to_string(),
                signal: "Rollback activity".to_string(),
            }],
        },
    );

    save_settings_to_path(
        &path,
        PersistedUiSettings {
            language: "en".to_string(),
            developer_mode: false,
            workspace_path: "/repo".to_string(),
            selected_branch: "main".to_string(),
            analysis_period: "3m".to_string(),
            excluded_paths: "dist/".to_string(),
            default_branch: "main".to_string(),
            bug_keywords: "fix, bug".to_string(),
            emergency_patterns: vec![EmergencyPatternConfig {
                pattern: "revert".to_string(),
                signal: "Rollback activity".to_string(),
            }],
            remember_last_repository: true,
            repository_overrides,
        },
    )
    .expect("save settings");
    save_analysis_runs_to_path(
        &path,
        vec![AnalysisRunRecord {
            workspace_path: "/repo".to_string(),
            branch: "main".to_string(),
            period: "3m".to_string(),
            head_sha: "abc123".to_string(),
            short_head_sha: "abc123".to_string(),
            recorded_at: "2026-04-10T00:00:00Z".to_string(),
            total_commits: 18,
            hotspot_count: 4,
            contributor_count: 3,
            delivery_risk_level: "medium".to_string(),
        }],
    )
    .expect("save runs");
    upsert_analysis_cache_to_path(
        &path,
        AnalysisCacheEntry {
            workspace_path: "/repo".to_string(),
            repository_name: "repo".to_string(),
            branch: "main".to_string(),
            period: "3m".to_string(),
            head_sha: "abc123".to_string(),
            recorded_at: "2026-04-10T00:00:00Z".to_string(),
            total_commits: 18,
            hotspot_count: 4,
            contributor_count: 3,
            delivery_risk_level: "medium".to_string(),
        },
    )
    .expect("save cache");

    let snapshot = load_snapshot_from_path(&path);
    let summary = summary_from_path(&path);

    assert_eq!(snapshot.settings.expect("settings").workspace_path, "/repo");
    assert_eq!(snapshot.analysis_runs.len(), 1);
    assert!(summary.settings_stored);
    assert_eq!(summary.analysis_run_count, 1);
    assert_eq!(summary.analysis_cache_count, 1);
    assert_eq!(summary.cached_repository_count, 1);

    let _ = fs::remove_file(path);
}

#[test]
fn database_cache_upsert_replaces_existing_row_for_same_key() {
    let path = temp_database_path("cache-upsert");

    upsert_analysis_cache_to_path(
        &path,
        AnalysisCacheEntry {
            workspace_path: "/repo".to_string(),
            repository_name: "repo".to_string(),
            branch: "main".to_string(),
            period: "3m".to_string(),
            head_sha: "abc123".to_string(),
            recorded_at: "2026-04-10T00:00:00Z".to_string(),
            total_commits: 18,
            hotspot_count: 4,
            contributor_count: 3,
            delivery_risk_level: "medium".to_string(),
        },
    )
    .expect("first upsert");
    upsert_analysis_cache_to_path(
        &path,
        AnalysisCacheEntry {
            workspace_path: "/repo".to_string(),
            repository_name: "repo".to_string(),
            branch: "main".to_string(),
            period: "3m".to_string(),
            head_sha: "abc123".to_string(),
            recorded_at: "2026-04-11T00:00:00Z".to_string(),
            total_commits: 20,
            hotspot_count: 5,
            contributor_count: 4,
            delivery_risk_level: "high".to_string(),
        },
    )
    .expect("second upsert");

    let database = read_database_file(&path);

    assert_eq!(database.analysis_cache.len(), 1);
    assert_eq!(database.analysis_cache[0].total_commits, 20);
    assert_eq!(database.analysis_cache[0].delivery_risk_level, "high");

    let _ = fs::remove_file(path);
}

fn temp_database_path(name: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!("gitpulse-{name}-{}.json", std::process::id()));
    let _ = fs::remove_file(&path);
    path
}
