const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { loadInstance } = require("./lib/instance-config");
const { ensureBalance, requiredBalance } = require("./fund-signers");

function resolveSigners(signers, indices) {
  return indices.map((index) => {
    if (index < 0 || index >= signers.length) {
      throw new Error(`Invalid signer index for challenge2: ${index}`);
    }

    return { index, signer: signers[index] };
  });
}

async function main() {
  const instance = loadInstance({ required: true });
  const cfg = instance.challenge2;

  if (cfg.depositorAccountIndices.length !== cfg.initialDepositsEth.length) {
    throw new Error(
      "challenge2.depositorAccountIndices and challenge2.initialDepositsEth must have the same length"
    );
  }

  console.log("Deploying SimpleVault for Challenge 2\n");
  console.log(`Instance: ${instance.instanceId}`);

  const signers = await hre.ethers.getSigners();
  const [deployer] = signers;

  console.log("Deployer:", deployer.address);
  console.log(
    "Deployer balance:",
    hre.ethers.utils.formatEther(await deployer.getBalance()),
    "ETH\n"
  );

  const SimpleVault = await hre.ethers.getContractFactory("SimpleVault");
  const vault = await SimpleVault.deploy();
  await vault.deployed();

  console.log("SimpleVault deployed to:", vault.address);

  const depositors = resolveSigners(signers, cfg.depositorAccountIndices);

  console.log("\nFunding vault with per-student deposits...");
  for (let i = 0; i < depositors.length; i += 1) {
    const { index, signer } = depositors[i];
    const amount = cfg.initialDepositsEth[i];

    await ensureBalance(
      deployer,
      signer,
      requiredBalance(amount, "1.0"),
      `challenge2 depositor [${index}]`
    );

    const tx = await vault.connect(signer).deposit({
      value: hre.ethers.utils.parseEther(String(amount))
    });
    await tx.wait();

    console.log(`  [${index}] ${signer.address} deposited ${amount} ETH`);
  }

  const totalBalance = await hre.ethers.provider.getBalance(vault.address);
  console.log(`\nVault balance: ${hre.ethers.utils.formatEther(totalBalance)} ETH`);

  console.log("\nVault balances:");
  for (let i = 0; i < depositors.length; i += 1) {
    const { index, signer } = depositors[i];
    const balance = await vault.balances(signer.address);
    console.log(`  [${index}] ${signer.address}: ${hre.ethers.utils.formatEther(balance)} ETH`);
  }

  const deploymentInfo = {
    instanceId: instance.instanceId,
    studentId: instance.studentId,
    network: hre.network.name,
    contractAddress: vault.address,
    deployer: deployer.address,
    totalBalance: hre.ethers.utils.formatEther(totalBalance),
    deposits: depositors.map(({ index, signer }, i) => ({
      signerIndex: index,
      address: signer.address,
      amount: cfg.initialDepositsEth[i]
    })),
    attackHints: {
      suggestedDepositEth: cfg.attackDepositEth,
      suggestedMaxAttacks: cfg.maxAttacks
    },
    deployedAt: new Date().toISOString()
  };

  fs.mkdirSync(path.join(process.cwd(), "deployments"), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), "deployments", "simple-vault.json"),
    `${JSON.stringify(deploymentInfo, null, 2)}\n`
  );

  console.log("\nChallenge 2 setup complete");
  console.log("Deployment info saved to deployments/simple-vault.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
