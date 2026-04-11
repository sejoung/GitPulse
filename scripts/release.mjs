#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const bumpType = process.argv[2];
if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: node scripts/release.mjs <patch|minor|major>");
  process.exit(1);
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

// 1. Read current version from package.json
const pkgPath = resolve(root, "package.json");
const pkg = readJson(pkgPath);
const oldVersion = pkg.version;
const newVersion = bumpVersion(oldVersion, bumpType);

console.log(`Bumping version: ${oldVersion} -> ${newVersion}`);

// 2. Update package.json
pkg.version = newVersion;
writeJson(pkgPath, pkg);
console.log("  Updated package.json");

// 3. Update src-tauri/tauri.conf.json
const tauriConfPath = resolve(root, "src-tauri", "tauri.conf.json");
const tauriConf = readJson(tauriConfPath);
tauriConf.version = newVersion;
writeJson(tauriConfPath, tauriConf);
console.log("  Updated src-tauri/tauri.conf.json");

// 4. Update src-tauri/Cargo.toml
const cargoPath = resolve(root, "src-tauri", "Cargo.toml");
let cargo = readFileSync(cargoPath, "utf-8");
cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${newVersion}"`);
writeFileSync(cargoPath, cargo);
console.log("  Updated src-tauri/Cargo.toml");

// 5. Update Cargo.lock
try {
  execSync("cargo generate-lockfile", {
    cwd: resolve(root, "src-tauri"),
    stdio: "inherit",
  });
  console.log("  Updated Cargo.lock");
} catch {
  console.warn("  Warning: Failed to update Cargo.lock");
}

// 6. Git commit and tag
const tag = `v${newVersion}`;
execSync("git add -A", { cwd: root, stdio: "inherit" });
execSync(`git commit -m "release: ${tag}"`, { cwd: root, stdio: "inherit" });
execSync(`git tag ${tag}`, { cwd: root, stdio: "inherit" });

console.log(`\nReleased ${tag}`);
console.log(`Run 'git push && git push origin ${tag}' to publish.`);
