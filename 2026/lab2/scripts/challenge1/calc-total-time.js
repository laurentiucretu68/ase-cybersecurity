#!/usr/bin/env node

const { loadChallenge1Data, calculateTotalTimeSeconds } = require("./helpers");

function main() {
  const challengeData = loadChallenge1Data();
  const totalTimeSeconds = calculateTotalTimeSeconds(challengeData.transfers);
  console.log(String(totalTimeSeconds));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
