use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverviewAnalysis {
    pub repository_name: String,
    pub total_commits: u32,
    pub hotspot_count: u32,
    pub contributor_count: u32,
    pub delivery_risk_level: String,
}
