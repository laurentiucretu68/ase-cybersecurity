#!/usr/bin/env node

const { ethers } = require("ethers");
const { loadInstance } = require("./lib/instance-config");

function parseArgs(argv) {
  const args = { txHash: null, showInput: false };

  argv.forEach((token) => {
    if (token === "--show-input") {
      args.showInput = true;
      return;
    }

    if (!args.txHash) {
      args.txHash = token;
    }
  });

  return args;
}

function formatEth(value) {
  return ethers.utils.formatEther(value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.txHash) {
    console.error("Usage: node scripts/inspect-transaction.js <txHash> [--show-input]");
    process.exit(1);
  }

  const instance = loadInstance();
  const rpcUrl = `http://127.0.0.1:${instance.chain.port}`;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const tx = await provider.getTransaction(args.txHash);
  if (!tx) {
    throw new Error(`Transaction not found: ${args.txHash}`);
  }

  const receipt = await provider.getTransactionReceipt(args.txHash);
  const block = await provider.getBlock(tx.blockNumber);

  const gasPrice = tx.gasPrice || receipt.effectiveGasPrice;
  const gasFee = receipt.gasUsed.mul(gasPrice);

  console.log("Transaction details");
  console.log("-------------------");
  console.log(`Hash: ${tx.hash}`);
  console.log(`From: ${tx.from}`);
  console.log(`To: ${tx.to}`);
  console.log(`Value: ${formatEth(tx.value)} ETH`);
  console.log(`Block: ${tx.blockNumber}`);
  console.log(`Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Gas price: ${gasPrice.toString()} wei`);
  console.log(`Gas fee: ${formatEth(gasFee)} ETH`);

  if (args.showInput) {
    console.log(`Input data: ${tx.data}`);

    if (tx.data && tx.data !== "0x") {
      try {
        const decoded = ethers.utils.toUtf8String(tx.data);
        console.log(`Input ASCII: ${decoded}`);
      } catch (_error) {
        console.log("Input ASCII: <not valid UTF-8>");
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
