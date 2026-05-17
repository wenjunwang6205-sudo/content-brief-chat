/**
 * 打包腾讯云 Web 函数 zip：npm run package:scf → dist/content-brief-chat-scf.zip
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleDir = path.join(root, "dist", "scf-bundle");
const zipPath = path.join(root, "dist", "content-brief-chat-scf.zip");

const COPY_DIRS = ["api", "lib", "knowledge", "scf"];

const deployPkg = {
  name: "content-brief-chat-scf",
  private: true,
  type: "module",
  version: "0.3.0",
  main: "scf/server.mjs",
  scripts: {
    start: "node scf/server.mjs",
  },
  engines: { node: ">=18" },
  dependencies: {
    express: "^4.21.2",
  },
};

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

rmrf(path.join(root, "dist"));
fs.mkdirSync(bundleDir, { recursive: true });

for (const dir of COPY_DIRS) {
  copyDir(path.join(root, dir), path.join(bundleDir, dir));
}

const bootstrapSrc = path.join(root, "scf", "scf_bootstrap");
const bootstrapDest = path.join(bundleDir, "scf_bootstrap");
fs.copyFileSync(bootstrapSrc, bootstrapDest);
fs.chmodSync(bootstrapDest, 0o755);

fs.writeFileSync(
  path.join(bundleDir, "package.json"),
  `${JSON.stringify(deployPkg, null, 2)}\n`,
);

console.log("Installing dependencies (linux x64 for SCF)...");
execSync("npm install --omit=dev", {
  cwd: bundleDir,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_platform: "linux",
    npm_config_arch: "x64",
    npm_config_optional: "false",
  },
});

fs.mkdirSync(path.dirname(zipPath), { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execSync(`cd "${bundleDir}" && zip -rq "${zipPath}" .`, {
  stdio: "inherit",
});

const sizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
console.log(`\nDone: ${zipPath} (${sizeMb} MB)`);
console.log("Upload this zip in Tencent SCF console.");
