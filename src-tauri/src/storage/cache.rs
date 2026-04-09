#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CacheKey {
    pub workspace: String,
    pub branch: String,
    pub period: String,
    pub head_sha: String,
}
