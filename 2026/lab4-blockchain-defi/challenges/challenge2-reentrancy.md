# Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: Beginner-Intermediate  
**Puncte**: 50  
**Durata estimata**: 45-60 minute

---

## Poveste

`SimpleVault` este un contract vulnerabil la reentrancy.

In acest challenge:
1. Rulezi atacul preconfigurat si extragi valorile Q3-Q6.
2. Aplici un patch simplu de securitate in `SimpleVault.sol` pentru Q7.

Q7 este independenta de Q3-Q6: poti completa Q7 separat, fara sa depinda de datele atacului.

---

## Setup

```bash
cd ~/lab4-blockchain-defi
./start-ganache.sh
npm run deploy:vault
```

---

## Pas cu pas

### Pasul 1: Ruleaza atacul (Q3-Q6)

```bash
npm run attack
```

Valorile necesare pentru JSON:
- `q3VaultAddress`
- `q4InitialVaultBalanceEth`
- `q5AttackerContractAddress`
- `q6FinalVaultBalanceEth`

Le gasesti in output-ul comenzii si in `deployments/attack-results.json`.

---

### Pasul 2: Aplica patch-ul de securitate (Q7)

Deschide:
- `contracts/SimpleVault.sol`

Cauta linia:

```solidity
bool public challenge2SecureMode = false;
```

Modifica valoarea in:

```solidity
bool public challenge2SecureMode = true;
```

Acesta este patch-ul Q7.

---

### Pasul 3: Completeaza JSON-ul de submit

```bash
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

Completeaza:
- `studentId` din `student/instance.json`
- `instanceId` din `student/instance.json`
- `q3...q6` din `npm run attack`
- `q7ContractPatchCode` cu `"1"` (secure mode activat)

---

### Pasul 4: Validare

```bash
npm run validate:results -- --challenge2
```

---

## Intrebari (5 x 10p = 50p)

### Q3 (10p) - Adresa vault-ului
### Q4 (10p) - Balanta initiala a vault-ului
### Q5 (10p) - Adresa contractului atacator
### Q6 (10p) - Soldul final al vault-ului dupa atac
### Q7 (10p) - Patch de securitate aplicat (`challenge2SecureMode = true`)

---

## Reguli de format

1. `studentId` si `instanceId` trebuie completate.
2. Valorile ETH trebuie sa fie string-uri cu 4 zecimale (ex: `"92.0000"`).
3. Adresele trebuie sa fie in format Ethereum valid.
4. `q7ContractPatchCode` trebuie sa fie `"1"`.
5. Validatorul verifica in cod ca `contracts/SimpleVault.sol` contine `challenge2SecureMode = true;`.

---

## Livrabil

`student/submissions/challenge2-results.json`

Template:

```json
{
  "challenge": "challenge2-reentrancy",
  "studentId": "<id>",
  "instanceId": "lab4-...",
  "answers": {
    "q3VaultAddress": "0x...",
    "q4InitialVaultBalanceEth": "0.0000",
    "q5AttackerContractAddress": "0x...",
    "q6FinalVaultBalanceEth": "0.0000",
    "q7ContractPatchCode": "1"
  }
}
```

---

## Daca ceva nu merge

| Problema | Solutie |
|---|---|
| `simple-vault.json not found` | Ruleaza `npm run deploy:vault` |
| Eroare de conectare RPC | Porneste Ganache: `./start-ganache.sh` |
| `q7ContractPatchCode: must be '1'` | Seteaza `q7ContractPatchCode` la `"1"` |
| `must contain challenge2SecureMode set to true` | Verifica `contracts/SimpleVault.sol` si seteaza `challenge2SecureMode = true` |

---

Succes!
