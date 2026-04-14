# GitPulse Feature Roadmap

## High Priority

- [x] **Version update notification** - Check GitHub Releases API on app launch, show badge when new version available
- [x] **Risk threshold customization** - Expose hotspot (20/5), delivery (6/2), ownership (60%) thresholds in Settings
- [x] **Incremental analysis** - Cache last analyzed HEAD SHA, only process new commits since then for large repos
- [x] **Keyboard shortcuts** - Page navigation (1-5), refresh analysis (R), open settings (S), select workspace (O)

## Medium Priority

- [x] **Co-change graph** - Detect files that frequently change together from existing git log data
- [x] **Contributor collaboration network** - Visualize who works on the same files, extending Ownership data
- [ ] **File staleness detection** - Flag files with no modifications beyond a configurable threshold
- [ ] **Trend anomaly detection** - Auto-detect unusual spikes/drops in monthly Activity using standard deviation

## Low Priority

- [ ] **GitHub/GitLab API integration** - Enrich commits with PR/issue metadata for deeper context
- [ ] **Slack/webhook notifications** - Alert on risk level changes for team workflows
- [ ] **PDF report export** - Generate formatted reports for management sharing
- [ ] **Dashboard widget customization** - Let users rearrange and select Overview layout widgets
