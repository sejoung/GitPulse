use super::*;

#[test]
fn cochange_returns_empty_for_invalid_workspace() {
    let result = build_cochange_analysis(Some("/nonexistent/path"), Some("1y"), None, None);

    assert!(result.pairs.is_empty());
    assert_eq!(result.analyzed_commit_count, 0);
    assert_eq!(result.unique_file_count, 0);
}

#[test]
fn cochange_returns_empty_for_none_workspace() {
    let result = build_cochange_analysis(None, Some("1y"), None, None);

    assert!(result.pairs.is_empty());
    assert_eq!(result.analyzed_commit_count, 0);
}
