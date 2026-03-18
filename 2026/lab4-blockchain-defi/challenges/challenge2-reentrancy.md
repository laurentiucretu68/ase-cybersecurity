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
   │── retrage 1 ETH (din nou!)─► │  verificare: sold >= 1? DA ✓
   │                              │── trimite 1 ETH ────────►│
   │                              │                           │
   │   ... se repetă ...          │                           │
   │                              │                           │
   │  Atacator: +N ETH            │  Seif: GOLIT              │
```

### Cum se repară (soluția corectă)

Schimbi ordinea: **întâi scazi din sold, apoi trimiți banii**.

Acest pattern se numește **Checks-Effects-Interactions** (prescurtat CEI):

```
1. CHECKS          →  Verifici condițiile
2. EFFECTS         →  Actualizezi soldul (evidența internă)
3. INTERACTIONS    →  Abia apoi trimiți bani / apelezi alt contract
```

Dacă atacatorul reintra, verificarea eșuează instant deoarece soldul a fost deja scăzut.

Poți vedea versiunea reparată în același fișier `SimpleVault.sol`, contractul `SimpleVaultSecure`. Compară ordinea operațiilor din `withdraw()` cu cea din versiunea vulnerabilă.

---

## Setup

Asigură-te că ai rulat deja pașii inițiali:

```bash
cd ~/lab4-blockchain-defi
./start-ganache.sh          # dacă Ganache nu rulează deja
npm run deploy:vault
```

Dacă ai rulat `npm run deploy:all` la Challenge 1, vault-ul este deja deployed.

---

## Pas cu pas: cum rezolvi challenge-ul

### Pasul 1: Citește codul vulnerabil (Q1, Q2)

Deschide fișierul `contracts/SimpleVault.sol`:

```bash
code contracts/SimpleVault.sol
```

Sau deschide-l din explorer-ul VS Code. Citește funcțiile `withdraw()` (linia ~52) și `withdrawAll()` (linia ~75).

**Ce trebuie să observi:**
- Ambele funcții trimit ETH cu `.call{value}()` **înainte** de a scădea soldul.
- Acesta este pattern-ul vulnerabil: transfer înainte de update stare.
- Pattern-ul se numește **reentrancy**.
- Soluția corectă: pattern-ul **checks-effects-interactions** (inversezi ordinea).

Cu aceste observații poți răspunde la Q1 și Q2.

### Pasul 2: Rulează atacul (Q3-Q6)

Nu trebuie să scrii niciun cod. Rulează scriptul de atac pregătit:

```bash
npm run attack
```

**Ce face scriptul:**
1. Citește adresa vault-ului din `deployments/simple-vault.json`.
2. Deployează un contract de atac pe chain-ul local.
3. Depune o sumă mică de ETH în vault.
4. Lansează atacul de reentrancy.
5. Afișează rezultatele: balanțe înainte/după, adresa atacatorului, ETH furați.

**Output-ul arată cam așa:**
```
=== CHALLENGE 2: REENTRANCY ATTACK ===

Vault address: 0x...
Vault balance INAINTE de atac: 92.0 ETH

--- Deploying attacker contract ---
Attacker deployed la: 0x...

--- Lansare atac reentrancy ---
Atac executat!

=== REZULTATE ===

Vault balance DUPA atac: 0.0 ETH
ETH furati de attacker: 93.0 ETH

=== VALORILE PENTRU JSON (Q3-Q6) ===

Q3  vaultAddress:             0x...
Q4  initialVaultBalanceEth:    92.0000
Q5  attackerContractAddress:   0x...
Q6  finalVaultBalanceEth:      0.0000
```

Copiază valorile Q3-Q6 din output.

> Datele sunt salvate și în `deployments/attack-results.json` pentru referință.

### Pasul 3: Completează JSON-ul

Copiază template-ul:

```bash
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

Deschide `student/submissions/challenge2-results.json` și completează:

- `studentId` — ID-ul tău (email sau matricol)
- `instanceId` — din `student/instance.json`
- Q1-Q2 — din analiza codului (Pasul 1)
- Q3-Q6 — din output-ul scriptului de atac (Pasul 2)

### Pasul 4: Validare

```bash
npm run validate:results -- --challenge2
```

Dacă vezi `[OK] Challenge 2` — ai terminat.

---

## Întrebări (6 x ~8p = 50p)

### Q1 (10p) — Ce tip de vulnerabilitate este aceasta?

Răspuns: un singur cuvânt, lowercase. Numele vulnerabilității despre care ai citit în documentație — cea care permite reapelarea unei funcții înainte ca starea să fie actualizată.

### Q2 (10p) — Ce pattern de remediere propui?

Răspuns: trei cuvinte separate cu cratime, lowercase. Gândește-te la ordinea corectă: verificare → actualizare → interacțiune. Poți compara `SimpleVault` (vulnerabil) cu `SimpleVaultSecure` (reparat) din același fișier.

### Q3 (8p) — Adresa vault-ului

O iei din output-ul `npm run attack` (linia `Q3`) sau din `deployments/simple-vault.json`, câmpul `contractAddress`.

### Q4 (8p) — Balanța inițială a vault-ului

O iei din output-ul `npm run attack` (linia `Q4`). Format: `X.XXXX` (4 zecimale).

### Q5 (7p) — Adresa contractului atacator

O iei din output-ul `npm run attack` (linia `Q5`).

### Q6 (7p) — Soldul final al vault-ului după atac

O iei din output-ul `npm run attack` (linia `Q6`). Format: `X.XXXX`.

---

## Reguli de format

1. `studentId` și `instanceId` trebuie completate.
2. Valorile ETH sunt string-uri cu 4 zecimale (ex: `"92.0000"`).
3. Adresele încep cu `0x` (42 caractere total).
4. Pattern-urile (Q1, Q2) sunt lowercase, fără spații (ex: `reentrancy`, `checks-effects-interactions`).

---

## Livrabile

`student/submissions/challenge2-results.json`

Template JSON:

```json
{
  "challenge": "challenge2-reentrancy",
  "studentId": "<id>",
  "instanceId": "lab4-...",
  "answers": {
    "q1VulnerabilityPattern": "<token>",
    "q2RemediationPattern": "<token>",
    "q3VaultAddress": "0x...",
    "q4InitialVaultBalanceEth": "0.0000",
    "q5AttackerContractAddress": "0x...",
    "q6FinalVaultBalanceEth": "0.0000"
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
| `npm run attack` dă eroare "simple-vault.json not found" | Rulează `npm run deploy:vault` mai întâi |
| `npm run attack` dă eroare de conectare | Pornește Ganache: `./start-ganache.sh` |
| Vrei să rulezi atacul din nou | Redeploy vault-ul: `npm run deploy:vault` apoi `npm run attack` |
| Validatorul zice "must be numeric string with 4 decimals" | Asigură-te că valoarea e format `"92.0000"` (string, cu punct, cu 4 zecimale) |
| Nu înțelegi unde e bug-ul | Recitește secțiunea "Unde e bug-ul în cod" de mai sus |

---

**Succes!**
