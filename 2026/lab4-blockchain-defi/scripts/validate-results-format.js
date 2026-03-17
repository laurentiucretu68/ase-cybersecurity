#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_REGEX = /^0x[a-fA-F0-9]*$/;
const UINT_STRING_REGEX = /^[0-9]+$/;
const ETH_4DP_REGEX = /^[0-9]+(\.[0-9]{4})$/;
const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TOKEN_REGEX = /^[a-z][a-z0-9-]*$/;

function parseArgs(argv) {
  return {
    challenge1: argv.includes("--challenge1"),
    challenge2: argv.includes("--challenge2"),
    help: argv.includes("--help")
  };
}

function printHelp() {
  console.log(`Usage:
  npm run validate:results
  npm run validate:results -- --challenge1
  npm run validate:results -- --challenge2

Validates the JSON submission format for Challenge 1 and Challenge 2.
`);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function pushError(errors, field, message) {
  errors.push(`${field}: ${message}`);
}

function validateCommon(root, errors, challengeName) {
  if (!isObject(root)) {
    pushError(errors, "root", "must be a JSON object");
    return;
  }

  if (root.challenge !== challengeName) {
    pushError(errors, "challenge", `must be '${challengeName}'`);
  }

  if (!isNonEmptyString(root.studentId)) {
    pushError(errors, "studentId", "must be a non-empty string");
  }

  if (!isNonEmptyString(root.instanceId)) {
    pushError(errors, "instanceId", "must be a non-empty string");
  }

  if (!isObject(root.answers)) {
    pushError(errors, "answers", "must be an object");
  }
}

function validateChallenge1(root) {
  const errors = [];
  validateCommon(root, errors, "challenge1-forensics");
  if (!isObject(root.answers)) {
    return errors;
  }

  const a = root.answers;

  if (!isNonEmptyString(a.initialTransactionHash) || !TX_HASH_REGEX.test(a.initialTransactionHash)) {
    pushError(errors, "answers.initialTransactionHash", "must be a valid tx hash");
  }

  if (!Array.isArray(a.hopTransactionHashes) || a.hopTransactionHashes.length === 0) {
    pushError(errors, "answers.hopTransactionHashes", "must be a non-empty array");
  } else {
    a.hopTransactionHashes.forEach((hash, index) => {
      if (!isNonEmptyString(hash) || !TX_HASH_REGEX.test(hash)) {
        pushError(
          errors,
          `answers.hopTransactionHashes[${index}]`,
          "must be a valid tx hash"
        );
      }
    });
  }

  if (!isNonEmptyString(a.firstDestinationAddress) || !ADDRESS_REGEX.test(a.firstDestinationAddress)) {
    pushError(errors, "answers.firstDestinationAddress", "must be a valid address");
  }

  if (!isNonNegativeInteger(a.intermediateHopCount)) {
    pushError(errors, "answers.intermediateHopCount", "must be a non-negative integer");
  }

  if (!isNonEmptyString(a.finalAddress) || !ADDRESS_REGEX.test(a.finalAddress)) {
    pushError(errors, "answers.finalAddress", "must be a valid address");
  }

  if (!isNonNegativeInteger(a.totalTimeSeconds)) {
    pushError(errors, "answers.totalTimeSeconds", "must be a non-negative integer");
  }

  if (!isNonEmptyString(a.totalGasFeeWei) || !UINT_STRING_REGEX.test(a.totalGasFeeWei)) {
    pushError(errors, "answers.totalGasFeeWei", "must be an unsigned integer string");
  }

  if (!isNonEmptyString(a.initialInputHex) || !HEX_REGEX.test(a.initialInputHex)) {
    pushError(errors, "answers.initialInputHex", "must be a valid hex string");
  }

  if (!isNonEmptyString(a.decodedMessage)) {
    pushError(errors, "answers.decodedMessage", "must be a non-empty string");
  }

  return errors;
}

function validateChallenge2(root) {
  const errors = [];
  validateCommon(root, errors, "challenge2-reentrancy");
  if (!isObject(root.answers)) {
    return errors;
  }

  const a = root.answers;

  if (!isNonEmptyString(a.q1VulnerableFunction) || !IDENTIFIER_REGEX.test(a.q1VulnerableFunction)) {
    pushError(errors, "answers.q1VulnerableFunction", "must be a function-like identifier");
  }

  if (
    !isNonEmptyString(a.q2SecondVulnerableFunction) ||
    !IDENTIFIER_REGEX.test(a.q2SecondVulnerableFunction)
  ) {
    pushError(
      errors,
      "answers.q2SecondVulnerableFunction",
      "must be a function-like identifier"
    );
  }

  if (!isNonEmptyString(a.q3ExternalCallLine) || !a.q3ExternalCallLine.includes("call")) {
    pushError(errors, "answers.q3ExternalCallLine", "must be a non-empty Solidity call line");
  }

  if (!Array.isArray(a.q4PostCallStateUpdates) || a.q4PostCallStateUpdates.length !== 2) {
    pushError(errors, "answers.q4PostCallStateUpdates", "must be an array with 2 lines");
  } else {
    if (!isNonEmptyString(a.q4PostCallStateUpdates[0])) {
      pushError(errors, "answers.q4PostCallStateUpdates[0]", "must be a non-empty string");
    }
    if (!isNonEmptyString(a.q4PostCallStateUpdates[1])) {
      pushError(errors, "answers.q4PostCallStateUpdates[1]", "must be a non-empty string");
    }
  }

  if (!isNonEmptyString(a.q5VulnerabilityPattern) || !TOKEN_REGEX.test(a.q5VulnerabilityPattern)) {
    pushError(errors, "answers.q5VulnerabilityPattern", "must be a lowercase token");
  }

  if (!isNonEmptyString(a.q6VaultAddress) || !ADDRESS_REGEX.test(a.q6VaultAddress)) {
    pushError(errors, "answers.q6VaultAddress", "must be a valid address");
  }

  if (!isNonEmptyString(a.q7InitialVaultBalanceEth) || !ETH_4DP_REGEX.test(a.q7InitialVaultBalanceEth)) {
    pushError(errors, "answers.q7InitialVaultBalanceEth", "must be numeric string with 4 decimals");
  }

  if (!isNonEmptyString(a.q8AttackerContractAddress) || !ADDRESS_REGEX.test(a.q8AttackerContractAddress)) {
    pushError(errors, "answers.q8AttackerContractAddress", "must be a valid address");
  }

  if (!isNonEmptyString(a.q9FinalVaultBalanceEth) || !ETH_4DP_REGEX.test(a.q9FinalVaultBalanceEth)) {
    pushError(errors, "answers.q9FinalVaultBalanceEth", "must be numeric string with 4 decimals");
  }

  if (!isNonEmptyString(a.q10RemediationPattern) || !TOKEN_REGEX.test(a.q10RemediationPattern)) {
    pushError(
      errors,
      "answers.q10RemediationPattern",
      "must be a lowercase token"
    );
  }

  return errors;
}

function validateFile(filePath, validator, label) {
  if (!fs.existsSync(filePath)) {
    return [`missing file: ${filePath}`];
  }

  try {
    const json = readJson(filePath);
    return validator(json);
  } catch (error) {
    return [`invalid JSON: ${filePath} (${error.message})`];
  }
}

function printResult(label, filePath, errors) {
  if (!errors.length) {
    console.log(`[OK] ${label}: ${filePath}`);
    return;
  }

  console.log(`[FAIL] ${label}: ${filePath}`);
  errors.forEach((error) => {
    console.log(`  - ${error}`);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const onlyC1 = args.challenge1 && !args.challenge2;
  const onlyC2 = args.challenge2 && !args.challenge1;

  const root = path.resolve(__dirname, "..");
  const c1Path = path.join(root, "student", "submissions", "challenge1-results.json");
  const c2Path = path.join(root, "student", "submissions", "challenge2-results.json");

  let hasFailures = false;

  if (!onlyC2) {
    const errors = validateFile(c1Path, validateChallenge1, "Challenge 1");
    printResult("Challenge 1", c1Path, errors);
    hasFailures = hasFailures || errors.length > 0;
  }

  if (!onlyC1) {
    const errors = validateFile(c2Path, validateChallenge2, "Challenge 2");
    printResult("Challenge 2", c2Path, errors);
    hasFailures = hasFailures || errors.length > 0;
  }

  if (hasFailures) {
    console.log("\nSubmission format validation failed.");
    process.exit(1);
  }

  console.log("\nSubmission format validation passed.");
}

main();
