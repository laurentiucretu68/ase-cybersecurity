#!/usr/bin/env node

const { loadStudentInstance } = require("./helpers");

function main() {
  const instance = loadStudentInstance();
  const patchCode =
    instance &&
    instance.challenge2 &&
    instance.challenge2.contractPatchCode !== undefined
      ? Number(instance.challenge2.contractPatchCode)
      : 0;
  const patchChecksum = (patchCode % 97) + 3;

  console.log(String(patchCode));
  console.log(String(patchChecksum));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
