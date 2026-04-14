use super::*;

#[test]
fn staleness_returns_empty_for_invalid_workspace() {
    let result = build_staleness_analysis(Some("/nonexistent/path"), None, None);

    assert!(result.files.is_empty());
    assert_eq!(result.tracked_file_count, 0);
}

#[test]
fn staleness_returns_empty_for_none_workspace() {
    let result = build_staleness_analysis(None, None, None);

    assert!(result.files.is_empty());
}

#[test]
fn days_between_calculates_approximate_difference() {
    assert_eq!(days_between("2025-01-01", "2025-07-01"), 180);
    assert_eq!(days_between("2025-01-01", "2025-01-01"), 0);
}
