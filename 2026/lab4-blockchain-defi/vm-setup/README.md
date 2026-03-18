# VM Setup Guide - DeFi Heist Lab (2 Challenges)

Acest ghid descrie setup-ul minim pentru varianta curenta de laborator:
- Challenge 1: Blockchain Forensics
- Challenge 2: Reentrancy

## Varianta recomandata: setup automat

```bash
cd ~/ase-cybersecurity/2026/lab4-blockchain-defi/vm-setup
chmod +x setup-vm.sh
./setup-vm.sh
```

Scriptul instaleaza:
- Node.js + npm
- Ganache CLI + GUI
- VS Code + extensii
- Firefox
- repo-ul laboratorului
- shortcut-uri desktop

## Dupa setup (ca student)

```bash
cd ~/lab4-blockchain-defi
npm run init:student -- --student-number <1-100>
./start-ganache.sh
npm run deploy:all
npm run verify-setup
```

## Verificari rapide

In Ganache GUI:
- RPC: `http://127.0.0.1:7545`
- Network ID: `1337`
- visible accounts: `1`
- workspace: `Quickstart` sau `BLOCKCHAIN-DEFI`

## Comenzi utile

```bash
# Deploy complet (Challenge 1 + 2)
npm run deploy:all

# Deploy individual
npm run deploy:challenge1
npm run deploy:vault

# Teste
npm run test:all

# Verificare setup
npm run verify-setup
```

## Troubleshooting

### Ganache nu e detectat
```bash
./start-ganache.sh
npm run verify-setup
```

### Apar 10 conturi in GUI
Inchide GUI si porneste din nou doar prin:
```bash
./start-ganache.sh
```

### `deploy:all` esueaza
Verifica inainte:
```bash
npm run init:student -- --student-number <1-100>
./start-ganache.sh
```

## Livrabile student

1. `student/submissions/challenge1-results.json`
2. `student/submissions/challenge2-results.json`
3. validare format: `npm run validate:results`
