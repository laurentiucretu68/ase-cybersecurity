# 🔍 Challenge 1: Blockchain Forensics - "Follow the Money"

**Dificultate**: 🟢 Beginner  
**Puncte**: 50  
**Durată estimată**: 30-45 minute

## 📖 Poveste

Un angajat EtherBank, cunoscut sub pseudonimul **CryptoThief**, a mutat fonduri din wallet-ul companiei prin mai multe adrese intermediare.

Datele sunt generate **per student**. Nu folosi hash-uri sau adrese din exemple vechi.

Misiunea ta:
1. Urmărește lanțul transferurilor.
2. Identifică adresa finală.
3. Extrage și decodează mesajul din `input`.

Datele reale sunt în `deployments/challenge1-data.json`.

---

## 🎯 Ce urmărești în acest challenge

1. Să reconstruiești corect traseul fondurilor între adrese.
2. Să calculezi costurile reale de tranzacționare (gas fees).
3. Să extragi date utile din `input` și să decodezi mesajul ascuns.

Deși livrabilul final este JSON, analiza intermediară trebuie făcută în GUI și pe date on-chain.

---

## 🧠 Mini-ghid de analiză

### Ce înseamnă "follow the money"

Pornești de la tranzacția inițială și urmărești fiecare transfer outbound relevant până la ultima adresă din lanț.

### Cum calculezi fee-ul unei tranzacții

Formula este:

```text
feeWei = gasUsed * gasPrice
```

`totalGasFeeWei` este suma fee-urilor pentru toate hop-urile din lanț.

### Cum determini timpul total

`totalTimeSeconds` = `timestamp_ultim_hop - timestamp_prim_hop`.

---

## 🛠️ Mediu de lucru

Challenge-ul se rezolvă pe **Ganache GUI local**, configurat automat.

✅ Folosește doar:
- `./start-ganache.sh`
- workspace-ul preconfigurat (`Quickstart` / `BLOCKCHAIN-DEFI`)

---

## 📝 Setup

```bash
cd ~/lab4-blockchain-defi
npm run init:student -- --student-id <id>
./start-ganache.sh
npm run deploy:challenge1
```

Verifică în GUI:
1. `RPC Server`: `http://127.0.0.1:7545`
2. `Network ID`: `1337`
3. `Visible accounts`: `1`
4. Workspace: `Quickstart` sau `BLOCKCHAIN-DEFI`

---

## 🎯 Întrebări cu răspuns exact (50p)

1. `initialTransactionHash`  
   Hash-ul tranzacției de start a scenariului. Îl iei direct din `deployments/challenge1-data.json` și îl folosești ca punct de pornire în GUI.

2. `hopTransactionHashes` (listă în ordine)  
   Toate hash-urile tranzacțiilor prin care trec fondurile, în ordinea reală a transferurilor, de la primul hop până la ultimul.

3. `firstDestinationAddress`  
   Prima adresă `to` care primește fonduri din tranzacția inițială.

4. `intermediateHopCount`  
   Numărul de hop-uri intermediare dintre prima destinație și adresa finală (nu include tranzacția inițială și nici destinația finală).

5. `finalAddress`  
   Ultima adresă relevantă din lanț, unde se oprește traseul fondurilor.

6. `totalTimeSeconds`  
   Diferența de timp în secunde dintre timestamp-ul primului transfer din lanț și timestamp-ul ultimului transfer.

7. `totalGasFeeWei`  
   Costul total de gas pentru toate tranzacțiile din lanț, în Wei, ca string numeric (`feeWei = gasUsed * gasPrice`, apoi sumă pe toate hop-urile).

8. `initialInputHex`  
   Câmpul `input` (hex) din tranzacția inițială, exact cum apare on-chain.

9. `decodedMessage`  
   Mesajul text rezultat după decodarea valorii `initialInputHex`.

---

## ✅ Reguli de răspuns

1. Fără explicații libere în livrabil.
2. Adresele trebuie în format `0x...` (40 hex chars).
3. Hash-urile de tranzacție trebuie în format `0x...` (64 hex chars).
4. Valorile de tip Wei se dau ca string numeric (fără separator de mii).
5. `totalTimeSeconds` și `intermediateHopCount` sunt numere întregi.

---

## 🔎 Pași rapizi de investigație

### 1. Ia hash-ul inițial

```bash
cat deployments/challenge1-data.json
```

Caută `initialTransactionHash`.

### 2. Urmărește lanțul în Ganache GUI

1. Tab `TRANSACTIONS` → caută hash-ul inițial.
2. Mergi din tranzacție în tranzacție până la destinația finală.
3. Notează hash-urile, fee-urile și timestamp-urile.

### 3. Decodează mesajul din input

```bash
npm run inspect:tx -- <initialTransactionHash>
```

Tool opțional pentru verificare de traseu:

```bash
npm run trace:funds -- <initialTransactionHash> 100
```

---

## 📤 Livrabil (JSON)

Fișier obligatoriu: `challenge1-results.json`

Template:

```json
{
  "challenge": "challenge1",
  "studentId": "<id>",
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

Validare format:

```bash
npm run validate:results -- --challenge1
```

---

**Succes la investigație! 🕵️**
