# Verificare completa a flow-ului - pas cu pas

Toate comenzile necesare pentru un test end-to-end al laboratorului.

---

## Pasul 0: Pregatire

```bash
cd 2026/lab2
npm install
npx hardhat compile
```

---

## Pasul 1: Generare instanta student

```bash
npm run init:student -- --student-number 70 --force
```

Verificare rapida:

```bash
node -e "const i=require('./student/instance.json'); console.log('instanceId:', i.instanceId); console.log('C1 hops:', i.challenge1.hopAccountIndices.length); console.log('C2 depositors:', i.challenge2.depositorAccountIndices.length);"
```

---

## Pasul 2: Pornire Ganache

```bash
LAB_GANACHE_MODE=cli ./start-ganache.sh
```

Ganache ramane activ. Deschide un terminal nou pentru pasii urmatori.

---

## Pasul 3: Deploy

```bash
cd 2026/lab2
npm run deploy:all
```

Verificare:

```bash
ls deployments/challenge1-data.json deployments/simple-vault.json
```

---

## Pasul 4: Verify setup

```bash
npm run verify-setup
```

---

## Pasul 5: Challenge 1 - Blockchain Forensics

### Varianta A: prin scripturi helper

```bash
npm run c1:calc:gas
npm run c1:calc:time
npm run c1:results
```

### Varianta B: verificare suplimentara

```bash
npm run inspect:tx -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") --show-input
npm run trace:funds -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") 100
```

Validare Challenge 1:

```bash
npm run validate:results -- --challenge1
```

---

## Pasul 6: Challenge 2 - Reentrancy

### 6.1 Rulare atac (Q1-Q5)

```bash
npm run attack
```

Q5 poate fi obtinut prin:

```bash
npm run c2:calc:gas
```

sau manual:

```bash
npm run inspect:tx -- <attack_tx_hash>
```

### 6.2 Exercitiul final de departajare (Q6)

Ia codurile personalizate:

```bash
npm run c2:calc:patch
```

Comanda afiseaza:
1. `patchCode` (valoarea pentru Q6)
2. `patchChecksum` (valoare de verificare)

Aplica patch-ul in `contracts/SimpleVault.sol`:
1. `challenge2SecureMode = true;`
2. `challenge2PatchCode = <patchCode>;`
3. `challenge2PatchChecksum = <patchChecksum>;`

Redeploy si reruleaza:

```bash
npm run deploy:vault
npm run attack
```

### 6.3 Generare JSON Challenge 2

```bash
npm run c2:results
```

Validare Challenge 2:

```bash
npm run validate:results -- --challenge2
```

---

## Pasul 7: Validare finala

```bash
npm run validate:results
```

---

## Pasul 8: Cleanup (optional)

```bash
npm run clean:generated
npm run clean
```

---

## Checklist

| Pas | Comanda | Verificare |
|---|---|---|
| Install | `npm install` | Fara erori |
| Compile | `npx hardhat compile` | Compilare OK |
| Init student | `npm run init:student -- --student-number <1-100> --force` | Instance generated |
| Start Ganache | `LAB_GANACHE_MODE=cli ./start-ganache.sh` | Port 7545 activ |
| Deploy all | `npm run deploy:all` | Ambele JSON-uri create |
| Verify setup | `npm run verify-setup` | PASSED |
| Run attack | `npm run attack` | Date Q1-Q5 disponibile |
| Patch code | `npm run c2:calc:patch` | Coduri Q6 afisate |
| Validate C1 | `npm run validate:results -- --challenge1` | OK |
| Validate C2 | `npm run validate:results -- --challenge2` | OK |
| Validate all | `npm run validate:results` | Passed |
