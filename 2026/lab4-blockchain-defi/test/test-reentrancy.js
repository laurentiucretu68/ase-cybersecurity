// Test suite for SimpleVault Reentrancy vulnerability
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("SimpleVault - Reentrancy Vulnerability Tests", function () {
  let vault;
  let attacker;
  let owner, user1, user2, attackerAccount;

  beforeEach(async function () {
    // Keep tests deterministic even with lower account balances.
    await network.provider.send("hardhat_reset");

    // Get signers
    [owner, user1, user2, attackerAccount] = await ethers.getSigners();

    // Deploy SimpleVault
    const SimpleVault = await ethers.getContractFactory("SimpleVault");
    vault = await SimpleVault.deploy();
    await vault.deployed();

    // Fund the vault with multiple deposits
    await vault.connect(user1).deposit({ value: ethers.utils.parseEther("30") });
    await vault.connect(user2).deposit({ value: ethers.utils.parseEther("20") });
    await vault.connect(owner).deposit({ value: ethers.utils.parseEther("50") });
  });

  describe("Normal Operations", function () {
    it("Should allow deposits", async function () {
      const balanceBefore = await vault.balances(user1.address);
      
      await vault.connect(user1).deposit({ value: ethers.utils.parseEther("10") });
      
      const balanceAfter = await vault.balances(user1.address);
      expect(balanceAfter).to.equal(balanceBefore.add(ethers.utils.parseEther("10")));
    });

    it("Should allow legitimate withdrawals", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const vaultBalance = await vault.balances(user1.address);

      const tx = await vault.connect(user1).withdraw(ethers.utils.parseEther("10"));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await ethers.provider.getBalance(user1.address);
      const expected = initialBalance.add(ethers.utils.parseEther("10")).sub(gasUsed);

      expect(finalBalance).to.be.closeTo(expected, ethers.utils.parseEther("0.01"));
    });

    it("Should track total deposits correctly", async function () {
      const totalDeposits = await vault.totalDeposits();
      expect(totalDeposits).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should prevent withdrawal of more than balance", async function () {
      await expect(
        vault.connect(user1).withdraw(ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Reentrancy Attack", function () {
    beforeEach(async function () {
      // Deploy the attacker contract
      const VaultAttacker = await ethers.getContractFactory("VaultAttacker");
      attacker = await VaultAttacker.connect(attackerAccount).deploy(vault.address);
      await attacker.deployed();
    });

    it("Should be vulnerable to reentrancy attack", async function () {
      const vaultBalanceBefore = await ethers.provider.getBalance(vault.address);
      console.log(`\n  📊 Vault balance before attack: ${ethers.utils.formatEther(vaultBalanceBefore)} ETH`);

      // Step 1: Attacker deposits ETH
      const depositAmount = ethers.utils.parseEther("1");
      await attacker.connect(attackerAccount).depositToVault({ value: depositAmount });
      console.log(`  💰 Attacker deposited: ${ethers.utils.formatEther(depositAmount)} ETH`);

      // Step 2: Execute the attack
      console.log(`  ⚔️  Executing reentrancy attack...`);
      const attackTx = await attacker.connect(attackerAccount).attack();
      const receipt = await attackTx.wait();

      // Check results
      const vaultBalanceAfter = await ethers.provider.getBalance(vault.address);
      const attackerContractBalance = await ethers.provider.getBalance(attacker.address);

      console.log(`  📊 Vault balance after attack: ${ethers.utils.formatEther(vaultBalanceAfter)} ETH`);
      console.log(`  💸 Attacker contract balance: ${ethers.utils.formatEther(attackerContractBalance)} ETH`);

      const stolen = vaultBalanceBefore.sub(vaultBalanceAfter).sub(depositAmount);
      console.log(`  🚨 Amount stolen: ${ethers.utils.formatEther(stolen)} ETH`);
      console.log(`  ⛽ Gas used: ${receipt.gasUsed.toString()}`);

      // Verify that more than the deposit was withdrawn (proof of reentrancy)
      expect(attackerContractBalance).to.be.gt(depositAmount);
      
      // Verify vault was drained (at least partially)
      expect(vaultBalanceAfter).to.be.lt(vaultBalanceBefore);
    });

    it("Should allow attacker to extract stolen funds", async function () {
      // First, perform the attack
      await attacker.connect(attackerAccount).depositToVault({ 
        value: ethers.utils.parseEther("1") 
      });
      await attacker.connect(attackerAccount).attack();

      // Get attacker's initial balance
      const attackerBalanceBefore = await ethers.provider.getBalance(attackerAccount.address);
      const contractBalance = await ethers.provider.getBalance(attacker.address);

      // Extract funds
      const extractTx = await attacker.connect(attackerAccount).extractStolenFunds();
      const receipt = await extractTx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      // Verify funds were extracted
      const attackerBalanceAfter = await ethers.provider.getBalance(attackerAccount.address);
      const profit = attackerBalanceAfter.sub(attackerBalanceBefore).add(gasUsed);

      console.log(`\n  💰 Profit extracted: ${ethers.utils.formatEther(profit)} ETH`);

      expect(profit).to.be.closeTo(contractBalance, ethers.utils.parseEther("0.01"));
    });

    it("Should show multiple reentrancy calls", async function () {
      await attacker.connect(attackerAccount).depositToVault({ 
        value: ethers.utils.parseEther("1") 
      });

      // Listen for ReentrancyTriggered events
      const attackTx = await attacker.connect(attackerAccount).attack();
      const receipt = await attackTx.wait();

      // Count reentrancy events
      const reentrancyEvents = receipt.events.filter(
        e => e.event === "ReentrancyTriggered"
      );

      console.log(`\n  🔄 Number of reentrancy calls: ${reentrancyEvents.length}`);
      
      reentrancyEvents.forEach((event, index) => {
        console.log(`    ${index + 1}. Reentrancy count: ${event.args.count}`);
      });

      expect(reentrancyEvents.length).to.be.gt(1); // Multiple calls = reentrancy
    });
  });

  describe("Secure Vault (Comparison)", function () {
    let secureVault;

    beforeEach(async function () {
      // Deploy the secure version
      const SimpleVaultSecure = await ethers.getContractFactory("SimpleVaultSecure");
      secureVault = await SimpleVaultSecure.deploy();
      await secureVault.deployed();

      // Fund it
      await secureVault.connect(user1).deposit({ value: ethers.utils.parseEther("30") });
      await secureVault.connect(user2).deposit({ value: ethers.utils.parseEther("20") });
    });

    it("Should NOT be vulnerable to reentrancy", async function () {
      // Deploy attacker targeting secure vault
      const VaultAttacker = await ethers.getContractFactory("VaultAttacker");
      const attacker = await VaultAttacker.connect(attackerAccount).deploy(secureVault.address);
      await attacker.deployed();

      const vaultBalanceBefore = await ethers.provider.getBalance(secureVault.address);

      // Deposit and attempt attack
      await attacker.connect(attackerAccount).depositToVault({ 
        value: ethers.utils.parseEther("1") 
      });

      // This should fail or only withdraw the legitimate amount
      await expect(
        attacker.connect(attackerAccount).attack()
      ).to.be.revertedWith("Transfer failed");
    });

    it("Should allow normal withdrawals", async function () {
      await secureVault.connect(user1).withdraw(ethers.utils.parseEther("10"));
      
      const balance = await secureVault.balances(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("20"));
    });
  });
});
