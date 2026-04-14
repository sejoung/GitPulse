use serde::{Deserialize, Serialize};

use crate::models::overview::EmergencyPatternConfig;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryOverrideSettings {
    pub excluded_paths: String,
    pub bug_keywords: String,
    pub emergency_patterns: Vec<EmergencyPatternConfig>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedUiSettings {
    pub language: String,
    pub developer_mode: bool,
    pub workspace_path: String,
    pub selected_branch: String,
    pub analysis_period: String,
    pub excluded_paths: String,
    pub default_branch: String,
    pub bug_keywords: String,
    pub emergency_patterns: Vec<EmergencyPatternConfig>,
    pub remember_last_repository: bool,
    pub repository_overrides: std::collections::BTreeMap<String, RepositoryOverrideSettings>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisRunRecord {
    pub workspace_path: String,
    pub branch: String,
    pub period: String,
    pub head_sha: String,
    pub short_head_sha: String,
    pub recorded_at: String,
    pub total_commits: u32,
    pub hotspot_count: u32,
    pub contributor_count: u32,
    pub delivery_risk_level: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisCacheEntry {
    pub workspace_path: String,
    pub repository_name: String,
    pub branch: String,
    pub period: String,
    pub head_sha: String,
    pub recorded_at: String,
    pub total_commits: u32,
    pub hotspot_count: u32,
    pub contributor_count: u32,
    pub delivery_risk_level: String,
}

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalDatabaseSnapshot {
    pub settings: Option<PersistedUiSettings>,
    pub analysis_runs: Vec<AnalysisRunRecord>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalDatabaseSummary {
    pub settings_stored: bool,
    pub analysis_run_count: u32,
    pub analysis_cache_count: u32,
    pub cached_repository_count: u32,
    pub database_path: String,
    pub analysis_run_limit: u32,
    pub analysis_cache_limit: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntryInput {
    pub level: String,
    pub source: String,
    pub message: String,
    pub context: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LogFileSummary {
    pub log_path: String,
    pub log_directory: String,
    pub latest_entries: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalDatabaseFile {
    pub version: u32,
    pub settings: Option<PersistedUiSettings>,
    pub analysis_runs: Vec<AnalysisRunRecord>,
    pub analysis_cache: Vec<AnalysisCacheEntry>,
}
