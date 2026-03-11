import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "tests"];
const files = ["vite.config.js"];
const supportedExtensions = new Set([".js", ".mjs"]);

const collectFiles = (directory) => {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      collectFiles(filePath);
      continue;
    }

    const extension = filePath.slice(filePath.lastIndexOf("."));
    if (supportedExtensions.has(extension)) {
      files.push(filePath);
    }
  }
};

for (const root of roots) {
  collectFiles(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`syntax ok: ${files.length} files`);
