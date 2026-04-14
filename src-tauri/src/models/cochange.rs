use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoChangePair {
    pub file_a: String,
    pub file_b: String,
    pub co_change_count: u32,
    pub coupling_ratio: f64,
    pub signal: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoChangeAnalysis {
    pub pairs: Vec<CoChangePair>,
    pub analyzed_commit_count: u32,
    pub unique_file_count: u32,
}
