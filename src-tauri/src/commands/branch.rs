use std::collections::HashSet;
use std::path::Path;
use std::process::Command;

use crate::models::overview::GitBranch;

fn is_git_workspace(workspace_path: &str) -> bool {
    Path::new(workspace_path).exists()
        && Command::new("git")
            .args(["-C", workspace_path, "rev-parse", "--is-inside-work-tree"])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
}

fn run_git(workspace_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
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
pub fn list_git_branches(workspace_path: Option<String>) -> Vec<GitBranch> {
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

#[cfg(test)]
mod tests {
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
}
