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

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmergencyPatternConfig {
    pub pattern: String,
    pub signal: String,
}
