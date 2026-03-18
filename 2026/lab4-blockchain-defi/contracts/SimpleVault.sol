// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleVault
 * @notice Vault folosit in Challenge 2.
 * @dev Contract educational pentru analiza ordinii operatiilor la retragere.
 *      Nu folosi acest cod in productie.
 */
contract SimpleVault {
    // Balanta fiecarui utilizator in vault.
    mapping(address => uint256) public balances;

    // Evidenta interna a depozitelor totale.
    uint256 public totalDeposits;

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
     * @notice Retragere partiala pe baza soldului curent.
     * @dev Executa transferul, apoi actualizeaza evidenta interna.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // Transfer catre apelant.
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        // Actualizare contabila dupa transfer.
        unchecked {
            balances[msg.sender] -= _amount;
            totalDeposits -= _amount;
        }

        emit Withdrawal(msg.sender, _amount);
    }

    /**
     * @notice Retragere integrala a soldului utilizatorului.
     * @dev Foloseste aceeasi ordine a operatiilor ca in withdraw().
     */
    function withdrawAll() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        // Transfer catre apelant.
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0;
        unchecked {
            totalDeposits -= balance;
        }

        emit Withdrawal(msg.sender, balance);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

/**
 * @title SimpleVaultSecure
 * @notice Implementare alternativa de referinta pentru comparatie.
 * @dev Foloseste lock simplu si alta ordine a operatiilor la retragere.
 */
contract SimpleVaultSecure {
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

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

    function withdraw(uint256 _amount) public noReentrancy {
        // 1) Verificari
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // 2) Actualizare evidenta
        balances[msg.sender] -= _amount;
        totalDeposits -= _amount;

        // 3) Transfer extern
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, _amount);
    }

    function withdrawAll() public noReentrancy {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        // Effects mai intai.
        balances[msg.sender] = 0;
        totalDeposits -= balance;

        // Interaction la final.
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, balance);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
