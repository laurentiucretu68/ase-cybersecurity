const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawnSync } = require("child_process");

const DEFAULT_CHAIN_ID = 1337;
const DEFAULT_PORT = 7545;

function resolveCommand(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

function runCommand(command, args = []) {
  const result = spawnSync(command, args, {
    encoding: "utf8"
  });

  return {
    ok: !result.error && result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error
  };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const env = {};

  lines.forEach((line) => {
    if (!line || line.trim().startsWith("#")) {
      return;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env[key] = value;
  });

  return env;
}

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatHeader(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(title);
  console.log();
}

function extractVersionLine(output, matcher) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => matcher.test(line));
}

function rpcRequest(port, method, params = []) {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  });

  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/",
        method: "POST",
        timeout: 2500,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          try {
            const parsed = JSON.parse(body);

            if (parsed.error) {
              reject(new Error(parsed.error.message || "Unknown JSON-RPC error"));
              return;
            }

            resolve(parsed.result);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Request timed out"));
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

async function checkGanacheConnection(port, expectedChainId) {
  try {
    const chainIdHex = await rpcRequest(port, "eth_chainId");
    const accounts = await rpcRequest(port, "eth_accounts");
    const chainId = Number.parseInt(chainIdHex, 16);

    return {
      running: true,
      chainId,
      accountCount: Array.isArray(accounts) ? accounts.length : 0,
      matchesExpectedChain: chainId === expectedChainId
    };
  } catch (error) {
    return {
      running: false,
      error: error.message
    };
  }
}

async function main() {
  console.log("Verifying DeFi Heist Lab Setup...\n");
  console.log("=".repeat(60));

  let allGood = true;

  const instanceEnv = parseEnvFile(path.join("student", "instance.env"));
  const expectedPort = parsePositiveInt(instanceEnv.LAB_PORT, DEFAULT_PORT);
  const expectedChainId = parsePositiveInt(instanceEnv.LAB_CHAIN_ID, DEFAULT_CHAIN_ID);

  try {
    const nodeVersion = process.version;
    console.log(`[OK] Node.js: ${nodeVersion}`);

    const major = Number.parseInt(nodeVersion.split(".")[0].slice(1), 10);
    if (major < 16) {
      console.log("[WARN] Node.js 16+ recommended");
      allGood = false;
    }
  } catch (_error) {
    console.log("[FAIL] Node.js: Not found");
    allGood = false;
  }

  const npmResult = runCommand(resolveCommand("npm"), ["--version"]);
  if (npmResult.ok) {
    console.log(`[OK] NPM: v${npmResult.stdout.trim()}`);
  } else {
    console.log("[FAIL] NPM: Not found");
    allGood = false;
  }

  const hardhatResult = runCommand(resolveCommand("npx"), ["hardhat", "--version"]);
  if (hardhatResult.ok) {
    console.log(`[OK] Hardhat: ${hardhatResult.stdout.trim()}`);
  } else {
    console.log("[FAIL] Hardhat: Not installed (run: npm install)");
    allGood = false;
  }

  const ganacheResult = runCommand("ganache", ["--version"]);
  if (ganacheResult.ok) {
    const combinedOutput = `${ganacheResult.stdout}\n${ganacheResult.stderr}`;
    const ganacheVersion =
      extractVersionLine(combinedOutput, /^ganache v/i) || "Ganache installed";
    console.log(`[OK] Ganache: ${ganacheVersion}`);
  } else {
    console.log("[WARN] Ganache CLI: Not installed globally (install: npm install -g ganache)");
    console.log("       Can still use with: npx ganache");
  }

  console.log("Checking Ganache connection...");
  const ganacheStatus = await checkGanacheConnection(expectedPort, expectedChainId);
  if (ganacheStatus.running) {
    const chainLabel = ganacheStatus.matchesExpectedChain
      ? `${ganacheStatus.chainId}`
      : `${ganacheStatus.chainId} (expected ${expectedChainId})`;
    console.log(
      `[OK] Ganache RPC: Running on http://127.0.0.1:${expectedPort} | chainId ${chainLabel} | visible accounts ${ganacheStatus.accountCount}`
    );
  } else {
    console.log(`[WARN] Ganache RPC: Not reachable on http://127.0.0.1:${expectedPort}`);
    console.log("       Start with: ./start-ganache.sh");
  }

  const gitResult = runCommand("git", ["--version"]);
  if (gitResult.ok) {
    console.log(`[OK] Git: ${gitResult.stdout.trim()}`);
  } else {
    console.log("[FAIL] Git: Not found");
    allGood = false;
  }

  formatHeader("Checking project structure...");

  const requiredDirs = ["contracts", "scripts", "challenges", "vm-setup", "deployments"];
  requiredDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      console.log(`[OK] Directory: ${dir}/`);
    } else {
      console.log(`[FAIL] Directory missing: ${dir}/`);
      allGood = false;
    }
  });

  const requiredFiles = [
    "package.json",
    "hardhat.config.js",
    "start-ganache.sh",
    "README.md",
    "scripts/generate-instance.js",
    "scripts/clean-generated.js",
    "scripts/setup-challenge1.js",
    "scripts/deploy-simple-vault.js",
    "scripts/configure-ganache-gui.js",
    "scripts/validate-results-format.js",
    "scripts/lib/instance-config.js",
    "scripts/inspect-transaction.js",
    "scripts/trace-funds.js"
  ];

  console.log();
  requiredFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`[OK] File: ${file}`);
    } else {
      console.log(`[FAIL] File missing: ${file}`);
      allGood = false;
    }
  });

  const instanceFiles = [
    "student/instance.json",
    "student/instance.env",
    "student/manifest.sig"
  ];
  const instanceReady = instanceFiles.every((file) => fs.existsSync(file));

  console.log();
  instanceFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`[OK] ${file}`);
    } else {
      console.log(`[WARN] Missing: ${file}`);
    }
  });

  if (!instanceReady) {
    console.log("       Run before deploy: npm run init:student -- --student-number <1-100>");
  }

  formatHeader("Checking contract files...");

  const contractFiles = [
    "contracts/SimpleVault.sol",
    "contracts/VaultAttacker.sol"
  ];

  contractFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`[OK] ${file}`);
    } else {
      console.log(`[FAIL] Missing: ${file}`);
      allGood = false;
    }
  });

  formatHeader("Checking challenge documentation...");

  const challengeDocs = [
    "challenges/challenge1-forensics.md",
    "challenges/challenge2-reentrancy.md"
  ];

  challengeDocs.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`[OK] ${file}`);
    } else {
      console.log(`[FAIL] Missing: ${file}`);
      allGood = false;
    }
  });

  formatHeader("Checking dependencies...");

  if (fs.existsSync("node_modules")) {
    console.log("[OK] node_modules/ - Dependencies installed");

    ["hardhat", "ethers", "@openzeppelin/contracts", "dotenv"].forEach((dependency) => {
      const dependencyPath = path.join("node_modules", dependency);
      if (fs.existsSync(dependencyPath)) {
        console.log(`  [OK] ${dependency}`);
      } else {
        console.log(`  [FAIL] ${dependency} - Missing`);
        allGood = false;
      }
    });
  } else {
    console.log("[FAIL] node_modules/ - Dependencies not installed");
    console.log("       Run: npm install");
    allGood = false;
  }

  formatHeader("Checking generated artifacts...");

  const deploymentFiles = [
    {
      file: "deployments/challenge1-data.json",
      label: "Challenge 1 deployment"
    },
    {
      file: "deployments/simple-vault.json",
      label: "Challenge 2 deployment"
    }
  ];

  const deploymentsReady = deploymentFiles.every((item) => fs.existsSync(item.file));

  deploymentFiles.forEach(({ file, label }) => {
    if (fs.existsSync(file)) {
      console.log(`[OK] ${label}: ${file}`);
    } else {
      console.log(`[WARN] Missing ${label}: ${file}`);
    }
  });

  const runtimeReady = instanceReady && ganacheStatus.running && deploymentsReady;
  const headerTitle = allGood
    ? runtimeReady
      ? "Setup verification PASSED!"
      : "Setup verification PARTIAL"
    : "Setup verification INCOMPLETE";

  formatHeader(headerTitle);

  if (allGood) {
    if (runtimeReady) {
      console.log("Environment is ready and deployments are already in place.");
      console.log("\nNext steps:");
      console.log("1. Open Challenge 1: challenges/challenge1-forensics.md");
      console.log("2. Use deployments/challenge1-data.json for the initial transaction hash.");
      console.log("3. Continue with Challenge 2: challenges/challenge2-reentrancy.md");
      console.log("4. Open VS Code if needed: code .");
    } else {
      console.log("Core environment looks good, but the lab runtime is not fully ready yet.");
      console.log("\nNext steps:");

      let step = 1;
      if (!instanceReady) {
        console.log(`${step}. Generate student instance: npm run init:student -- --student-number <1-100>`);
        step += 1;
      }
      if (!ganacheStatus.running) {
        console.log(`${step}. Start Ganache: ./start-ganache.sh`);
        step += 1;
      }
      if (!deploymentsReady) {
        console.log(`${step}. Deploy contracts: npm run deploy:all`);
        step += 1;
      }

      console.log(`${step}. Open VS Code: code .`);
      console.log(`${step + 1}. Start with Challenge 1: challenges/challenge1-forensics.md`);
    }
  } else {
    console.log("Please fix the issues above before starting the lab.");
    console.log("\nCommon fixes:");
    console.log("- Run: npm install");
    console.log("- Run: npm run init:student -- --student-number <1-100>");
    console.log("- Start Ganache: ./start-ganache.sh");
    console.log("- Ensure you're in the lab2 directory");
  }

  console.log("=".repeat(60));
  process.exit(allGood ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
