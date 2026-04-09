use std::collections::{BTreeMap, HashMap};
use std::path::Path;
use std::process::Command;

use crate::models::overview::{
    ActivityPoint, DeliveryEvent, EmergencyPatternConfig, HotspotFile, OverviewAnalysis,
    OwnershipContributor,
};

fn is_git_workspace(workspace_path: &str) -> bool {
    Path::new(workspace_path).exists()
        && Command::new("git")
            .args(["-C", workspace_path, "rev-parse", "--is-inside-work-tree"])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
}

fn run_git(workspace_path: &str, args: &[&str]) -> Option<String> {
    let output = Command::new("git")
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

fn month_window(period: Option<&str>) -> i32 {
    match period {
        Some("3m") | Some("30d") => 3,
        Some("6m") | Some("90d") => 6,
        _ => 12,
    }
}

fn workspace_name(workspace_path: &str) -> String {
    Path::new(workspace_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(workspace_path)
        .to_string()
}

fn parse_month(month: &str) -> Option<(i32, i32)> {
    let (year, month) = month.split_once('-')?;
    let year = year.parse::<i32>().ok()?;
    let month = month.parse::<i32>().ok()?;

    if (1..=12).contains(&month) {
        Some((year, month))
    } else {
        None
    }
}

fn shift_month(year: i32, month: i32, offset: i32) -> String {
    let zero_based = year * 12 + (month - 1) + offset;
    let shifted_year = zero_based.div_euclid(12);
    let shifted_month = zero_based.rem_euclid(12) + 1;

    format!("{shifted_year:04}-{shifted_month:02}")
}

fn split_keywords(keywords: Option<&str>, fallback: &[&str]) -> Vec<String> {
    let parsed: Vec<String> = keywords
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|keyword| !keyword.is_empty())
        .map(ToString::to_string)
        .collect();

    if parsed.is_empty() {
        fallback.iter().map(|keyword| keyword.to_string()).collect()
    } else {
        parsed
    }
}

fn escape_git_regex(keyword: &str) -> String {
    keyword.chars().fold(String::new(), |mut pattern, value| {
        if matches!(
            value,
            '.' | '^' | '$' | '*' | '+' | '?' | '(' | ')' | '[' | ']' | '{' | '}' | '\\' | '|'
        ) {
            pattern.push('\\');
        }

        pattern.push(value);
        pattern
    })
}

fn keyword_pattern(keywords: Option<&str>, fallback: &[&str]) -> String {
    split_keywords(keywords, fallback)
        .iter()
        .map(|keyword| escape_git_regex(keyword))
        .collect::<Vec<_>>()
        .join("|")
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

fn default_emergency_patterns() -> Vec<EmergencyPatternConfig> {
    vec![
        EmergencyPatternConfig {
            pattern: "revert".to_string(),
            signal: "Normal recovery".to_string(),
        },
        EmergencyPatternConfig {
            pattern: "hotfix".to_string(),
            signal: "Watch release pressure".to_string(),
        },
        EmergencyPatternConfig {
            pattern: "emergency".to_string(),
            signal: "Emergency response".to_string(),
        },
        EmergencyPatternConfig {
            pattern: "rollback".to_string(),
            signal: "Rollback pattern".to_string(),
        },
    ]
}

fn normalized_emergency_patterns(
    emergency_patterns: Option<&[EmergencyPatternConfig]>,
) -> Vec<EmergencyPatternConfig> {
    let patterns: Vec<EmergencyPatternConfig> = emergency_patterns
        .unwrap_or(&[])
        .iter()
        .filter_map(|item| {
            let pattern = item.pattern.trim();

            if pattern.is_empty() {
                None
            } else {
                Some(EmergencyPatternConfig {
                    pattern: pattern.to_string(),
                    signal: item.signal.trim().to_string(),
                })
            }
        })
        .collect();

    if patterns.is_empty() {
        default_emergency_patterns()
    } else {
        patterns
    }
}

fn pattern_aliases(pattern: &str) -> Vec<String> {
    pattern
        .split(',')
        .map(str::trim)
        .filter(|pattern| !pattern.is_empty())
        .map(|pattern| pattern.to_lowercase())
        .collect()
}

fn count_pattern_aliases(output: &str, pattern: &str) -> u32 {
    let aliases = pattern_aliases(pattern);

    output
        .lines()
        .filter(|line| aliases.iter().any(|pattern| line.contains(pattern)))
        .count() as u32
}

fn count_commits(workspace_path: &str, period: Option<&str>) -> u32 {
    let mut args = vec!["rev-list", "--count", "HEAD"];
    let since;

    if let Some(period_since) = since_arg(period) {
        since = format!("--since={period_since}");
        args.push(&since);
    }

    run_git(workspace_path, &args)
        .and_then(|output| output.trim().parse::<u32>().ok())
        .unwrap_or(0)
}

fn collect_file_counts(
    workspace_path: &str,
    period: Option<&str>,
    excluded_paths: &[String],
    grep: Option<&str>,
) -> HashMap<String, u32> {
    let mut args = vec!["log", "--format=format:", "--name-only"];
    let since;
    let grep_arg;

    if let Some(period_since) = since_arg(period).or(Some("1 year ago")) {
        since = format!("--since={period_since}");
        args.push(&since);
    }

    if let Some(grep_pattern) = grep {
        grep_arg = format!("--grep={grep_pattern}");
        args.push("-i");
        args.push("-E");
        args.push(&grep_arg);
    }

    let mut counts = HashMap::new();
    let Some(output) = run_git(workspace_path, &args) else {
        return counts;
    };

    for line in output.lines() {
        let path = line.trim();
        if path.is_empty() {
            continue;
        }
        if is_excluded_path(path, excluded_paths) {
            continue;
        }

        *counts.entry(path.to_string()).or_insert(0) += 1;
    }

    counts
}

pub fn build_hotspots_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
    excluded_paths: Option<&str>,
    bug_keywords: Option<&str>,
) -> Vec<HotspotFile> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Vec::new();
    };

    let excluded_paths = split_csv(excluded_paths);
    let change_counts = collect_file_counts(workspace_path, period, &excluded_paths, None);
    let bug_pattern = keyword_pattern(bug_keywords, &["fix", "bug", "broken"]);
    let fix_counts =
        collect_file_counts(workspace_path, period, &excluded_paths, Some(&bug_pattern));
    let mut rows: Vec<HotspotFile> = change_counts
        .into_iter()
        .map(|(path, changes)| {
            let fixes = fix_counts.get(&path).copied().unwrap_or(0);
            let risk = if changes >= 20 && fixes >= 5 {
                "risky"
            } else if changes >= 10 || fixes >= 3 {
                "watch"
            } else {
                "healthy"
            };

            HotspotFile {
                path,
                changes,
                fixes,
                risk: risk.to_string(),
            }
        })
        .collect();

    rows.sort_by(|a, b| {
        b.changes
            .cmp(&a.changes)
            .then_with(|| b.fixes.cmp(&a.fixes))
    });
    rows.truncate(20);
    rows
}

pub fn build_ownership_analysis(workspace_path: Option<&str>) -> Vec<OwnershipContributor> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Vec::new();
    };

    let Some(output) = run_git(workspace_path, &["shortlog", "-sn", "--no-merges", "HEAD"]) else {
        return Vec::new();
    };
    let total: u32 = output
        .lines()
        .filter_map(|line| line.split_whitespace().next()?.parse::<u32>().ok())
        .sum();

    let active_output = run_git(
        workspace_path,
        &[
            "shortlog",
            "-sn",
            "--no-merges",
            "--since=6 months ago",
            "HEAD",
        ],
    )
    .unwrap_or_default();
    let active_authors: Vec<String> = active_output
        .lines()
        .filter_map(|line| {
            let (_, name) = line.trim().split_once(char::is_whitespace)?;
            Some(name.trim().to_string())
        })
        .collect();

    output
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            let (count, name) = trimmed.split_once(char::is_whitespace)?;
            let commits = count.parse::<u32>().ok()?;
            let share = if total == 0 {
                0.0
            } else {
                (commits as f64 / total as f64) * 100.0
            };
            let recent_key = if active_authors.iter().any(|author| author == name.trim()) {
                "status.active"
            } else {
                "status.quiet"
            };
            let risk = if share >= 60.0 { "watch" } else { "healthy" };

            Some(OwnershipContributor {
                name: name.trim().to_string(),
                commits,
                share: format!("{share:.0}%"),
                recent_key: recent_key.to_string(),
                risk: risk.to_string(),
            })
        })
        .take(20)
        .collect()
}

pub fn build_activity_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
) -> Vec<ActivityPoint> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Vec::new();
    };

    let since = since_arg(period).unwrap_or("1 year ago");
    let since = format!("--since={since}");
    let Some(output) = run_git(
        workspace_path,
        &["log", "--format=%ad", "--date=format:%Y-%m", &since],
    ) else {
        return Vec::new();
    };

    let mut by_month = BTreeMap::new();
    for month in output
        .lines()
        .map(str::trim)
        .filter(|month| !month.is_empty())
    {
        *by_month.entry(month.to_string()).or_insert(0) += 1;
    }

    let Some((latest_year, latest_month)) = by_month
        .keys()
        .next_back()
        .and_then(|month| parse_month(month))
    else {
        return Vec::new();
    };

    let month_window = month_window(period);

    (1 - month_window..=0)
        .map(|offset| {
            let month = shift_month(latest_year, latest_month, offset);
            let commits = by_month.get(&month).copied().unwrap_or(0);

            ActivityPoint { month, commits }
        })
        .collect()
}

pub fn build_delivery_risk_analysis(
    workspace_path: Option<&str>,
    emergency_patterns: Option<&[EmergencyPatternConfig]>,
) -> Vec<DeliveryEvent> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Vec::new();
    };

    let Some(output) = run_git(workspace_path, &["log", "--oneline", "--since=1 year ago"]) else {
        return Vec::new();
    };
    let lower_output = output.to_lowercase();
    let patterns = normalized_emergency_patterns(emergency_patterns);

    patterns
        .iter()
        .map(|event| {
            let aliases = pattern_aliases(&event.pattern);
            let count = count_pattern_aliases(&lower_output, &event.pattern);
            let risk = if count >= 6 {
                "risky"
            } else if count >= 2 {
                "watch"
            } else {
                "healthy"
            };
            let primary_pattern = aliases.first().map(String::as_str).unwrap_or("");
            let signal_key = match (primary_pattern, count) {
                ("rollback", 0) => "signals.noRollbackPattern",
                ("emergency", 0) => "signals.noEmergencyPattern",
                ("hotfix", count) if count >= 2 => "signals.watchReleasePressure",
                _ => "signals.normalRecovery",
            };

            DeliveryEvent {
                event: event.pattern.clone(),
                count,
                signal: event.signal.clone(),
                signal_key: signal_key.to_string(),
                risk: risk.to_string(),
            }
        })
        .collect()
}

pub fn build_overview_analysis(
    workspace_path: Option<&str>,
    period: Option<&str>,
    excluded_paths: Option<&str>,
    bug_keywords: Option<&str>,
    emergency_patterns: Option<&[EmergencyPatternConfig]>,
) -> OverviewAnalysis {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return OverviewAnalysis {
            repository_name: "No workspace selected".to_string(),
            total_commits: 0,
            hotspot_count: 0,
            contributor_count: 0,
            delivery_risk_level: "low".to_string(),
        };
    };

    let hotspots =
        build_hotspots_analysis(Some(workspace_path), period, excluded_paths, bug_keywords);
    let ownership = build_ownership_analysis(Some(workspace_path));
    let delivery = build_delivery_risk_analysis(Some(workspace_path), emergency_patterns);
    let delivery_risk_level = if delivery.iter().any(|row| row.risk == "risky") {
        "high"
    } else if delivery.iter().any(|row| row.risk == "watch") {
        "medium"
    } else {
        "low"
    };

    OverviewAnalysis {
        repository_name: workspace_name(workspace_path),
        total_commits: count_commits(workspace_path, period),
        hotspot_count: hotspots.len() as u32,
        contributor_count: ownership.len() as u32,
        delivery_risk_level: delivery_risk_level.to_string(),
    }
}

#[cfg(test)]
#[path = "../../tests/unit/analysis/overview_tests.rs"]
mod overview_tests;
