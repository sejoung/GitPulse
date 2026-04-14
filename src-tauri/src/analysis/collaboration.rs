use std::collections::{HashMap, HashSet};

use crate::git::{is_excluded_path, is_git_workspace, run_git, since_arg, split_csv};
use crate::models::collaboration::{CollaborationAnalysis, CollaborationPair};

const MAX_COLLABORATION_PAIRS: usize = 30;
const STRONG_THRESHOLD: u32 = 5;
const MODERATE_THRESHOLD: u32 = 2;

fn empty_analysis() -> CollaborationAnalysis {
    CollaborationAnalysis {
        pairs: Vec::new(),
        contributor_count: 0,
        analyzed_file_count: 0,
    }
}

pub fn build_collaboration_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
    excluded_paths: Option<&str>,
) -> CollaborationAnalysis {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return empty_analysis();
    };

    let excluded_paths = split_csv(excluded_paths);

    let mut args = vec!["log", "--format=%an%x1f%H", "--name-only", "--no-merges"];
    let since;

    if let Some(period_since) = since_arg(period).or(Some("1 year ago")) {
        since = format!("--since={period_since}");
        args.push(&since);
    }

    let Some(output) = run_git(workspace_path, &args) else {
        return empty_analysis();
    };

    let mut file_authors: HashMap<String, HashSet<String>> = HashMap::new();
    let mut current_author = String::new();

    for line in output.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() {
            continue;
        }

        if let Some((author, _sha)) = trimmed.split_once('\x1f') {
            current_author = author.to_string();
            continue;
        }

        if current_author.is_empty() || is_excluded_path(trimmed, &excluded_paths) {
            continue;
        }

        file_authors
            .entry(trimmed.to_string())
            .or_default()
            .insert(current_author.clone());
    }

    let analyzed_file_count = file_authors.len() as u32;
    let mut all_authors: HashSet<String> = HashSet::new();
    let mut pair_counts: HashMap<(String, String), u32> = HashMap::new();

    for authors in file_authors.values() {
        let authors_vec: Vec<&String> = authors.iter().collect();

        for author in &authors_vec {
            all_authors.insert((*author).clone());
        }

        for i in 0..authors_vec.len() {
            for j in (i + 1)..authors_vec.len() {
                let (a, b) = if authors_vec[i] <= authors_vec[j] {
                    (authors_vec[i].clone(), authors_vec[j].clone())
                } else {
                    (authors_vec[j].clone(), authors_vec[i].clone())
                };

                *pair_counts.entry((a, b)).or_insert(0) += 1;
            }
        }
    }

    let mut pairs: Vec<CollaborationPair> = pair_counts
        .into_iter()
        .map(|((author_a, author_b), shared_file_count)| {
            let strength = if shared_file_count >= STRONG_THRESHOLD {
                "strong"
            } else if shared_file_count >= MODERATE_THRESHOLD {
                "moderate"
            } else {
                "weak"
            };

            CollaborationPair {
                author_a,
                author_b,
                shared_file_count,
                strength: strength.to_string(),
            }
        })
        .collect();

    pairs.sort_by(|a, b| b.shared_file_count.cmp(&a.shared_file_count));
    pairs.truncate(MAX_COLLABORATION_PAIRS);

    CollaborationAnalysis {
        pairs,
        contributor_count: all_authors.len() as u32,
        analyzed_file_count,
    }
}

#[cfg(test)]
#[path = "../../tests/unit/analysis/collaboration_tests.rs"]
mod collaboration_tests;
