#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {
    force: false,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);

    if (key === "force") {
      args.force = true;
      continue;
    }

    if (key === "dry-run") {
      args.dryRun = true;
      continue;
    }

    if (key === "help") {
      args.help = true;
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-batch-instances.js --file <students.txt> [--salt <secret>] [--force] [--dry-run]

Input file format:
  - One student identifier per line (email, matricol, username)
  - Empty lines and lines starting with # are ignored
  - CSV is also accepted; first column is treated as student id

Examples:
  node scripts/generate-batch-instances.js --file students.txt --salt "course-secret" --force
  node scripts/generate-batch-instances.js --file students.csv --dry-run
`);
}

function parseStudentList(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const ids = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const candidate = trimmed.includes(",") ? trimmed.split(",")[0].trim() : trimmed;

    if (!candidate) {
      return;
    }

    ids.push(candidate);
  });

  return [...new Set(ids)];
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.file) {
    throw new Error("Missing --file argument.");
  }

  const filePath = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const studentIds = parseStudentList(filePath);
  if (!studentIds.length) {
    throw new Error("No valid student identifiers found in input file.");
  }

  console.log(`Found ${studentIds.length} student identifiers.`);

  if (args.dryRun) {
    studentIds.forEach((studentId, index) => {
      console.log(`${String(index + 1).padStart(3, " ")}. ${studentId}`);
    });
    console.log("Dry run complete.");
    return;
  }

  const generatorPath = path.resolve(__dirname, "generate-instance.js");

  studentIds.forEach((studentId, index) => {
    const cmdArgs = [generatorPath, "--student-id", studentId];

    if (args.salt) {
      cmdArgs.push("--salt", args.salt);
    }

    if (args.force) {
      cmdArgs.push("--force");
    }

    console.log(`[${index + 1}/${studentIds.length}] Generating instance for ${studentId}`);

    const result = spawnSync(process.execPath, cmdArgs, {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit"
    });

    if (result.status !== 0) {
      throw new Error(`Generation failed for ${studentId}`);
    }
  });

  console.log("Batch generation complete.");
}

main();
