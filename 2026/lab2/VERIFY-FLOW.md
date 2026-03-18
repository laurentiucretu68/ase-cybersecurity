# Verificare completă a flow-ului — Pas cu pas

Toate comenzile necesare pentru a verifica end-to-end că laboratorul funcționează.

Pentru fiecare challenge sunt prezentate **două variante de rezolvare**: prin script (CLI) și prin Ganache GUI.

---

## Pasul 0: Pregătire

```bash
cd 2026/lab2
npm install
npx hardhat compile
```

---

## Pasul 1: Generare instanță student

```bash
npm run init:student -- --student-id test-student@example.com --force
```

Verificare:

```bash
node -e "const i = require('./student/instance.json'); console.log('instanceId:', i.instanceId); console.log('C1 hops:', i.challenge1.hopAccountIndices.length); console.log('C2 depositors:', i.challenge2.depositorAccountIndices.length);"
```

---

## Pasul 2: Pornire Ganache

```bash
LAB_GANACHE_MODE=cli ./start-ganache.sh
```

Ganache rămâne activ. **Deschide un terminal nou** pentru pașii următori.

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

## Pasul 5: Challenge 1 — Blockchain Forensics

### Varianta A: Rezolvare prin script (CLI)

#### 5A.1 Obține datele și generează răspunsuri

```bash
node -e "
const d = require('./deployments/challenge1-data.json');
const instance = require('./student/instance.json');

const hopHashes = d.transfers.map(t => t.txHash);
const firstDest = d.transfers[0].to;
const finalAddr = d.transfers[d.transfers.length - 1].to;
const interHops = d.transfers.length - 2;
const t0 = d.transfers[0].timestamp;
const tN = d.transfers[d.transfers.length - 1].timestamp;

let totalGas = BigInt(0);
d.transfers.forEach(t => {
  totalGas += BigInt(t.gasUsed) * BigInt(t.gasPriceWei);
});

const result = {
  challenge: 'challenge1-forensics',
  studentId: instance.studentId,
  instanceId: instance.instanceId,
  answers: {
    initialTransactionHash: d.initialTransactionHash,
    hopTransactionHashes: hopHashes,
    firstDestinationAddress: firstDest,
    intermediateHopCount: interHops < 0 ? 0 : interHops,
    finalAddress: finalAddr,
    totalTimeSeconds: tN - t0,
    totalGasFeeWei: totalGas.toString(),
    initialInputHex: d.secretMessageHex,
    decodedMessage: d.secretMessage
  }
};

const fs = require('fs');
fs.mkdirSync('student/submissions', { recursive: true });
fs.writeFileSync('student/submissions/challenge1-results.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
"
```

#### 5A.2 Verificare cu inspect și trace

```bash
npm run inspect:tx -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") --show-input
npm run trace:funds -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") 100
```

### Varianta B: Rezolvare prin Ganache GUI

#### 5B.1 Obține hash-ul inițial

```bash
node -e "console.log(require('./deployments/challenge1-data.json').initialTransactionHash)"
```

#### 5B.2 Urmărește lanțul în GUI

1. Deschide Ganache GUI → tab **TRANSACTIONS**.
2. Caută hash-ul inițial → click pe el.
3. Notează: `FROM`, `TO`, `VALUE`, `GAS USED`, `GAS PRICE`, `BLOCK` number.
4. Pentru `INPUT DATA`: convertește hex-ul în text (fiecare pereche hex = 1 caracter ASCII).
5. Click pe adresa `TO` → caută tranzacția outbound a acestei adrese.
6. Repetă pentru fiecare hop până nu mai există tranzacții outbound.

#### 5B.3 Calculează valorile

Pentru fiecare hop notat din GUI:

```
Gas fee per hop (Wei) = GAS USED × GAS PRICE
totalGasFeeWei = suma tuturor gas fees
```

Pentru timp: click pe blocul fiecărei tranzacții, notează timestamp-ul.

```
totalTimeSeconds = timestamp_ultim_hop - timestamp_prim_hop
```

#### 5B.4 Completează JSON-ul manual

```bash
cp submission-templates/challenge1-results.template.json student/submissions/challenge1-results.json
```

Editează fișierul cu valorile notate din GUI.

### Validare Challenge 1

```bash
npm run validate:results -- --challenge1
```

---

## Pasul 6: Challenge 2 — Reentrancy Attack

### 6.1 Răspunsuri Q1-Q2 (analiză cod — la fel indiferent de variantă)

Din citirea `contracts/SimpleVault.sol`:
- **Q1**: `reentrancy`
- **Q2**: `checks-effects-interactions`

### 6.2 Rulare atac (obligatoriu)

```bash
npm run attack
```

Notează din output: valorile Q3-Q6 și **Attack TX hash**.

### Varianta A: Q7 prin script (CLI)

```bash
npm run inspect:tx -- <attack_tx_hash>
```

Citește linia `Gas fee:` din output. Formatează cu 6 zecimale.

### Varianta B: Q7 prin Ganache GUI

1. Deschide Ganache GUI → tab **TRANSACTIONS**.
2. Caută tranzacția cu hash-ul de atac.
3. Notează **GAS USED** și **GAS PRICE** (în Wei).
4. Calculează: `gas_fee_eth = gasUsed × gasPrice ÷ 1000000000000000000`
5. Formatează cu 6 zecimale.

### 6.3 Generare JSON Challenge 2

```bash
node -e "
const fs = require('fs');
const instance = require('./student/instance.json');
const attack = require('./deployments/attack-results.json');

const result = {
  challenge: 'challenge2-reentrancy',
  studentId: instance.studentId,
  instanceId: instance.instanceId,
  answers: {
    q1VulnerabilityPattern: 'reentrancy',
    q2RemediationPattern: 'checks-effects-interactions',
    q3VaultAddress: attack.vaultAddress,
    q4InitialVaultBalanceEth: attack.initialVaultBalanceEth,
    q5AttackerContractAddress: attack.attackerAddress,
    q6FinalVaultBalanceEth: attack.finalVaultBalanceEth,
    q7AttackGasFeeEth: attack.attackGasFeeEth
  }
};

fs.mkdirSync('student/submissions', { recursive: true });
fs.writeFileSync('student/submissions/challenge2-results.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
"
```

### Validare Challenge 2

```bash
npm run validate:results -- --challenge2
```

---

## Pasul 7: Validare finală

```bash
npm run validate:results
```

---

## Pasul 8: Cleanup (opțional)

```bash
npm run clean:generated
npm run clean
```

---

## Checklist

| Pas | Comandă | Verificare |
|---|---|---|
| Install | `npm install` | Fără erori |
| Compile | `npx hardhat compile` | Compiled N Solidity files |
| Init student | `npm run init:student -- --student-id X --force` | Instance generated |
| Start Ganache | `LAB_GANACHE_MODE=cli ./start-ganache.sh` | Port 7545 activ |
| Deploy all | `npm run deploy:all` | Ambele JSON-uri create |
| Verify setup | `npm run verify-setup` | PASSED |
| Run attack | `npm run attack` | Vault golit, Q3-Q6 afișate |
| Inspect tx | `npm run inspect:tx -- <hash>` | Gas fee afișat |
| Validate C1 | `npm run validate:results -- --challenge1` | OK |
| Validate C2 | `npm run validate:results -- --challenge2` | OK |
| Validate all | `npm run validate:results` | Passed |
