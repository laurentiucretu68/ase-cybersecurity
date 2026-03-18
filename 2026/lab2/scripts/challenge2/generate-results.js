#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  PROJECT_ROOT,
  loadStudentInstance,
  loadAttackResults,
  buildChallenge2Result
} = require("./helpers");

const DEFAULT_OUTPUT = path.join("student", "submissions", "challenge2-results.json");

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const nextValue = argv[i + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = nextValue;
    i += 1;
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputRelative = args.out || DEFAULT_OUTPUT;
  const outputPath = path.resolve(PROJECT_ROOT, outputRelative);

  const instance = loadStudentInstance();
  const attackData = loadAttackResults();
  const result = buildChallenge2Result(instance, attackData);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`Saved: ${path.relative(PROJECT_ROOT, outputPath)}`);
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
