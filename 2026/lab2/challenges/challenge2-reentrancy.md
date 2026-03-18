# Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: Beginner-Intermediate  
**Puncte**: 50  
**Durata estimata**: 45-90 minute

---

## Obiectiv

In acest challenge lucrezi pe contractul `SimpleVault`:
1. rulezi atacul de reentrancy si extragi valorile on-chain cerute;
2. rezolvi un exercitiu final de departajare (patch real in contract, personalizat per student).

---

## Setup

```bash
cd ~/lab2
./start-ganache.sh
npm run deploy:vault
```

---

## Scripturi helper (optional)

```bash
npm run c2:calc:gas
npm run c2:calc:patch
```

Ce fac:
- `c2:calc:gas` afiseaza valoarea pentru `q5AttackGasFeeEth` din `deployments/attack-results.json`.
- `c2:calc:patch` afiseaza 2 linii: `patchCode` si `patchChecksum`.

---

## Pas cu pas

### Pasul 1: Ruleaza atacul (Q1-Q5)

```bash
npm run attack
```

Din output si din `deployments/attack-results.json` completezi:
- Q1 `q1VaultAddress`
- Q2 `q2InitialVaultBalanceEth`
- Q3 `q3AttackerContractAddress`
- Q4 `q4FinalVaultBalanceEth`
- Q5 `q5AttackGasFeeEth`

Pentru Q5 poti folosi:
```bash
npm run c2:calc:gas
```

### Pasul 2: Exercitiu final de departajare (Q6)

Acesta este pasul mai greu si personalizat.

1. Ia codul personalizat al instantei tale:

```bash
npm run c2:calc:patch
```

Output-ul are doua linii:
- linia 1: `patchCode` (valoarea pentru Q6)
- linia 2: `patchChecksum` (valoarea de verificare)

2. Adauga aceste valori in `contracts/SimpleVault.sol`

3. Redeploy si retesteaza:

```bash
npm run deploy:vault
npm run attack
```

Scopul este sa activezi modul securizat si sa aplici patch-ul personalizat corect.

---

## Date de trimis (50p)

### Q1 (8p) - `q1VaultAddress`
Adresa vault-ului pentru instanta curenta.

### Q2 (8p) - `q2InitialVaultBalanceEth`
Soldul initial al vault-ului, format cu 4 zecimale.

### Q3 (8p) - `q3AttackerContractAddress`
Adresa contractului atacator deployat de script.

### Q4 (8p) - `q4FinalVaultBalanceEth`
Soldul final al vault-ului dupa rularea atacului, format cu 4 zecimale.

### Q5 (8p) - `q5AttackGasFeeEth`
Gas fee-ul tranzactiei de atac, format cu 6 zecimale.

### Q6 (10p) - `q6ContractPatchCode`
Codul de patch personalizat al instantei tale (cel folosit in `SimpleVault.sol`).

Nota:
- Validatorul verifica si codul sursa:
  - `challenge2SecureMode = true`
  - `challenge2PatchCode = q6ContractPatchCode`
  - `challenge2PatchChecksum = (q6ContractPatchCode % 97) + 3`

---

## Reguli de format

1. `studentId` si `instanceId` sunt obligatorii.
2. Q2 si Q4: string numeric cu 4 zecimale (ex: `"92.0000"`).
3. Q5: string numeric cu 6 zecimale (ex: `"0.002814"`).
4. Q6: string numeric intreg (ex: `"4821"`).
5. Adresele Ethereum au format `0x...` (42 caractere).

---

## Livrabil

Fisier: `student/submissions/challenge2-results.json`

Template:

```json
{
  "challenge": "challenge2-reentrancy",
  "studentId": "<id>",
  "instanceId": "lab2-...",
  "answers": {
    "q1VaultAddress": "0x...",
    "q2InitialVaultBalanceEth": "0.0000",
    "q3AttackerContractAddress": "0x...",
    "q4FinalVaultBalanceEth": "0.0000",
    "q5AttackGasFeeEth": "0.000000",
    "q6ContractPatchCode": "0000"
  }
}
```

Validare:

```bash
npm run validate:results -- --challenge2
```

---

**Succes!**
