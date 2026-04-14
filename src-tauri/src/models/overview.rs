use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverviewAnalysis {
    pub repository_name: String,
    pub total_commits: u32,
    pub hotspot_count: u32,
    pub contributor_count: u32,
    pub delivery_risk_level: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HotspotFile {
    pub path: String,
    pub changes: u32,
    pub fixes: u32,
    pub risk: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HotspotCommit {
    pub sha: String,
    pub short_sha: String,
    pub date: String,
    pub author: String,
    pub subject: String,
    pub matches_bug_keyword: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnershipContributor {
    pub name: String,
    pub commits: u32,
    pub share: String,
    pub recent_key: String,
    pub risk: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityPoint {
    pub month: String,
    pub commits: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryEvent {
    pub event: String,
    pub count: u32,
    pub signal: String,
    pub signal_key: String,
    pub risk: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPatternMatch {
    pub pattern: String,
    pub signal: String,
    pub count: u32,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPreviewCommit {
    pub short_sha: String,
    pub date: String,
    pub author: String,
    pub subject: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPatternCommitSample {
    pub pattern: String,
    pub signal: String,
    pub commits: Vec<SettingsPreviewCommit>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsMatchPreview {
    pub analyzed_commit_count: u32,
    pub bug_keyword_commit_count: u32,
    pub excluded_file_count: u32,
    pub excluded_files: Vec<String>,
    pub emergency_matches: Vec<SettingsPatternMatch>,
    pub bug_keyword_commits: Vec<SettingsPreviewCommit>,
    pub emergency_commit_samples: Vec<SettingsPatternCommitSample>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmergencyPatternConfig {
    pub pattern: String,
    pub signal: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitBranch {
    pub name: String,
    pub label: String,
    pub kind: String,
    pub current: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRemoteStatus {
    pub status: String,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub message: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepositoryState {
    pub branch: Option<String>,
    pub head_sha: Option<String>,
    pub short_head_sha: Option<String>,
    pub dirty: bool,
}

#[derive(Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RiskThresholds {
    pub hotspot_risky_changes: Option<u32>,
    pub hotspot_risky_fixes: Option<u32>,
    pub hotspot_watch_changes: Option<u32>,
    pub hotspot_watch_fixes: Option<u32>,
    pub delivery_risky_count: Option<u32>,
    pub delivery_watch_count: Option<u32>,
    pub ownership_watch_percent: Option<f64>,
}

impl RiskThresholds {
    pub fn hotspot_risky_changes(&self) -> u32 {
        self.hotspot_risky_changes.unwrap_or(20)
    }
    pub fn hotspot_risky_fixes(&self) -> u32 {
        self.hotspot_risky_fixes.unwrap_or(5)
    }
    pub fn hotspot_watch_changes(&self) -> u32 {
        self.hotspot_watch_changes.unwrap_or(10)
    }
    pub fn hotspot_watch_fixes(&self) -> u32 {
        self.hotspot_watch_fixes.unwrap_or(3)
    }
    pub fn delivery_risky_count(&self) -> u32 {
        self.delivery_risky_count.unwrap_or(6)
    }
    pub fn delivery_watch_count(&self) -> u32 {
        self.delivery_watch_count.unwrap_or(2)
    }
    pub fn ownership_watch_percent(&self) -> f64 {
        self.ownership_watch_percent.unwrap_or(60.0)
    }
}
