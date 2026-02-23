// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleVault
 * @notice Contract VULNERABIL pentru Challenge 2 - The DeFi Heist Lab
 * @dev Acest contract conține o vulnerabilitate de REENTRANCY
 * 
 * ATENȚIE: Acest contract este intenționat vulnerabil pentru scopuri educaționale.
 * NU UTILIZA în producție!
 */
contract SimpleVault {
    // Mapping pentru a urmări balanțele utilizatorilor
    mapping(address => uint256) public balances;
    
    // Totalul fondurilor din vault
    uint256 public totalDeposits;
    
    // Event emis la depunere
    event Deposit(address indexed user, uint256 amount);
    
    // Event emis la retragere
    event Withdrawal(address indexed user, uint256 amount);
    
    /**
     * @notice Permite utilizatorilor să depună ETH în vault
     */
    function deposit() public payable {
        require(msg.value > 0, "Must deposit some ETH");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Permite utilizatorilor să verifice balanța lor
     */
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
    
    /**
     * @notice Permite utilizatorilor să retragă o sumă specifică
     * @param _amount Suma de retras
     * 
     * ⚠️ VULNERABILITATE: Reentrancy Attack
     * Problema: call() este făcut ÎNAINTE de actualizarea balanței
     * Un atacator poate apela recursiv withdraw() înainte ca balanța să fie actualizată
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // ❌ VULNERABIL: Trimitem ETH înainte de a actualiza starea
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        // ❌ Actualizăm balanța DUPĂ ce am trimis ETH
        // Dacă msg.sender este un contract, poate apela din nou withdraw()
        // Intenționat nesigur pentru laborator: permitem underflow (model Solidity <0.8)
        unchecked {
            balances[msg.sender] -= _amount;
            totalDeposits -= _amount;
        }
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    /**
     * @notice Permite utilizatorilor să retragă întreaga balanță
     * 
     * ⚠️ VULNERABILITATE: Același pattern vulnerabil ca la withdraw()
     */
    function withdrawAll() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        // ❌ VULNERABIL: Același pattern
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
        // Intenționat nesigur pentru laborator
        unchecked {
            totalDeposits -= balance;
        }
        
        emit Withdrawal(msg.sender, balance);
    }
    
    /**
     * @notice Returnează balanța totală a contractului
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}


/**
 * @title SimpleVaultSecure
 * @notice Versiunea SECURIZATĂ a contractului pentru comparație
 * @dev Implementează pattern-ul Checks-Effects-Interactions
 */
contract SimpleVaultSecure {
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    
    // ReentrancyGuard simplu
    bool private locked;
    
    modifier noReentrancy() {
        require(!locked, "No reentrancy allowed");
        locked = true;
        _;
        locked = false;
    }
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    function deposit() public payable {
        require(msg.value > 0, "Must deposit some ETH");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
    
    /**
     * @notice Versiune SECURIZATĂ - Checks-Effects-Interactions pattern
     * 
     * ✅ SECURIZAT:
     * 1. CHECKS: Verificăm condițiile (require)
     * 2. EFFECTS: Actualizăm starea contractului
     * 3. INTERACTIONS: Abia apoi interacționăm cu alte contracte
     */
    function withdraw(uint256 _amount) public noReentrancy {
        // 1. CHECKS
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // 2. EFFECTS - Actualizăm starea ÎNAINTE de transfer
        balances[msg.sender] -= _amount;
        totalDeposits -= _amount;
        
        // 3. INTERACTIONS - Abia acum trimitem ETH
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    function withdrawAll() public noReentrancy {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        // Pattern corect: Effects apoi Interactions
        balances[msg.sender] = 0;
        totalDeposits -= balance;
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, balance);
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
