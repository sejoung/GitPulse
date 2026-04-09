use super::*;

#[test]
fn branch_list_excludes_remote_head_pointer() {
    let branches = branches_from_ref_output(
        "refs/heads/main|main\nrefs/remotes/origin/HEAD|origin\nrefs/remotes/origin/main|origin/main",
        Some("main"),
    );

    assert_eq!(branches.len(), 1);
    assert_eq!(branches[0].name, "main");
    assert!(branches[0].current);
}

#[test]
fn branch_list_keeps_remote_branch_without_local_tracking_branch() {
    let branches = branches_from_ref_output(
        "refs/heads/main|main\nrefs/remotes/origin/feature-a|origin/feature-a",
        Some("main"),
    );

    assert_eq!(branches.len(), 2);
    assert_eq!(branches[1].name, "origin/feature-a");
    assert_eq!(branches[1].label, "origin/feature-a (remote)");
    assert_eq!(branches[1].kind, "remote");
}

#[test]
fn branch_list_handles_local_branch_names_with_slashes() {
    let branches = branches_from_ref_output(
        "refs/heads/feature/a|feature/a\nrefs/remotes/origin/feature/a|origin/feature/a",
        Some("feature/a"),
    );

    assert_eq!(branches.len(), 1);
    assert_eq!(branches[0].name, "feature/a");
    assert_eq!(branches[0].kind, "local");
    assert!(branches[0].current);
}

#[test]
fn remote_head_pointer_is_not_treated_as_checkoutable_remote_branch() {
    assert!(!remote_branch_exists("/not/a/repo", "origin"));
    assert!(!remote_branch_exists("/not/a/repo", "origin/HEAD"));
}

#[test]
fn parses_ahead_and_behind_counts() {
    assert_eq!(parse_ahead_behind("2\t3"), Some((2, 3)));
    assert_eq!(parse_ahead_behind("0 1"), Some((0, 1)));
    assert_eq!(parse_ahead_behind("not-counts"), None);
}

#[test]
fn maps_remote_status_from_counts() {
    assert_eq!(remote_status_from_counts(0, 0), "up_to_date");
    assert_eq!(remote_status_from_counts(0, 2), "behind");
    assert_eq!(remote_status_from_counts(2, 0), "ahead");
    assert_eq!(remote_status_from_counts(2, 3), "diverged");
}

#[test]
fn remote_status_helper_keeps_counts_and_message() {
    let status = remote_status(
        "dirty",
        Some("origin/main".to_string()),
        1,
        2,
        Some("msg".to_string()),
    );

    assert_eq!(status.status, "dirty");
    assert_eq!(status.upstream.as_deref(), Some("origin/main"));
    assert_eq!(status.ahead, 1);
    assert_eq!(status.behind, 2);
    assert_eq!(status.message.as_deref(), Some("msg"));
}
