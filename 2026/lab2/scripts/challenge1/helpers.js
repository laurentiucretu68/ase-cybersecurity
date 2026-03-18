const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const CHALLENGE1_DATA_PATH = path.join(PROJECT_ROOT, "deployments", "challenge1-data.json");
const INSTANCE_PATH = path.join(PROJECT_ROOT, "student", "instance.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertFileExists(filePath, hintCommand) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `${path.relative(PROJECT_ROOT, filePath)} not found.\nRun first: ${hintCommand}`
    );
  }
}

function toBigInt(value, fieldName) {
  try {
    return BigInt(String(value));
  } catch (error) {
    throw new Error(`Invalid bigint for ${fieldName}: ${value}`);
  }
}

function toSafeInt(value, fieldName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer for ${fieldName}: ${value}`);
  }
  return parsed;
}

function normalizeTransfers(data) {
  if (!data || !Array.isArray(data.transfers) || data.transfers.length === 0) {
    throw new Error("Invalid challenge1-data.json: missing non-empty transfers array.");
  }
  return data.transfers;
}

function loadChallenge1Data() {
  assertFileExists(CHALLENGE1_DATA_PATH, "npm run deploy:challenge1");
  const data = readJson(CHALLENGE1_DATA_PATH);
  normalizeTransfers(data);
  return data;
}

function loadStudentInstance() {
  assertFileExists(INSTANCE_PATH, "npm run init:student -- --student-number <1-100>");
  return readJson(INSTANCE_PATH);
}

function calculateTotalGasFeeWei(transfers) {
  return transfers.reduce((accumulator, transfer, index) => {
    const gasUsed = toBigInt(transfer.gasUsed, `transfers[${index}].gasUsed`);
    const gasPriceWei = toBigInt(transfer.gasPriceWei, `transfers[${index}].gasPriceWei`);
    return accumulator + gasUsed * gasPriceWei;
  }, 0n);
}

function calculateTotalTimeSeconds(transfers) {
  if (transfers.length <= 1) {
    return 0;
  }

  const firstTimestamp = toSafeInt(transfers[0].timestamp, "transfers[0].timestamp");
  const lastTimestamp = toSafeInt(
    transfers[transfers.length - 1].timestamp,
    `transfers[${transfers.length - 1}].timestamp`
  );

  return Math.max(0, lastTimestamp - firstTimestamp);
}

function buildChallenge1Result(challengeData, instance) {
  const transfers = normalizeTransfers(challengeData);
  const firstTransfer = transfers[0];
  const lastTransfer = transfers[transfers.length - 1];
  const totalGasFeeWei = calculateTotalGasFeeWei(transfers);
  const totalTimeSeconds = calculateTotalTimeSeconds(transfers);

  return {
    challenge: "challenge1-forensics",
    studentId: instance.studentId,
    instanceId: instance.instanceId,
    answers: {
      initialTransactionHash: challengeData.initialTransactionHash,
      hopTransactionHashes: transfers.map((transfer) => transfer.txHash),
      firstDestinationAddress: firstTransfer.to,
      intermediateHopCount: Math.max(0, transfers.length - 2),
      finalAddress: lastTransfer.to,
      totalTimeSeconds,
      totalGasFeeWei: totalGasFeeWei.toString(),
      initialInputHex: challengeData.secretMessageHex,
      decodedMessage: challengeData.secretMessage
    }
  };
}

module.exports = {
  PROJECT_ROOT,
  loadChallenge1Data,
  loadStudentInstance,
  calculateTotalGasFeeWei,
  calculateTotalTimeSeconds,
  buildChallenge1Result
};
