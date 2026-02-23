const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { loadInstance } = require("./lib/instance-config");

function resolveSigner(signers, index, label) {
  if (index < 0 || index >= signers.length) {
    throw new Error(`Invalid signer index for ${label}: ${index}`);
  }

  return signers[index];
}

async function main() {
  const instance = loadInstance({ required: true });
  const cfg = instance.challenge1;

  if (cfg.hopAccountIndices.length !== cfg.transferAmountsEth.length) {
    throw new Error(
      "challenge1.hopAccountIndices and challenge1.transferAmountsEth must have the same length"
    );
  }

  console.log("Setting up Challenge 1 (Blockchain Forensics)\n");
  console.log(`Instance: ${instance.instanceId}`);

  const signers = await hre.ethers.getSigners();
  const companySigner = resolveSigner(signers, cfg.companyAccountIndex, "challenge1 company");
  const hopSigners = cfg.hopAccountIndices.map((index) =>
    resolveSigner(signers, index, "challenge1 hop")
  );

  const provider = hre.ethers.provider;

  const transfers = [];
  let initialTxHash = null;
  let totalGasFeeWei = hre.ethers.BigNumber.from(0);

  for (let i = 0; i < hopSigners.length; i += 1) {
    const sender = i === 0 ? companySigner : hopSigners[i - 1];
    const receiver = hopSigners[i];
    const amountEth = cfg.transferAmountsEth[i];

    const txRequest = {
      to: receiver.address,
      value: hre.ethers.utils.parseEther(String(amountEth)),
      gasPrice: hre.ethers.BigNumber.from(String(instance.chain.gasPriceWei))
    };

    if (i === 0) {
      txRequest.data = cfg.messageHex;
    }

    const tx = await sender.sendTransaction(txRequest);
    const receipt = await tx.wait();
    const block = await provider.getBlock(receipt.blockNumber);
    const gasPrice = tx.gasPrice || receipt.effectiveGasPrice;
    const gasFeeWei = receipt.gasUsed.mul(gasPrice);

    totalGasFeeWei = totalGasFeeWei.add(gasFeeWei);

    if (!initialTxHash) {
      initialTxHash = tx.hash;
    }

    transfers.push({
      step: i + 1,
      txHash: tx.hash,
      from: sender.address,
      fromSignerIndex: i === 0 ? cfg.companyAccountIndex : cfg.hopAccountIndices[i - 1],
      to: receiver.address,
      toSignerIndex: cfg.hopAccountIndices[i],
      amountEth: String(amountEth),
      gasUsed: receipt.gasUsed.toString(),
      gasPriceWei: gasPrice.toString(),
      gasFeeEth: hre.ethers.utils.formatEther(gasFeeWei),
      blockNumber: receipt.blockNumber,
      timestamp: block.timestamp
    });

    console.log(
      `  transfer ${i + 1}: [${i === 0 ? cfg.companyAccountIndex : cfg.hopAccountIndices[i - 1]}] ${sender.address} -> [${cfg.hopAccountIndices[i]}] ${receiver.address} (${amountEth} ETH)`
    );
  }

  const challengeData = {
    instanceId: instance.instanceId,
    studentId: instance.studentId,
    generatedAt: new Date().toISOString(),
    companyWallet: {
      signerIndex: cfg.companyAccountIndex,
      address: companySigner.address
    },
    initialTransactionHash: initialTxHash,
    stolenAmountEth: cfg.transferAmountsEth[0],
    secretMessageHex: cfg.messageHex,
    secretMessage: cfg.message,
    transferCount: transfers.length,
    transfers,
    finalDestination: {
      signerIndex: cfg.hopAccountIndices[cfg.hopAccountIndices.length - 1],
      address: hopSigners[hopSigners.length - 1].address,
      amountEth: cfg.transferAmountsEth[cfg.transferAmountsEth.length - 1]
    },
    totalGasFeeEth: hre.ethers.utils.formatEther(totalGasFeeWei)
  };

  fs.mkdirSync(path.join(process.cwd(), "deployments"), { recursive: true });

  const deploymentPath = path.join(process.cwd(), "deployments", "challenge1-data.json");
  const rootPath = path.join(process.cwd(), "challenge1-data.json");

  fs.writeFileSync(deploymentPath, `${JSON.stringify(challengeData, null, 2)}\n`);
  fs.writeFileSync(rootPath, `${JSON.stringify(challengeData, null, 2)}\n`);

  console.log("\nChallenge 1 setup complete");
  console.log(`Initial tx hash: ${initialTxHash}`);
  console.log(`Data saved to ${path.relative(process.cwd(), deploymentPath)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
