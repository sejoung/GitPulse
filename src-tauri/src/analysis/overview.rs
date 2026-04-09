use crate::models::overview::OverviewAnalysis;

pub fn build_overview_analysis() -> OverviewAnalysis {
    OverviewAnalysis {
        repository_name: "No workspace selected".to_string(),
        total_commits: 0,
        hotspot_count: 0,
        contributor_count: 0,
        delivery_risk_level: "low".to_string(),
    }
}
