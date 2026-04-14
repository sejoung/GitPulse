use std::collections::HashMap;

use crate::git::{is_excluded_path, is_git_workspace, run_git, split_csv};
use crate::models::staleness::{StaleFile, StalenessAnalysis};

const DEFAULT_STALE_DAYS: u32 = 180;
const CRITICAL_MULTIPLIER: u32 = 2;
const MAX_STALE_FILES: usize = 50;

fn empty_analysis() -> StalenessAnalysis {
    StalenessAnalysis {
        files: Vec::new(),
        tracked_file_count: 0,
        stale_file_count: 0,
    }
}

fn days_between(from: &str, to: &str) -> u32 {
    let parse = |s: &str| -> Option<i64> {
        let mut parts = s.split('-');
        let y = parts.next()?.parse::<i64>().ok()?;
        let m = parts.next()?.parse::<i64>().ok()?;
        let d = parts.next()?.parse::<i64>().ok()?;
        Some(y * 365 + m * 30 + d)
    };

    match (parse(from), parse(to)) {
        (Some(a), Some(b)) if b >= a => (b - a) as u32,
        _ => 0,
    }
}

pub fn build_staleness_analysis(
    workspace_path: Option<&str>,
    excluded_paths: Option<&str>,
    stale_threshold_days: Option<u32>,
) -> StalenessAnalysis {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return empty_analysis();
    };

    let excluded_paths = split_csv(excluded_paths);
    let threshold = stale_threshold_days.unwrap_or(DEFAULT_STALE_DAYS);

    let Some(today_output) = run_git(
        workspace_path,
        &["log", "-1", "--format=%ad", "--date=short"],
    ) else {
        return empty_analysis();
    };
    let today = today_output.lines().next().unwrap_or("").trim().to_string();

    if today.is_empty() {
        return empty_analysis();
    }

    let Some(output) = run_git(
        workspace_path,
        &[
            "log",
            "--format=%ad%x1f%H",
            "--date=short",
            "--name-only",
            "--diff-filter=ACMR",
        ],
    ) else {
        return empty_analysis();
    };

    let mut file_last_modified: HashMap<String, String> = HashMap::new();
    let mut current_date = String::new();

    for line in output.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() {
            continue;
        }

        if let Some((date, _sha)) = trimmed.split_once('\x1f') {
            current_date = date.to_string();
            continue;
        }

        if current_date.is_empty() || is_excluded_path(trimmed, &excluded_paths) {
            continue;
        }

        file_last_modified
            .entry(trimmed.to_string())
            .or_insert_with(|| current_date.clone());
    }

    let tracked_file_count = file_last_modified.len() as u32;

    let mut files: Vec<StaleFile> = file_last_modified
        .into_iter()
        .filter_map(|(path, last_modified)| {
            let days_since = days_between(&last_modified, &today);

            if days_since < threshold {
                return None;
            }

            let staleness = if days_since >= threshold * CRITICAL_MULTIPLIER {
                "critical"
            } else {
                "stale"
            };

            Some(StaleFile {
                path,
                last_modified,
                days_since,
                staleness: staleness.to_string(),
            })
        })
        .collect();

    files.sort_by(|a, b| b.days_since.cmp(&a.days_since));
    let stale_file_count = files.len() as u32;
    files.truncate(MAX_STALE_FILES);

    StalenessAnalysis {
        files,
        tracked_file_count,
        stale_file_count,
    }
}

#[cfg(test)]
#[path = "../../tests/unit/analysis/staleness_tests.rs"]
mod staleness_tests;
