# Lab 2: The DeFi Heist - Blockchain Security & Smart Contract Auditing

> Rol: esti Security Auditor la EtherBank. Scopul laboratorului este sa investighezi fluxuri on-chain si sa exploatezi controlat o vulnerabilitate de tip reentrancy, intr-un mediu local.

## Obiective

La finalul laboratorului vei sti:
- cum sa investighezi tranzactii Ethereum pe un chain local;
- cum sa identifici si exploatezi o vulnerabilitate Reentrancy;
- cum sa validezi setup-ul si sa livrezi artefacte corectabile automat.

## Resurse

- [THEORY.md](THEORY.md) — concepte teoretice: blockchain, Ethereum, smart contracts, reentrancy
- [VERIFY-FLOW.md](VERIFY-FLOW.md) — ghid complet de verificare end-to-end (pentru instructor)

---

## Setup

### Varianta 1: Setup automat (VM laborator)

```bash
cd ~/ase-cybersecurity/2026/lab2/vm-setup
chmod +x setup-vm.sh
./setup-vm.sh
```

Scriptul instaleaza: Node.js + npm, Ganache CLI + GUI, VS Code + extensii, Firefox, repo-ul laboratorului, shortcut-uri desktop.

### Varianta 2: Setup manual

**Cerinte**: Node.js 16+, npm, Git.

```bash
git clone https://github.com/[username]/ase-cybersecurity.git
cd ase-cybersecurity/2026/lab2
npm install
```

### Initializare student + deploy

```bash
npm run init:student -- --student-id <email_ase_sau_matricol>
./start-ganache.sh
npm run deploy:all
npm run verify-setup
```

### Verificari in Ganache GUI

- RPC: `http://127.0.0.1:7545`
- Network ID: `1337`
- Workspace: `Quickstart` sau `BLOCKCHAIN-DEFI`

---

## Challenges

### Challenge 1: Blockchain Forensics (50p)
- documentatie: [challenges/challenge1-forensics.md](challenges/challenge1-forensics.md)
- livrabil: `student/submissions/challenge1-results.json`

### Challenge 2: Reentrancy Attack (50p)
- documentatie: [challenges/challenge2-reentrancy.md](challenges/challenge2-reentrancy.md)
- livrabil: `student/submissions/challenge2-results.json`

---

## Punctaj

| Challenge | Puncte |
|-----------|--------|
| Challenge 1 | 50p |
| Challenge 2 | 50p |
| **TOTAL** | **100p** |

Conversie recomandata: nota = `puncte / 10` (ex: 90p => 9.0).

---

## Comenzi utile

```bash
# Deploy complet (Challenge 1 + Challenge 2)
npm run deploy:all

# Deploy individual
npm run deploy:challenge1
npm run deploy:vault

# Rulare atac Challenge 2
npm run attack

# Inspectare tranzactie (Challenge 1)
npm run inspect:tx -- <tx_hash> --show-input

# Trace fonduri (Challenge 1)
npm run trace:funds -- <tx_hash> 100

# Verificare setup
npm run verify-setup

# Re-generate student instance
npm run init:student -- --student-id <id> --force
```

---

## Livrabile

1. `student/submissions/challenge1-results.json`
2. `student/submissions/challenge2-results.json`
3. Validare format: `npm run validate:results`

Bootstrap rapid:

```bash
mkdir -p student/submissions
cp submission-templates/challenge1-results.template.json student/submissions/challenge1-results.json
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

---

## Troubleshooting

| Problema | Solutie |
|----------|---------|
| Ganache nu e detectat | `./start-ganache.sh` apoi `npm run verify-setup` |
| Apar 10 conturi in GUI | Inchide GUI, porneste din nou: `./start-ganache.sh` |
| `deploy:all` esueaza | Verifica: `npm run init:student -- --student-id <id>` apoi `./start-ganache.sh` |
| `npm run attack` esueaza | Verifica ca Ganache ruleaza si vault-ul e deployed: `npm run deploy:vault` |
| Validarea esueaza | Verifica formatul: adrese `0x...`, ETH cu 4/6 zecimale, pattern-uri lowercase |

---

## Important

- foloseste doar reteaua locala Ganache;
- nu ataca retele reale/publice;
- tehnicile sunt strict educationale.
