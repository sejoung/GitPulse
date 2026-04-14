use super::*;

#[test]
fn collaboration_returns_empty_for_invalid_workspace() {
    let result = build_collaboration_analysis(Some("/nonexistent/path"), Some("1y"), None);

    assert!(result.pairs.is_empty());
    assert_eq!(result.contributor_count, 0);
    assert_eq!(result.analyzed_file_count, 0);
}

#[test]
fn collaboration_returns_empty_for_none_workspace() {
    let result = build_collaboration_analysis(None, Some("1y"), None);

    assert!(result.pairs.is_empty());
    assert_eq!(result.contributor_count, 0);
}
