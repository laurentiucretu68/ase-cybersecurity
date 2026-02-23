#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {
    keepExpected: false,
    dryRun: false
  };

  argv.forEach((token) => {
    if (token === "--keep-expected") {
      args.keepExpected = true;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
    }
    if (token === "--help") {
      args.help = true;
    }
  });

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/clean-generated.js [--keep-expected] [--dry-run]

Options:
  --keep-expected   Keep instructor/expected/*.json files
  --dry-run         Print what would be removed without deleting
  --help            Show this message
`);
}

function removeFile(targetPath, dryRun) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  if (dryRun) {
    console.log(`[dry-run] remove ${targetPath}`);
    return true;
  }

  fs.rmSync(targetPath, { force: true });
  console.log(`removed ${targetPath}`);
  return true;
}

function removeMatching(dirPath, matcher, dryRun) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let count = 0;
  fs.readdirSync(dirPath).forEach((entry) => {
    if (!matcher(entry)) {
      return;
    }

    const absolute = path.join(dirPath, entry);
    if (removeFile(absolute, dryRun)) {
      count += 1;
    }
  });

  return count;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const root = path.resolve(__dirname, "..");

  const directFiles = [
    ".env.backup",
    ".bash_history_fake",
    ".secret_config.json",
    "challenge1-data.json",
    path.join("student", "instance.json"),
    path.join("student", "instance.env"),
    path.join("student", "manifest.sig")
  ];

  let removedCount = 0;

  directFiles.forEach((relative) => {
    const absolute = path.join(root, relative);
    if (removeFile(absolute, args.dryRun)) {
      removedCount += 1;
    }
  });

  removedCount += removeMatching(
    path.join(root, "deployments"),
    (entry) => entry.endsWith(".json"),
    args.dryRun
  );

  if (!args.keepExpected) {
    removedCount += removeMatching(
      path.join(root, "instructor", "expected"),
      (entry) => entry.endsWith(".json"),
      args.dryRun
    );
  }

  if (!removedCount) {
    console.log("No generated artifacts found.");
    return;
  }

  console.log(
    args.dryRun
      ? `Dry-run complete. ${removedCount} files would be removed.`
      : `Cleanup complete. ${removedCount} files removed.`
  );
}

main();
