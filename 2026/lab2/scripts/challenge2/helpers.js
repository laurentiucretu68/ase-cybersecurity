const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const INSTANCE_PATH = path.join(PROJECT_ROOT, "student", "instance.json");
const ATTACK_RESULTS_PATH = path.join(PROJECT_ROOT, "deployments", "attack-results.json");

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

function loadStudentInstance() {
  assertFileExists(INSTANCE_PATH, "npm run init:student -- --student-number <1-100>");
  return readJson(INSTANCE_PATH);
}

function loadAttackResults() {
  assertFileExists(ATTACK_RESULTS_PATH, "npm run attack");
  const attackData = readJson(ATTACK_RESULTS_PATH);

  if (!attackData.attackGasFeeEth) {
    throw new Error(
      "Invalid deployments/attack-results.json: missing attackGasFeeEth. Run npm run attack again."
    );
  }

  return attackData;
}

function buildChallenge2Result(instance, attackData, q1Token, q2Token) {
  return {
    challenge: "challenge2-reentrancy",
    studentId: instance.studentId,
    instanceId: instance.instanceId,
    answers: {
      q1VulnerabilityPattern: q1Token,
      q2RemediationPattern: q2Token,
      q3VaultAddress: attackData.vaultAddress,
      q4InitialVaultBalanceEth: attackData.initialVaultBalanceEth,
      q5AttackerContractAddress: attackData.attackerAddress,
      q6FinalVaultBalanceEth: attackData.finalVaultBalanceEth,
      q7AttackGasFeeEth: attackData.attackGasFeeEth
    }
  };
}

module.exports = {
  PROJECT_ROOT,
  loadStudentInstance,
  loadAttackResults,
  buildChallenge2Result
};
