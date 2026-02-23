# 🖥️ VM Setup Guide - The DeFi Heist Lab

Acest ghid te va ajuta să configurezi mediul de lucru pentru laboratorul de Blockchain Security, fie folosind VM-ul pre-configurat, fie instalând manual toate dependențele.

## 📦 Opțiunea 1: VM Pre-configurat (Recomandat)

### Download & Import

1. **Descarcă VM-ul**:
   - Link: [DeFi-Heist-Lab-VM.ova](link-to-download)
   - Dimensiune: ~8 GB
   - Format: OVA (compatibil VirtualBox/VMware)

2. **Importă în VirtualBox**:
   ```
   File → Import Appliance → Select .ova file → Import
   ```

3. **Specificații recomandate**:
   - RAM: Minimum 4 GB, Recomandat 8 GB
   - CPU: 2 cores minimum
   - Storage: 20 GB
   - Network: Bridged sau NAT

4. **Pornește VM-ul**:
   - Username: `student`
   - Password: `cybersec2026`

### Ce este Pre-instalat?

✅ **Sistem de Operare**:
- Ubuntu 22.04 LTS
- XFCE Desktop Environment (lightweight)

✅ **Blockchain Tools**:
- Ganache CLI v7.7.0
- Ganache GUI v2.7.0
- Truffle Suite
- Hardhat

✅ **Development Environment**:
- Node.js v18.x
- NPM v9.x
- Python 3.10
- Git

✅ **IDE & Editors**:
- VS Code cu extensii:
  - Solidity (Juan Blanco)
  - Hardhat Solidity
  - Prettier - Code formatter
- Remix IDE (browser-based, bookmark pre-configurat)

✅ **Wallets**:
- MetaMask extension în Firefox
  - Pre-configurat pentru localhost:7545
  - 10 accounts imported cu keys din Ganache

✅ **Lab Materials**:
- Directorul `~/lab4-blockchain-defi/` conține:
  - Toate contractele vulnerabile
  - Scripturi helper
  - Generator pentru challenge data per student

### Quick Start în VM

```bash
# 1. Deschide terminal
Ctrl+Alt+T

# 2. Navighează în lab directory
cd ~/lab4-blockchain-defi

# 3. Generează instanța studentului
npm run init:student -- --student-id <email_ase_sau_matricol>

# 4. Pornește Ganache
./start-ganache.sh

# 5. Deploy contractele (în alt terminal)
npm run deploy:all

# 6. Deschide VS Code
code .

# 7. Deschide Firefox și Remix
firefox https://remix.ethereum.org &

# 8. (Opțional) Rulează testele
npm run test:all
```

---

## 🔧 Opțiunea 2: Setup Manual (Advanced)

Dacă preferi să instalezi pe propriul sistem sau să creezi propriul VM.

### Prerequisites

- Linux (Ubuntu 20.04+, Debian 11+) sau macOS
- Minimum 8 GB RAM
- 10 GB free disk space
- Internet connection

### Pasul 1: Instalare Node.js & NPM

#### Ubuntu/Debian:
```bash
# Instalare Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifică instalarea
node --version  # v18.x.x
npm --version   # 9.x.x
```

#### macOS:
```bash
# Folosind Homebrew
brew install node@18

# Verifică
node --version
npm --version
```

### Pasul 2: Instalare Ganache

#### Ganache CLI (Lightweight, recomandat pentru lab):
```bash
npm install -g ganache
```

Test:
```bash
ganache --version
# ganache v7.7.0
```

#### Ganache GUI (Optional, pentru visualizare):
```bash
# Ubuntu/Debian
wget https://github.com/trufflesuite/ganache-ui/releases/download/v2.7.0/ganache-2.7.0-linux-x86_64.AppImage
chmod +x ganache-2.7.0-linux-x86_64.AppImage
sudo mv ganache-2.7.0-linux-x86_64.AppImage /usr/local/bin/ganache

# macOS
brew install --cask ganache
```

### Pasul 3: Instalare Hardhat

```bash
# Global (optional, pentru comenzi quick)
npm install -g hardhat

# Per-project (recomandat)
# Se va face în pasul următor când clone-zi repo-ul
```

### Pasul 4: Clone Lab Repository

```bash
# Clone repo-ul lab-ului
git clone https://github.com/[username]/ase-cybersecurity.git
cd ase-cybersecurity/2026/lab4-blockchain-defi

# Instalează dependențele
npm install
```

Aceasta va instala:
- Hardhat
- Ethers.js
- OpenZeppelin Contracts
- Chai (pentru testing)
- Alte dependențe necesare

### Pasul 5: Configurare Hardhat

Fișierul `hardhat.config.js` este deja configurat, dar verifică:

```javascript
// hardhat.config.js
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",
      accounts: [
        // Ganache default accounts (deterministic cu seed)
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        // ... alte accounts
      ]
    },
    hardhat: {
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

### Pasul 6: Instalare VS Code & Extensii

#### Instalare VS Code:
```bash
# Ubuntu/Debian
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code

# macOS
brew install --cask visual-studio-code
```

#### Extensii Necesare:
```bash
# Instalare din command line
code --install-extension JuanBlanco.solidity
code --install-extension NomicFoundation.hardhat-solidity
code --install-extension esbenp.prettier-vscode
```

Sau din VS Code:
1. Ctrl+Shift+X (Extensions)
2. Caută "Solidity" → Install (Juan Blanco)
3. Caută "Hardhat" → Install
4. Caută "Prettier" → Install

### Pasul 7: Instalare MetaMask

#### Browser Extension:

**Firefox**:
```bash
firefox https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
```

**Chrome/Brave**:
```bash
# Deschide Chrome Web Store
# Caută "MetaMask"
# Add to Chrome
```

#### Configurare MetaMask pentru Ganache:

1. Deschide MetaMask
2. Click pe rețea (sus, "Ethereum Mainnet")
3. "Add Network" → "Add a network manually"
4. Completează:
   ```
   Network Name: Ganache Local
   RPC URL: http://127.0.0.1:7545
   Chain ID: 1337
   Currency Symbol: ETH
   ```
5. Save

#### Import Ganache Accounts:

Ganache generează 10 accounts cu 100 ETH fiecare. Importă-le în MetaMask:

1. Click pe icon profil → "Import Account"
2. Selectează "Private Key"
3. Paste prima cheie din Ganache:
   ```
   0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
   ```
4. Import
5. Repetă pentru alte accounts dacă e necesar

### Pasul 8: Verificare Setup

Rulează script-ul de verificare:

```bash
cd ~/lab4-blockchain-defi
npm run verify-setup
```

Output așteptat:
```
✅ Node.js: v18.16.0
✅ NPM: v9.5.1
✅ Hardhat: v2.14.0
✅ Ganache: Not running (will start manually)
✅ Git: v2.40.0
✅ Contract files found: 3
✅ Test files found: 3
✅ Scripts found: 8

🎉 Setup complete! Ready to start.

Next steps:
1. Start Ganache: ./start-ganache.sh
2. Deploy contracts: npm run deploy:all
3. Open VS Code: code .
```

### Pasul 9: Pornește Ganache

```bash
# În terminal dedicat (lasă-l running)
ganache --deterministic --networkId 1337 --port 7545

# Sau folosind script-ul helper:
./start-ganache.sh
```

Output:
```
Ganache CLI v7.7.0 (ganache-core: 2.13.2)

Available Accounts
==================
(0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (100 ETH)
(1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 (100 ETH)
...

Private Keys
==================
(0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
(1) 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
...

Listening on 127.0.0.1:7545
```

**IMPORTANT**: Salvează aceste Private Keys pentru import în MetaMask!

### Pasul 10: Deploy Contractele de Lab

```bash
# În alt terminal
cd ~/lab4-blockchain-defi

# Deploy toate contractele
npm run deploy:all

# Sau individual:
npm run deploy:vault        # SimpleVault (Challenge 2)
npm run deploy:admin        # AdminVault (Challenge 3)
npm run deploy:forensics    # Challenge 1 scenario
```

Output:
```
Deploying contracts to localhost...

SimpleVault deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  - Funded with 100 ETH
  - 5 deposits made from different accounts

AdminVault deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  - Funded with 50 ETH
  - Admin: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1

Challenge 1 scenario created:
  - Transaction hash: 0x8f4e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
  - Check challenge1-data.json for details

✅ All contracts deployed successfully!
```

---

## 📁 Structura Directorului Lab

După setup, directorul tău ar trebui să arate așa:

```
lab4-blockchain-defi/
├── contracts/              # Smart contracts
│   ├── SimpleVault.sol    # Challenge 2 - Reentrancy
│   ├── VaultAttacker.sol  # Attack contract pentru Challenge 2
│   ├── AdminVault.sol     # Challenge 3 - Access Control
│   └── ...
├── scripts/               # Deployment & helper scripts
│   ├── deploy-simple-vault.js
│   ├── deploy-admin-vault.js
│   ├── execute-attack.js
│   ├── trace-funds.js
│   └── ...
├── test/                  # Unit tests
│   ├── test-reentrancy.js
│   ├── test-access-control.js
│   └── ...
├── challenges/            # Challenge documentation
│   ├── challenge1-forensics.md
│   ├── challenge2-reentrancy.md
│   └── challenge3-access-control.md
├── hardhat.config.js     # Hardhat configuration
├── package.json          # Dependencies
├── README.md             # Lab overview
└── start-ganache.sh      # Quick start script
```

---

## 🚀 Comenzi Utile

### Development

```bash
# Compilează contractele
npx hardhat compile

# Rulează toate testele
npx hardhat test

# Rulează un test specific
npx hardhat test test/test-reentrancy.js

# Deploy contract
npx hardhat run scripts/deploy-simple-vault.js --network localhost

# Deschide Hardhat console
npx hardhat console --network localhost
```

### Ganache

```bash
# Pornește cu seed deterministic (aceleași accounts)
ganache --deterministic

# Pornește cu mai multe accounts
ganache --accounts 20

# Pornește cu balanță custom
ganache --defaultBalanceEther 1000

# Pornește cu block time custom (pentru testing)
ganache --blockTime 3  # 3 seconds per block
```

### Debugging

```bash
# Vezi log-urile Ganache în detaliu
ganache --verbose

# Resetează Ganache (șterge toate datele)
# Pur și simplu restart process-ul

# Verifică conexiunea la Ganache
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:7545
```

---

## 🐛 Troubleshooting

### Problema: "Error: Cannot connect to Ganache"

**Soluție**:
```bash
# Verifică că Ganache rulează
ps aux | grep ganache

# Dacă nu rulează, pornește-l
ganache --deterministic --port 7545

# Verifică că portul 7545 e liber
lsof -i :7545
```

### Problema: "Error: Nonce too high"

**Cauză**: MetaMask are nonce-ul desincronizat cu Ganache (după restart).

**Soluție**:
1. MetaMask → Settings → Advanced
2. "Reset Account" (șterge transaction history)
3. Try again

### Problema: "Contract not deployed"

**Soluție**:
```bash
# Re-deploy contractele
npm run deploy:all

# Verifică că Ganache rulează și e în sync
npx hardhat console --network localhost
> const provider = ethers.provider;
> await provider.getBlockNumber();
```

### Problema: "Gas estimation failed"

**Cauză**: Transaction va eșua (revert).

**Soluție**:
1. Verifică că ai suficient ETH în account
2. Verifică că apelezi funcția corectă cu parametrii corecți
3. Verifică în Remix sau hardhat console:
   ```javascript
   await contract.functionName.estimateGas(params);
   ```

### Problema: MetaMask nu se conectează la Ganache

**Soluție**:
1. Verifică că network-ul "Ganache Local" e configurat corect
2. RPC URL: `http://127.0.0.1:7545` (nu `localhost`)
3. Chain ID: `1337`
4. Încearcă "Reset Account" în MetaMask

---

## 📚 Resurse Adiționale

### Documentație Oficială

- [Hardhat Docs](https://hardhat.org/docs)
- [Ganache Docs](https://trufflesuite.com/docs/ganache/)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Solidity Docs](https://docs.soliditylang.org/)

### Video Tutorials

- [Hardhat Tutorial - Patrick Collins](https://www.youtube.com/watch?v=gyMwXuJrbJQ)
- [Ganache Setup Guide](https://www.youtube.com/watch?v=nUEBAS5r4Og)
- [MetaMask Setup](https://www.youtube.com/watch?v=Af_lQ1zUnoM)

### Community

- [Hardhat Discord](https://discord.gg/hardhat)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [r/ethdev](https://www.reddit.com/r/ethdev/)

---

## ✅ Checklist Final

Înainte de a începe lab-ul, asigură-te că:

- [ ] Ganache rulează pe port 7545
- [ ] MetaMask e instalat și configurat pentru Ganache
- [ ] Ai importat cel puțin un account din Ganache în MetaMask
- [ ] Contractele sunt deployed (rulează `npm run deploy:all`)
- [ ] Poți compila contractele (`npx hardhat compile`)
- [ ] Testele trec (`npx hardhat test`)
- [ ] VS Code e instalat cu extensiile Solidity și Hardhat
- [ ] Ai citit README-ul principal al lab-ului

**Dacă toate sunt bifate, ești gata să începi! 🚀**

---

**Succes la setup! Dacă întâmpini probleme, contactează instructorul.**

📧 lcretu@bitdefender.com
