use crate::analysis::overview::{
    build_activity_analysis, build_delivery_risk_analysis, build_hotspots_analysis,
    build_overview_analysis, build_ownership_analysis,
};
use crate::models::overview::{
    ActivityPoint, DeliveryEvent, EmergencyPatternConfig, HotspotFile, OverviewAnalysis,
    OwnershipContributor,
};

#[tauri::command]
pub fn get_overview_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    bug_keywords: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
) -> OverviewAnalysis {
    build_overview_analysis(
        workspace_path.as_deref(),
        period.as_deref(),
        bug_keywords.as_deref(),
        emergency_patterns.as_deref(),
    )
}

#[tauri::command]
pub fn get_hotspots_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    bug_keywords: Option<String>,
) -> Vec<HotspotFile> {
    build_hotspots_analysis(
        workspace_path.as_deref(),
        period.as_deref(),
        bug_keywords.as_deref(),
    )
}

#[tauri::command]
pub fn get_ownership_analysis(workspace_path: Option<String>) -> Vec<OwnershipContributor> {
    build_ownership_analysis(workspace_path.as_deref())
}

#[tauri::command]
pub fn get_activity_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
) -> Vec<ActivityPoint> {
    build_activity_analysis(workspace_path.as_deref(), period.as_deref())
}

#[tauri::command]
pub fn get_delivery_risk_analysis(
    workspace_path: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
) -> Vec<DeliveryEvent> {
    build_delivery_risk_analysis(workspace_path.as_deref(), emergency_patterns.as_deref())
}
