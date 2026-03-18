# Challenge 1: Blockchain Forensics - "Follow the Money"

**Dificultate**: Beginner  
**Puncte**: 50  
**Durată estimată**: 30-45 minute

---

## Poveste

Un angajat EtherBank, cunoscut sub pseudonimul **CryptoThief**, a mutat fonduri din wallet-ul companiei prin mai multe adrese intermediare, încercând să ascundă traseul banilor.

Datele sunt generate **per student** pe baza ID-ului tău. Hash-urile și adresele sunt unice; nu folosi valori din exemple vechi sau ale altor colegi.

Misiunea ta:
1. Urmărește lanțul transferurilor de ETH între adrese.
2. Identifică adresa finală unde s-au oprit fondurile.
3. Extrage și decodează mesajul ascuns din câmpul `input` al tranzacției inițiale.

Datele reale ale scenariului tău sunt în `deployments/challenge1-data.json`.

---

## Ce urmărești în acest challenge

1. Să reconstruiești corect **traseul fondurilor** între adrese (cine trimite, cine primește, în ce ordine).
2. Să calculezi **costurile reale de tranzacționare** (gas fees) pentru întregul lanț.
3. Să extragi date utile din câmpul `input` al tranzacției inițiale și să **decodezi mesajul ascuns** din hex în text.

Deși livrabilul final este un JSON, analiza intermediară trebuie făcută în Ganache GUI și pe datele on-chain.

---

## Concepte necesare

Dacă nu ai citit teoria, consultă mai întâi [THEORY.md](../THEORY.md), secțiunile 2 (Ethereum) și 4 (Blockchain Forensics).

### Ce este o tranzacție Ethereum

O tranzacție este o instrucțiune semnată de un EOA (cont cu cheie privată) care transferă ETH și/sau date de la o adresă la alta. Fiecare tranzacție este identificată unic printr-un **transaction hash** (32 bytes, format `0x` + 64 caractere hex).

### Ce înseamnă "follow the money"

Pornești de la o tranzacție cunoscută (cea inițială) și urmărești fiecare transfer de ETH de la adresă la adresă, până când nu mai există tranzacții outbound de la ultima adresă.

```
Company Wallet ──(tx1)──► Adresa A ──(tx2)──► Adresa B ──(tx3)──► Adresa C
    │                        │                    │                   │
    │  hop 1                 │  hop 2             │  hop 3            │
    │  value: 80 ETH         │  value: 79.5 ETH   │  value: 79 ETH    │
    │  input: 0x43544...     │                    │                   │
    └─ gas fee               └─ gas fee           └─ gas fee          │
                                                                      ▼
                                                                Destinație finală
```

Fiecare săgeată este un **hop** (un salt în lanț). Tranzacția inițială este hop-ul 1.

### Cum citești o tranzacție în Ganache GUI

În tab-ul **TRANSACTIONS**, fiecare tranzacție afișează:
- **TX HASH**: identificatorul unic;
- **FROM** / **TO**: adresele sursă și destinație;
- **VALUE**: cantitatea de ETH transferată;
- **GAS USED** și **GAS PRICE**: necesare pentru calculul fee-ului;
- **BLOCK** și **TIMESTAMP**: momentul confirmării.

Click pe un TX HASH pentru detalii complete. Din pagina de detalii poți vedea câmpul **INPUT DATA** (date atașate tranzacției).

### Cum calculezi fee-ul unei tranzacții

Formula:

```
feeWei = gasUsed × gasPrice
```

Ambele valori sunt vizibile în Ganache GUI sau obtenabile prin script. `totalGasFeeWei` este suma fee-urilor pentru **toate hop-urile** din lanț.

Exemplu: dacă `gasUsed = 21000` și `gasPrice = 20000000000` (20 Gwei):

```
feeWei = 21000 × 20000000000 = 420000000000000 Wei = 0.00042 ETH
```

### Cum determini timpul total

```
totalTimeSeconds = timestamp_ultimul_hop - timestamp_primul_hop
```

Timestamp-urile sunt în format Unix (secunde). Le găsești în Ganache GUI la detaliile fiecărui bloc.

### Cum decodezi mesajul din câmpul `input`

Câmpul `input` (hex) conține bytes care pot fi convertiți în text. Procesul:

1. Ia valoarea hex din tranzacția inițială (ex: `0x4354462d...`).
2. Elimină prefixul `0x`.
3. Convertește fiecare pereche de caractere hex în caracterul ASCII corespunzător.

Exemplu manual:
```
Hex:   0x48656c6c6f
       48  65  6c  6c  6f
ASCII: H   e   l   l   o
Rezultat: "Hello"
```

Poți folosi și comanda:
```bash
npm run inspect:tx -- <hash> --show-input
```

---

## Mediu de lucru

Challenge-ul se rezolvă pe **Ganache GUI local**, configurat automat la setup.

Folosește doar:
- `./start-ganache.sh` — pornește chain-ul local;
- workspace-ul preconfigurat (`Quickstart` / `BLOCKCHAIN-DEFI`) din Ganache GUI.

---

## Setup

```bash
cd ~/lab4-blockchain-defi
npm run init:student -- --student-id <id>
./start-ganache.sh
npm run deploy:challenge1
```

Verifică în Ganache GUI:
1. `RPC Server`: `http://127.0.0.1:7545`
2. `Network ID`: `1337`
3. Conturile sunt vizibile
4. Workspace: `Quickstart` sau `BLOCKCHAIN-DEFI`

---

## Întrebări cu răspuns exact (50p)

### 1. `initialTransactionHash`
Hash-ul tranzacției de start a scenariului. Îl iei direct din `deployments/challenge1-data.json` — este punctul de pornire al investigației.

### 2. `hopTransactionHashes` (listă în ordine)
Toate hash-urile tranzacțiilor prin care trec fondurile, în ordinea reală a transferurilor, de la primul hop până la ultimul. Include și tranzacția inițială.

### 3. `firstDestinationAddress`
Prima adresă `to` care primește fonduri din tranzacția inițială. Este adresa destinatarului din hop-ul 1.

### 4. `intermediateHopCount`
Numărul de hop-uri **intermediare** dintre prima destinație și adresa finală.  
Nu include tranzacția inițială și nu include destinația finală.

Exemplu cu 4 hop-uri totale (A→B→C→D→E):
- `firstDestinationAddress` = B
- `finalAddress` = E
- hop-uri intermediare (între B și E) = C, D → `intermediateHopCount` = 2

### 5. `finalAddress`
Ultima adresă relevantă din lanț, unde se oprește traseul fondurilor (nu mai trimite mai departe).

### 6. `totalTimeSeconds`
Diferența de timp **în secunde** dintre timestamp-ul primei tranzacții din lanț și timestamp-ul ultimei tranzacții. Se calculează din blocurile corespunzătoare.

### 7. `totalGasFeeWei`
Costul total de gas pentru **toate** tranzacțiile din lanț, în Wei, ca string numeric.

Formula per hop: `feeWei = gasUsed × gasPrice`  
Apoi: `totalGasFeeWei = Σ feeWei` pe toate hop-urile.

### 8. `initialInputHex`
Câmpul `input` (hex) din tranzacția inițială, exact cum apare on-chain. Începe cu `0x`.

Obții această valoare inspectând detaliile tranzacției inițiale în Ganache GUI sau cu:
```bash
npm run inspect:tx -- <initialTransactionHash> --show-input
```

### 9. `decodedMessage`
Mesajul text rezultat din decodarea valorii `initialInputHex` (hex → UTF-8). Începe cu `CTF-`.

---

## Reguli de răspuns

1. Fără explicații libere în livrabil — doar valorile cerute.
2. Adresele trebuie în format `0x...` (42 caractere: `0x` + 40 hex chars).
3. Hash-urile de tranzacție trebuie în format `0x...` (66 caractere: `0x` + 64 hex chars).
4. Valorile de tip Wei se dau ca **string** numeric (fără separator de mii).
5. `totalTimeSeconds` și `intermediateHopCount` sunt numere întregi.

---

## Pași de investigație

### 1. Obține hash-ul inițial

```bash
cat deployments/challenge1-data.json
```

Caută câmpul `initialTransactionHash`. Acesta este punctul de pornire.

### 2. Urmărește lanțul în Ganache GUI

1. Deschide Ganache GUI → tab **TRANSACTIONS**.
2. Caută hash-ul inițial (sau navighează din lista de tranzacții).
3. Notează: `from`, `to`, `value`, `gasUsed`, `gasPrice`.
4. Mergi la adresa `to` și caută tranzacția outbound trimisă de ea.
5. Repetă până nu mai există tranzacții outbound de la ultima adresă.
6. Pe tot parcursul, notează hash-urile, fee-urile și timestamp-urile.

### 3. Inspectează tranzacția inițială (pentru input)

```bash
npm run inspect:tx -- <initialTransactionHash> --show-input
```

Comanda afișează detalii despre tranzacție, inclusiv `Input data` (hex) și `Input ASCII` (textul decodat). Flag-ul `--show-input` este necesar pentru a vedea câmpul input.

### 4. Verificare automată a traseului (opțional)

```bash
npm run trace:funds -- <initialTransactionHash> 100
```

Acest tool parcurge lanțul automat și afișează toate hop-urile cu adrese, valori și gas fees. Folosește-l pentru verificare, nu ca soluție directă.

---

## Livrabil (JSON)

Fișier obligatoriu: `student/submissions/challenge1-results.json`

Poți porni de la template:
```bash
cp submission-templates/challenge1-results.template.json student/submissions/challenge1-results.json
```

Template complet:

```json
{
  "challenge": "challenge1-forensics",
  "studentId": "<id>",
  "instanceId": "lab4-...",
  "answers": {
    "initialTransactionHash": "0x...",
    "hopTransactionHashes": ["0x...", "0x...", "0x..."],
    "firstDestinationAddress": "0x...",
    "intermediateHopCount": 2,
    "finalAddress": "0x...",
    "totalTimeSeconds": 0,
    "totalGasFeeWei": "0",
    "initialInputHex": "0x...",
    "decodedMessage": "CTF-..."
  }
}
```

**Important**: `challenge` trebuie să fie exact `"challenge1-forensics"`, iar `instanceId` trebuie completat cu valoarea din `student/instance.json`.

Validare format:

```bash
npm run validate:results -- --challenge1
```

---

**Succes la investigație!**
