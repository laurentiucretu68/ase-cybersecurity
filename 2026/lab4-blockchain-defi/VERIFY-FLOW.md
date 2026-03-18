# Verificare completă a flow-ului — Pas cu pas

Acest document conține **toate comenzile** necesare pentru a verifica end-to-end că laboratorul funcționează corect: de la instalare până la validarea rezultatelor ambelor challenge-uri.

Rulează fiecare secțiune în ordine. La fiecare pas, verifică output-ul așteptat.

---

## Pasul 0: Pregătire

```bash
cd 2026/lab4-blockchain-defi
```

### 0.1 Instalare dependențe

```bash
npm install
```

**Output așteptat**: fără erori, `node_modules/` creat.

### 0.2 Verificare rapidă structură

```bash
ls contracts/ scripts/lib/ challenges/ submission-templates/ student/
```

**Output așteptat**: fișierele principale vizibile:
- `contracts/` → `SimpleVault.sol`, `VaultAttacker.sol`
- `scripts/lib/` → `instance-config.js`
- `challenges/` → `challenge1-forensics.md`, `challenge2-reentrancy.md`
- `submission-templates/` → `challenge1-results.template.json`, `challenge2-results.template.json`
- `student/` → `.gitkeep`, `submissions/`

### 0.3 Compilare Solidity

```bash
npx hardhat compile
```

**Output așteptat**: `Compiled N Solidity files successfully` (fără erori).

---

## Pasul 1: Generare instanță student

```bash
npm run init:student -- --student-id test-student@example.com --force
```

**Output așteptat**:
```
[warn] Using default salt. ...
Instance generated successfully.
student/instance.json: .../student/instance.json
student/instance.env: .../student/instance.env
student/manifest.sig: .../student/manifest.sig
instance id: lab4-XXXXXXXXXXXX
grading token: CTF-XXXXXXXXXXXX
```

### Verificare fișiere generate

```bash
cat student/instance.env
```

**Verifică**: `LAB_CHAIN_ID`, `LAB_PORT`, `LAB_MNEMONIC` sunt prezente.

```bash
node -e "const i = require('./student/instance.json'); console.log('instanceId:', i.instanceId); console.log('challenge1 hops:', i.challenge1.hopAccountIndices.length); console.log('challenge2 depositors:', i.challenge2.depositorAccountIndices.length);"
```

**Output așteptat**: instanceId valid, 3-5 hop-uri, 4 depositors.

---

## Pasul 2: Pornire Ganache

### Varianta CLI (fără GUI, recomandată pentru testare)

```bash
LAB_GANACHE_MODE=cli ./start-ganache.sh
```

**Output așteptat**: Ganache pornește pe port 7545, afișează conturile generate.

> Ganache rămâne activ în terminal. **Deschide un terminal nou** pentru pașii următori.

### Verificare conectivitate (din terminalul nou)

```bash
cd 2026/lab4-blockchain-defi
curl -s -X POST http://127.0.0.1:7545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      const r=JSON.parse(d); console.log('Chain ID:', parseInt(r.result, 16));
    });"
```

**Output așteptat**: `Chain ID: 1337`

---

## Pasul 3: Deploy Challenge 1

### 3.1 Deploy Challenge 1

```bash
npm run deploy:challenge1
```

**Output așteptat**:

```
Setting up Challenge 1 (Blockchain Forensics)
...
  transfer 1: [0] 0x... -> [X] 0x... (NN.N ETH)
  transfer 2: ...
  ...
Challenge 1 setup complete
Initial tx hash: 0x...
```

### 3.2 Verificare artefacte generate

```bash
ls deployments/
```

**Output așteptat**: `challenge1-data.json`

```bash
node -e "const d = require('./deployments/challenge1-data.json'); console.log('C1 initial tx:', d.initialTransactionHash); console.log('C1 transfers:', d.transferCount); console.log('C1 final dest:', d.finalDestination.address);"
```

---

## Pasul 4: Verify setup (pentru Challenge 1)

```bash
npm run verify-setup
```

**Output așteptat**: toate check-urile `[OK]`, final `Setup verification PASSED!`

Dacă vezi `[FAIL]` la `scripts/lib/instance-config.js`, modulul lipsește. Dacă vezi `[WARN]` la deployments, rulează din nou `npm run deploy:challenge1`.

---

## Pasul 5: Rezolvare Challenge 1 (Blockchain Forensics)

Aici parcurgem tot flow-ul de rezolvare al Challenge 1 folosind comenzile disponibile.

### 5.1 Obține datele de start

```bash
node -e "
const d = require('./deployments/challenge1-data.json');
console.log('=== CHALLENGE 1 DATA ===');
console.log('initialTransactionHash:', d.initialTransactionHash);
console.log('transfers:', d.transferCount);
console.log('');
d.transfers.forEach(t => {
  console.log('Hop ' + t.step + ': ' + t.from + ' -> ' + t.to);
  console.log('  tx:    ' + t.txHash);
  console.log('  value: ' + t.amountEth + ' ETH');
  console.log('  gas:   ' + t.gasUsed + ' * ' + t.gasPriceWei + ' = ' + (BigInt(t.gasUsed) * BigInt(t.gasPriceWei)).toString() + ' Wei');
  console.log('  block: ' + t.blockNumber + ' | timestamp: ' + t.timestamp);
});
"
```

### 5.2 Inspectează tranzacția inițială (cu input)

```bash
npm run inspect:tx -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") --show-input
```

**Output așteptat**: detalii tranzacție + `Input data: 0x...` + `Input ASCII: CTF-...`

### 5.3 Trace fonduri automat

```bash
npm run trace:funds -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") 100
```

**Output așteptat**: toate hop-urile listate cu adrese, valori, gas fees, destinația finală și timpul total.

### 5.4 Generare răspunsuri Challenge 1

```bash
node -e "
const d = require('./deployments/challenge1-data.json');
const instance = require('./student/instance.json');

const hopHashes = d.transfers.map(t => t.txHash);
const firstDest = d.transfers[0].to;
const finalAddr = d.transfers[d.transfers.length - 1].to;
const interHops = d.transfers.length - 2; // fără prima și ultima
const t0 = d.transfers[0].timestamp;
const tN = d.transfers[d.transfers.length - 1].timestamp;
const totalTime = tN - t0;

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
    totalTimeSeconds: totalTime,
    totalGasFeeWei: totalGas.toString(),
    initialInputHex: d.secretMessageHex,
    decodedMessage: d.secretMessage
  }
};

const fs = require('fs');
fs.mkdirSync('student/submissions', { recursive: true });
fs.writeFileSync('student/submissions/challenge1-results.json', JSON.stringify(result, null, 2) + '\n');
console.log('challenge1-results.json generat:');
console.log(JSON.stringify(result, null, 2));
"
```

### 5.5 Validare format Challenge 1

```bash
npm run validate:results -- --challenge1
```

**Output așteptat**: `[OK] Challenge 1: ...` + `Submission format validation passed.`

---

## Pasul 6: Rezolvare Challenge 2 (Reentrancy Attack)

### 6.1 Verifică datele vault-ului

```bash
node -e "
const d = require('./deployments/simple-vault.json');
console.log('=== CHALLENGE 2 DATA ===');
console.log('vault address:', d.contractAddress);
console.log('total balance:', d.totalBalance, 'ETH');
d.deposits.forEach(dep => {
  console.log('  depositor [' + dep.signerIndex + ']:', dep.address, '->', dep.amount, 'ETH');
});
"
```

### 6.2 Răspunsuri Q1-Q2 (analiză cod)

Vin din citirea `contracts/SimpleVault.sol`:

- **Q1**: `reentrancy` (tipul vulnerabilității)
- **Q2**: `checks-effects-interactions` (pattern-ul de remediere)

### 6.3 Rulare atac (Q3-Q6)

```bash
npm run attack
```

**Output așteptat**: vault-ul golit, valorile Q3-Q6 afișate + salvate în `deployments/attack-results.json`.

### 6.4 Generare JSON Challenge 2

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
    q6FinalVaultBalanceEth: attack.finalVaultBalanceEth
  }
};

fs.mkdirSync('student/submissions', { recursive: true });
fs.writeFileSync('student/submissions/challenge2-results.json', JSON.stringify(result, null, 2) + '\n');
console.log('challenge2-results.json generat!');
console.log(JSON.stringify(result, null, 2));
"
```

### 6.5 Validare format Challenge 2

```bash
npm run validate:results -- --challenge2
```

**Output așteptat**: `[OK] Challenge 2: ...` + `Submission format validation passed.`

---

## Pasul 7: Validare finală (ambele challenge-uri)

```bash
npm run validate:results
```

**Output așteptat**:
```
[OK] Challenge 1: .../student/submissions/challenge1-results.json
[OK] Challenge 2: .../student/submissions/challenge2-results.json

Submission format validation passed.
```

### Verificare livrabile

```bash
echo "=== LIVRABILE ==="
echo ""
echo "1. Challenge 1 results:"
cat student/submissions/challenge1-results.json | head -5
echo "   ..."
echo ""
echo "2. Challenge 2 results:"
cat student/submissions/challenge2-results.json | head -5
echo "   ..."
```

---

## Pasul 8: Cleanup (opțional)

Dacă vrei să resetezi totul și să testezi din nou de la zero:

```bash
# Oprește Ganache (Ctrl+C în terminalul respectiv)

# Șterge artefactele generate
npm run clean:generated

# Șterge cache-ul Hardhat
npm run clean

# Verifică că s-au șters
ls student/instance.json 2>/dev/null && echo "WARN: instance.json încă există" || echo "OK: instance.json șters"
ls deployments/*.json 2>/dev/null && echo "WARN: deployments încă au JSON-uri" || echo "OK: deployments curat"
```

Apoi reîncepe de la **Pasul 1**.

---

## Checklist rezumat

| Pas | Comandă | Verificare |
|---|---|---|
| Install | `npm install` | Fără erori |
| Compile | `npx hardhat compile` | `Compiled N Solidity files` |
| Init student | `npm run init:student -- --student-id X --force` | `Instance generated successfully` |
| Start Ganache | `LAB_GANACHE_MODE=cli ./start-ganache.sh` | Port 7545 activ |
| Deploy all | `npm run deploy:all` | `challenge1-data.json` + `simple-vault.json` create |
| Verify setup | `npm run verify-setup` | `Setup verification PASSED!` |
| Inspect tx | `npm run inspect:tx -- <hash> --show-input` | Afișează input + ASCII |
| Trace funds | `npm run trace:funds -- <hash> 100` | Listează toate hop-urile |
| Run attack | `npm run attack` | Vault golit, valorile Q6-Q9 afișate |
| Validate C1 | `npm run validate:results -- --challenge1` | `[OK] Challenge 1` |
| Validate C2 | `npm run validate:results -- --challenge2` | `[OK] Challenge 2` |
| Validate all | `npm run validate:results` | `Submission format validation passed` |
| Cleanup | `npm run clean:generated` | Fișierele generate șterse |
