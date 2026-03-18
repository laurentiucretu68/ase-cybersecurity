#!/usr/bin/env node

const crypto = require("crypto");
const { ethers } = require("ethers");
const {
  DEFAULT_INSTANCE,
  deepClone,
  writeInstanceFiles,
  INSTANCE_JSON_PATH,
  INSTANCE_ENV_PATH,
  INSTANCE_MANIFEST_PATH
} = require("./lib/instance-config");

const DEFAULT_COHORT_SEED = "LAB4-COHORT-2026";

function buildFallbackChallenge1MessageCatalog() {
  const actions = ["urmareste", "traseaza", "mapeaza", "auditeaza", "verifica"];
  const adjectives = [
    "discret",
    "ascuns",
    "critic",
    "sigur",
    "rapid",
    "lent",
    "adanc",
    "clar",
    "criptat",
    "stratificat",
    "mobil",
    "stabil",
    "tacit",
    "activ",
    "pasiv",
    "strict",
    "secret",
    "focal",
    "local",
    "global"
  ];
  const targets = [
    "registrul",
    "portofelul",
    "podul",
    "seiful",
    "semnalul",
    "reteaua",
    "transferul",
    "ruta-cheii",
    "traseul",
    "predarea"
  ];

  const catalog = [];
  actions.forEach((action) => {
    adjectives.forEach((adjective) => {
      targets.forEach((target) => {
        catalog.push(`${action} ${adjective} ${target}`);
      });
    });
  });
  return catalog;
}

function loadChallenge1MessageCatalog() {
  if (process.env.LAB_FORCE_C1_CATALOG_FALLBACK === "1") {
    return buildFallbackChallenge1MessageCatalog();
  }

  try {
    const loaded = require("./lib/challenge1-message-catalog");
    const catalog = loaded && loaded.CHALLENGE1_MESSAGE_CATALOG;
    if (Array.isArray(catalog) && catalog.length > 0) {
      return catalog;
    }

    console.warn(
      "[warn] Invalid challenge1 message catalog export. Using built-in fallback catalog."
    );
    return buildFallbackChallenge1MessageCatalog();
  } catch (error) {
    const missingCatalogModule =
      error &&
      error.code === "MODULE_NOT_FOUND" &&
      String(error.message || "").includes("challenge1-message-catalog");

    if (!missingCatalogModule) {
      throw error;
    }

    console.warn(
      "[warn] Missing scripts/lib/challenge1-message-catalog.js. Using built-in fallback catalog."
    );
    return buildFallbackChallenge1MessageCatalog();
  }
}

const CHALLENGE1_MESSAGE_CATALOG = loadChallenge1MessageCatalog();

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
  node scripts/generate-instance.js --student-number <1-100> [--force]

Options:
  --student-number  Student number from lab roster (1-100). Generates a unique student id.
  --force        Overwrite existing student instance files
  --help         Show this message
`);
}

function parseStudentNumber(value) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || String(parsed) !== String(value).trim()) {
    throw new Error("Invalid --student-number. Expected an integer between 1 and 100.");
  }

  if (parsed < 1 || parsed > 100) {
    throw new Error("Invalid --student-number. Expected a value between 1 and 100.");
  }

  return parsed;
}

function deriveStudentIdFromNumber(studentNumber) {
  const padded = String(studentNumber).padStart(3, "0");
  const hash = crypto
    .createHash("sha256")
    .update(`lab4-student-number:${padded}`)
    .digest("hex")
    .slice(0, 8);

  return `student-${padded}-${hash}`;
}

function asEthStringFromTenths(tenths) {
  return (tenths / 10).toFixed(1);
}

function pickChallenge1Message(seedHash) {
  const catalogSize = BigInt(CHALLENGE1_MESSAGE_CATALOG.length);
  const selector = BigInt(`0x${seedHash.slice(0, 16)}`);
  const index = Number(selector % catalogSize);
  return {
    index,
    text: CHALLENGE1_MESSAGE_CATALOG[index]
  };
}

function buildHopAccountIndices(rng, availableIndices, transferCount) {
  if (!Array.isArray(availableIndices) || availableIndices.length === 0) {
    throw new Error("Challenge 1 requires at least one available hop account.");
  }

  const indices = [];
  const uniqueCandidates = rng.shuffle(availableIndices);

  for (let i = 0; i < uniqueCandidates.length && indices.length < transferCount; i += 1) {
    indices.push(uniqueCandidates[i]);
  }

  while (indices.length < transferCount) {
    const candidate = availableIndices[rng.int(0, availableIndices.length - 1)];
    const previous = indices[indices.length - 1];

    if (availableIndices.length > 1 && candidate === previous) {
      continue;
    }

    indices.push(candidate);
  }

  return indices;
}

function buildChallenge1(rng, catalogMessage) {
  const companyAccountIndex = 0;
  const available = [];
  const accountCount = Math.max(2, Number(DEFAULT_INSTANCE.chain.accounts) || 10);

  for (let i = 0; i < accountCount; i += 1) {
    if (i !== companyAccountIndex) {
      available.push(i);
    }
  }

  const transferCount = rng.int(3, 10);
  const hopAccountIndices = buildHopAccountIndices(rng, available, transferCount);

  let amountTenths = rng.int(300, 950);
  const transferAmountsEth = [];

  for (let i = 0; i < transferCount; i += 1) {
    transferAmountsEth.push(asEthStringFromTenths(amountTenths));

    if (i < transferCount - 1) {
      const maxDropTenths = transferCount > 6 ? 9 : 7;
      amountTenths -= rng.int(1, maxDropTenths);
      if (amountTenths < 50) {
        amountTenths = 50;
      }
    }
  }

  const message = catalogMessage.text;
  const messageHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));

  return {
    companyAccountIndex,
    hopAccountIndices,
    transferAmountsEth,
    messageCatalogIndex: catalogMessage.index,
    messageCatalogText: catalogMessage.text,
    message,
    messageHex
  };
}

function buildChallenge2(rng) {
  const accountCount = Math.max(2, Number(DEFAULT_INSTANCE.chain.accounts) || 10);
  const availableDepositors = [];
  for (let i = 1; i < accountCount; i += 1) {
    availableDepositors.push(i);
  }

  const maxDepositors = Math.max(1, Math.min(8, availableDepositors.length));
  const minDepositors = Math.min(3, maxDepositors);
  const depositorCount = rng.int(minDepositors, maxDepositors);
  const depositorAccountIndices = rng.shuffle(availableDepositors).slice(0, depositorCount);

  const initialDepositsEth = depositorAccountIndices.map(() => String(rng.int(8, 34)));

  const attackDepositEth = asEthStringFromTenths(rng.int(40, 120)); // 4.0 - 12.0 ETH
  const attackDepositTenths = Math.max(1, Number.parseInt((Number(attackDepositEth) * 10).toFixed(0), 10));
  const totalVaultTenths = initialDepositsEth.reduce((sum, amount) => sum + Number.parseInt(amount, 10) * 10, 0);
  const minimumLoops = Math.ceil(totalVaultTenths / attackDepositTenths);
  const maxAttacks = Math.max(3, Math.min(60, minimumLoops + rng.int(1, 4)));
  return {
    depositorAccountIndices,
    initialDepositsEth,
    attackDepositEth,
    maxAttacks
  };
}

function buildEnvFile(instance) {
  const studentNumberLine =
    typeof instance.studentNumber === "number"
      ? `LAB_STUDENT_NUMBER=${instance.studentNumber}`
      : "LAB_STUDENT_NUMBER=";

  return [
    "# Auto-generated per-student lab instance",
    "# Do not edit manually unless you know what you are doing",
    `LAB_INSTANCE_ID=${instance.instanceId}`,
    `LAB_STUDENT_ID=${instance.studentId}`,
    studentNumberLine,
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

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args["student-id"] !== undefined) {
    throw new Error("Option --student-id is no longer supported. Use --student-number <1-100>.");
  }

  if (args.salt !== undefined) {
    console.warn(
      `[warn] Option --salt is ignored. Using fixed cohort seed: ${DEFAULT_COHORT_SEED}.`
    );
  }

  const studentNumberArg = args["student-number"] || process.env.STUDENT_NUMBER;

  if (studentNumberArg === undefined) {
    throw new Error("Missing --student-number (or STUDENT_NUMBER env var).");
  }

  const studentNumber = parseStudentNumber(studentNumberArg);
  const studentId = deriveStudentIdFromNumber(studentNumber);
  console.log(`[info] Derived student id from number ${studentNumber}: ${studentId}`);

  const salt = DEFAULT_COHORT_SEED;
  console.log(`[info] Using cohort seed: ${DEFAULT_COHORT_SEED}`);

  const seedHash = crypto
    .createHash("sha256")
    .update(`${studentId}:${salt}`)
    .digest("hex");
  const rng = new DeterministicRng(seedHash);
  const catalogMessage = pickChallenge1Message(seedHash);

  const mnemonicEntropy = rng.bytes(16);
  const mnemonic = ethers.utils.entropyToMnemonic(mnemonicEntropy);

  const instance = deepClone(DEFAULT_INSTANCE);
  instance.version = 1;
  instance.studentNumber = studentNumber;
  instance.studentId = studentId;
  instance.instanceId = `lab4-${seedHash.slice(0, 12)}`;
  instance.seedHash = seedHash;
  instance.generatedAt = new Date().toISOString();
  instance.chain.mnemonic = mnemonic;
  instance.challenge1 = buildChallenge1(rng, catalogMessage);
  instance.challenge2 = buildChallenge2(rng);
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

  console.log("Instance generated successfully.");
  console.log(`student/instance.json: ${INSTANCE_JSON_PATH}`);
  console.log(`student/instance.env: ${INSTANCE_ENV_PATH}`);
  console.log(`student/manifest.sig: ${INSTANCE_MANIFEST_PATH}`);
  console.log(`instance id: ${instance.instanceId}`);
  console.log(`grading token: ${instance.grading.token}`);
}

main();
