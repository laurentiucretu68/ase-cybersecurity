#!/usr/bin/env node

const { loadChallenge1Data, calculateTotalGasFeeWei } = require("./helpers");

function main() {
  const challengeData = loadChallenge1Data();
  const totalGasFeeWei = calculateTotalGasFeeWei(challengeData.transfers);
  console.log(totalGasFeeWei.toString());
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
