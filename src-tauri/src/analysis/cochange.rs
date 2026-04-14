use std::collections::HashMap;

use crate::git::{is_excluded_path, is_git_workspace, run_git, since_arg, split_csv};
use crate::models::cochange::{CoChangeAnalysis, CoChangePair};

const DEFAULT_MIN_COUPLING: u32 = 3;
const COUPLING_TIGHT_THRESHOLD: f64 = 0.8;
const COUPLING_MODERATE_THRESHOLD: f64 = 0.5;
const MAX_COCHANGE_PAIRS: usize = 30;

struct CommitStats {
    pair_counts: HashMap<(String, String), u32>,
    file_counts: HashMap<String, u32>,
    commit_count: u32,
}

fn collect_commit_stats(output: &str, excluded_paths: &[String]) -> CommitStats {
    let mut pair_counts: HashMap<(String, String), u32> = HashMap::new();
    let mut file_counts: HashMap<String, u32> = HashMap::new();
    let mut commit_count: u32 = 0;

    for commit_block in output.split("---") {
        let files: Vec<&str> = commit_block
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .filter(|line| !is_excluded_path(line, excluded_paths))
            .collect();

        if files.is_empty() {
            continue;
        }

        commit_count += 1;

        for file in &files {
            *file_counts.entry(file.to_string()).or_insert(0) += 1;
        }

        for i in 0..files.len() {
            for j in (i + 1)..files.len() {
                let (a, b) = if files[i] <= files[j] {
                    (files[i].to_string(), files[j].to_string())
                } else {
                    (files[j].to_string(), files[i].to_string())
                };

                *pair_counts.entry((a, b)).or_insert(0) += 1;
            }
        }
    }

    CommitStats {
        pair_counts,
        file_counts,
        commit_count,
    }
}

fn build_pairs(stats: &CommitStats, min_coupling: u32) -> Vec<CoChangePair> {
    let mut pairs: Vec<CoChangePair> = stats
        .pair_counts
        .iter()
        .filter(|(_, count)| **count >= min_coupling)
        .map(|((file_a, file_b), &co_change_count)| {
            let max_individual = stats
                .file_counts
                .get(file_a)
                .copied()
                .unwrap_or(1)
                .max(stats.file_counts.get(file_b).copied().unwrap_or(1))
                .max(1);
            let coupling_ratio = co_change_count as f64 / max_individual as f64;
            let signal = if coupling_ratio >= COUPLING_TIGHT_THRESHOLD {
                "tight"
            } else if coupling_ratio >= COUPLING_MODERATE_THRESHOLD {
                "moderate"
            } else {
                "loose"
            };

            CoChangePair {
                file_a: file_a.clone(),
                file_b: file_b.clone(),
                co_change_count,
                coupling_ratio: (coupling_ratio * 100.0).round() / 100.0,
                signal: signal.to_string(),
            }
        })
        .collect();

    pairs.sort_by(|a, b| {
        b.co_change_count
            .cmp(&a.co_change_count)
            .then_with(|| b.coupling_ratio.total_cmp(&a.coupling_ratio))
    });
    pairs.truncate(MAX_COCHANGE_PAIRS);
    pairs
}

fn empty_analysis() -> CoChangeAnalysis {
    CoChangeAnalysis {
        pairs: Vec::new(),
        analyzed_commit_count: 0,
        unique_file_count: 0,
    }
}

pub fn build_cochange_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
    excluded_paths: Option<&str>,
    min_coupling: Option<u32>,
) -> CoChangeAnalysis {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return empty_analysis();
    };

    let excluded_paths = split_csv(excluded_paths);
    let min_coupling = min_coupling.unwrap_or(DEFAULT_MIN_COUPLING);

    let mut args = vec!["log", "--format=format:%n---", "--name-only"];
    let since;

    if let Some(period_since) = since_arg(period).or(Some("1 year ago")) {
        since = format!("--since={period_since}");
        args.push(&since);
    }

    let Some(output) = run_git(workspace_path, &args) else {
        return empty_analysis();
    };

    let stats = collect_commit_stats(&output, &excluded_paths);
    let pairs = build_pairs(&stats, min_coupling);

    CoChangeAnalysis {
        pairs,
        analyzed_commit_count: stats.commit_count,
        unique_file_count: stats.file_counts.len() as u32,
    }
}

#[cfg(test)]
#[path = "../../tests/unit/analysis/cochange_tests.rs"]
mod cochange_tests;
