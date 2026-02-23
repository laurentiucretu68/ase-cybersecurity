# 🔐 Lab 4: The DeFi Heist - Blockchain Security & Smart Contract Auditing

> **Scenariul**: Ești Security Auditor la **EtherBank**, o nouă bancă de investiții DeFi (Decentralized Finance). Banca a lansat un nou protocol de împrumuturi, dar există suspiciuni de fraudă internă și vulnerabilități critice în smart contracts. Misiunea ta: identifică vulnerabilitățile, recuperează fondurile furate și securizează sistemul.

## 🎯 Obiectivele Laboratorului

La finalul acestui laborator vei înțelege:
- Cum funcționează blockchain-ul Ethereum și tranzacțiile
- Structura și analiza smart contracts (Solidity)
- Vulnerabilități comune în DeFi: Reentrancy, Access Control, Integer Overflow
- Tehnici de forensics blockchain
- Securitatea cheilor private și a wallet-urilor

## 📋 Pregătirea Mediului

### Varianta 1: Utilizare VM (Recomandat)
Descarcă și importă VM-ul pre-configurat care conține toate dependențele necesare:
- [Download VM - The DeFi Heist Lab](link-to-vm)
- Username: `student` | Password: `cybersec2026`

**Ce conține VM-ul:**
- ✅ Ubuntu 22.04 LTS cu XFCE Desktop
- ✅ Ganache CLI & GUI (blockchain local)
- ✅ Node.js 18+ & NPM
- ✅ Hardhat Development Environment
- ✅ VS Code cu extensia Solidity
- ✅ MetaMask pre-configurat pentru rețeaua locală
- ✅ Remix IDE (browser-based)
- ✅ Toate contractele vulnerabile pre-deployed

### Varianta 2: Setup Manual (Advanced)
Dacă preferi să instalezi local, urmează ghidul de setup: [VM Setup Guide](vm-setup/README.md)

### Instanță Unică Per Student (Obligatoriu)
Înainte de deploy, fiecare student trebuie să își genereze instanța proprie:

```bash
npm run init:student -- --student-id <email_ase_sau_matricol>
```

Acest pas personalizează mnemonic-ul, adresele, sumele și datele challenges.

Pentru instructor:

```bash
# generează instanțe pentru listă de studenți
npm run init:batch -- --file students.txt --salt "<secret>" --force

# curăță toate artefactele generate
npm run clean:generated

# corectare semi-automată pentru un student
npm run grade:submission -- --student-id <id> --submission-dir <folder>
```

## 🎮 Structura Challenges

### 🥉 Challenge 1: Blockchain Forensics (20 puncte)
**Dificultate**: Beginner  
**Durată estimată**: 30-45 minute

**Povestea**: Un angajat al EtherBank a furat fonduri din portofelul companiei. Urmărește fluxul banilor și descoperă mesajul secret lăsat de hacker.

Notă: valorile exacte (hash, adrese, sume, mesaj) sunt generate per student în `challenge1-data.json`.

**Obiective:**
- Identifică adresa finală unde au ajuns fondurile
- Decodează mesajul hex din "Input Data" al tranzacției
- Înțelege conceptele: Gas fees, Block Explorer, Transaction tracing

📂 [Accesează Challenge 1](challenges/challenge1-forensics.md)

---

### 🥈 Challenge 2: Reentrancy Attack (40 puncte)
**Dificultate**: Intermediate  
**Durată estimată**: 60-90 minute

**Povestea**: Contractul **SimpleVault** al EtherBank permite clienților să depună și să retragă ETH. Un audit intern a descoperit că există o vulnerabilitate de tip Reentrancy care permite unui atacator să dreneze toate fondurile din contract.

**Obiective:**
- Analizează codul contractului `SimpleVault.sol`
- Identifică vulnerabilitatea de Reentrancy
- Scrie un contract de attack care exploatează vulnerabilitatea
- Drenează fondurile din vault în contul tău
- Înțelege pattern-ul Checks-Effects-Interactions

📂 [Accesează Challenge 2](challenges/challenge2-reentrancy.md)

---

### 🥇 Challenge 3: Access Control & Private Keys (40 puncte)
**Dificultate**: Advanced  
**Durată estimată**: 60-90 minute

**Povestea**: Administratorul EtherBank și-a salvat cheia privată într-un fișier "sigur" pe server, dar a uitat o copie în `.bash_history`. Mai mult, contractul **AdminVault** are un bug de Access Control care permite oricui să devină administrator.

**Obiective:**
- Scanează VM-ul pentru a găsi cheia privată ascunsă
- Exploatează vulnerabilitatea de Access Control în contract
- Importă cheia în MetaMask și recuperează fondurile
- Înțelege riscurile: Environment variables, Private key storage, Access modifiers

📂 [Accesează Challenge 3](challenges/challenge3-access-control.md)

---

## 🛠️ Instrumente Utilizate

| Tool | Descriere | Utilitate în Lab |
|------|-----------|------------------|
| **Ganache** | Blockchain Ethereum local | Testare rapidă fără costuri reale |
| **Hardhat** | Framework de dezvoltare | Compilare, deploy, testing contracts |
| **Remix IDE** | IDE browser pentru Solidity | Editare și testare rapidă |
| **MetaMask** | Wallet Ethereum | Interacțiune cu contractele |
| **Etherscan (Local)** | Block explorer | Investigarea tranzacțiilor |
| **VS Code** | Editor de cod | Dezvoltare scripturi și contracte |

## 📚 Concepte Cheie

### Blockchain & Ethereum
- **Block**: Grup de tranzacții validate
- **Transaction**: Transfer de valoare sau executare de funcție
- **Gas**: Cost de procesare al tranzacțiilor
- **Smart Contract**: Cod executabil pe blockchain

### Vulnerabilități DeFi Comune

#### 1. Reentrancy Attack
```solidity
// VULNERABIL
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    msg.sender.call{value: amount}(""); // ❌ Apelează înainte de update
    balances[msg.sender] -= amount;     // Prea târziu!
}
```

#### 2. Access Control Issues
```solidity
// VULNERABIL
function setAdmin(address newAdmin) public {
    admin = newAdmin; // ❌ Oricine poate deveni admin!
}

// SECURIZAT
function setAdmin(address newAdmin) public {
    require(msg.sender == admin, "Only admin");
    admin = newAdmin;
}
```

#### 3. Integer Overflow (Solidity < 0.8.0)
```solidity
// VULNERABIL în versiuni vechi
uint8 value = 255;
value += 1; // Devine 0 prin overflow
```

## 🎓 Sistem de Notare

| Challenge | Puncte | Detalii |
|-----------|--------|---------|
| Challenge 1 | 20p | 10p investigație + 10p decoding |
| Challenge 2 | 40p | 15p analiza + 25p exploit |
| Challenge 3 | 40p | 15p private key + 25p access control |
| **Total** | **100p** | Nota = Puncte obținute / 10 |

**Bonus (+10p)**: Scrie un raport de securitate cu recomandări pentru fiecare vulnerabilitate găsită.

## 📖 Resurse Suplimentare

### Documentație Oficială
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethereum Development Documentation](https://ethereum.org/en/developers/docs/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### Security Resources
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Ethernaut CTF](https://ethernaut.openzeppelin.com/) - Practice challenges
- [Damn Vulnerable DeFi](https://www.damnvulnerabledefi.xyz/) - Advanced challenges
- [SWC Registry](https://swcregistry.io/) - Smart Contract Weakness Classification

### Video Tutorials
- [Blockchain 101](https://www.youtube.com/watch?v=_160oMzblY8)
- [Solidity in 2 Hours](https://www.youtube.com/watch?v=ipwxYa-F1uY)
- [Reentrancy Attacks Explained](https://www.youtube.com/watch?v=4Mm3BCyHtDY)

## 🚨 Important - Cod de Conduită

⚠️ **ATENȚIE**: Tehnicile învățate în acest laborator sunt exclusiv pentru scopuri educaționale.

**Interzis:**
- ❌ Atacarea rețelelor blockchain reale
- ❌ Exploatarea contractelor în producție
- ❌ Utilizarea vulnerabilităților pentru profit personal

**Permis:**
- ✅ Testare pe rețele locale (Ganache)
- ✅ Bug bounty programs autorizate
- ✅ Audit de securitate cu acordul proprietarului

**Consecințe**: Utilizarea neautorizată a tehnicilor de hacking poate duce la consecințe legale severe, inclusiv închisoare și amenzi.

## 🤝 Colaborare

- **Lucrul în echipă**: Permis (max 2 studenți/echipă)
- **Partajarea soluțiilor complete**: Interzis
- **Discuții conceptuale**: Încurajate
- **Stack Overflow & Google**: Permis și recomandat

## 📬 Suport

Dacă întâmpini probleme tehnice sau ai întrebări:
- 📧 Email: lcretu@bitdefender.com
- 💬 Google Classroom: Postează în secțiunea Q&A
- 🕐 Office Hours: Joi 16:00-18:00 (doar cu programare)

---

**Good luck, Security Auditor! The fate of EtherBank is in your hands.** 🔐💰

*"In DeFi we trust, but we verify the code first."*
