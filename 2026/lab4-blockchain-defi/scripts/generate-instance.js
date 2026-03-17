#!/usr/bin/env node

const crypto = require("crypto");
const path = require("path");
const { ethers } = require("ethers");
const {
  DEFAULT_INSTANCE,
  deepClone,
  ensureDir,
  saveJson,
  writeInstanceFiles,
  INSTANCE_JSON_PATH,
  INSTANCE_ENV_PATH,
  INSTANCE_MANIFEST_PATH,
  INSTRUCTOR_EXPECTED_DIR,
  getAccountFromMnemonic
} = require("./lib/instance-config");

class DeterministicRng {
  constructor(seedHex) {
    this.seed = Buffer.from(seedHex, "hex");
    this.counter = 0;
    this.pool = Buffer.alloc(0);
  }

  refill() {
    const counterBuffer = Buffer.alloc(4);
    counterBuffer.writeUInt32BE(this.counter, 0);
    this.counter += 1;

    const hash = crypto
      .createHash("sha256")
      .update(this.seed)
      .update(counterBuffer)
      .digest();

    this.pool = Buffer.concat([this.pool, hash]);
  }

  bytes(length) {
    while (this.pool.length < length) {
      this.refill();
    }

    const chunk = this.pool.subarray(0, length);
    this.pool = this.pool.subarray(length);
    return chunk;
  }

  int(min, max) {
    if (max < min) {
      throw new Error(`Invalid range: ${min}..${max}`);
    }

    const span = max - min + 1;
    const value = this.bytes(4).readUInt32BE(0);
    return min + (value % span);
  }

  shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }

    return copy;
  }

  hex(bytesLength) {
    return this.bytes(bytesLength).toString("hex");
  }
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);

    if (["help", "force"].includes(key)) {
      args[key] = true;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-instance.js --student-id <id> [--salt <secret>] [--force]

Options:
  --student-id   Stable student identifier (email, username, matricol)
  --salt         Secret instructor salt. Falls back to LAB_INSTANCE_SALT env var.
  --force        Overwrite existing student instance files
  --help         Show this message
`);
}

function asEthStringFromTenths(tenths) {
  return (tenths / 10).toFixed(1);
}

function buildChallenge1(rng, instanceTag) {
  const companyAccountIndex = 0;
  const available = [];

  for (let i = 0; i < 10; i += 1) {
    if (i !== companyAccountIndex) {
      available.push(i);
    }
  }

  const transferCount = rng.int(3, 5);
  const hopAccountIndices = rng.shuffle(available).slice(0, transferCount);

  let amountTenths = rng.int(680, 940);
  const transferAmountsEth = [];

  for (let i = 0; i < transferCount; i += 1) {
    transferAmountsEth.push(asEthStringFromTenths(amountTenths));

    if (i < transferCount - 1) {
      amountTenths -= rng.int(1, 6);
      if (amountTenths < 200) {
        amountTenths = 200;
      }
    }
  }

  const message = `CTF-${instanceTag}: follow-the-money`;
  const messageHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));

  return {
    companyAccountIndex,
    hopAccountIndices,
    transferAmountsEth,
    message,
    messageHex
  };
}

function buildChallenge2(rng) {
  const depositorAccountIndices = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const initialDepositsEth = [
    String(rng.int(16, 36)),
    String(rng.int(14, 34)),
    String(rng.int(12, 30)),
    String(rng.int(15, 35))
  ];

  const attackDepositEth = asEthStringFromTenths(rng.int(8, 20));
  const maxAttacks = rng.int(3, 7);

  return {
    depositorAccountIndices,
    initialDepositsEth,
    attackDepositEth,
    maxAttacks
  };
}

function buildChallenge3(rng) {
  const adminAccountIndex = rng.int(1, 9);
  const others = [];

  for (let i = 0; i < 10; i += 1) {
    if (i !== adminAccountIndex) {
      others.push(i);
    }
  }

  const depositorAccountIndices = rng.shuffle(others).slice(0, 2);
  const initialDepositsEth = [String(rng.int(18, 42)), String(rng.int(15, 35))];

  const leakFiles = {
    envBackup: ".env.backup",
    shellHistory: ".bash_history_fake",
    secretConfig: ".secret_config.json"
  };

  const decoyPrivateKeys = [
    `0x${rng.hex(32)}`,
    `0x${rng.hex(32)}`,
    `0x${rng.hex(32)}`
  ];

  return {
    adminAccountIndex,
    depositorAccountIndices,
    initialDepositsEth,
    leakFiles,
    decoyPrivateKeys
  };
}

function buildEnvFile(instance) {
  return [
    "# Auto-generated per-student lab instance",
    "# Do not edit manually unless you know what you are doing",
    `LAB_INSTANCE_ID=${instance.instanceId}`,
    `LAB_STUDENT_ID=${instance.studentId}`,
    `LAB_CHAIN_ID=${instance.chain.chainId}`,
    `LAB_PORT=${instance.chain.port}`,
    `LAB_ACCOUNTS=${instance.chain.accounts}`,
    `LAB_DEFAULT_BALANCE_ETH=${instance.chain.defaultBalanceEth}`,
    `LAB_GAS_PRICE_WEI=${instance.chain.gasPriceWei}`,
    `LAB_GAS_LIMIT=${instance.chain.gasLimit}`,
    `LAB_MNEMONIC='${instance.chain.mnemonic}'`,
    ""
  ].join("\n");
}

function buildExpected(instance, salt) {
  const challenge1Addresses = instance.challenge1.hopAccountIndices.map((index) =>
    getAccountFromMnemonic(instance.chain.mnemonic, index).address
  );

  const adminAccount = getAccountFromMnemonic(
    instance.chain.mnemonic,
    instance.challenge3.adminAccountIndex
  );

  const manifestSignature = crypto
    .createHmac("sha256", salt)
    .update(JSON.stringify(instance))
    .digest("hex");

  return {
    version: instance.version,
    studentId: instance.studentId,
    instanceId: instance.instanceId,
    seedHash: instance.seedHash,
    generatedAt: instance.generatedAt,
    manifestSignature,
    expected: {
      chain: {
        chainId: instance.chain.chainId,
        port: instance.chain.port,
        gasPriceWei: instance.chain.gasPriceWei
      },
      challenge1: {
        companyAccountIndex: instance.challenge1.companyAccountIndex,
        hopAccountIndices: instance.challenge1.hopAccountIndices,
        hopAddresses: challenge1Addresses,
        finalDestinationAddress: challenge1Addresses[challenge1Addresses.length - 1],
        transferAmountsEth: instance.challenge1.transferAmountsEth,
        message: instance.challenge1.message,
        messageHex: instance.challenge1.messageHex
      },
      challenge2: {
        depositorAccountIndices: instance.challenge2.depositorAccountIndices,
        initialDepositsEth: instance.challenge2.initialDepositsEth,
        attackDepositEth: instance.challenge2.attackDepositEth,
        maxAttacks: instance.challenge2.maxAttacks
      },
      challenge3: {
        adminAccountIndex: instance.challenge3.adminAccountIndex,
        adminAddress: adminAccount.address,
        adminPrivateKey: adminAccount.privateKey,
        depositorAccountIndices: instance.challenge3.depositorAccountIndices,
        initialDepositsEth: instance.challenge3.initialDepositsEth,
        leakFiles: instance.challenge3.leakFiles
      },
      grading: {
        token: instance.grading.token
      }
    }
  };
}

function sanitizeStudentId(studentId) {
  const slug = studentId
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "student";
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const studentId = args["student-id"] || process.env.STUDENT_ID;
  if (!studentId) {
    throw new Error("Missing --student-id (or STUDENT_ID env var).");
  }

  const salt = args.salt || process.env.LAB_INSTANCE_SALT || "CHANGE_ME_INSTRUCTOR_SALT";
  if (salt === "CHANGE_ME_INSTRUCTOR_SALT") {
    console.warn(
      "[warn] Using default salt. Set LAB_INSTANCE_SALT for stronger per-course separation."
    );
  }

  const seedHash = crypto
    .createHash("sha256")
    .update(`${studentId}:${salt}`)
    .digest("hex");
  const rng = new DeterministicRng(seedHash);

  const mnemonicEntropy = rng.bytes(16);
  const mnemonic = ethers.utils.entropyToMnemonic(mnemonicEntropy);
  const instanceTag = seedHash.slice(0, 10).toUpperCase();

  const instance = deepClone(DEFAULT_INSTANCE);
  instance.version = 1;
  instance.studentId = studentId;
  instance.instanceId = `lab4-${seedHash.slice(0, 12)}`;
  instance.seedHash = seedHash;
  instance.generatedAt = new Date().toISOString();
  instance.chain.mnemonic = mnemonic;
  instance.challenge1 = buildChallenge1(rng, instanceTag);
  instance.challenge2 = buildChallenge2(rng);
  instance.challenge3 = buildChallenge3(rng);
  instance.grading = {
    token: `CTF-${seedHash.slice(0, 12).toUpperCase()}`
  };

  const canonical = JSON.stringify(instance);
  const manifest = crypto.createHmac("sha256", salt).update(canonical).digest("hex");
  const envFileContent = buildEnvFile(instance);

  if (!args.force && require("fs").existsSync(INSTANCE_JSON_PATH)) {
    throw new Error(
      `Instance already exists at ${INSTANCE_JSON_PATH}. Use --force to overwrite.`
    );
  }

  writeInstanceFiles({ instance, envFileContent, manifest });

  const expected = buildExpected(instance, salt);
  ensureDir(INSTRUCTOR_EXPECTED_DIR);

  const expectedPath = path.join(
    INSTRUCTOR_EXPECTED_DIR,
    `${sanitizeStudentId(studentId)}.json`
  );
  saveJson(expectedPath, expected);

  console.log("Instance generated successfully.");
  console.log(`student/instance.json: ${INSTANCE_JSON_PATH}`);
  console.log(`student/instance.env: ${INSTANCE_ENV_PATH}`);
  console.log(`student/manifest.sig: ${INSTANCE_MANIFEST_PATH}`);
  console.log(`instructor expected: ${expectedPath}`);
  console.log(`instance id: ${instance.instanceId}`);
  console.log(`grading token: ${instance.grading.token}`);
}

main();
