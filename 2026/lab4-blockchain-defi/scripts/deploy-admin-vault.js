const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { loadInstance, getAccountFromMnemonic } = require("./lib/instance-config");

function resolveSigners(signers, indices, label) {
  return indices.map((index) => {
    if (index < 0 || index >= signers.length) {
      throw new Error(`Invalid signer index for ${label}: ${index}`);
    }

    return { index, signer: signers[index] };
  });
}

function writeRelativeFile(relativePath, content) {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), normalized);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);

  return normalized;
}

async function main() {
  const instance = loadInstance({ required: true });
  const cfg = instance.challenge3;

  if (cfg.depositorAccountIndices.length !== cfg.initialDepositsEth.length) {
    throw new Error(
      "challenge3.depositorAccountIndices and challenge3.initialDepositsEth must have the same length"
    );
  }

  console.log("Deploying AdminVault for Challenge 3\n");
  console.log(`Instance: ${instance.instanceId}`);

  const signers = await hre.ethers.getSigners();
  const adminIndex = cfg.adminAccountIndex;

  if (adminIndex < 0 || adminIndex >= signers.length) {
    throw new Error(`Invalid adminAccountIndex: ${adminIndex}`);
  }

  const adminSigner = signers[adminIndex];
  const adminWallet = getAccountFromMnemonic(instance.chain.mnemonic, adminIndex);

  console.log(`Admin signer index: ${adminIndex}`);
  console.log(`Admin signer address: ${adminSigner.address}`);

  const AdminVault = await hre.ethers.getContractFactory("AdminVault", adminSigner);
  const vault = await AdminVault.deploy();
  await vault.deployed();

  const contractAdmin = await vault.admin();

  if (contractAdmin.toLowerCase() !== adminWallet.address.toLowerCase()) {
    throw new Error(
      `Derived admin mismatch. Expected ${adminWallet.address}, got ${contractAdmin}`
    );
  }

  console.log("AdminVault deployed to:", vault.address);
  console.log("Current admin:", contractAdmin);

  const depositors = resolveSigners(signers, cfg.depositorAccountIndices, "challenge3");

  console.log("\nFunding vault with per-student deposits...");
  for (let i = 0; i < depositors.length; i += 1) {
    const { index, signer } = depositors[i];
    const amount = cfg.initialDepositsEth[i];

    const tx = await vault.connect(signer).deposit({
      value: hre.ethers.utils.parseEther(String(amount))
    });
    await tx.wait();

    console.log(`  [${index}] ${signer.address} deposited ${amount} ETH`);
  }

  const totalBalance = await hre.ethers.provider.getBalance(vault.address);
  console.log(`\nVault balance: ${hre.ethers.utils.formatEther(totalBalance)} ETH`);

  console.log("\nCreating private-key leak scenario...");

  const leakFiles = cfg.leakFiles || {
    envBackup: ".env.backup",
    shellHistory: ".bash_history_fake",
    secretConfig: ".secret_config.json"
  };

  const envContent = [
    "# AdminVault recovery backup",
    `VAULT_ADDRESS=${vault.address}`,
    "NETWORK=localhost",
    "RPC_URL=http://127.0.0.1:7545",
    "",
    "# TODO remove this before committing",
    `ADMIN_PRIVATE_KEY=${adminWallet.privateKey}`,
    `FALLBACK_KEY=${cfg.decoyPrivateKeys[0]}`,
    ""
  ].join("\n");

  const shellHistoryContent = [
    "cd ~/lab4-blockchain-defi",
    "npm run deploy:admin",
    `export ADMIN_KEY=${adminWallet.privateKey}`,
    `export TEMP_KEY=${cfg.decoyPrivateKeys[1]}`,
    "ganache --networkId 1337",
    ""
  ].join("\n");

  const secretConfigContent = {
    note: "internal config - should never be committed",
    admin: {
      address: adminWallet.address,
      privateKey: adminWallet.privateKey
    },
    decoys: cfg.decoyPrivateKeys,
    vault: vault.address,
    instanceId: instance.instanceId
  };

  const writtenLeakFiles = [];
  writtenLeakFiles.push(writeRelativeFile(leakFiles.envBackup, `${envContent}\n`));
  writtenLeakFiles.push(writeRelativeFile(leakFiles.shellHistory, `${shellHistoryContent}\n`));
  writtenLeakFiles.push(
    writeRelativeFile(leakFiles.secretConfig, `${JSON.stringify(secretConfigContent, null, 2)}\n`)
  );

  writtenLeakFiles.forEach((relativePath) => {
    console.log(`  created ${relativePath}`);
  });

  const deploymentInfo = {
    instanceId: instance.instanceId,
    studentId: instance.studentId,
    network: hre.network.name,
    contractAddress: vault.address,
    admin: contractAdmin,
    adminSignerIndex: adminIndex,
    totalBalance: hre.ethers.utils.formatEther(totalBalance),
    deposits: depositors.map(({ index, signer }, i) => ({
      signerIndex: index,
      address: signer.address,
      amount: cfg.initialDepositsEth[i]
    })),
    hints: {
      privateKeyLocations: writtenLeakFiles
    },
    deployedAt: new Date().toISOString()
  };

  fs.mkdirSync(path.join(process.cwd(), "deployments"), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), "deployments", "admin-vault.json"),
    `${JSON.stringify(deploymentInfo, null, 2)}\n`
  );

  console.log("\nChallenge 3 setup complete");
  console.log("Deployment info saved to deployments/admin-vault.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
