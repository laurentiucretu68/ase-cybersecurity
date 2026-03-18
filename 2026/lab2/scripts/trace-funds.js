#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { loadInstance } = require("./lib/instance-config");

function parseArgs(argv) {
  if (!argv[0]) {
    return null;
  }

  const txHash = argv[0];
  const maxSteps = argv[1] ? Number(argv[1]) : 10;

  return {
    txHash,
    maxSteps: Number.isFinite(maxSteps) && maxSteps > 0 ? maxSteps : 10
  };
}

function formatEth(value) {
  return ethers.utils.formatEther(value);
}

function loadChallengeData(projectRoot) {
  const candidates = [
    path.join(projectRoot, "deployments", "challenge1-data.json"),
    path.join(projectRoot, "challenge1-data.json")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }

  return null;
}

function printTraceFromGeneratedData(challengeData, txHash) {
  const transfers = challengeData.transfers || [];
  const startIndex = transfers.findIndex(
    (transfer) => transfer.txHash.toLowerCase() === txHash.toLowerCase()
  );

  if (startIndex < 0) {
    return false;
  }

  const subset = transfers.slice(startIndex);
  let totalGas = ethers.BigNumber.from(0);

  console.log(`Tracing from generated challenge data (instance ${challengeData.instanceId})`);
  subset.forEach((transfer) => {
    const gasFeeWei = ethers.utils.parseEther(String(transfer.gasFeeEth));
    totalGas = totalGas.add(gasFeeWei);

    console.log(
      `Transfer ${transfer.step}: ${transfer.from} -> ${transfer.to} | ${transfer.amountEth} ETH | gas ${transfer.gasFeeEth} ETH`
    );
  });

  const first = subset[0];
  const last = subset[subset.length - 1];
  const elapsed = last.timestamp - first.timestamp;

  console.log(`Final destination: ${last.to}`);
  console.log(`Final amount: ${last.amountEth} ETH`);
  console.log(`Elapsed time: ${elapsed} seconds`);
  console.log(`Total gas spent: ${formatEth(totalGas)} ETH`);

  return true;
}

async function findNextOutgoingTx(provider, fromAddress, fromBlock, latestBlock) {
  for (let blockNumber = fromBlock + 1; blockNumber <= latestBlock; blockNumber += 1) {
    const block = await provider.getBlockWithTransactions(blockNumber);
    const match = block.transactions.find(
      (transaction) => transaction.from.toLowerCase() === fromAddress.toLowerCase()
    );

    if (match) {
      return match;
    }
  }

  return null;
}

async function traceFromChain(provider, txHash, maxSteps) {
  const firstTx = await provider.getTransaction(txHash);
  if (!firstTx) {
    throw new Error(`Transaction not found: ${txHash}`);
  }

  const latestBlock = await provider.getBlockNumber();
  const transfers = [];

  let currentTx = firstTx;
  let steps = 0;

  while (currentTx && steps < maxSteps) {
    const receipt = await provider.getTransactionReceipt(currentTx.hash);
    const block = await provider.getBlock(currentTx.blockNumber);
    const gasPrice = currentTx.gasPrice || receipt.effectiveGasPrice;
    const gasFee = receipt.gasUsed.mul(gasPrice);

    transfers.push({
      hash: currentTx.hash,
      from: currentTx.from,
      to: currentTx.to,
      amountWei: currentTx.value,
      amountEth: formatEth(currentTx.value),
      gasFeeWei: gasFee,
      gasFeeEth: formatEth(gasFee),
      blockNumber: currentTx.blockNumber,
      timestamp: block.timestamp
    });

    if (!currentTx.to) {
      break;
    }

    const nextTx = await findNextOutgoingTx(provider, currentTx.to, currentTx.blockNumber, latestBlock);
    if (!nextTx) {
      break;
    }

    currentTx = nextTx;
    steps += 1;
  }

  return transfers;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args) {
    console.error("Usage: node scripts/trace-funds.js <txHash> [maxSteps]");
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, "..");
  const challengeData = loadChallengeData(projectRoot);

  if (challengeData && printTraceFromGeneratedData(challengeData, args.txHash)) {
    return;
  }

  const instance = loadInstance();
  const provider = new ethers.providers.JsonRpcProvider(
    `http://127.0.0.1:${instance.chain.port}`
  );

  const transfers = await traceFromChain(provider, args.txHash, args.maxSteps);
  if (!transfers.length) {
    console.log("No transfers found.");
    return;
  }

  let totalGas = ethers.BigNumber.from(0);
  transfers.forEach((transfer, index) => {
    totalGas = totalGas.add(transfer.gasFeeWei);
    console.log(
      `Transfer ${index + 1}: ${transfer.from} -> ${transfer.to} | ${transfer.amountEth} ETH | gas ${transfer.gasFeeEth} ETH`
    );
  });

  const first = transfers[0];
  const last = transfers[transfers.length - 1];
  const elapsed = last.timestamp - first.timestamp;

  console.log(`Final destination: ${last.to}`);
  console.log(`Final amount: ${last.amountEth} ETH`);
  console.log(`Elapsed time: ${elapsed} seconds`);
  console.log(`Total gas spent: ${formatEth(totalGas)} ETH`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
