use crate::analysis::overview::build_overview_analysis;
use crate::models::overview::OverviewAnalysis;

#[tauri::command]
pub fn get_overview_analysis() -> OverviewAnalysis {
    build_overview_analysis()
}
