use std::collections::HashSet;
use std::path::Path;
use std::process::Command;

use crate::models::overview::{GitBranch, GitRemoteStatus, GitRepositoryState};

#[allow(unused_mut)]
fn git_command() -> Command {
    let mut cmd = Command::new("git");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
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

fn run_git(workspace_path: &str, args: &[&str]) -> Result<String, String> {
    let output = git_command()
        .arg("-C")
        .arg(workspace_path)
        .args(args)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn current_branch(workspace_path: &str) -> Option<String> {
    run_git(workspace_path, &["symbolic-ref", "--short", "HEAD"]).ok()
}

fn head_sha(workspace_path: &str) -> Option<String> {
    run_git(workspace_path, &["rev-parse", "HEAD"]).ok()
}

fn short_head_sha(workspace_path: &str) -> Option<String> {
    run_git(workspace_path, &["rev-parse", "--short", "HEAD"]).ok()
}

fn working_tree_dirty(workspace_path: &str) -> bool {
    run_git(workspace_path, &["status", "--porcelain"])
        .map(|output| !output.trim().is_empty())
        .unwrap_or(false)
}

fn local_branch_exists(workspace_path: &str, branch_name: &str) -> bool {
    run_git(
        workspace_path,
        &[
            "rev-parse",
            "--verify",
            &format!("refs/heads/{branch_name}"),
        ],
    )
    .is_ok()
}

fn remote_branch_exists(workspace_path: &str, branch_name: &str) -> bool {
    if !branch_name.contains('/') || branch_name.ends_with("/HEAD") {
        return false;
    }

    run_git(
        workspace_path,
        &[
            "rev-parse",
            "--verify",
            &format!("refs/remotes/{branch_name}"),
        ],
    )
    .is_ok()
}

fn local_name_from_remote(branch_name: &str) -> Option<&str> {
    branch_name
        .split_once('/')
        .map(|(_, local_name)| local_name)
}

fn parse_ahead_behind(output: &str) -> Option<(u32, u32)> {
    let mut parts = output.split_whitespace();
    let ahead = parts.next()?.parse().ok()?;
    let behind = parts.next()?.parse().ok()?;

    Some((ahead, behind))
}

fn remote_status_from_counts(ahead: u32, behind: u32) -> String {
    match (ahead, behind) {
        (0, 0) => "up_to_date",
        (0, _) => "behind",
        (_, 0) => "ahead",
        _ => "diverged",
    }
    .to_string()
}

fn remote_status(
    status: &str,
    upstream: Option<String>,
    ahead: u32,
    behind: u32,
    message: Option<String>,
) -> GitRemoteStatus {
    GitRemoteStatus {
        status: status.to_string(),
        upstream,
        ahead,
        behind,
        message,
    }
}

fn branches_from_ref_output(output: &str, current_branch: Option<&str>) -> Vec<GitBranch> {
    let local_names: HashSet<String> = output
        .lines()
        .filter_map(|line| {
            let (ref_name, short_name) = line.split_once('|')?;

            if ref_name.starts_with("refs/heads/") {
                Some(short_name.to_string())
            } else {
                None
            }
        })
        .collect();

    output
        .lines()
        .filter_map(|line| {
            let (ref_name, name) = line.trim().split_once('|')?;

            if name.is_empty() || name.ends_with("/HEAD") || ref_name.ends_with("/HEAD") {
                return None;
            }

            let is_remote = ref_name.starts_with("refs/remotes/");
            let local_name = if is_remote {
                local_name_from_remote(name).unwrap_or(name)
            } else {
                name
            };

            if is_remote && local_names.contains(local_name) {
                return None;
            }

            Some(GitBranch {
                name: name.to_string(),
                label: if is_remote {
                    format!("{name} (remote)")
                } else {
                    name.to_string()
                },
                kind: if is_remote { "remote" } else { "local" }.to_string(),
                current: current_branch == Some(local_name),
            })
        })
        .collect()
}

#[tauri::command]
pub async fn list_git_branches(workspace_path: Option<String>) -> Result<Vec<GitBranch>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
            return Vec::new();
        };
        let current_branch = current_branch(&workspace_path);
        let output = run_git(
            &workspace_path,
            &[
                "for-each-ref",
                "--format=%(refname)|%(refname:short)",
                "refs/heads",
                "refs/remotes",
            ],
        )
        .unwrap_or_default();
        branches_from_ref_output(&output, current_branch.as_deref())
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn checkout_git_branch(
    workspace_path: Option<String>,
    branch_name: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        checkout_git_branch_blocking(workspace_path, branch_name)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn get_git_repository_state(
    workspace_path: Option<String>,
) -> Result<GitRepositoryState, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
            return Err("Select a Git workspace first.".to_string());
        };

        Ok(GitRepositoryState {
            branch: current_branch(&workspace_path),
            head_sha: head_sha(&workspace_path),
            short_head_sha: short_head_sha(&workspace_path),
            dirty: working_tree_dirty(&workspace_path),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

fn checkout_git_branch_blocking(
    workspace_path: Option<String>,
    branch_name: String,
) -> Result<String, String> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Err("Select a Git workspace first.".to_string());
    };
    let branch_name = branch_name.trim();

    if branch_name.is_empty() {
        return Err("Select a branch first.".to_string());
    }

    if local_branch_exists(&workspace_path, branch_name) {
        run_git(&workspace_path, &["checkout", branch_name])?;
        return Ok(branch_name.to_string());
    }

    if remote_branch_exists(&workspace_path, branch_name) {
        let local_name = local_name_from_remote(branch_name).unwrap_or(branch_name);

        if local_branch_exists(&workspace_path, local_name) {
            run_git(&workspace_path, &["checkout", local_name])?;
        } else {
            run_git(&workspace_path, &["checkout", "--track", branch_name])?;
        }

        return Ok(local_name.to_string());
    }

    Err(format!("Branch not found: {branch_name}"))
}

#[tauri::command]
pub async fn check_git_remote_status(
    workspace_path: Option<String>,
) -> Result<GitRemoteStatus, String> {
    tauri::async_runtime::spawn_blocking(move || check_git_remote_status_blocking(workspace_path))
        .await
        .map_err(|error| error.to_string())?
}

fn check_git_remote_status_blocking(
    workspace_path: Option<String>,
) -> Result<GitRemoteStatus, String> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Err("Select a Git workspace first.".to_string());
    };

    if let Err(message) = run_git(&workspace_path, &["fetch", "--prune"]) {
        return Ok(remote_status("fetch_failed", None, 0, 0, Some(message)));
    }

    let upstream = match run_git(
        &workspace_path,
        &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    ) {
        Ok(upstream) => upstream,
        Err(message) => {
            return Ok(remote_status("no_upstream", None, 0, 0, Some(message)));
        }
    };

    let counts = run_git(
        &workspace_path,
        &["rev-list", "--left-right", "--count", "HEAD...@{u}"],
    )?;
    let (ahead, behind) = parse_ahead_behind(&counts)
        .ok_or_else(|| format!("Could not parse remote status: {counts}"))?;

    Ok(remote_status(
        &remote_status_from_counts(ahead, behind),
        Some(upstream),
        ahead,
        behind,
        None,
    ))
}

#[tauri::command]
pub async fn pull_git_remote_updates(
    workspace_path: Option<String>,
) -> Result<GitRemoteStatus, String> {
    tauri::async_runtime::spawn_blocking(move || pull_git_remote_updates_blocking(workspace_path))
        .await
        .map_err(|error| error.to_string())?
}

fn pull_git_remote_updates_blocking(
    workspace_path: Option<String>,
) -> Result<GitRemoteStatus, String> {
    let Some(workspace_path) = workspace_path.filter(|path| is_git_workspace(path)) else {
        return Err("Select a Git workspace first.".to_string());
    };

    if working_tree_dirty(&workspace_path) {
        return Ok(remote_status(
            "dirty",
            None,
            0,
            0,
            Some("Commit or stash local changes before pulling.".to_string()),
        ));
    }

    let status = check_git_remote_status_blocking(Some(workspace_path.clone()))?;
    match status.status.as_str() {
        "behind" => {
            if let Err(message) = run_git(&workspace_path, &["pull", "--ff-only"]) {
                return Ok(remote_status(
                    "pull_failed",
                    status.upstream,
                    status.ahead,
                    status.behind,
                    Some(message),
                ));
            }

            check_git_remote_status_blocking(Some(workspace_path))
        }
        "up_to_date" => Ok(status),
        "ahead" | "diverged" | "no_upstream" | "fetch_failed" => Ok(status),
        _ => Ok(status),
    }
}

#[cfg(test)]
#[path = "../../tests/unit/commands/branch_tests.rs"]
mod branch_tests;
