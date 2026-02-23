# 🎯 Lab 4: The DeFi Heist - Quick Start Guide

## 📖 Ce este acest laborator?

Un laborator practic de **Blockchain Security** și **Smart Contract Auditing** unde înveți să identifici și să exploatezi vulnerabilitățile comune în aplicațiile DeFi prin 3 scenarii de tip CTF (Capture The Flag).

**🎭 Povestea**: Ești security auditor la EtherBank, o bancă DeFi care a fost compromisă. Misiunea ta: investighează incidentele, găsește vulnerabilitățile și demonstrează impact-ul.

---

## 🚀 Quick Start

### Pas 1: Clone Repo-ul

```bash
git clone https://github.com/[username]/ase-cybersecurity.git
cd ase-cybersecurity/2026/lab4-blockchain-defi
```

### Pas 2: Instalează Dependențele

```bash
npm install
```

### Pas 3: Generează Instanța Ta (Unică per student)

```bash
npm run init:student -- --student-id <email_ase_sau_matricol>
```

Acest pas generează parametrii unici pentru tine (`student/instance.json`).

### Pas 4: Pornește Ganache (Blockchain Local)

```bash
./start-ganache.sh
```

Lasă acest terminal deschis! Ganache va rula în background.

### Pas 5: Deploy Contractele

În **alt terminal**:

```bash
npm run deploy:all
```

### Pas 6: Verifică Setup-ul

```bash
npm run verify-setup
```

Ar trebui să vezi ✅ pentru toate componentele.

### Pas 7: Începe cu Challenge 1

```bash
code challenges/challenge1-forensics.md
```

---

## 📋 Structura Lab-ului

```
lab4-blockchain-defi/
│
├── 📄 README.md                    # Acest fișier
├── 📚 INSTRUCTOR_GUIDE.md          # Ghid pentru profesor
│
├── 🎯 challenges/                  # Documentația challenges
│   ├── challenge1-forensics.md     # Blockchain forensics
│   ├── challenge2-reentrancy.md    # Reentrancy attack
│   └── challenge3-access-control.md # Access control & keys
│
├── 📝 contracts/                   # Smart contracts
│   ├── SimpleVault.sol             # Vulnerabil la reentrancy
│   ├── VaultAttacker.sol           # Contract de attack
│   └── AdminVault.sol              # Vulnerabil la access control
│
├── 🔧 scripts/                     # Helper scripts
│   ├── generate-instance.js        # Generează instanță unică per student
│   ├── generate-batch-instances.js # Generează instanțe în batch (instructor)
│   ├── setup-challenge1.js         # Setup dinamic Challenge 1
│   ├── deploy-simple-vault.js      # Deploy Challenge 2
│   ├── deploy-admin-vault.js       # Deploy Challenge 3
│   ├── inspect-transaction.js      # Forensics helper
│   ├── trace-funds.js              # Tracing helper
│   ├── find-private-key.sh         # Discovery helper Challenge 3
│   ├── clean-generated.js          # Cleanup artefacte generate
│   ├── grade-submissions.js        # Corectare semi-automată (instructor)
│   └── verify-setup.js             # Verificare setup
│
├── 🧪 test/                        # Unit tests
│   └── test-reentrancy.js          # Test pentru reentrancy
│
├── 🖥️ vm-setup/                    # Ghid setup VM
│   └── README.md                   # Instalare manuală
│
├── ⚙️ hardhat.config.js            # Configurare Hardhat
├── 📦 package.json                 # Dependencies
└── 🚀 start-ganache.sh             # Script pornire blockchain

```

---

## 🎮 Challenges Overview

### 🔍 Challenge 1: Blockchain Forensics (20p)

**Dificultate**: 🟢 Beginner  
**Durată**: 30-45 min

Urmărește un furt de 100 ETH prin blockchain, identifică destinația finală și decodează mesajul secret lăsat de atacator.

**Ce înveți:**
- Structura tranzacțiilor Ethereum
- Block explorers și chain analysis
- Hex encoding/decoding
- Gas fees și costuri

[➡️ Start Challenge 1](challenges/challenge1-forensics.md)

---

### ⚔️ Challenge 2: Reentrancy Attack (40p + 5p bonus)

**Dificultate**: 🟡 Intermediate  
**Durată**: 90-120 min

Identifică și exploatează vulnerabilitatea de **Reentrancy** în contractul SimpleVault - aceeași vulnerabilitate care a dus la The DAO Hack ($60M).

**Ce înveți:**
- Cum funcționează smart contracts în Solidity
- Pattern-ul Checks-Effects-Interactions
- Reentrancy attacks și defense
- Development cu Hardhat și testing

[➡️ Start Challenge 2](challenges/challenge2-reentrancy.md)

---

### 🔑 Challenge 3: Access Control & Private Keys (40p + 5p bonus)

**Dificultate**: 🔴 Advanced  
**Durată**: 60-90 min

Găsește cheia privată a administratorului ascunsă în filesystem și exploatează un bug de Access Control pentru a prelua controlul vault-ului.

**Ce înveți:**
- Securitatea cheilor criptografice
- Access Control în smart contracts
- Reconnaissance și information gathering
- Best practices pentru key management

[➡️ Start Challenge 3](challenges/challenge3-access-control.md)

---

## 🛠️ Tehnologii Folosite

| Tool | Versiune | Descriere |
|------|----------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Hardhat** | 2.14+ | Framework de dezvoltare Ethereum |
| **Ganache** | 7.7+ | Blockchain local pentru testing |
| **Solidity** | 0.8.19 | Limbaj pentru smart contracts |
| **Ethers.js** | 5.7+ | Library pentru interacțiune cu Ethereum |
| **MetaMask** | Latest | Wallet Ethereum (optional) |

---

## ⚡ Comenzi Utile

```bash
# Rulează toate testele locale (Challenge 2 + Challenge 3)
npm run test:all

# Regenerare instanță pentru același student
npm run init:student -- --student-id <id> --force

# Curăță artefactele generate (deployments, instance files, leak files)
npm run clean:generated
```

---

## 📊 Notare

| Challenge | Puncte | Bonus |
|-----------|--------|-------|
| Challenge 1: Forensics | 20p | - |
| Challenge 2: Reentrancy | 40p | +5p (100% drain) |
| Challenge 3: Access Control | 40p | +5p (remediere) |
| **TOTAL** | **100p** | **+10p** |

**Conversie**: Puncte / 10 = Nota (ex: 85p = 8.5 → Nota 9)

---

## 📤 Livrabile

La finalul lab-ului, uploada pe Google Classroom:

1. ✅ `challenge1-solution.md` - Investigația forensics
2. ✅ `challenge2-report.md` - Analiza reentrancy + raport
3. ✅ `MyVaultAttacker.sol` - Contractul tău de attack
4. ✅ `challenge3-investigation.md` - Private key discovery + exploit

**BONUS**: Raport de securitate complet cu recomandări pentru toate vulnerabilitățile (+10p)

---

## 💡 Tips & Best Practices

### ✅ DO:

- Testează pe rețeaua locală (Ganache) - e gratis!
- Citește documentația și încearcă să înțelegi conceptele
- Folosește Google și Stack Overflow
- Colaborează și discută conceptual (dar nu copia cod!)
- Experimentează și învață din erori

### ❌ DON'T:

- Nu ataca contracte reale pe mainnet/testnets
- Nu copia soluțiile colegilor (verificăm cu diff tools)
- Nu te descuraja dacă e greu - e normal!
- Nu sări peste challenge-uri - sunt progresive

---

## 🆘 Ajutor & Support

### Probleme Tehnice?

1. **Verifică README-ul fiecărui challenge** - Are secțiune de troubleshooting
2. **Rulează verificarea**: `npm run verify-setup`
3. **Citește erorile cu atenție** - Hardhat oferă mesaje clare
4. **Caută pe Google** - Probabil altcineva a avut aceeași problemă

### Întrebări Conceptuale?

- 📧 Email: lcretu@bitdefender.com
- 💬 Google Classroom: Thread Q&A
- 🕐 Office Hours: Joi 16:00-18:00 (cu programare)

### Resurse Utile

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [OpenZeppelin Security Best Practices](https://docs.openzeppelin.com/contracts/security)

---

## 🏆 Provocări Extra (După Lab)

După ce finalizezi toate challenges, încearcă:

1. **Ethernaut** - https://ethernaut.openzeppelin.com/
   - Peste 20 de challenges de securitate smart contracts
   
2. **Damn Vulnerable DeFi** - https://www.damnvulnerabledefi.xyz/
   - Focusat pe vulnerabilități DeFi avansate
   
3. **Capture The Ether** - https://capturetheether.com/
   - Challenges clasice de security

4. **CryptoZombies** - https://cryptozombies.io/
   - Învață Solidity prin gaming

---

## 📜 Cod de Conduită

### ⚠️ FOARTE IMPORTANT

Tehnicile învățate în acest laborator sunt **EXCLUSIV pentru scopuri educaționale**.

**Interzis:**
- ❌ Atacarea rețelelor blockchain reale
- ❌ Exploatarea contractelor în producție
- ❌ Utilizarea vulnerabilităților pentru profit personal

**Permis:**
- ✅ Testare pe rețele locale (Ganache)
- ✅ Bug bounty programs autorizate
- ✅ Audit de securitate cu acordul proprietarului

**Consecințe**: Utilizarea neautorizată a tehnicilor de hacking poate duce la:
- 🚨 Acuzații penale
- 💰 Amenzi substanțiale
- 🔒 Închisoare
- 📉 Distrugerea carierei în tech

**Folosește-ți cunoștințele pentru bine! Be a White Hat! 🎩⚪**

---

## 🎯 Obiective de Învățare

La finalul acestui laborator vei fi capabil să:

✅ Înțelegi cum funcționează blockchain-ul Ethereum  
✅ Scrii și compilezi smart contracts în Solidity  
✅ Identifici vulnerabilități comune în DeFi  
✅ Folosești tools profesionale (Hardhat, Ganache, Ethers.js)  
✅ Conduci un audit de securitate de bază  
✅ Înțelegi importanța securității în Web3  

---

## 🌟 Contribuții

Ai găsit un bug sau ai o sugestie de îmbunătățire?

- 📬 Deschide un Issue pe GitHub
- 🔧 Trimite un Pull Request
- 💬 Contactează instructorul

Contribuțiile sunt binevenite! 🙏

---

## 📄 Licență

Acest laborator este open-source sub licența MIT.

Copyright © 2026 Liviu Cretu - Bitdefender

---

## 🙏 Credits

**Inspirat de:**
- [Ethernaut](https://ethernaut.openzeppelin.com/) - OpenZeppelin
- [Damn Vulnerable DeFi](https://www.damnvulnerabledefi.xyz/) - Tincho
- [The DAO Hack Analysis](https://hackingdistributed.com/2016/06/18/analysis-of-the-dao-exploit/) - Phil Daian

**Special thanks to:**
- OpenZeppelin pentru tools și best practices
- Hardhat team pentru amazing developer experience
- ASE Students pentru feedback și testing

---

**🚀 Ready to start? Begin with [Challenge 1](challenges/challenge1-forensics.md)!**

**Good luck, Security Auditor! May your exploits be successful and your contracts secure! 🔐💰**

*"In DeFi we trust, but we verify the code first."*
