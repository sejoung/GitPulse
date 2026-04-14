use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaleFile {
    pub path: String,
    pub last_modified: String,
    pub days_since: u32,
    pub staleness: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StalenessAnalysis {
    pub files: Vec<StaleFile>,
    pub tracked_file_count: u32,
    pub stale_file_count: u32,
}
