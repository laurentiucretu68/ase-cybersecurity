# Verificare completÄƒ a flow-ului â€” Pas cu pas

Acest document conÈ›ine **toate comenzile** necesare pentru a verifica end-to-end cÄƒ laboratorul funcÈ›ioneazÄƒ corect: de la instalare pÃ¢nÄƒ la validarea rezultatelor ambelor challenge-uri.

RuleazÄƒ fiecare secÈ›iune Ã®n ordine. La fiecare pas, verificÄƒ output-ul aÈ™teptat.

---

## Pasul 0: PregÄƒtire

```bash
cd 2026/lab4-blockchain-defi
```

### 0.1 Instalare dependenÈ›e

```bash
npm install
```

**Output aÈ™teptat**: fÄƒrÄƒ erori, `node_modules/` creat.

### 0.2 Verificare rapidÄƒ structurÄƒ

```bash
ls contracts/ scripts/lib/ challenges/ submission-templates/ student/
```

**Output aÈ™teptat**: fiÈ™ierele principale vizibile:
- `contracts/` â†’ `SimpleVault.sol`, `VaultAttacker.sol`
- `scripts/lib/` â†’ `instance-config.js`
- `challenges/` â†’ `challenge1-forensics.md`, `challenge2-reentrancy.md`
- `submission-templates/` â†’ `challenge1-results.template.json`, `challenge2-results.template.json`
- `student/` â†’ `.gitkeep`, `submissions/`

### 0.3 Compilare Solidity

```bash
npx hardhat compile
```

**Output aÈ™teptat**: `Compiled N Solidity files successfully` (fÄƒrÄƒ erori).

---

## Pasul 1: Generare instanÈ›Äƒ student

```bash
npm run init:student -- --student-number 42 --force
```

**Output aÈ™teptat**:
```
[warn] Using default salt. ...
Instance generated successfully.
student/instance.json: .../student/instance.json
student/instance.env: .../student/instance.env
student/manifest.sig: .../student/manifest.sig
instance id: lab4-XXXXXXXXXXXX
grading token: CTF-XXXXXXXXXXXX
```

### Verificare fiÈ™iere generate

```bash
cat student/instance.env
```

**VerificÄƒ**: `LAB_CHAIN_ID`, `LAB_PORT`, `LAB_MNEMONIC` sunt prezente.

```bash
node -e "const i = require('./student/instance.json'); console.log('instanceId:', i.instanceId); console.log('challenge1 hops:', i.challenge1.hopAccountIndices.length); console.log('challenge2 depositors:', i.challenge2.depositorAccountIndices.length);"
```

**Output aÈ™teptat**: instanceId valid, 3-5 hop-uri, 4 depositors.

---

## Pasul 2: Pornire Ganache

### Varianta CLI (fÄƒrÄƒ GUI, recomandatÄƒ pentru testare)

```bash
LAB_GANACHE_MODE=cli ./start-ganache.sh
```

**Output aÈ™teptat**: Ganache porneÈ™te pe port 7545, afiÈ™eazÄƒ conturile generate.

> Ganache rÄƒmÃ¢ne activ Ã®n terminal. **Deschide un terminal nou** pentru paÈ™ii urmÄƒtori.

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

**Output aÈ™teptat**: `Chain ID: 1337`

---

## Pasul 3: Deploy Challenge 1

### 3.1 Deploy Challenge 1

```bash
npm run deploy:challenge1
```

**Output aÈ™teptat**:

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

**Output aÈ™teptat**: `challenge1-data.json`

```bash
node -e "const d = require('./deployments/challenge1-data.json'); console.log('C1 initial tx:', d.initialTransactionHash); console.log('C1 transfers:', d.transferCount); console.log('C1 final dest:', d.finalDestination.address);"
```

---

## Pasul 4: Verify setup (pentru Challenge 1)

```bash
npm run verify-setup
```

**Output aÈ™teptat**: toate check-urile `[OK]`, final `Setup verification PASSED!`

DacÄƒ vezi `[FAIL]` la `scripts/lib/instance-config.js`, modulul lipseÈ™te. DacÄƒ vezi `[WARN]` la deployments, ruleazÄƒ din nou `npm run deploy:challenge1`.

---

## Pasul 5: Rezolvare Challenge 1 (Blockchain Forensics)

Aici parcurgem tot flow-ul de rezolvare al Challenge 1 folosind comenzile disponibile.

### 5.1 ObÈ›ine datele de start

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

### 5.2 InspecteazÄƒ tranzacÈ›ia iniÈ›ialÄƒ (cu input)

```bash
npm run inspect:tx -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") --show-input
```

**Output aÈ™teptat**: detalii tranzacÈ›ie + `Input data: 0x...` + `Input ASCII: CTF-...`

### 5.3 Trace fonduri automat

```bash
npm run trace:funds -- $(node -e "process.stdout.write(require('./deployments/challenge1-data.json').initialTransactionHash)") 100
```

**Output aÈ™teptat**: toate hop-urile listate cu adrese, valori, gas fees È™i destinaÈ›ia finalÄƒ.

### 5.4 Generare rÄƒspunsuri Challenge 1

```bash
node -e "
const d = require('./deployments/challenge1-data.json');
const instance = require('./student/instance.json');

const hopHashes = d.transfers.map(t => t.txHash);
const firstDest = d.transfers[0].to;
const finalAddr = d.transfers[d.transfers.length - 1].to;
const interHops = d.transfers.length - 2; // fÄƒrÄƒ prima È™i ultima

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

**Output aÈ™teptat**: `[OK] Challenge 1: ...` + `Submission format validation passed.`

---

## Pasul 6: Rezolvare Challenge 2 (Reentrancy Attack)

### 6.0 Deploy Challenge 2 (obligatoriu inainte de Pasul 6.1)

```bash
npm run deploy:vault
```

**Output asteptat**: `deployments/simple-vault.json` creat si adresa `SimpleVault` afisata.

### 6.1 Verifica datele vault-ului
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

### 6.2 RÄƒspunsuri Q1-Q2 (analizÄƒ cod)

Vin din citirea `contracts/SimpleVault.sol`:

- **Q1**: `reentrancy` (tipul vulnerabilitÄƒÈ›ii)
- **Q2**: `checks-effects-interactions` (pattern-ul de remediere)

### 6.3 Rulare atac (Q3-Q6)

```bash
npm run attack
```

**Output aÈ™teptat**: vault-ul golit, valorile Q3-Q6 afiÈ™ate + salvate Ã®n `deployments/attack-results.json`.

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

**Output aÈ™teptat**: `[OK] Challenge 2: ...` + `Submission format validation passed.`

---

## Pasul 7: Validare finalÄƒ (ambele challenge-uri)

```bash
npm run validate:results
```

**Output aÈ™teptat**:
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

## Pasul 8: Cleanup (opÈ›ional)

DacÄƒ vrei sÄƒ resetezi totul È™i sÄƒ testezi din nou de la zero:

```bash
# OpreÈ™te Ganache (Ctrl+C Ã®n terminalul respectiv)

# È˜terge artefactele generate
npm run clean:generated

# È˜terge cache-ul Hardhat
npm run clean

# VerificÄƒ cÄƒ s-au È™ters
ls student/instance.json 2>/dev/null && echo "WARN: instance.json Ã®ncÄƒ existÄƒ" || echo "OK: instance.json È™ters"
ls deployments/*.json 2>/dev/null && echo "WARN: deployments Ã®ncÄƒ au JSON-uri" || echo "OK: deployments curat"
```

Apoi reÃ®ncepe de la **Pasul 1**.

---

## Checklist rezumat

| Pas | ComandÄƒ | Verificare |
|---|---|---|
| Install | `npm install` | FÄƒrÄƒ erori |
| Compile | `npx hardhat compile` | `Compiled N Solidity files` |
| Init student | `npm run init:student -- --student-number 42 --force` | `Instance generated successfully` |
| Start Ganache | `LAB_GANACHE_MODE=cli ./start-ganache.sh` | Port 7545 activ |
| Deploy C1 | `npm run deploy:challenge1` | `challenge1-data.json` creat |
| Deploy C2 | `npm run deploy:vault` | `simple-vault.json` creat |
| Verify setup | `npm run verify-setup` | `Setup verification PASSED!` |
| Inspect tx | `npm run inspect:tx -- <hash> --show-input` | AfiÈ™eazÄƒ input + ASCII |
| Trace funds | `npm run trace:funds -- <hash> 100` | ListeazÄƒ toate hop-urile |
| Run attack | `npm run attack` | Vault golit, valorile Q6-Q9 afiÈ™ate |
| Validate C1 | `npm run validate:results -- --challenge1` | `[OK] Challenge 1` |
| Validate C2 | `npm run validate:results -- --challenge2` | `[OK] Challenge 2` |
| Validate all | `npm run validate:results` | `Submission format validation passed` |
| Cleanup | `npm run clean:generated` | FiÈ™ierele generate È™terse |

