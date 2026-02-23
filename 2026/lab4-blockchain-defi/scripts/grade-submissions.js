#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const solc = require("solc");
const hre = require("hardhat");
const { ethers } = hre;

function parseArgs(argv) {
  const args = {
    exploitCheck: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);

    if (key === "no-exploit-check") {
      args.exploitCheck = false;
      continue;
    }

    if (key === "help") {
      args.help = true;
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/grade-submissions.js
    --student-id <id>
    --submission-dir <path>
    [--expected-file <path>]
    [--out <path>]
    [--no-exploit-check]

Examples:
  npm run grade:submission -- --student-id student1@stud.ase.ro --submission-dir ./submissions/student1
  npm run grade:submission -- --student-id student1@stud.ase.ro --submission-dir ./submissions/student1 --out ./reports/student1.json
`);
}

function slugifyStudentId(studentId) {
  const slug = studentId
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "student";
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function findFilesRecursive(dirPath) {
  const result = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (["node_modules", ".git", "artifacts", "cache"].includes(entry.name)) {
          return;
        }
        walk(fullPath);
        return;
      }

      result.push(fullPath);
    });
  }

  walk(dirPath);
  return result;
}

function pickFile(files, pattern) {
  const match = files.find((filePath) => pattern.test(path.basename(filePath)));
  return match || null;
}

function readTextMaybe(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function normalizeText(text) {
  return (text || "").toLowerCase();
}

function includesInsensitive(text, fragment) {
  return normalizeText(text).includes(String(fragment || "").toLowerCase());
}

function includesAddress(text, address) {
  if (!address) {
    return false;
  }

  return includesInsensitive(text, address);
}

function includesHex(text, hexValue) {
  if (!hexValue) {
    return false;
  }

  const normalized = normalizeText(text).replace(/\s+/g, "");
  const withPrefix = String(hexValue).toLowerCase();
  const noPrefix = withPrefix.replace(/^0x/, "");

  return normalized.includes(withPrefix) || normalized.includes(noPrefix);
}

function hasCodeLikeContent(text) {
  return /```|function\s+|await\s+|const\s+|\btx\b/i.test(text || "");
}

function extractNumbers(text) {
  const matches = String(text || "").match(/\d+(?:\.\d+)?/g);
  if (!matches) {
    return [];
  }

  return matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

function computeChallenge1ExpectedGasFeeEth(expectedData) {
  const gasPriceWei = expectedData?.expected?.chain?.gasPriceWei || "20000000000";
  const messageHex = expectedData?.expected?.challenge1?.messageHex || "0x";
  const transferCount = (expectedData?.expected?.challenge1?.transferAmountsEth || []).length;

  if (!transferCount) {
    return null;
  }

  const hex = messageHex.replace(/^0x/, "");
  let dataGas = 0;

  for (let i = 0; i < hex.length; i += 2) {
    const byteHex = hex.slice(i, i + 2);
    if (!byteHex) {
      continue;
    }

    const byte = parseInt(byteHex, 16);
    dataGas += byte === 0 ? 4 : 16;
  }

  const firstTxGas = 21000 + dataGas;
  const totalGas = firstTxGas + Math.max(transferCount - 1, 0) * 21000;
  const feeWei = ethers.BigNumber.from(gasPriceWei).mul(totalGas);

  return Number(ethers.utils.formatEther(feeWei));
}

function scoreChallenge1(solutionText, expectedData) {
  const findings = [];
  const expected = expectedData.expected.challenge1;

  if (!solutionText) {
    return {
      score: 0,
      max: 20,
      findings: [
        {
          criterion: "challenge1-solution.md",
          score: 0,
          max: 20,
          note: "Missing file"
        }
      ]
    };
  }

  const hopAddresses = expected.hopAddresses || [];
  const matchedHops = hopAddresses.filter((address) => includesAddress(solutionText, address)).length;
  const chainScore = hopAddresses.length
    ? Number(((5 * matchedHops) / hopAddresses.length).toFixed(2))
    : 0;
  findings.push({
    criterion: "Identificare lanț complet",
    score: chainScore,
    max: 5,
    note: `${matchedHops}/${hopAddresses.length} adrese intermediare găsite`
  });

  const hasFinalAddress = includesAddress(solutionText, expected.finalDestinationAddress);
  findings.push({
    criterion: "Adresa finală corectă",
    score: hasFinalAddress ? 3 : 0,
    max: 3,
    note: hasFinalAddress ? "OK" : "Adresa finală lipsește"
  });

  const expectedGasFee = computeChallenge1ExpectedGasFeeEth(expectedData);
  const numbers = extractNumbers(solutionText);
  let gasScore = 0;

  if (/gas/i.test(solutionText) && numbers.length) {
    if (expectedGasFee) {
      const hasCloseValue = numbers.some((value) => {
        const delta = Math.abs(value - expectedGasFee);
        return delta <= Math.max(expectedGasFee * 0.15, 0.001);
      });

      gasScore = hasCloseValue ? 2 : 1;
    } else {
      gasScore = 1;
    }
  }

  findings.push({
    criterion: "Calcul gas fees",
    score: gasScore,
    max: 2,
    note:
      gasScore === 2
        ? "Valoare gas fee apropiată de expected"
        : gasScore === 1
          ? "Menționează gas, dar fără match clar"
          : "Nu apare calcul gas"
  });

  const hasHex = includesHex(solutionText, expected.messageHex);
  findings.push({
    criterion: "Extragere mesaj hex",
    score: hasHex ? 5 : 0,
    max: 5,
    note: hasHex ? "OK" : "Mesajul hex nu apare complet"
  });

  const hasDecoded = includesInsensitive(solutionText, expected.message);
  findings.push({
    criterion: "Decodare mesaj",
    score: hasDecoded ? 5 : 0,
    max: 5,
    note: hasDecoded ? "OK" : "Mesajul decodat nu apare"
  });

  const score = findings.reduce((acc, item) => acc + item.score, 0);

  return {
    score: Number(score.toFixed(2)),
    max: 20,
    findings
  };
}

function scoreChallenge2Report(reportText) {
  const findings = [];

  if (!reportText) {
    return {
      score: 0,
      max: 20,
      findings: [
        {
          criterion: "challenge2-report.md",
          score: 0,
          max: 20,
          note: "Missing file"
        }
      ]
    };
  }

  let vulnScore = 0;
  if (/reentranc/i.test(reportText)) vulnScore += 4;
  if (/withdraw/i.test(reportText) && /call/i.test(reportText)) vulnScore += 2;
  if (/before/i.test(reportText) && /(state|balance|update)/i.test(reportText)) vulnScore += 2;
  vulnScore = Math.min(vulnScore, 8);

  findings.push({
    criterion: "Identificare vulnerabilitate",
    score: vulnScore,
    max: 8,
    note: vulnScore >= 6 ? "OK" : "Explicația vulnerabilității e incompletă"
  });

  let patternScore = 0;
  if (/checks\s*[- ]\s*effects\s*[- ]\s*interactions/i.test(reportText)) patternScore += 4;
  if (/(reentrancyguard|update.*before.*call|state.*before.*external)/i.test(reportText)) patternScore += 3;
  patternScore = Math.min(patternScore, 7);

  findings.push({
    criterion: "Explicare pattern securizat",
    score: patternScore,
    max: 7,
    note: patternScore >= 4 ? "OK" : "Lipsește CEI/remedierea clară"
  });

  const length = reportText.trim().length;
  const docScore = length > 1200 ? 5 : length > 600 ? 3 : length > 200 ? 1 : 0;
  findings.push({
    criterion: "Documentație raport",
    score: docScore,
    max: 5,
    note: `Lungime raport: ${length} caractere`
  });

  const score = findings.reduce((acc, item) => acc + item.score, 0);

  return {
    score,
    max: 20,
    findings
  };
}

function compileSubmissionContract(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const projectRoot = path.resolve(__dirname, "..");
  const submissionDir = path.dirname(sourcePath);

  function findImport(importPath) {
    const candidates = [
      path.resolve(submissionDir, importPath),
      path.resolve(projectRoot, importPath),
      path.resolve(projectRoot, "contracts", importPath),
      path.resolve(projectRoot, "node_modules", importPath)
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { contents: fs.readFileSync(candidate, "utf8") };
      }
    }

    return { error: `File not found: ${importPath}` };
  }

  const input = {
    language: "Solidity",
    sources: {
      "Submission.sol": {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

  const errors = (output.errors || []).filter((item) => item.severity === "error");
  if (errors.length) {
    return {
      success: false,
      errors: errors.map((item) => item.formattedMessage || item.message)
    };
  }

  const contracts = output.contracts?.["Submission.sol"] || {};
  const compiledEntries = Object.entries(contracts)
    .map(([name, artifact]) => ({
      name,
      abi: artifact.abi,
      bytecode: artifact.evm?.bytecode?.object ? `0x${artifact.evm.bytecode.object}` : "0x"
    }))
    .filter((item) => item.bytecode && item.bytecode !== "0x");

  if (!compiledEntries.length) {
    return {
      success: false,
      errors: ["No deployable contract found in submission"]
    };
  }

  const preferred = compiledEntries.find((item) => /myvaultattacker|vaultattacker|attacker/i.test(item.name));

  return {
    success: true,
    contract: preferred || compiledEntries[0],
    warnings: (output.errors || [])
      .filter((item) => item.severity !== "error")
      .map((item) => item.formattedMessage || item.message)
  };
}

function chooseFunction(contract, options) {
  for (const option of options) {
    const fn = contract.interface.functions[option];
    if (fn) {
      return fn;
    }
  }

  const all = Object.values(contract.interface.functions);
  for (const fn of all) {
    const name = fn.name.toLowerCase();

    if (
      options.some((option) => {
        const raw = option.split("(")[0].toLowerCase();
        return name === raw;
      })
    ) {
      return fn;
    }
  }

  return null;
}

async function scoreChallenge2Exploit(submissionContractPath, expectedData, exploitCheckEnabled) {
  const findings = [];
  let bonus = 0;

  if (!submissionContractPath) {
    return {
      score: 0,
      max: 20,
      bonus,
      findings: [
        {
          criterion: "MyVaultAttacker.sol",
          score: 0,
          max: 20,
          note: "Missing file"
        }
      ]
    };
  }

  const compilation = compileSubmissionContract(submissionContractPath);

  findings.push({
    criterion: "Contract compilează",
    score: compilation.success ? 5 : 0,
    max: 5,
    note: compilation.success ? `Contract detectat: ${compilation.contract.name}` : compilation.errors[0]
  });

  if (!exploitCheckEnabled) {
    findings.push({
      criterion: "Exploit check runtime",
      score: 0,
      max: 15,
      note: "Skipped (--no-exploit-check)"
    });

    return {
      score: findings.reduce((acc, item) => acc + item.score, 0),
      max: 20,
      bonus,
      findings
    };
  }

  if (!compilation.success) {
    findings.push({
      criterion: "Contract deployed",
      score: 0,
      max: 5,
      note: "Skipped because compilation failed"
    });
    findings.push({
      criterion: "Exploit funcționează",
      score: 0,
      max: 10,
      note: "Skipped because compilation failed"
    });

    return {
      score: findings.reduce((acc, item) => acc + item.score, 0),
      max: 20,
      bonus,
      findings
    };
  }

  try {
    await hre.network.provider.send("hardhat_reset");

    const signers = await ethers.getSigners();
    const [deployer, attackerSigner] = signers;

    const SimpleVault = await ethers.getContractFactory("SimpleVault", deployer);
    const vault = await SimpleVault.deploy();
    await vault.deployed();

    const depositAmounts = expectedData?.expected?.challenge2?.initialDepositsEth || ["30", "25", "20", "25"];
    const depositIndices = expectedData?.expected?.challenge2?.depositorAccountIndices || [1, 2, 3, 4];

    for (let i = 0; i < depositAmounts.length; i += 1) {
      const signer = signers[depositIndices[i]] || signers[(i % (signers.length - 1)) + 1];
      const amount = depositAmounts[i] || "1";
      await (await vault.connect(signer).deposit({ value: ethers.utils.parseEther(String(amount)) })).wait();
    }

    const vaultBalanceBefore = await ethers.provider.getBalance(vault.address);

    let attackerContract;
    let deployedScore = 0;

    try {
      const factory = new ethers.ContractFactory(
        compilation.contract.abi,
        compilation.contract.bytecode,
        attackerSigner
      );

      try {
        attackerContract = await factory.deploy(vault.address);
      } catch (_firstError) {
        attackerContract = await factory.deploy();
      }

      await attackerContract.deployed();
      deployedScore = 5;
    } catch (error) {
      findings.push({
        criterion: "Contract deployed",
        score: 0,
        max: 5,
        note: `Deploy failed: ${error.message}`
      });
      findings.push({
        criterion: "Exploit funcționează",
        score: 0,
        max: 10,
        note: "Exploit skipped because deploy failed"
      });

      return {
        score: findings.reduce((acc, item) => acc + item.score, 0),
        max: 20,
        bonus,
        findings
      };
    }

    findings.push({
      criterion: "Contract deployed",
      score: deployedScore,
      max: 5,
      note: `Deployed at ${attackerContract.address}`
    });

    const suggestedAttackDeposit =
      expectedData?.expected?.challenge2?.attackDepositEth ||
      expectedData?.expected?.challenge2?.suggestedDepositEth ||
      "1.0";

    const setMaxAttacksFn = chooseFunction(attackerContract, ["setMaxAttacks(uint256)"]);
    if (setMaxAttacksFn) {
      const maxAttacks = Number(expectedData?.expected?.challenge2?.maxAttacks || 5);
      await (await attackerContract.connect(attackerSigner)[setMaxAttacksFn.name](maxAttacks)).wait();
    }

    const depositFn = chooseFunction(attackerContract, [
      "depositToVault()",
      "deposit()",
      "fund()",
      "seed()"
    ]);

    if (depositFn && depositFn.inputs.length === 0) {
      await (
        await attackerContract
          .connect(attackerSigner)
          [depositFn.name]({ value: ethers.utils.parseEther(String(suggestedAttackDeposit)) })
      ).wait();
    }

    const attackFn = chooseFunction(attackerContract, [
      "attack()",
      "executeAttack()",
      "exploit()",
      "pwn()"
    ]);

    if (!attackFn || attackFn.inputs.length !== 0) {
      findings.push({
        criterion: "Exploit funcționează",
        score: 0,
        max: 10,
        note: "No compatible attack() function found"
      });

      return {
        score: findings.reduce((acc, item) => acc + item.score, 0),
        max: 20,
        bonus,
        findings
      };
    }

    await (await attackerContract.connect(attackerSigner)[attackFn.name]()).wait();

    const vaultBalanceAfter = await ethers.provider.getBalance(vault.address);

    const drainedBps = vaultBalanceBefore.isZero()
      ? 0
      : vaultBalanceBefore.sub(vaultBalanceAfter).mul(10000).div(vaultBalanceBefore).toNumber();

    let exploitScore = 0;
    if (drainedBps >= 5000) {
      exploitScore = 10;
    } else if (drainedBps >= 2500) {
      exploitScore = 6;
    } else if (drainedBps > 0) {
      exploitScore = 3;
    }

    if (vaultBalanceAfter.isZero()) {
      bonus = 5;
    }

    findings.push({
      criterion: "Exploit funcționează",
      score: exploitScore,
      max: 10,
      note: `Vault drained: ${(drainedBps / 100).toFixed(2)}%`
    });
  } catch (error) {
    findings.push({
      criterion: "Exploit funcționează",
      score: 0,
      max: 10,
      note: `Runtime check failed: ${error.message}`
    });
  }

  return {
    score: findings.reduce((acc, item) => acc + item.score, 0),
    max: 20,
    bonus,
    findings
  };
}

function scoreChallenge3(reportText, expectedData) {
  const findings = [];
  let bonus = 0;

  if (!reportText) {
    return {
      score: 0,
      max: 40,
      bonus,
      findings: [
        {
          criterion: "challenge3-investigation.md",
          score: 0,
          max: 40,
          note: "Missing file"
        }
      ]
    };
  }

  const expected = expectedData.expected.challenge3;

  let keyScore = 0;
  if (includesInsensitive(reportText, expected.adminPrivateKey)) {
    keyScore = 10;
  } else if (includesInsensitive(reportText, expected.adminAddress)) {
    keyScore = 5;
  } else {
    const leakLocations = Object.values(expected.leakFiles || {}).filter((value) => value);
    const matched = leakLocations.filter((value) => includesInsensitive(reportText, value)).length;
    if (matched > 0) {
      keyScore = Math.min(4, matched + 1);
    }
  }

  findings.push({
    criterion: "Găsire private key",
    score: keyScore,
    max: 10,
    note: keyScore >= 5 ? "OK" : "Lipsește cheia/adresa corectă"
  });

  let importScore = 0;
  ["metamask", "import", "wallet", "balance", "ethers"].forEach((keyword) => {
    if (includesInsensitive(reportText, keyword)) {
      importScore += 1;
    }
  });
  importScore = Math.min(importScore, 5);

  findings.push({
    criterion: "Validare și import",
    score: importScore,
    max: 5,
    note: importScore >= 3 ? "OK" : "Validarea/importul nu este clar"
  });

  let bugScore = 0;
  if (includesInsensitive(reportText, "proposeadmin")) bugScore += 4;
  if (includesInsensitive(reportText, "pendingadmin")) bugScore += 2;
  if (includesInsensitive(reportText, "access control") || includesInsensitive(reportText, "only admin")) bugScore += 2;
  bugScore = Math.min(bugScore, 8);

  findings.push({
    criterion: "Identificare bug Access Control",
    score: bugScore,
    max: 8,
    note: bugScore >= 6 ? "OK" : "Explicația bug-ului este incompletă"
  });

  let pocScore = 0;
  if (includesInsensitive(reportText, "proposeadmin")) pocScore += 2;
  if (includesInsensitive(reportText, "acceptadmin")) pocScore += 2;
  if (includesInsensitive(reportText, "emergencywithdraw")) pocScore += 2;
  if (hasCodeLikeContent(reportText)) pocScore += 1;
  pocScore = Math.min(pocScore, 7);

  findings.push({
    criterion: "Proof of Concept",
    score: pocScore,
    max: 7,
    note: pocScore >= 5 ? "OK" : "PoC incomplet"
  });

  let exploitScore = 0;
  if (
    includesInsensitive(reportText, "became admin") ||
    includesInsensitive(reportText, "devin admin") ||
    includesInsensitive(reportText, "admin changed")
  ) {
    exploitScore += 4;
  }
  if (
    includesInsensitive(reportText, "drain") ||
    includesInsensitive(reportText, "dren") ||
    includesInsensitive(reportText, "withdraw all") ||
    includesInsensitive(reportText, "emergencywithdraw")
  ) {
    exploitScore += 3;
  }
  exploitScore = Math.min(exploitScore, 7);

  findings.push({
    criterion: "Exploit reușit",
    score: exploitScore,
    max: 7,
    note: exploitScore >= 4 ? "OK" : "Rezultatul exploitului nu este clar"
  });

  const length = reportText.trim().length;
  const docScore = length > 900 ? 3 : length > 400 ? 2 : length > 150 ? 1 : 0;
  findings.push({
    criterion: "Documentație",
    score: docScore,
    max: 3,
    note: `Lungime raport: ${length} caractere`
  });

  const remediationKeywords = ["onlyadmin", "modifier", "timelock", "accesscontrol", "openzeppelin"];
  const remediationHits = remediationKeywords.filter((keyword) => includesInsensitive(reportText, keyword)).length;

  if (remediationHits >= 2) {
    bonus = Math.min(5, remediationHits);
  }

  const score = findings.reduce((acc, item) => acc + item.score, 0);

  return {
    score,
    max: 40,
    bonus,
    findings
  };
}

function resolveExpectedFile(args, studentId, projectRoot) {
  if (args["expected-file"]) {
    return path.resolve(process.cwd(), args["expected-file"]);
  }

  const slug = slugifyStudentId(studentId);
  return path.join(projectRoot, "instructor", "expected", `${slug}.json`);
}

function buildReport({
  studentId,
  expectedFile,
  submissionDir,
  files,
  challenge1,
  challenge2Report,
  challenge2Exploit,
  challenge3
}) {
  const c2Total = challenge2Report.score + challenge2Exploit.score;
  const c2Max = challenge2Report.max + challenge2Exploit.max;
  const c2Bonus = challenge2Exploit.bonus;

  const total = challenge1.score + c2Total + challenge3.score;
  const bonus = c2Bonus + challenge3.bonus;
  const totalWithBonus = total + bonus;

  return {
    generatedAt: new Date().toISOString(),
    studentId,
    expectedFile,
    submissionDir,
    files,
    rubric: {
      challenge1: {
        score: challenge1.score,
        max: challenge1.max,
        findings: challenge1.findings
      },
      challenge2: {
        score: c2Total,
        max: c2Max,
        bonus: c2Bonus,
        sections: {
          report: challenge2Report,
          exploit: challenge2Exploit
        }
      },
      challenge3: {
        score: challenge3.score,
        max: challenge3.max,
        bonus: challenge3.bonus,
        findings: challenge3.findings
      }
    },
    totals: {
      baseScore: Number(total.toFixed(2)),
      maxBaseScore: 100,
      bonus: Number(bonus.toFixed(2)),
      maxBonus: 10,
      scoreWithBonus: Number(totalWithBonus.toFixed(2))
    },
    notes: [
      "Scoring is semi-automatic; instructor review is still recommended.",
      "Text-based criteria can miss valid alternative explanations.",
      "Exploit runtime check only covers Challenge 2 contract execution."
    ]
  };
}

function printSummary(report) {
  console.log("\n=== Semi-Automatic Grading Summary ===");
  console.log(`Student: ${report.studentId}`);
  console.log(`Challenge 1: ${report.rubric.challenge1.score}/${report.rubric.challenge1.max}`);
  console.log(
    `Challenge 2: ${report.rubric.challenge2.score}/${report.rubric.challenge2.max} (+${report.rubric.challenge2.bonus} bonus)`
  );
  console.log(
    `Challenge 3: ${report.rubric.challenge3.score}/${report.rubric.challenge3.max} (+${report.rubric.challenge3.bonus} bonus)`
  );
  console.log(
    `Total: ${report.totals.baseScore}/${report.totals.maxBaseScore} (+${report.totals.bonus}) = ${report.totals.scoreWithBonus}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const studentId = args["student-id"];
  const submissionDirArg = args["submission-dir"];

  if (!studentId || !submissionDirArg) {
    throw new Error("Both --student-id and --submission-dir are required.");
  }

  const projectRoot = path.resolve(__dirname, "..");
  const submissionDir = path.resolve(process.cwd(), submissionDirArg);

  if (!fs.existsSync(submissionDir) || !fs.statSync(submissionDir).isDirectory()) {
    throw new Error(`Submission directory not found: ${submissionDir}`);
  }

  const expectedFile = resolveExpectedFile(args, studentId, projectRoot);
  if (!fs.existsSync(expectedFile)) {
    throw new Error(`Expected file not found: ${expectedFile}`);
  }

  const expectedData = JSON.parse(fs.readFileSync(expectedFile, "utf8"));

  const discoveredFiles = findFilesRecursive(submissionDir);

  const challenge1File = pickFile(discoveredFiles, /challenge\s*1|challenge1|forensics/i);
  const challenge2ReportFile = pickFile(discoveredFiles, /challenge\s*2|challenge2|reentrancy|report/i);
  const challenge3File = pickFile(discoveredFiles, /challenge\s*3|challenge3|investigation|access/i);
  const attackerFile = pickFile(discoveredFiles, /(my)?vaultattacker.*\.sol$/i);

  const challenge1Text = readTextMaybe(challenge1File);
  const challenge2ReportText = readTextMaybe(challenge2ReportFile);
  const challenge3Text = readTextMaybe(challenge3File);

  const challenge1 = scoreChallenge1(challenge1Text, expectedData);
  const challenge2Report = scoreChallenge2Report(challenge2ReportText);
  const challenge2Exploit = await scoreChallenge2Exploit(
    attackerFile,
    expectedData,
    args.exploitCheck
  );
  const challenge3 = scoreChallenge3(challenge3Text, expectedData);

  const report = buildReport({
    studentId,
    expectedFile,
    submissionDir,
    files: {
      challenge1: challenge1File,
      challenge2Report: challenge2ReportFile,
      challenge2Contract: attackerFile,
      challenge3: challenge3File
    },
    challenge1,
    challenge2Report,
    challenge2Exploit,
    challenge3
  });

  const defaultOut = path.join(
    projectRoot,
    "instructor",
    "grading",
    `${slugifyStudentId(studentId)}.json`
  );
  const outPath = args.out ? path.resolve(process.cwd(), args.out) : defaultOut;

  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  printSummary(report);
  console.log(`Report written to: ${outPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
