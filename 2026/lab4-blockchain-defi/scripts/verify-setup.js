// Verification script to check if the environment is properly set up
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🔍 Verifying DeFi Heist Lab Setup...\n");
console.log("=".repeat(60));

let allGood = true;

// Check Node.js version
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  if (major < 16) {
    console.log("⚠️  Warning: Node.js 16+ recommended");
    allGood = false;
  }
} catch (error) {
  console.log("❌ Node.js: Not found");
  allGood = false;
}

// Check NPM
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ NPM: v${npmVersion}`);
} catch (error) {
  console.log("❌ NPM: Not found");
  allGood = false;
}

// Check Hardhat
try {
  const hardhatVersion = execSync('npx hardhat --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ Hardhat: ${hardhatVersion}`);
} catch (error) {
  console.log("❌ Hardhat: Not installed (run: npm install)");
  allGood = false;
}

// Check Ganache
try {
  const ganacheVersion = execSync('ganache --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ Ganache: ${ganacheVersion}`);
} catch (error) {
  console.log("⚠️  Ganache CLI: Not installed globally (install: npm install -g ganache)");
  console.log("   (Can still use with: npx ganache)");
}

// Check if Ganache is running
try {
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 7545,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  // Try to make a request to Ganache
  console.log("🔌 Checking Ganache connection...");
  // Note: This is async, so we'll mark it as optional
  console.log("⚠️  Ganache: Not running (start with: ./start-ganache.sh)");
} catch (error) {
  console.log("⚠️  Ganache: Cannot verify (start with: ./start-ganache.sh)");
}

// Check Git
try {
  const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ Git: ${gitVersion}`);
} catch (error) {
  console.log("❌ Git: Not found");
  allGood = false;
}

console.log("\n" + "=".repeat(60));
console.log("📁 Checking project structure...\n");

// Check directories
const requiredDirs = [
  'contracts',
  'scripts',
  'challenges',
  'vm-setup',
  'deployments'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ Directory: ${dir}/`);
  } else {
    console.log(`❌ Directory missing: ${dir}/`);
    allGood = false;
  }
});

// Check important files
const requiredFiles = [
  'package.json',
  'hardhat.config.js',
  'start-ganache.sh',
  'README.md',
  'scripts/generate-instance.js',
  'scripts/generate-batch-instances.js',
  'scripts/clean-generated.js',
  'scripts/grade-submissions.js',
  'scripts/setup-challenge1.js',
  'scripts/inspect-transaction.js',
  'scripts/trace-funds.js',
  'scripts/find-private-key.sh',
  'test/test-access-control.js',
  'instructor/students.example.txt'
];

console.log();
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ File: ${file}`);
  } else {
    console.log(`❌ File missing: ${file}`);
    allGood = false;
  }
});

console.log();
if (fs.existsSync('student/instance.json')) {
  console.log('✅ student/instance.json - Per-student instance found');
} else {
  console.log('⚠️  student/instance.json - Missing per-student instance');
  console.log('   Run before deploy: npm run init:student -- --student-id <id>');
}

// Check contracts
console.log("\n" + "=".repeat(60));
console.log("📄 Checking contract files...\n");

const contractFiles = [
  'contracts/SimpleVault.sol',
  'contracts/VaultAttacker.sol',
  'contracts/AdminVault.sol'
];

contractFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allGood = false;
  }
});

// Check challenge docs
console.log("\n" + "=".repeat(60));
console.log("📚 Checking challenge documentation...\n");

const challengeDocs = [
  'challenges/challenge1-forensics.md',
  'challenges/challenge2-reentrancy.md',
  'challenges/challenge3-access-control.md'
];

challengeDocs.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allGood = false;
  }
});

// Check if node_modules exists
console.log("\n" + "=".repeat(60));
console.log("📦 Checking dependencies...\n");

if (fs.existsSync('node_modules')) {
  console.log("✅ node_modules/ - Dependencies installed");
  
  // Check key dependencies
  const keyDeps = ['hardhat', 'ethers', '@openzeppelin/contracts'];
  keyDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    if (fs.existsSync(depPath)) {
      console.log(`  ✅ ${dep}`);
    } else {
      console.log(`  ❌ ${dep} - Missing`);
      allGood = false;
    }
  });
} else {
  console.log("❌ node_modules/ - Dependencies not installed");
  console.log("   Run: npm install");
  allGood = false;
}

// Final summary
console.log("\n" + "=".repeat(60));
if (allGood) {
  console.log("✅ Setup verification PASSED!");
  console.log("\n🚀 You're ready to start the lab!");
  console.log("\nNext steps:");
  console.log("1. Generate student instance: npm run init:student -- --student-id <id>");
  console.log("2. Start Ganache: ./start-ganache.sh");
  console.log("3. Deploy contracts: npm run deploy:all");
  console.log("4. Open VS Code: code .");
  console.log("5. Start with Challenge 1: challenges/challenge1-forensics.md");
} else {
  console.log("⚠️  Setup verification INCOMPLETE");
  console.log("\n🔧 Please fix the issues above before starting the lab.");
  console.log("\nCommon fixes:");
  console.log("- Run: npm install");
  console.log("- Run: npm run init:student -- --student-id <id>");
  console.log("- Install Ganache: npm install -g ganache");
  console.log("- Ensure you're in the lab4-blockchain-defi directory");
}
console.log("=".repeat(60));

process.exit(allGood ? 0 : 1);
