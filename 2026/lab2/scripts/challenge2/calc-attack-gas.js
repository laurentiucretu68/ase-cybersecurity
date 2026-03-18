#!/usr/bin/env node

const { loadAttackResults } = require("./helpers");

function main() {
  const attackData = loadAttackResults();
  console.log(String(attackData.attackGasFeeEth));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
