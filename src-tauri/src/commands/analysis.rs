use crate::analysis::cochange::build_cochange_analysis;
use crate::analysis::overview::{
    build_activity_analysis, build_delivery_risk_analysis, build_hotspot_commit_details,
    build_hotspots_analysis, build_overview_analysis, build_ownership_analysis,
    build_settings_match_preview,
};
use crate::models::cochange::CoChangeAnalysis;
use crate::models::overview::{
    ActivityPoint, DeliveryEvent, EmergencyPatternConfig, HotspotCommit, HotspotFile,
    OverviewAnalysis, OwnershipContributor, RiskThresholds, SettingsMatchPreview,
};

#[tauri::command]
pub async fn get_overview_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
    risk_thresholds: Option<RiskThresholds>,
) -> Result<OverviewAnalysis, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let thresholds = risk_thresholds.unwrap_or_default();
        build_overview_analysis(
            workspace_path.as_deref(),
            period.as_deref(),
            excluded_paths.as_deref(),
            bug_keywords.as_deref(),
            emergency_patterns.as_deref(),
            &thresholds,
        )
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_hotspots_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
    risk_thresholds: Option<RiskThresholds>,
) -> Result<Vec<HotspotFile>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let thresholds = risk_thresholds.unwrap_or_default();
        build_hotspots_analysis(
            workspace_path.as_deref(),
            period.as_deref(),
            excluded_paths.as_deref(),
            bug_keywords.as_deref(),
            &thresholds,
        )
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_hotspot_commit_details(
    workspace_path: Option<String>,
    period: Option<String>,
    bug_keywords: Option<String>,
    file_path: Option<String>,
) -> Result<Vec<HotspotCommit>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        build_hotspot_commit_details(
            workspace_path.as_deref(),
            period.as_deref(),
            bug_keywords.as_deref(),
            file_path.as_deref(),
        )
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_ownership_analysis(
    workspace_path: Option<String>,
    risk_thresholds: Option<RiskThresholds>,
) -> Result<Vec<OwnershipContributor>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let thresholds = risk_thresholds.unwrap_or_default();
        build_ownership_analysis(workspace_path.as_deref(), &thresholds)
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_activity_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
) -> Result<Vec<ActivityPoint>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        build_activity_analysis(workspace_path.as_deref(), period.as_deref())
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_delivery_risk_analysis(
    workspace_path: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
    risk_thresholds: Option<RiskThresholds>,
) -> Result<Vec<DeliveryEvent>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let thresholds = risk_thresholds.unwrap_or_default();
        build_delivery_risk_analysis(
            workspace_path.as_deref(),
            emergency_patterns.as_deref(),
            &thresholds,
        )
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_settings_match_preview(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    bug_keywords: Option<String>,
    emergency_patterns: Option<Vec<EmergencyPatternConfig>>,
    risk_thresholds: Option<RiskThresholds>,
) -> Result<SettingsMatchPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let thresholds = risk_thresholds.unwrap_or_default();
        build_settings_match_preview(
            workspace_path.as_deref(),
            period.as_deref(),
            excluded_paths.as_deref(),
            bug_keywords.as_deref(),
            emergency_patterns.as_deref(),
            &thresholds,
        )
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_cochange_analysis(
    workspace_path: Option<String>,
    period: Option<String>,
    excluded_paths: Option<String>,
    min_coupling: Option<u32>,
) -> Result<CoChangeAnalysis, String> {
    tauri::async_runtime::spawn_blocking(move || {
        build_cochange_analysis(
            workspace_path.as_deref(),
            period.as_deref(),
            excluded_paths.as_deref(),
            min_coupling,
        )
    })
    .await
    .map_err(|error| error.to_string())
}
