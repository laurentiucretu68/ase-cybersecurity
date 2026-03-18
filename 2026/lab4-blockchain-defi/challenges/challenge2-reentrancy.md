# Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: Intermediate  
**Puncte**: 50  
**Durată estimată**: 60-90 minute

---

## Poveste

După incidentul investigat în Challenge 1, echipa EtherBank descoperă că modulul de depozitare (`SimpleVault`) are un bug critic de securitate. Contractul permite utilizatorilor să depună și să retragă ETH, dar ordinea operațiilor interne lasă o fereastră de atac exploatabilă.

Rolul tău este de **security auditor**:
1. Identifici exact unde este vulnerabilitatea în codul Solidity.
2. Demonstrezi impactul printr-un atac controlat (contract de atac).
3. Documentezi rezultatele într-un format strict, ușor de corectat automat.

---

## Concepte necesare

Dacă nu ai citit teoria, consultă [THEORY.md](../THEORY.md), secțiunea 5 (Reentrancy).

### Ce este reentrancy

**Reentrancy** apare când un contract face un **external call** (de exemplu, trimite ETH) către o adresă externă **înainte** de a-și actualiza starea internă. Contractul apelat poate reintra în aceeași funcție și poate executa logica sensibilă de mai multe ori, exploatând starea neactualizată.

Este una dintre cele mai costisitoare vulnerabilități din istoria Ethereum (The DAO Hack, 2016, ~60M USD).

### Cum arată problema concret

Într-un contract vulnerabil, ordinea operațiilor este:

```
1. CHECK    require(balance >= amount)      ← verificare: "ai destui bani?"
2. CALL     msg.sender.call{value}("")      ← trimite ETH (PERICOL: controlul trece la destinatar)
3. EFFECT   balance -= amount               ← actualizare stare (PREA TÂRZIU!)
```

Între pașii 2 și 3, contractul apelat (atacatorul) primește ETH, și funcția sa `receive()` se execută automat. Din acea funcție, atacatorul poate **reapela** `withdraw()`. Deoarece balanța nu a fost încă actualizată, verificarea de la pasul 1 trece din nou.

### Diagrama atacului pas cu pas

```
Atacator                         SimpleVault
   │                                  │
   │── 1. deposit(1 ETH) ──────────►  │  (atacatorul depune 1 ETH)
   │                                  │  balances[attacker] = 1 ETH
   │                                  │
   │── 2. withdraw(1 ETH) ─────────►  │
   │                                  │── check: balance >= 1? ✓
   │                                  │── SEND 1 ETH ──────────►│
   │◄── 3. receive() se execută ─────────────────────────────────│
   │   (balanța ÎNCĂ = 1 ETH!)        │                         │
   │                                  │                         │
   │── 4. withdraw(1 ETH) ─────────►  │  (re-intrare!)          │
   │                                  │── check: balance >= 1? ✓│
   │                                  │── SEND 1 ETH ──────────►│
   │◄── 5. receive() se execută ─────────────────────────────────│
   │                                  │                         │
   │── 6. withdraw(1 ETH) ─────────►  │  (re-intrare!)          │
   │                                  │── check: balance >= 1? ✓│
   │                                  │── SEND 1 ETH ──────────►│
   │                                  │                         │
   │   ... se repetă de N ori ...     │                         │
   │                                  │                         │
   │   (când atacul se oprește)        │── effect: balance -= 1  │
   │                                  │── effect: balance -= 1  │
   │                                  │── effect: balance -= 1  │
   │                                  │  (underflow cu unchecked)│
   │                                  │                         │
   │  Atacator: +N ETH                │  Vault: golit           │
```

### De ce funcționează: `.call{value}()` și transferul de control

Când un contract trimite ETH prin:

```solidity
(bool success, ) = msg.sender.call{value: _amount}("");
```

Controlul execuției **trece complet** la contractul destinatar. Dacă destinatarul are o funcție `receive()`, aceasta se execută cu tot gasul disponibil. Abia după ce `receive()` se termină, execuția revine la contractul apelant.

Alte metode de transfer (`transfer()`, `send()`) limitează gasul la 2300 — insuficient pentru un reapel. Dar `.call{value}()` transmite tot gasul, permițând reapeluri complexe.

### Soluția: pattern-ul Checks-Effects-Interactions (CEI)

Regula de aur este simplă — modifică starea internă **înainte** de a interacționa cu contracte externe:

```
1. CHECKS         require(balance >= amount)
2. EFFECTS        balance -= amount           ← starea se actualizează ACUM
3. INTERACTIONS   msg.sender.call{value}("")  ← transferul extern, ULTIMUL
```

Cu ordinea corectă, chiar dacă atacatorul reintra, verificarea de la pasul 1 eșuează deoarece balanța a fost deja scăzută.

O protecție suplimentară este **Reentrancy Guard** (mutex):

```solidity
bool private locked;
modifier noReentrancy() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}
```

---

## Setup

```bash
cd ~/lab4-blockchain-defi
./start-ganache.sh
npm run deploy:vault
```

Fișiere relevante:
- `contracts/SimpleVault.sol` — contractul vulnerabil (și versiunea securizată, pentru comparație)
- `contracts/VaultAttacker.sol` — contract de atac complet + template pentru studenți
- `deployments/simple-vault.json` — adresa vault-ului și datele de deploy

---

## Obiective practice

1. **Analizezi** funcțiile `withdraw` și `withdrawAll` din `SimpleVault.sol` și identifici vulnerabilitatea.
2. **Implementezi** contractul de atac `MyVaultAttacker.sol` (poți folosi `VaultAttackerTemplate` din `VaultAttacker.sol` ca punct de plecare).
3. **Rulezi** exploitul pe chain-ul local și observi cum vault-ul este golit.
4. **Extragi** datele necesare pentru răspunsurile Q1-Q10.

---

## Ghid de implementare

### Structura minimă a contractului de atac

Contractul tău are nevoie de:

1. **Referință la vault** — adresa + interfața `ISimpleVault` (definită în `VaultAttacker.sol`).
2. **Funcție de deposit** — depune o sumă mică de ETH în vault (necesară pentru a avea o balanță de pe care să retragi).
3. **Funcție de atac** — pornește retragerea; apelează `vault.withdraw(amount)`.
4. **`receive()` sau `fallback()`** — funcția specială care se execută automat când contractul primește ETH. Aici reapelezi `vault.withdraw()`.
5. **Condiție de oprire** — verifică soldul vault-ului și/sau un contor de iterații, altfel riști out-of-gas.

### Exemplu conceptual (pseudocod)

```
contract MyAttacker {
    vault = ISimpleVault(vaultAddress)
    counter = 0
    maxRounds = 5

    function startAttack() {
        vault.deposit{value: 1 ETH}()
        vault.withdraw(1 ETH)
    }

    receive() {
        counter++
        if vault.balance >= 1 ETH AND counter < maxRounds:
            vault.withdraw(1 ETH)
    }
}
```

### Ce să monitorizezi în timpul atacului

| Metric | Cum verifici |
|---|---|
| Soldul vault-ului înainte | `vault.getContractBalance()` sau `address(vault).balance` |
| Soldul vault-ului după atac | La fel, după ce atacul s-a terminat |
| Soldul contractului atacator | `address(this).balance` sau `attacker.getStolenAmount()` |
| Numărul de reapelări | Counter intern sau event-uri `ReentrancyTriggered` |
| Consum de gas | Receipt-ul tranzacției de atac |

### Capcane frecvente

1. **Atacul pornește fără deposit** — trebuie să ai o balanță în vault înainte de `withdraw()`.
2. **`receive()` nu conține reapelul** — dacă nu reapelezi `vault.withdraw()` din `receive()`, nu există reentrancy.
3. **Lipsă condiție de oprire** — fără limită de iterații sau verificare de sold, atacul consumă tot gasul și tranzacția reverts.
4. **Format greșit în JSON** — câmpurile ETH trebuie scrise ca string cu 4 zecimale (ex: `"92.0000"`, nu `92` sau `"92"`).

---

## Reguli de răspuns

1. Livrabilul este un fișier JSON.
2. Completezi **toate** câmpurile din template.
3. Pentru câmpurile ETH folosești string numeric cu **4 zecimale** (ex: `"92.0000"`).
4. Pentru adrese folosești formatul `0x...` (42 caractere).
5. Pentru linii de cod, copiază **exact** din contract (inclusiv spații, punct și virgulă).

---

## Întrebări (10 × 5p = 50p)

### Q1 (5p) — Funcția vulnerabilă principală
Care este funcția vulnerabilă principală din `SimpleVault`?

Răspunsul este numele funcției (ex: `withdraw`). Caută funcția care trimite ETH prin `.call{value}()` **înainte** de a actualiza `balances[]`.

### Q2 (5p) — A doua funcție vulnerabilă
Care este a doua funcție vulnerabilă care urmează același pattern?

Hint: `SimpleVault` are două funcții de retragere. Ambele au aceeași problemă de ordine.

### Q3 (5p) — Linia de external call
Care este linia exactă de external call din `withdraw(uint256 _amount)`?

Copiază linia din contract care face `.call{value}()`. Exemplu de format:
```
(bool success, ) = msg.sender.call{value: _amount}("");
```

### Q4 (5p) — Liniile de state update post-call
Care sunt cele **două** linii de state update executate **după** external call în funcția `withdraw`?

Sunt cele două linii care modifică `balances[]` și `totalDeposits` — dar care apar prea târziu (după `.call()`).

### Q5 (5p) — Pattern-ul de vulnerabilitate
Ce pattern de vulnerabilitate identifici aici?

Răspunsul este un token scurt, lowercase, cu cratime (ex: `reentrancy`). Gândește-te la clasificarea standard din SWC Registry.

### Q6 (5p) — Adresa vault-ului
Care este adresa `SimpleVault` deployat pe chain-ul tău local?

O găsești în `deployments/simple-vault.json`, câmpul `contractAddress`.

### Q7 (5p) — Balanța inițială a vault-ului
Care este balanța inițială totală a vault-ului (în ETH, format `X.XXXX`)?

O găsești în `deployments/simple-vault.json`, câmpul `totalBalance`. Formatează cu 4 zecimale.

### Q8 (5p) — Adresa contractului atacator
Care este adresa contractului tău attacker după deploy?

Obții adresa la deploy-ul contractului `MyVaultAttacker.sol` pe chain-ul local.

### Q9 (5p) — Soldul final al vault-ului
Care este soldul final al vault-ului după atac (în ETH, format `X.XXXX`)?

Verifică `address(vault).balance` sau `vault.getContractBalance()` după execuția atacului.

### Q10 (5p) — Pattern-ul de remediere
Ce pattern de remediere propui pentru a fixa vulnerabilitatea?

Răspunsul este un token scurt, lowercase, cu cratime. Gândește-te la regula de aur din secțiunea de teorie.

---

## Workflow recomandat

### 1. Analizează contractul vulnerabil

```bash
code contracts/SimpleVault.sol
```

Citește funcțiile `withdraw()` și `withdrawAll()`. Identifică ordinea: check → call → effect (greșit) vs. check → effect → call (corect).

### 2. Compilează

```bash
npx hardhat compile
```

### 3. Creează contractul de atac

Creează `contracts/MyVaultAttacker.sol`. Poți folosi `VaultAttackerTemplate` ca punct de plecare sau scrie de la zero. Structura minimă:

- constructor cu adresa vault-ului;
- funcție de deposit;
- funcție de atac;
- `receive()` cu reapel;
- funcție de extragere fonduri.

### 4. Rulează exploitul

Folosește un script Hardhat sau consola interactivă (`npx hardhat console --network localhost`). Pașii:

1. Obține referința la vault-ul deployat.
2. Deploy contractul atacator cu adresa vault-ului.
3. Depune ETH în vault prin contractul atacator.
4. Lansează atacul.
5. Verifică soldurile (vault, atacator).

### 5. Completează JSON-ul

Verifică valorile runtime (adrese, balanțe) și completează `student/submissions/challenge2-results.json`.

### 6. Validează formatul

```bash
npm run validate:results -- --challenge2
```

---

## Debugging util

Dacă atacul nu produce efect:

1. **Verifică deposit-ul** — contractul atacator trebuie să aibă o balanță nenulă în vault înainte de `withdraw()`.
2. **Verifică `receive()`** — trebuie să conțină reapelul `vault.withdraw()` cu condiție de oprire.
3. **Verifică soldul vault-ului** — dacă vault-ul e gol, atacul nu mai are ce drena. Redeploy cu `npm run deploy:vault`.
4. **Începe simplu** — setează `maxAttacks` la 2-3 inițial. Crește după ce verifici că funcționează.
5. **Verifică gasul** — dacă primești out-of-gas, scade numărul de iterații sau crește gas limit-ul la deploy.

---

## Livrabile

1. `contracts/MyVaultAttacker.sol` — contractul tău de atac
2. `student/submissions/challenge2-results.json` — răspunsurile

Poți porni de la template:
```bash
cp submission-templates/challenge2-results.template.json student/submissions/challenge2-results.json
```

Template JSON complet:

```json
{
  "challenge": "challenge2-reentrancy",
  "studentId": "<id>",
  "instanceId": "lab4-...",
  "answers": {
    "q1VulnerableFunction": "<string>",
    "q2SecondVulnerableFunction": "<string>",
    "q3ExternalCallLine": "<solidity_line>",
    "q4PostCallStateUpdates": [
      "<line_1>",
      "<line_2>"
    ],
    "q5VulnerabilityPattern": "<token>",
    "q6VaultAddress": "0x...",
    "q7InitialVaultBalanceEth": "0.0000",
    "q8AttackerContractAddress": "0x...",
    "q9FinalVaultBalanceEth": "0.0000",
    "q10RemediationPattern": "<token>"
  }
}
```

**Important**: `instanceId` trebuie completat cu valoarea din `student/instance.json`.

Validare format:

```bash
npm run validate:results -- --challenge2
```

---

**Succes!**
