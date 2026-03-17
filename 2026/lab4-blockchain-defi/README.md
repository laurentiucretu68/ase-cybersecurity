# Lab 4: The DeFi Heist - Blockchain Security & Smart Contract Auditing

> Rol: esti Security Auditor la EtherBank. Scopul laboratorului este sa investighezi fluxuri on-chain si sa exploatezi controlat o vulnerabilitate de tip reentrancy, intr-un mediu local.

## Obiective

La finalul laboratorului vei sti:
- cum sa investighezi tranzactii Ethereum pe un chain local;
- cum sa identifici si exploatezi o vulnerabilitate Reentrancy;
- cum sa validezi setup-ul si sa livrezi artefacte corectabile automat.

## Setup rapid

```bash
cd 2026/lab4-blockchain-defi
npm install
npm run init:student -- --student-id <email_ase_sau_matricol>
./start-ganache.sh
npm run deploy:all
npm run verify-setup
```

## Challenges active

### Challenge 1: Blockchain Forensics (50p)
- documentatie: `challenges/challenge1-forensics.md`
- livrabil: `student/submissions/challenge1-results.json`

### Challenge 2: Reentrancy Attack (50p)
- documentatie: `challenges/challenge2-reentrancy.md`
- livrabile: `student/submissions/challenge2-results.json` + `contracts/MyVaultAttacker.sol`

## Punctaj (nou)

| Challenge | Puncte |
|-----------|--------|
| Challenge 1 | 50p |
| Challenge 2 | 50p |
| **TOTAL** | **100p** |

Conversie recomandata in nota:
- nota baza = `puncte / 10` (ex: 90p => 9.0)
- punctajul final este din 100p (fara bonus separat).

## Comenzi utile

```bash
# Deploy flow complet (Challenge 1 + Challenge 2)
npm run deploy:all

# Teste locale (doar Challenge 2)
npm run test:all
```

## Livrabile obligatorii

1. `student/submissions/challenge1-results.json`
2. `student/submissions/challenge2-results.json`
3. `contracts/MyVaultAttacker.sol`
4. validare format: `npm run validate:results`

## Important

- foloseste doar reteaua locala Ganache;
- nu ataca retele reale/publice;
- tehnicile sunt strict educationale.

## Resurse

- [GETTING_STARTED.md](GETTING_STARTED.md)
- [vm-setup/README.md](vm-setup/README.md)

