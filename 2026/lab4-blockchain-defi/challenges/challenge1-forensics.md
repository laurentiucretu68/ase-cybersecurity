# 🔍 Challenge 1: Blockchain Forensics - "Follow the Money"

**Dificultate**: 🟢 Beginner  
**Puncte**: 20  
**Durată estimată**: 30-45 minute

## 📖 Povestea

Un angajat al EtherBank, cunoscut sub pseudonimul **"CryptoThief"**, a furat **100 ETH** din portofelul principal al companiei pe 15 Februarie 2026 la ora 14:37 UTC.

Departamentul IT a reușit să identifice:
- **Adresa portofelului companiei**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5`
- **Hash-ul tranzacției inițiale**: `0x8f4e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`
- **Suma furată**: 100 ETH

Investigația internă sugerează că CryptoThief a lăsat un **mesaj secret** în datele tranzacției - posibil un indiciu despre următoarea țintă sau o provocare pentru echipa de securitate.

**Misiunea ta**: Urmărește fluxul banilor, găsește adresa finală unde au ajuns fondurile și decodează mesajul secret.

> Notă: în varianta curentă a laboratorului, valorile reale sunt generate per student. Folosește `challenge1-data.json` după `npm run deploy:challenge1`.

---

## 🎯 Obiective

### Obiectiv 1: Identifică Lanțul de Tranzacții (10 puncte)

Urmărește ETH-ul furat prin blockchain și răspunde la următoarele întrebări:

1. **Prima destinație**: Unde a trimis CryptoThief cei 100 ETH inițial?
2. **Numărul de transfer-uri**: Prin câte portofel-uri intermediare au trecut fondurile?
3. **Adresa finală**: Care este adresa unde se află acum cei 100 ETH (sau majoritatea lor)?
4. **Timp total**: Cât timp a trecut între primul și ultimul transfer?
5. **Gas fees**: Cât a plătit CryptoThief în total pentru toate tranzacțiile?

### Obiectiv 2: Decodează Mesajul Secret (10 puncte)

Analizează **Input Data** din tranzacția inițială și:

1. Extrage datele hexadecimale
2. Convertește-le în text ASCII
3. Identifică mesajul lăsat de CryptoThief

---

## 🛠️ Instrumente Necesare

### 1. Ganache Block Explorer (Local)
În VM, deschide browser-ul și navighează la:
```
http://localhost:7545
```

### 2. Etherscan (Dacă folosești rețea de test)
Pentru Sepolia Testnet:
```
https://sepolia.etherscan.io/
```

### 3. Tool-uri de conversie Hex
- Online: [RapidTables Hex to ASCII](https://www.rapidtables.com/convert/number/hex-to-ascii.html)
- Terminal (Linux/Mac):
  ```bash
  echo "48656c6c6f" | xxd -r -p
  ```
- Python:
  ```python
  bytes.fromhex("48656c6c6f").decode('utf-8')
  ```

---

## 📝 Pași de Urmat

### Setup Inițial (în VM)

1. **Pornește Ganache**:
   ```bash
   cd ~/lab4-blockchain-defi
   ./start-ganache.sh
   ```
   
   Ar trebui să vezi:
   ```
   Ganache CLI v7.7.0
   Available Accounts
   (0) 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5 (100 ETH) <-- Portofel EtherBank
   (1) 0x... (100 ETH)
   ...
   Listening on 127.0.0.1:7545
   ```

> Nota VM: Daca laboratorul a fost instalat cu `vm-setup/setup-vm.sh`, ruleaza mai intai `npm run init:student -- --student-id <id>`.
> Abia dupa generarea instantei Ganache va porni cu datele studentului, automat la login sau manual cu `./start-ganache.sh`.
> Verifica mai intai `lsof -i :7545`, apoi ruleaza `./start-ganache.sh` doar daca portul nu este deja ocupat.
>
> In VM este expus un singur cont Ganache pentru student. Nu importa un cont nou in MetaMask la fiecare restart; refoloseste acelasi cont deja importat pe masina.

2. **Deploy scenariul de forensics**:
   ```bash
   cd ~/lab4-blockchain-defi
   npm run deploy:challenge1
   ```
   
   Acest script va:
   - Crea scenariul cu tranzacțiile pre-făcute
   - Afișa hash-ul tranzacției inițiale
   - Genera fișierul `challenge1-data.json` cu informațiile necesare

### Pasul 1: Găsește Tranzacția Inițială

1. Deschide **Ganache GUI** sau folosește Ganache CLI:
   Nu porni un al doilea proces `ganache-cli --deterministic`.
   Foloseste instanta Ganache deja pornita in VM si interogheaza chain-ul local cu scripturile helper.

2. Navighează la Block Explorer sau folosește un script pentru a query:
   ```bash
   cd ~/lab4-blockchain-defi/scripts
   node inspect-transaction.js <TRANSACTION_HASH>
   ```

3. **Ce să cauți în tranzacție**:
   - `from`: Adresa portofelului EtherBank
   - `to`: Adresa destinației (primul intermediar)
   - `value`: Ar trebui să fie 100 ETH (în Wei: 100000000000000000000)
   - `input`: Datele hexadecimale (mesajul secret!)
   - `gasUsed`: Pentru calculul costurilor

### Pasul 2: Urmărește Lanțul de Transfer-uri

**Metodă 1: Manual (prin Block Explorer)**

1. Click pe adresa `to` din prima tranzacție
2. Vezi toate tranzacțiile ieșite (outgoing) din acea adresă
3. Identifică transferul următor de ~100 ETH
4. Repetă până găsești adresa finală (fără tranzacții outgoing)

**Metodă 2: Script Automatizat**

Folosește script-ul helper:
```bash
cd ~/lab4-blockchain-defi/scripts
node trace-funds.js 0x8f4e9a1b2c3d4e5f... 100
```

Output-ul va arăta:
```
🔍 Tracing 100 ETH from 0x742d35Cc...

Transfer 1: 0x742d35Cc... → 0xABC123... (100 ETH) | Gas: 0.0021 ETH
Transfer 2: 0xABC123... → 0xDEF456... (99.5 ETH)  | Gas: 0.0018 ETH
Transfer 3: 0xDEF456... → 0x789XYZ... (99 ETH)    | Gas: 0.0019 ETH

✅ Final destination: 0x789XYZ...
💰 Final amount: 99 ETH
⏱️ Total time: 15 minutes
⛽ Total gas spent: 0.0058 ETH
```

### Pasul 3: Extrage și Decodează Mesajul

1. **Extrage Input Data din tranzacția inițială**:
   ```bash
   node inspect-transaction.js 0x8f4e9a1b... --show-input
   ```
   
   Vei vedea ceva de genul:
   ```
   Input Data: 0x546865206e65787420746172676574206973204465466950726f746f636f6c...
   ```

2. **Îndepărtează prefixul `0x`** și păstrează doar hex:
   ```
   546865206e65787420746172676574206973204465466950726f746f636f6c...
   ```

3. **Convertește Hex → ASCII**:
   
   **Opțiunea A - Python Script**:
   ```python
   # decode_message.py
   hex_string = "546865206e65787420746172676574206973204465466950726f746f636f6c"
   message = bytes.fromhex(hex_string).decode('utf-8')
   print(f"Message: {message}")
   ```
   
   Rulează:
   ```bash
   python3 decode_message.py
   ```
   
   **Opțiunea B - Online Tool**:
   - Copiază hex string-ul
   - Deschide https://www.rapidtables.com/convert/number/hex-to-ascii.html
   - Paste și convertește

4. **Analizează mesajul**:
   - Ce spune mesajul?
   - Este o indiciu pentru un alt challenge?
   - Conține vreo adresă sau informație utilă?

---

## 📊 Ce Trebuie să Înveți

### Concepte Blockchain

#### 1. Structura unei Tranzacții Ethereum
```javascript
{
  hash: "0x8f4e9a...",           // ID unic al tranzacției
  from: "0x742d35Cc...",         // Expeditor
  to: "0xABC123...",             // Destinatar
  value: "100000000000000000000", // 100 ETH în Wei
  gas: 21000,                     // Gas limit
  gasPrice: "20000000000",        // 20 Gwei
  gasUsed: 21000,                 // Gas efectiv consumat
  nonce: 5,                       // Numărul tranzacției pentru acest cont
  input: "0x546865...",           // Date arbitrare (aici e mesajul!)
  blockNumber: 12345,             // În ce block a fost inclusă
  blockHash: "0x9b8c7d...",       // Hash-ul block-ului
  timestamp: 1707999420           // Unix timestamp
}
```

#### 2. Conversia între Unități
```
1 ETH = 1,000,000,000 Gwei
1 ETH = 1,000,000,000,000,000,000 Wei

Exemplu:
100 ETH = 100000000000000000000 Wei
```

#### 3. Gas & Fees
```
Transaction Fee = gasUsed × gasPrice

Exemplu:
21000 gas × 20 Gwei = 420,000 Gwei = 0.00042 ETH
```

### Investigație Forensics

#### De ce este Blockchain Transparent?
- ✅ Toate tranzacțiile sunt publice și permanente
- ✅ Poți urmări orice sumă de bani de la origine la destinație
- ✅ Nimeni nu poate șterge sau modifica tranzacțiile

#### Limitările Anonimității
- ⚠️ Adresele sunt pseudonime (nu legate direct de identități reale)
- ⚠️ DAR: Odată ce o adresă este legată de o identitate, tot istoricul devine vizibil
- ⚠️ Tehnici de "mixing" și "tumbling" pot obfusca urmele

#### Tehnici de Tracing Folosite de Autoritați
1. **Chain Analysis**: Urmărirea fluxului de fonduri
2. **Clustering**: Gruparea adreselor care aparțin aceleiași entități
3. **Taint Analysis**: Identificarea fondurilor "murdare"
4. **Exchange Tracking**: Monitorizarea depunerilor la exchange-uri regulate

---

## ✅ Criteriu de Notare

| Task | Puncte | Cerințe |
|------|--------|---------|
| **Identificare lanț complet** | 5p | Documentezi toate adresele intermediare |
| **Adresa finală corectă** | 3p | Identifici destinația finală |
| **Calcul gas fees** | 2p | Calculezi corect costurile totale |
| **Extragere mesaj** | 5p | Extragi corect hex data |
| **Decodare mesaj** | 5p | Convertești în text lizibil |
| **TOTAL** | **20p** | |

---

## 📤 Livrabile

Creează un fișier `challenge1-solution.md` cu următoarele informații:

```markdown
# Challenge 1: Blockchain Forensics - Soluție

**Student**: [Numele tău]
**Data**: [Data]

## Partea 1: Urmărirea Fondurilor

### Lanțul de Tranzacții

1. **Tranzacția inițială**
   - Hash: 0x8f4e9a1b...
   - From: 0x742d35Cc... (EtherBank)
   - To: 0x[adresa_1]
   - Value: 100 ETH
   - Gas Used: [X] | Gas Price: [Y] | Fee: [Z] ETH

2. **Transfer 2**
   - Hash: 0x...
   - From: 0x[adresa_1]
   - To: 0x[adresa_2]
   - Value: [X] ETH
   - Fee: [Y] ETH

[Continuă pentru toate transfer-urile...]

### Sumar
- **Adresa finală**: 0x...
- **Suma finală**: [X] ETH
- **Total gas fees**: [Y] ETH
- **Timp total**: [Z] minute
- **Număr de transfer-uri**: [N]

## Partea 2: Mesajul Secret

### Hex Data Extras
```
[Paste hex string aici]
```

### Mesaj Decodat
```
[Mesajul în text clar]
```

### Interpretare
[Explicația ta despre ce înseamnă mesajul]

## Concluzii

[Observațiile tale despre:
- Dificultatea de a ascunde tranzacții pe blockchain
- Ce ai învățat despre transparența blockchain-ului
- Tehnici folosite de CryptoThief pentru a obfusca urmele
]
```

Salvează și uploada pe Google Classroom.

---

## 💡 Hints

<details>
<summary>🔍 Hint 1: Nu găsesc tranzacția</summary>

Asigură-te că:
1. Ganache rulează (`ps aux | grep ganache`)
2. Folosești hash-ul corect din `challenge1-data.json`
3. Block-urile au fost mined (verifică cu `getBlockNumber()`)

```bash
cd ~/lab4-blockchain-defi/scripts
node check-blockchain.js
```
</details>

<details>
<summary>🔍 Hint 2: Cum convertesc Wei în ETH?</summary>

```javascript
// JavaScript
const ethers = require('ethers');
const weiValue = "100000000000000000000";
const ethValue = ethers.utils.formatEther(weiValue);
console.log(ethValue); // "100.0"
```

```python
# Python
wei_value = 100000000000000000000
eth_value = wei_value / 1e18
print(eth_value)  # 100.0
```
</details>

<details>
<summary>🔍 Hint 3: Mesajul decodat nu are sens</summary>

Verifică că:
1. Ai îndepărtat prefixul `0x`
2. Nu ai inclus date extra (doar payload-ul mesajului)
3. Folosești UTF-8 encoding

Mesajul ar trebui să fie text lizibil în limba engleză.
</details>

---

## 🎓 Resurse Suplimentare

### Video Tutorials
- [How Bitcoin Transactions Work](https://www.youtube.com/watch?v=bBC-nXj3Ng4) (similar pentru Ethereum)
- [Blockchain Forensics Explained](https://www.youtube.com/watch?v=xxxx)

### Tools Reale pentru Forensics
- [Chainalysis](https://www.chainalysis.com/) - Tool profesional de investigație
- [Elliptic](https://www.elliptic.co/) - Anti-money laundering pentru crypto
- [CipherTrace](https://ciphertrace.com/) - Blockchain intelligence

### Cazuri Reale
- [Colonial Pipeline Ransomware](https://www.justice.gov/opa/pr/department-justice-seizes-23-million-cryptocurrency-paid-ransomware-extortionists-darkside) - FBI a recuperat Bitcoin-ul
- [Bitfinex Hack](https://www.justice.gov/opa/pr/two-arrested-alleged-conspiracy-launder-45-billion-stolen-cryptocurrency) - Recuperare după 6 ani

---

**Succes la investigație, Detective! 🕵️**

*"The blockchain never forgets, and neither should you."*
