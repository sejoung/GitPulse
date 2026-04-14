use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CollaborationPair {
    pub author_a: String,
    pub author_b: String,
    pub shared_file_count: u32,
    pub strength: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CollaborationAnalysis {
    pub pairs: Vec<CollaborationPair>,
    pub contributor_count: u32,
    pub analyzed_file_count: u32,
}
