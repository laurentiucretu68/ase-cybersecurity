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
npm run deploy:challenge1
npm run verify-setup
```

Flux recomandat pentru studenti:
- Challenge 1: deploy cu `npm run deploy:challenge1`
- Challenge 2: deploy ulterior, separat, cu `npm run deploy:vault`

## Challenges active

### Challenge 1: Blockchain Forensics (50p)
- documentatie: `challenges/challenge1-forensics.md`
- livrabil: `student/submissions/challenge1-results.json`

### Challenge 2: Reentrancy Attack (50p)
- documentatie: `challenges/challenge2-reentrancy.md`
- livrabil: `student/submissions/challenge2-results.json`

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
# Deploy Challenge 1 (recomandat la inceput)
npm run deploy:challenge1

# Deploy Challenge 2 (dupa ce termini Challenge 1)
npm run deploy:vault

# Teste locale (doar Challenge 2)
npm run test:all
```

## Livrabile obligatorii

1. `student/submissions/challenge1-results.json`
2. `student/submissions/challenge2-results.json`
3. validare format: `npm run validate:results`

## Important

- foloseste doar reteaua locala Ganache;
- nu ataca retele reale/publice;
- tehnicile sunt strict educationale.

## Resurse

- [GETTING_STARTED.md](GETTING_STARTED.md)
- [THEORY.md](THEORY.md)
- [vm-setup/README.md](vm-setup/README.md)

