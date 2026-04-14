use std::path::Path;
use std::process::Command;

#[allow(unused_mut)]
pub fn git_command() -> Command {
    let mut cmd = Command::new("git");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    cmd
}

pub fn is_git_workspace(workspace_path: &str) -> bool {
    Path::new(workspace_path).exists()
        && git_command()
            .args(["-C", workspace_path, "rev-parse", "--is-inside-work-tree"])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
}

/// Runs a git command and returns stdout. Returns `None` on failure.
pub fn run_git(workspace_path: &str, args: &[&str]) -> Option<String> {
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

/// Runs a git command and returns stdout trimmed. Returns stderr as `Err` on failure.
pub fn run_git_strict(workspace_path: &str, args: &[&str]) -> Result<String, String> {
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

pub fn since_arg(period: Option<&str>) -> Option<&'static str> {
    match period {
        Some("3m") | Some("30d") => Some("3 months ago"),
        Some("6m") | Some("90d") => Some("6 months ago"),
        Some("1y") | Some("all") => Some("1 year ago"),
        _ => None,
    }
}

pub fn split_csv(value: Option<&str>) -> Vec<String> {
    value
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .map(ToString::to_string)
        .collect()
}

pub fn is_excluded_path(path: &str, excluded_paths: &[String]) -> bool {
    excluded_paths.iter().any(|excluded_path| {
        let normalized = excluded_path.trim_end_matches('/');

        !normalized.is_empty()
            && (path == normalized
                || (path.starts_with(normalized)
                    && path.as_bytes().get(normalized.len()) == Some(&b'/')))
    })
}
