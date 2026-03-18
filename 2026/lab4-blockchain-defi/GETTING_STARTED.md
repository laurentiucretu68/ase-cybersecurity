# Lab 4 - Quick Start (2 Challenges)

## 1. Install & init

```bash
git clone https://github.com/[username]/ase-cybersecurity.git
cd ase-cybersecurity/2026/lab4-blockchain-defi
npm install
npm run init:student -- --student-id <email_ase_sau_matricol>
```

## 2. Start chain (GUI)

```bash
./start-ganache.sh
```

Ganache GUI trebuie sa porneasca pe:
- `http://127.0.0.1:7545`
- `network id = 1337`
- `visible accounts = 1`

## 3. Deploy Challenge 1

```bash
npm run deploy:challenge1
```

Acest pas pregateste doar datele pentru Challenge 1 (`challenge1-data.json`).

## 4. Verify setup

```bash
npm run verify-setup
```

## 5. Start challenges

1. [Challenge 1 - Forensics](challenges/challenge1-forensics.md)
2. [Theory Notes](THEORY.md)
3. Dupa ce termini Challenge 1, deploy pentru Challenge 2:

```bash
npm run deploy:vault
```

4. [Challenge 2 - Reentrancy](challenges/challenge2-reentrancy.md)

## 6. Scoring

| Challenge | Puncte |
|-----------|--------|
| Challenge 1 | 50p |
| Challenge 2 | 50p |
| **TOTAL** | **100p** |

## 7. Livrabile

1. `student/submissions/challenge1-results.json`
2. `student/submissions/challenge2-results.json`
3. `contracts/MyVaultAttacker.sol`
4. Validare format:

```bash
npm run validate:results
```

Bootstrap rapid pentru fisierele JSON:

```bash
mkdir -p student/submissions
cp submission-templates/challenge1-results.template.json student/submissions/challenge1-results.json
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

## 8. Comenzi utile

```bash
# Re-generate student instance
npm run init:student -- --student-id <id> --force

# Run Challenge 2 tests
npm run test:all

# Inspect transaction (Challenge 1)
npm run inspect:tx -- <tx_hash>

# Trace funds (Challenge 1)
npm run trace:funds -- <tx_hash> 100
```

