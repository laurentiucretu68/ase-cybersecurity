# ⚔️ Challenge 2: Reentrancy Attack - "Breaking the Vault"

**Dificultate**: 🟡 Intermediate  
**Puncte**: 50  
**Durată estimată**: 60-90 minute

## 📖 Poveste

După incidentul investigat în Challenge 1, echipa EtherBank descoperă că modulul de depozitare (`SimpleVault`) are un bug critic de securitate.

Rolul tău este de security auditor:
1. identifici exact unde este vulnerabilitatea;
2. demonstrezi impactul printr-un atac controlat;
3. documentezi rezultatele într-un format strict, ușor de corectat automat.

---

## 🧠 Context tehnic

### Ce este reentrancy

Reentrancy apare când un contract face un external call către o adresă neîncredere înainte să își actualizeze starea internă.  
Contractul apelat poate reintra în aceeași funcție și poate executa logică sensibilă de mai multe ori.

### Cum arată problema, pe scurt

Ordinea greșită este:
1. contractul trimite ETH către atacator;
2. atacatorul intră din nou în funcția de retragere;
3. abia după aceea vault-ul încearcă să își actualizeze starea.

Consecința: aceeași balanță poate fi exploatată de mai multe ori în aceeași secvență de apeluri.

### Cum funcționează un atac reușit

1. Contractul atacator depune o sumă mică în vault, ca să treacă validările.
2. Contractul atacator pornește retragerea.
3. La primirea ETH, `receive()`/`fallback()` este declanșat automat.
4. Din `receive()`/`fallback()`, atacatorul reapelează retragerea cât timp mai există fonduri.
5. Bucla continuă până când vault-ul nu mai are sold suficient sau atacul este oprit de logică/gas.

### Cum arată remedierea corectă (conceptual)

Într-o implementare sigură, contractul face:
1. verificări;
2. actualizarea stării interne;
3. interacțiunea externă.

Asta elimină fereastra în care un contract extern poate reintra înainte de update-ul intern.

---

## 🧪 Setup

```bash
cd ~/lab4-blockchain-defi
./start-ganache.sh
npm run deploy:vault
```

Fișiere utile:
- `contracts/SimpleVault.sol`
- `contracts/VaultAttacker.sol`
- `deployments/simple-vault.json`

---

## 🎯 Obiective practice

1. Analizezi funcțiile de withdraw din `SimpleVault`.
2. Implementezi/completezi `MyVaultAttacker.sol`.
3. Rulezi exploitul pe chain-ul local.
4. Extragi datele necesare pentru răspunsurile Q1-Q10.

---

## 🧱 Ghid de implementare

### Structura minimă a contractului de atac

Contractul tău are nevoie de:
1. referință la vault (adresă + interfață);
2. o funcție de inițializare/deposit;
3. o funcție care pornește atacul;
4. `receive()` sau `fallback()` pentru reapel;
5. un mecanism de oprire (condiție de sold și/sau limită de iterații).

### Ce să monitorizezi în timpul atacului

1. soldul vault-ului înainte și după;
2. soldul contractului atacator;
3. numărul de reapelări;
4. consumul de gas.

### Capcane frecvente

1. Atacul pornește fără deposit inițial în vault.
2. `receive()` nu conține reapelul sau condiția de continuare.
3. Logică fără limită de iterații, care duce la out-of-gas.
4. Format greșit al valorilor în JSON (mai ales câmpurile ETH).

---

## ✅ Reguli de răspuns

1. Livrabilul este JSON.
2. Completezi toate câmpurile din template.
3. Pentru câmpurile ETH folosești string numeric cu 4 zecimale (ex: `92.0000`).
4. Pentru adrese folosești formatul `0x...`.
5. Pentru linii de cod, copiază exact din contract.

---

## 📋 Întrebări (10 x 5p = 50p)

### Q1 (5p)
Care este funcția vulnerabilă principală din `SimpleVault`?

### Q2 (5p)
Care este a doua funcție vulnerabilă care urmează același pattern?

### Q3 (5p)
Care este linia exactă de external call din `withdraw(uint256 _amount)`?

### Q4 (5p)
Care sunt cele două linii de state update executate după external call în `withdraw`?

### Q5 (5p)
Ce pattern de vulnerabilitate identifici aici (token scurt)?

### Q6 (5p)
Care este adresa `SimpleVault` din `deployments/simple-vault.json`?

### Q7 (5p)
Care este `totalBalance` inițial din `deployments/simple-vault.json`?

### Q8 (5p)
Care este adresa contractului tău attacker după deploy?

### Q9 (5p)
Care este soldul final al vault-ului după atac?

### Q10 (5p)
Ce pattern de remediere propui (token scurt)?

---

## 🛠️ Workflow recomandat

1. Deschide contractul vulnerabil:
```bash
code contracts/SimpleVault.sol
```

2. Compilează:
```bash
npx hardhat compile
```

3. Rulează exploitul tău (script sau console) pe `localhost`.

4. Verifică valori runtime (adrese, balanțe, rezultat final) și completează JSON-ul.

5. Validează formatul livrabilului înainte de predare:
```bash
npm run validate:results -- --challenge2
```

---

## 🧪 Debugging util

Dacă atacul nu produce efect:
1. verifică dacă ai fonduri depuse în vault pe adresa contractului atacator;
2. verifică dacă `receive()`/`fallback()` este executat;
3. verifică soldul disponibil în vault înainte de fiecare reapel;
4. încearcă inițial cu logică de reapel limitată, apoi ajustează.

---

## 📤 Livrabile

1. `contracts/MyVaultAttacker.sol`
2. `student/submissions/challenge2-results.json`

Template JSON obligatoriu:

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

Validare format:

```bash
npm run validate:results -- --challenge2
```

---

**Succes!**
