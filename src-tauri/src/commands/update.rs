use crate::models::update::{AppUpdateInfo, GitHubRelease};

const GITHUB_RELEASES_URL: &str = "https://api.github.com/repos/sejoung/GitPulse/releases/latest";
const DOWNLOAD_URL: &str = "https://sejoung.github.io/GitPulse/";

fn compare_versions(current: &str, latest: &str) -> bool {
    let parse =
        |v: &str| -> Vec<u32> { v.split('.').filter_map(|part| part.parse().ok()).collect() };
    let c = parse(current);
    let l = parse(latest);

    for i in 0..c.len().max(l.len()) {
        let cv = c.get(i).copied().unwrap_or(0);
        let lv = l.get(i).copied().unwrap_or(0);
        if lv > cv {
            return true;
        }
        if lv < cv {
            return false;
        }
    }
    false
}

fn current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

async fn fetch_latest_version() -> Result<String, String> {
    let client = reqwest::Client::new();
    let release: GitHubRelease = client
        .get(GITHUB_RELEASES_URL)
        .header(
            "User-Agent",
            format!("GitPulse/{}", env!("CARGO_PKG_VERSION")),
        )
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(release.tag_name.trim_start_matches('v').to_string())
}

#[tauri::command]
pub async fn check_app_update() -> AppUpdateInfo {
    let current = current_version();

    match fetch_latest_version().await {
        Ok(latest) => {
            let has_update = compare_versions(&current, &latest);
            AppUpdateInfo {
                current_version: current,
                latest_version: latest,
                has_update,
                download_url: DOWNLOAD_URL.to_string(),
            }
        }
        Err(_) => AppUpdateInfo {
            current_version: current.clone(),
            latest_version: current,
            has_update: false,
            download_url: DOWNLOAD_URL.to_string(),
        },
    }
}

#[cfg(test)]
mod update_tests {
    use super::*;

    #[test]
    fn detects_newer_patch() {
        assert!(compare_versions("0.1.3", "0.1.4"));
    }

    #[test]
    fn detects_newer_minor() {
        assert!(compare_versions("0.1.4", "0.2.0"));
    }

    #[test]
    fn detects_newer_major() {
        assert!(compare_versions("0.1.4", "1.0.0"));
    }

    #[test]
    fn same_version_is_not_newer() {
        assert!(!compare_versions("0.1.4", "0.1.4"));
    }

    #[test]
    fn older_version_is_not_newer() {
        assert!(!compare_versions("0.2.0", "0.1.4"));
    }
}
