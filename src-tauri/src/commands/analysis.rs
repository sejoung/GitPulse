use crate::analysis::overview::{
    build_activity_analysis, build_delivery_risk_analysis, build_hotspot_commit_details,
    build_hotspots_analysis, build_overview_analysis, build_ownership_analysis,
    build_settings_match_preview,
};
use crate::models::overview::{
    ActivityPoint, DeliveryEvent, EmergencyPatternConfig, HotspotCommit, HotspotFile,
    OverviewAnalysis, OwnershipContributor, SettingsMatchPreview,
};

#[tauri::command]
pub fn get_overview_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
) -> OverviewAnalysis {
    build_overview_analysis(
        workspace_path.as_deref(),
        period.as_deref(),
        excluded_paths.as_deref(),
        bug_keywords.as_deref(),
        emergency_patterns.as_deref(),
    )
}

#[tauri::command]
pub fn get_hotspots_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
) -> Vec<HotspotFile> {
    build_hotspots_analysis(
        workspace_path.as_deref(),
        period.as_deref(),
        excluded_paths.as_deref(),
        bug_keywords.as_deref(),
    )
}

#[tauri::command]
pub fn get_hotspot_commit_details(
    workspace_path: Option<String>,
    period: Option<String>,
    bug_keywords: Option<String>,
    file_path: Option<String>,
) -> Vec<HotspotCommit> {
    build_hotspot_commit_details(
        workspace_path.as_deref(),
        period.as_deref(),
        bug_keywords.as_deref(),
        file_path.as_deref(),
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

#[tauri::command]
pub fn get_settings_match_preview(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
) -> SettingsMatchPreview {
    build_settings_match_preview(
        workspace_path.as_deref(),
        period.as_deref(),
        excluded_paths.as_deref(),
        bug_keywords.as_deref(),
        emergency_patterns.as_deref(),
    )
}
