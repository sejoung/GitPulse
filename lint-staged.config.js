export default {
  "*.{ts,tsx,js,jsx,json,css,md,html}": "prettier --write",
  "src-tauri/**/*.rs": () => "cargo fmt --manifest-path src-tauri/Cargo.toml",
};
