use std::collections::HashMap;
use std::path::Path;
use std::process::Command;

use crate::models::cochange::{CoChangeAnalysis, CoChangePair};

#[allow(unused_mut)]
fn git_command() -> Command {
    let mut cmd = Command::new("git");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    cmd
}

fn is_git_workspace(workspace_path: &str) -> bool {
    Path::new(workspace_path).exists()
        && git_command()
            .args(["-C", workspace_path, "rev-parse", "--is-inside-work-tree"])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
}

fn run_git(workspace_path: &str, args: &[&str]) -> Option<String> {
    let output = git_command()
        .arg("-C")
        .arg(workspace_path)
        .args(args)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

fn since_arg(period: Option<&str>) -> Option<&'static str> {
    match period {
        Some("3m") | Some("30d") => Some("3 months ago"),
        Some("6m") | Some("90d") => Some("6 months ago"),
        Some("1y") | Some("all") => Some("1 year ago"),
        _ => None,
    }
}

fn split_csv(value: Option<&str>) -> Vec<String> {
    value
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .map(ToString::to_string)
        .collect()
}

fn is_excluded_path(path: &str, excluded_paths: &[String]) -> bool {
    excluded_paths.iter().any(|excluded_path| {
        let normalized = excluded_path.trim_end_matches('/');

        !normalized.is_empty()
            && (path == normalized || path.starts_with(&format!("{normalized}/")))
    })
}

pub fn build_cochange_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
    excluded_paths: Option<&str>,
    min_coupling: Option<u32>,
) -> CoChangeAnalysis {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return CoChangeAnalysis {
            pairs: Vec::new(),
            analyzed_commit_count: 0,
            unique_file_count: 0,
        };
    };

    let excluded_paths = split_csv(excluded_paths);
    let min_coupling = min_coupling.unwrap_or(3);

    let mut args = vec!["log", "--format=format:%n---", "--name-only"];
    let since;

    if let Some(period_since) = since_arg(period).or(Some("1 year ago")) {
        since = format!("--since={period_since}");
        args.push(&since);
    }

    let Some(output) = run_git(workspace_path, &args) else {
        return CoChangeAnalysis {
            pairs: Vec::new(),
            analyzed_commit_count: 0,
            unique_file_count: 0,
        };
    };

    let mut pair_counts: HashMap<(String, String), u32> = HashMap::new();
    let mut file_counts: HashMap<String, u32> = HashMap::new();
    let mut commit_count: u32 = 0;

    for commit_block in output.split("---") {
        let files: Vec<&str> = commit_block
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .filter(|line| !is_excluded_path(line, &excluded_paths))
            .collect();

        if files.len() < 2 {
            if !files.is_empty() {
                commit_count += 1;
                for file in &files {
                    *file_counts.entry(file.to_string()).or_insert(0) += 1;
                }
            }
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

    let unique_file_count = file_counts.len() as u32;

    let mut pairs: Vec<CoChangePair> = pair_counts
        .into_iter()
        .filter(|(_, count)| *count >= min_coupling)
        .map(|((file_a, file_b), co_change_count)| {
            let max_individual = file_counts
                .get(&file_a)
                .copied()
                .unwrap_or(1)
                .max(file_counts.get(&file_b).copied().unwrap_or(1))
                .max(1);
            let coupling_ratio = co_change_count as f64 / max_individual as f64;
            let signal = if coupling_ratio >= 0.8 {
                "tight"
            } else if coupling_ratio >= 0.5 {
                "moderate"
            } else {
                "loose"
            };

            CoChangePair {
                file_a,
                file_b,
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
    pairs.truncate(30);

    CoChangeAnalysis {
        pairs,
        analyzed_commit_count: commit_count,
        unique_file_count,
    }
}

#[cfg(test)]
#[path = "../../tests/unit/analysis/cochange_tests.rs"]
mod cochange_tests;
