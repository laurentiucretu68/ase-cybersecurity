const { ethers } = require("ethers");

function requiredBalance(amountEth, extraEth = "1.0") {
  return ethers.utils
    .parseEther(String(amountEth))
    .add(ethers.utils.parseEther(String(extraEth)));
}

async function ensureBalance(faucetSigner, targetSigner, minBalanceWei, label) {
  const provider = faucetSigner.provider;
  const currentBalance = await provider.getBalance(targetSigner.address);

  if (currentBalance.gte(minBalanceWei)) {
    return;
  }

  try {
    await provider.send("evm_setAccountBalance", [
      targetSigner.address,
      ethers.BigNumber.from(minBalanceWei).toHexString()
    ]);

    const updatedBalance = await provider.getBalance(targetSigner.address);
    if (updatedBalance.gte(minBalanceWei)) {
      console.log(
        `  set balance for ${label}: ${ethers.utils.formatEther(updatedBalance)} ETH -> ${targetSigner.address}`
      );
      return;
    }
  } catch (_error) {
    // Fall back to on-chain funding when the local RPC method is unavailable.
  }

  const topUpWei = minBalanceWei.sub(currentBalance);
  const tx = await faucetSigner.sendTransaction({
    to: targetSigner.address,
    value: topUpWei
  });

  await tx.wait();
  console.log(
    `  funded ${label}: ${ethers.utils.formatEther(topUpWei)} ETH -> ${targetSigner.address}`
  );
}

module.exports = {
  ensureBalance,
  requiredBalance
};
