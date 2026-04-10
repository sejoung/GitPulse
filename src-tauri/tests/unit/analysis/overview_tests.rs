use super::*;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[test]
fn period_helpers_map_analysis_windows() {
    assert_eq!(since_arg(Some("3m")), Some("3 months ago"));
    assert_eq!(since_arg(Some("6m")), Some("6 months ago"));
    assert_eq!(since_arg(Some("1y")), Some("1 year ago"));
    assert_eq!(month_window(Some("3m")), 3);
    assert_eq!(month_window(Some("6m")), 6);
    assert_eq!(month_window(Some("1y")), 12);
}

#[test]
fn shift_month_handles_year_boundaries() {
    assert_eq!(shift_month(2026, 1, -1), "2025-12");
    assert_eq!(shift_month(2026, 12, 1), "2027-01");
    assert_eq!(shift_month(2026, 4, -11), "2025-05");
}

#[test]
fn excluded_path_matches_directory_prefixes_only() {
    let excluded_paths = split_csv(Some("dist/, node_modules, target/"));

    assert!(is_excluded_path("dist/main.js", &excluded_paths));
    assert!(is_excluded_path(
        "node_modules/react/index.js",
        &excluded_paths
    ));
    assert!(is_excluded_path("target", &excluded_paths));
    assert!(!is_excluded_path("src/dist/main.js", &excluded_paths));
    assert!(!is_excluded_path("dist-file.js", &excluded_paths));
}

#[test]
fn keyword_pattern_escapes_regex_metacharacters() {
    assert_eq!(
        keyword_pattern(Some("fix+, bug?"), &["fallback"]),
        "fix\\+|bug\\?"
    );
    assert_eq!(keyword_pattern(Some(""), &["fix", "bug"]), "fix|bug");
}

#[test]
fn emergency_patterns_fallback_when_all_rows_are_blank() {
    let patterns = normalized_emergency_patterns(Some(&[EmergencyPatternConfig {
        pattern: "  ".to_string(),
        signal: "Ignored".to_string(),
    }]));

    assert_eq!(patterns.len(), 4);
    assert_eq!(patterns[0].pattern, "revert");
}

#[test]
fn emergency_pattern_aliases_share_one_count() {
    let output = "revert: first change\nthis commit reverted the api\nhotfix release";

    assert_eq!(count_pattern_aliases(output, "revert, reverted"), 2);
    assert_eq!(count_pattern_aliases(output, "hotfix"), 1);
}

#[test]
fn parse_month_rejects_invalid_months() {
    assert_eq!(parse_month("2026-04"), Some((2026, 4)));
    assert_eq!(parse_month("2026-13"), None);
    assert_eq!(parse_month("not-a-month"), None);
}

#[test]
fn activity_analysis_returns_only_the_requested_month_window() {
    let repo = init_temp_repo("activity-window");
    commit_empty(&repo, "work in february", "2099-02-15T00:00:00+0000");
    commit_empty(&repo, "work in march", "2099-03-15T00:00:00+0000");
    commit_empty(&repo, "work in april", "2099-04-15T00:00:00+0000");

    let rows = build_activity_analysis(repo.to_str(), Some("3m"));

    assert_eq!(rows.len(), 3);
    assert_eq!(rows[0].month, "2099-02");
    assert_eq!(rows[1].month, "2099-03");
    assert_eq!(rows[2].month, "2099-04");
    assert_eq!(rows.iter().map(|row| row.commits).sum::<u32>(), 3);

    let _ = fs::remove_dir_all(repo);
}

#[test]
fn delivery_risk_analysis_counts_custom_aliases_and_keeps_signal() {
    let repo = init_temp_repo("delivery-risk");
    for index in 0..7 {
        commit_empty(
            &repo,
            &format!("urgent release fix {index}"),
            "2099-04-15T00:00:00+0000",
        );
    }

    let patterns = vec![EmergencyPatternConfig {
        pattern: "hotfix, urgent".to_string(),
        signal: "Release pressure".to_string(),
    }];
    let rows = build_delivery_risk_analysis(repo.to_str(), Some(&patterns));

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].event, "hotfix, urgent");
    assert_eq!(rows[0].count, 7);
    assert_eq!(rows[0].signal, "Release pressure");
    assert_eq!(rows[0].risk, "risky");

    let _ = fs::remove_dir_all(repo);
}

#[test]
fn hotspot_commit_details_returns_recent_file_commits_with_keyword_matches() {
    let repo = init_temp_repo("hotspot-commits");
    commit_file(
        &repo,
        "src/app.rs",
        "first change",
        "refactor app shell",
        "2099-03-15T00:00:00+0000",
    );
    commit_file(
        &repo,
        "src/app.rs",
        "bug fix",
        "fix app shell bug",
        "2099-04-15T00:00:00+0000",
    );
    commit_file(
        &repo,
        "src/other.rs",
        "other change",
        "fix unrelated file",
        "2099-04-16T00:00:00+0000",
    );

    let rows = build_hotspot_commit_details(
        repo.to_str(),
        Some("3m"),
        Some("fix, bug"),
        Some("src/app.rs"),
    );

    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].subject, "fix app shell bug");
    assert!(rows[0].matches_bug_keyword);
    assert_eq!(rows[1].subject, "refactor app shell");
    assert!(!rows[1].matches_bug_keyword);

    let _ = fs::remove_dir_all(repo);
}

#[test]
fn settings_match_preview_counts_keywords_exclusions_and_patterns() {
    let repo = init_temp_repo("settings-preview");
    commit_file(
        &repo,
        "src/app.rs",
        "first change",
        "fix app shell bug",
        "2099-03-15T00:00:00+0000",
    );
    commit_file(
        &repo,
        "dist/index.js",
        "bundle output",
        "build dist bundle",
        "2099-04-10T00:00:00+0000",
    );
    commit_file(
        &repo,
        "src/app.rs",
        "rollback",
        "reverted app shell",
        "2099-04-18T00:00:00+0000",
    );

    let preview = build_settings_match_preview(
        repo.to_str(),
        Some("3m"),
        Some("dist/, target/"),
        Some("fix, bug"),
        Some(&[EmergencyPatternConfig {
            pattern: "revert, reverted".to_string(),
            signal: "Rollback activity".to_string(),
        }]),
    );

    assert_eq!(preview.analyzed_commit_count, 3);
    assert_eq!(preview.bug_keyword_commit_count, 1);
    assert_eq!(preview.excluded_file_count, 1);
    assert_eq!(preview.excluded_files, vec!["dist/index.js".to_string()]);
    assert_eq!(preview.emergency_matches.len(), 1);
    assert_eq!(preview.emergency_matches[0].pattern, "revert, reverted");
    assert_eq!(preview.emergency_matches[0].signal, "Rollback activity");
    assert_eq!(preview.emergency_matches[0].count, 1);

    let _ = fs::remove_dir_all(repo);
}

fn init_temp_repo(name: &str) -> PathBuf {
    let repo = std::env::temp_dir().join(format!("gitpulse-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&repo);
    fs::create_dir_all(&repo).expect("create temp git repo");
    run_repo_git(&repo, &["init"]);
    run_repo_git(&repo, &["config", "user.email", "tests@gitpulse.local"]);
    run_repo_git(&repo, &["config", "user.name", "GitPulse Tests"]);
    repo
}

fn commit_file(repo: &PathBuf, path: &str, contents: &str, message: &str, date: &str) {
    let file_path = repo.join(path);
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).expect("create file parent");
    }
    fs::write(&file_path, contents).expect("write test file");
    run_repo_git(repo, &["add", path]);
    commit_empty(repo, message, date);
}

fn commit_empty(repo: &PathBuf, message: &str, date: &str) {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(["commit", "--allow-empty", "-m", message])
        .env("GIT_AUTHOR_DATE", date)
        .env("GIT_COMMITTER_DATE", date)
        .output()
        .expect("run git commit");

    assert!(
        output.status.success(),
        "git commit failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

fn run_repo_git(repo: &PathBuf, args: &[&str]) {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(args)
        .output()
        .expect("run git");

    assert!(
        output.status.success(),
        "git {:?} failed: {}",
        args,
        String::from_utf8_lossy(&output.stderr)
    );
}
