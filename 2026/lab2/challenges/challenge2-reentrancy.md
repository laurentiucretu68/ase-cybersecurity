# Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: Beginner-Intermediate  
**Puncte**: 50  
**Durată estimată**: 45-60 minute

---

## Poveste

EtherBank are un "seif digital" (smart contract `SimpleVault`) unde clienții depun și retrag ETH. Problema: seiful are un bug. Dacă ești suficient de atent, poți retrage mai mulți bani decât ai depus.

Ca security auditor, trebuie să:
1. Citești codul seifului și să înțelegi unde e problema.
2. Rulezi un atac pregătit care demonstrează bug-ul.
3. Completezi un JSON cu răspunsurile.

**Nu trebuie să scrii cod Solidity de la zero.** Scriptul de atac este deja pregătit. Focusul este pe **înțelegerea vulnerabilității**.

---

## Concepte explicate simplu

### Ce este un smart contract

Gândește-te la un automat de cafea programabil:
- Primește bani (ETH).
- Execută reguli scrise în cod.
- Dă bani înapoi dacă regulile zic să o facă.
- Nimeni nu-l poate opri sau modifica după ce a fost "instalat" (deployed).

`SimpleVault` este un astfel de automat: primește depuneri și permite retrageri.

### Ce este Reentrancy (pe scurt)

Imaginează-ți un bancomat defect:
1. Ceri 100 lei.
2. Bancomatul îți dă banii.
3. **Înainte să-ți scadă soldul**, tu apeși din nou pe "Retrage".
4. Bancomatul verifică soldul → soldul e încă 100 → îți dă iar 100 lei.
5. Repeți de câte ori vrei.

Exact asta este **reentrancy**: contractul trimite banii **înainte** de a-și actualiza evidența. Un atacator reapelează retragerea în mod repetat, golind seiful.

### Unde e bug-ul în cod

Deschide `contracts/SimpleVault.sol` și caută funcția `withdraw`. Ordinea operațiilor este:

```
Pas 1: Verificare  →  "Ai destui bani?"           ✓ OK
Pas 2: Transfer    →  "Ia banii"                   ← AICI E PROBLEMA
Pas 3: Evidență    →  "Scad din sold"              ← PREA TÂRZIU!
```

Între Pas 2 și Pas 3, atacatorul primește banii și **reapelează** funcția de retragere. Soldul nu a fost încă scăzut, deci verificarea de la Pas 1 trece din nou.

Ordinea **corectă** ar fi fost: Verificare → Evidență → Transfer.

### Cum arată atacul vizual

```
Atacator                     Seiful (SimpleVault)
   │                              │
   │── depune 1 ETH ───────────► │  sold atacator = 1 ETH
   │                              │
   │── retrage 1 ETH ──────────► │  verificare: sold >= 1? DA ✓
   │                              │── trimite 1 ETH ────────►│
   │◄── primesc banii ───────────────────────────────────────│
   │   (sold INCA = 1, nu s-a scazut!)                       │
   │                              │                           │
   │── retrage 1 ETH (din nou!)─► │  verificare: sold >= 1? DA ✓
   │                              │── trimite 1 ETH ────────►│
   │◄── primesc iar banii ───────────────────────────────────│
   │                              │                           │
   │   ... se repetă ...          │  Seif: GOLIT              │
```

### Cum se repară (soluția corectă)

Schimbi ordinea: **întâi scazi din sold, apoi trimiți banii**.

Acest pattern se numește **Checks-Effects-Interactions** (prescurtat CEI):

```
1. CHECKS          →  Verifici condițiile
2. EFFECTS         →  Actualizezi soldul (evidența internă)
3. INTERACTIONS    →  Abia apoi trimiți bani / apelezi alt contract
```

Poți vedea versiunea reparată în același fișier `SimpleVault.sol`, contractul `SimpleVaultSecure`.

---

## Setup

```bash
cd ~/lab2
./start-ganache.sh          # dacă Ganache nu rulează deja
npm run deploy:vault
```

Dacă ai rulat `npm run deploy:all` la Challenge 1, vault-ul este deja deployed.

## Scripturi helper (optional)

Pe langa pasii manuali (CLI + Ganache GUI), poti folosi si scripturile din `scripts/challenge2`:

```bash
npm run c2:calc:gas
npm run c2:results
```

Ce fac:
- `c2:calc:gas` afiseaza direct valoarea pentru `q7AttackGasFeeEth` (din `deployments/attack-results.json`).
- `c2:results` genereaza automat `student/submissions/challenge2-results.json`.

Aceste scripturi sunt utile pentru verificare rapida si pentru completarea corecta a livrabilului.

---

## Pas cu pas: cum rezolvi challenge-ul

### Pasul 1: Citește codul vulnerabil (Q1, Q2)

Deschide fișierul `contracts/SimpleVault.sol` și citește funcțiile `withdraw()` și `withdrawAll()`.

Ce trebuie să observi:
- Ambele funcții trimit ETH cu `.call{value}()` **înainte** de a scădea soldul.
- Pattern-ul se numește **reentrancy**.
- Soluția: pattern-ul **checks-effects-interactions**.

### Pasul 2: Rulează atacul (Q3-Q6)

```bash
npm run attack
```

Scriptul deployează un contract de atac, depune ETH, lansează atacul, și afișează rezultatele. Copiază valorile Q3-Q6 din output.

### Pasul 3: Află gas fee-ul atacului (Q7)

Din output-ul de la Pasul 2, notează **Attack TX hash**.

**Varianta CLI:**
```bash
npm run inspect:tx -- <attack_tx_hash>
```
Citește linia `Gas fee:` din output și formatează cu 6 zecimale.

**Varianta GUI:** Deschide Ganache GUI → tab TRANSACTIONS → caută tranzacția după hash → notează **GAS USED** și **GAS PRICE**. Calculează:
```
gas fee (ETH) = gasUsed × gasPrice ÷ 1000000000000000000
```

### Pasul 4: Completează JSON-ul

```bash
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

Completează `studentId`, `instanceId` (din `student/instance.json`), Q1-Q2 (din analiză), Q3-Q6 (din output atac), Q7 (din inspect/GUI).

### Pasul 5: Validare

```bash
npm run validate:results -- --challenge2
```

---

## Întrebări (7 x ~7p = 50p)

### Q1 (8p) — Ce tip de vulnerabilitate este aceasta?

Un singur cuvânt, lowercase. Vulnerabilitatea care permite reapelarea unei funcții înainte ca starea să fie actualizată.

### Q2 (8p) — Ce pattern de remediere propui?

Trei cuvinte separate cu cratime, lowercase. Ordinea corectă: verificare → actualizare → interacțiune.

### Q3 (7p) — Adresa vault-ului

Din output-ul `npm run attack` (linia Q3) sau din `deployments/simple-vault.json`.

### Q4 (7p) — Balanța inițială a vault-ului

Din output-ul `npm run attack` (linia Q4). Format: `X.XXXX` (4 zecimale).

### Q5 (7p) — Adresa contractului atacator

Din output-ul `npm run attack` (linia Q5).

### Q6 (6p) — Soldul final al vault-ului după atac

Din output-ul `npm run attack` (linia Q6). Format: `X.XXXX`.

### Q7 (7p) — Gas fee-ul tranzacției de atac

Necesită câțiva pași:
1. Notează **Attack TX hash** din output-ul `npm run attack`.
2. Inspectează tranzacția (`npm run inspect:tx -- <hash>` sau Ganache GUI).
3. Extrage gas fee-ul și formatează cu **6 zecimale** (ex: `"0.002814"`).

---

## Reguli de format

1. `studentId` și `instanceId` trebuie completate.
2. Valorile ETH Q3-Q6 sunt string-uri cu 4 zecimale (ex: `"92.0000"`).
3. Valoarea ETH Q7 este string cu 6 zecimale (ex: `"0.002814"`).
4. Adresele încep cu `0x` (42 caractere total).
5. Pattern-urile (Q1, Q2) sunt lowercase, fără spații.

---

## Livrabil

`student/submissions/challenge2-results.json`

```json
{
  "challenge": "challenge2-reentrancy",
  "studentId": "<id>",
  "instanceId": "lab2-...",
  "answers": {
    "q1VulnerabilityPattern": "<token>",
    "q2RemediationPattern": "<token>",
    "q3VaultAddress": "0x...",
    "q4InitialVaultBalanceEth": "0.0000",
    "q5AttackerContractAddress": "0x...",
    "q6FinalVaultBalanceEth": "0.0000",
    "q7AttackGasFeeEth": "0.000000"
  }
}
```

Validare:

```bash
npm run validate:results -- --challenge2
```

---

## Dacă ceva nu merge

| Problemă | Soluție |
|---|---|
| `npm run attack` — "simple-vault.json not found" | `npm run deploy:vault` |
| `npm run attack` — eroare de conectare | `./start-ganache.sh` |
| Vrei să rulezi atacul din nou | `npm run deploy:vault` apoi `npm run attack` |
| Validatorul zice "must be numeric string with N decimals" | Verifică formatul: `"92.0000"` (4 zec) sau `"0.002814"` (6 zec) |

---

**Succes!**
