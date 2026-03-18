# Noțiuni teoretice: Blockchain, Ethereum și Smart Contract Security

Acest document acoperă fundamentele necesare pentru a înțelege laboratorul. Citește-l înainte de a începe challenge-urile.

---

## 1. Ce este un blockchain

Un blockchain este un registru distribuit (distributed ledger) în care datele sunt organizate în **blocuri** legate criptografic între ele. Fiecare bloc conține:

- un set de **tranzacții** validate;
- un **timestamp**;
- hash-ul blocului anterior (**parent hash**);
- un **nonce** (în cazul Proof-of-Work) sau alte date de consens.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Block N-1  │     │   Block N    │     │   Block N+1  │
│              │     │              │     │              │
│ parentHash ──┼────►│ parentHash ──┼────►│ parentHash   │
│ timestamp    │     │ timestamp    │     │ timestamp    │
│ txRoot       │     │ txRoot       │     │ txRoot       │
│ stateRoot    │     │ stateRoot    │     │ stateRoot    │
│ nonce        │     │ nonce        │     │ nonce        │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Proprietăți fundamentale

| Proprietate | Descriere |
|---|---|
| **Imutabilitate** | Odată incluse într-un bloc confirmat, datele nu mai pot fi modificate fără a invalida toate blocurile ulterioare. |
| **Transparență** | Oricine poate citi și verifica tranzacțiile (pe un blockchain public). |
| **Descentralizare** | Nu există o autoritate centrală; consensul este atins de rețeaua de noduri. |
| **Pseudonimitate** | Adresele sunt publice, dar nu sunt legate direct de identitate (deși analiza on-chain poate dezvălui legătura). |

### Cum se propagă un bloc

```
  Utilizator                Nod local             Rețea P2P          Consens
      │                        │                     │                  │
      │── trimite tx ─────────►│                     │                  │
      │                        │── broadcast tx ────►│                  │
      │                        │                     │── tx ajunge ────►│
      │                        │                     │   la validatori  │
      │                        │                     │                  │
      │                        │                     │◄── bloc nou ─────│
      │                        │◄── bloc nou ────────│                  │
      │◄── confirmare ─────────│                     │                  │
```

---

## 2. Ethereum: concepte cheie

Ethereum extinde modelul Bitcoin cu o **mașină virtuală Turing-completă** (EVM), permițând execuția de programe arbitrare direct pe blockchain.

### 2.1 Conturi

Ethereum are două tipuri de conturi:

| Tip | Descriere | Controlat de |
|---|---|---|
| **EOA** (Externally Owned Account) | Cont controlat de o cheie privată (utilizator uman). Poate trimite tranzacții. | Cheie privată |
| **Contract Account** | Cont ce conține cod executabil (smart contract). Nu poate iniția tranzacții singur. | Codul contractului |

Ambele tipuri au:
- **address**: identificator unic de 20 bytes (`0x...`, 40 caractere hex);
- **balance**: cantitatea de ETH deținută (exprimată în Wei);
- **nonce**: contor de tranzacții (EOA) sau de contracte create (Contract).

### 2.2 Tranzacții

O tranzacție Ethereum conține:

| Câmp | Descriere |
|---|---|
| `from` | Adresa EOA care semnează și trimite tranzacția. |
| `to` | Adresa destinatarului (EOA sau contract). Dacă este gol, se creează un contract nou. |
| `value` | Cantitatea de ETH transferată (în Wei). |
| `data` / `input` | Payload-ul tranzacției. Pentru contracte, conține semnătura funcției + argumente. Pentru simple transferuri, poate conține un mesaj arbitrar codificat hex. |
| `gasLimit` | Cantitatea maximă de gas pe care tranzacția o poate consuma. |
| `gasPrice` | Prețul pe unitate de gas pe care expeditorul îl oferă (în Wei). |
| `nonce` | Secvența tranzacției pentru adresa `from`. |

### 2.3 Gas și costul tranzacțiilor

**Gas** este unitatea de măsură pentru efortul computațional pe EVM. Fiecare operație (SSTORE, CALL, ADD etc.) costă un anumit număr de unități de gas.

```
Costul tranzacției (în Wei) = gasUsed × gasPrice
Costul tranzacției (în ETH) = gasUsed × gasPrice / 10^18
```

| Termen | Semnificație |
|---|---|
| `gasLimit` | Maximul de gas alocat de utilizator. |
| `gasUsed` | Gasul efectiv consumat la execuție. |
| `gasPrice` | Prețul per unitate, setat de utilizator (sau de rețea, post-EIP-1559). |
| Gas neutilizat | Se returnează automat expeditorului. |

### 2.4 Unități de valoare

| Unitate | Wei |
|---|---|
| 1 Wei | 1 |
| 1 Gwei | 10^9 Wei |
| 1 ETH | 10^18 Wei |

Conversia este relevantă pentru Challenge 1, unde calculezi `totalGasFeeWei`.

### 2.5 Ciclul de viață al unei tranzacții

```
  1. Creare          2. Semnare           3. Broadcast         4. Includere în bloc
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ from, to,   │   │ Semnătură   │   │ Tranzacția intră │   │ Miner/Validator │
│ value, data,│──►│ cu cheia    │──►│ în mempool-ul    │──►│ include tx în   │
│ gas, nonce  │   │ privată     │   │ rețelei          │   │ blocul următor  │
└─────────────┘   └─────────────┘   └──────────────────┘   └─────────────────┘
                                                                    │
                                                                    ▼
                                                            5. Confirmare
                                                           ┌─────────────────┐
                                                           │ Tranzacția este │
                                                           │ imuabilă pe     │
                                                           │ blockchain      │
                                                           └─────────────────┘
```

---

## 3. Smart Contracts

Un **smart contract** este un program stocat pe blockchain care se execută automat atunci când este apelat printr-o tranzacție. Codul este imuabil după deploy (cu excepția pattern-urilor de upgrade proxy).

### 3.1 Solidity: limbajul dominant pe Ethereum

Solidity este un limbaj static tipizat, compilat în bytecode EVM. Structura de bază:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExempluContract {
    // State variables - stocate permanent pe blockchain
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    // Events - log-uri emise pe blockchain, indexabile off-chain
    event Deposit(address indexed user, uint256 amount);

    // Functions
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}
```

### 3.2 Variabile globale importante

| Variabilă | Descriere |
|---|---|
| `msg.sender` | Adresa apelantului curent (EOA sau contract). |
| `msg.value` | Cantitatea de Wei trimisă împreună cu apelul. |
| `address(this).balance` | Balul ETH al contractului curent. |
| `block.timestamp` | Timestamp-ul blocului curent (Unix). |

### 3.3 Funcții speciale: `receive()` și `fallback()`

Când un contract primește ETH fără apelarea explicită a unei funcții:

```
ETH primit de contract
        │
        ▼
  msg.data este gol?
     /         \
   DA           NU
   │             │
   ▼             ▼
receive()    fallback()
 există?      există?
  /    \       /    \
DA     NU    DA     NU
│       │    │       │
▼       ▼    ▼       ▼
receive  REVERT  fallback  REVERT
```

Aceste funcții sunt esențiale pentru atacurile de reentrancy: când un contract trimite ETH către un alt contract, `receive()` sau `fallback()` se execută automat la destinatar.

---

## 4. Blockchain Forensics

Analiza forensică pe blockchain presupune reconstituirea traseului fondurilor folosind datele publice disponibile on-chain.

### 4.1 Ce date sunt disponibile

Pentru fiecare tranzacție poți extrage:

```
Tranzacție (tx)                    Receipt
├── hash (identificator unic)      ├── gasUsed
├── from                           ├── status (1 = succes, 0 = revert)
├── to                             ├── logs (events emise)
├── value                          └── blockNumber
├── input / data
├── gasPrice
├── blockNumber
└── nonce

Bloc
├── number
├── timestamp
├── parentHash
└── transactions[]
```

### 4.2 Cum urmărești fondurile (Follow the Money)

Principiul este simplu: pornești de la o tranzacție cunoscută și urmărești fiecare transfer de ETH de la adresă la adresă.

```
Company Wallet ──(tx1)──► Adresa A ──(tx2)──► Adresa B ──(tx3)──► Adresa C (final)
    │                        │                    │                     │
    │ value: 80 ETH          │ value: 79.5 ETH    │ value: 79.0 ETH    │
    │ input: 0x4354...       │                    │                     │
    │ (mesaj codificat)      │                    │                     │
    │                        │                    │                     │
    └── gas fee: ~0.0004 ETH └── gas fee          └── gas fee           │
                                                                        ▼
                                                                  Destinație finală
```

### 4.3 Decodificarea mesajelor din `input`

Câmpul `input` (sau `data`) al unei tranzacții poate conține date arbitrare, codificate hexadecimal. Pentru un mesaj text simplu:

1. Valoarea hex din `input` (ex: `0x4354462d...`) reprezintă bytes.
2. Fiecare pereche de caractere hex = 1 byte.
3. Conversia hex → ASCII/UTF-8 dezvăluie mesajul original.

Exemplu:
```
Hex:   0x48656c6c6f
Bytes: 48  65  6c  6c  6f
ASCII: H   e   l   l   o
```

### 4.4 Calculul gas fees

```
Fee per tranzacție (Wei) = gasUsed × gasPrice
Fee total pe lanțul de transferuri = Σ fee(tx_i) pentru fiecare hop
```

---

## 5. Reentrancy: vulnerabilitate fundamentală

Reentrancy este una dintre cele mai cunoscute și costisitoare vulnerabilități din istoria smart contract-urilor. Atacul DAO din 2016 a exploatat exact acest pattern, cauzând pierderea a ~60 milioane USD și ducând la hard fork-ul Ethereum/Ethereum Classic.

### 5.1 Cum apare vulnerabilitatea

Problema este ordinea operațiilor. Într-un contract vulnerabil:

```
Ordinea GREȘITĂ (vulnerabilă):
1. Check   → require(balance >= amount)     ← verificare
2. Call    → msg.sender.call{value}("")     ← trimite ETH (EXTERNAL CALL)
3. Effect  → balance -= amount              ← actualizare stare

Ordinea CORECTĂ (securizată - Checks-Effects-Interactions):
1. Check   → require(balance >= amount)     ← verificare
2. Effect  → balance -= amount              ← actualizare stare
3. Call    → msg.sender.call{value}("")     ← trimite ETH (EXTERNAL CALL)
```

### 5.2 De ce funcționează atacul

Când contractul vulnerabil trimite ETH prin `.call{value}()`, controlul execuției trece la contractul destinatar. Dacă destinatarul este un contract malițios, acesta poate:

1. Primi ETH → se declanșează `receive()`.
2. Din `receive()`, reapelează funcția `withdraw()` a vault-ului.
3. Vault-ul verifică din nou balul → acesta NU a fost încă actualizat (pasul 3 din ordinea greșită).
4. Vault-ul trimite ETH din nou → ciclul se repetă.

```
Atacator                    Vault (vulnerabil)
   │                             │
   │── withdraw(1 ETH) ────────►│
   │                             │── check: balance >= 1? ✓
   │                             │── send 1 ETH ──────────►│
   │◄── receive() triggered ─────────────────────────────────
   │                             │                          │
   │── withdraw(1 ETH) ────────►│ (balance ÎNCĂ nu e updatat)
   │                             │── check: balance >= 1? ✓ │
   │                             │── send 1 ETH ──────────►│
   │◄── receive() triggered ─────────────────────────────────
   │                             │                          │
   │── withdraw(1 ETH) ────────►│ (balance ÎNCĂ nu e updatat)
   │                             │── check: balance >= 1? ✓ │
   │                             │── send 1 ETH ──────────►│
   │                             │                          │
   │   ... se repetă până la    │                          │
   │   epuizarea vault-ului     │                          │
   │   sau out-of-gas           │                          │
   │                             │                          │
   │                             │── balance -= 1 (prea târziu!)
   │                             │── balance -= 1
   │                             │── balance -= 1
```

### 5.3 Call Stack și re-intrarea

EVM procesează apelurile ca un stack. Reentrancy exploatează faptul că starea contractului nu s-a modificat înainte de a da controlul altui contract:

```
Call Stack (depth-first execution):

vault.withdraw()
  └─► attacker.receive()
        └─► vault.withdraw()        ← re-intrare (starea nu s-a actualizat)
              └─► attacker.receive()
                    └─► vault.withdraw()
                          └─► ... (până la limita de gas sau sold)

Desfășurare (unwind):
  ... balance -= amount (pentru fiecare apel, cu underflow)
```

### 5.4 Mecanisme de apărare

#### Pattern-ul Checks-Effects-Interactions (CEI)

Regula de aur: modifică starea internă **înainte** de a interacționa cu contracte externe.

```solidity
function withdraw(uint256 _amount) public {
    // 1. CHECKS
    require(balances[msg.sender] >= _amount, "Insufficient balance");

    // 2. EFFECTS (starea se actualizează ÎNAINTE de transfer)
    balances[msg.sender] -= _amount;
    totalDeposits -= _amount;

    // 3. INTERACTIONS (transferul extern, ultimul pas)
    (bool success, ) = msg.sender.call{value: _amount}("");
    require(success, "Transfer failed");
}
```

Chiar dacă atacatorul reintra, verificarea din pasul 1 va eșua deoarece balul a fost deja actualizat la pasul 2.

#### Reentrancy Guard (Mutex)

Un modifier care blochează reapelarea funcției în timp ce aceasta este deja în execuție:

```solidity
bool private locked;

modifier noReentrancy() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}

function withdraw(uint256 _amount) public noReentrancy {
    // ... implementare
}
```

#### Comparație mecanisme

| Mecanism | Avantaj | Limitare |
|---|---|---|
| CEI pattern | Simplu, zero overhead gas | Necesită disciplină; nu protejează cross-function |
| Reentrancy Guard | Protejează întreaga funcție | Cost gas suplimentar (~5000 gas pentru SSTORE) |
| CEI + Guard | Protecție maximă | Ambele costuri combinate |
| `transfer()` / `send()` | Limita de 2300 gas | Depreciat post-Istanbul; poate cauza probleme cu contracte care au logică în `receive()` |

### 5.5 Atacuri din lumea reală

| Incident | An | Pierdere | Mecanism |
|---|---|---|---|
| The DAO Hack | 2016 | ~60M USD | Reentrancy clasic pe funcția split |
| Uniswap/Lendf.Me | 2020 | ~25M USD | Reentrancy via ERC-777 hooks |
| Cream Finance | 2021 | ~130M USD | Reentrancy cross-contract |
| Curve Finance | 2023 | ~70M USD | Reentrancy via Vyper compiler bug |

---

## 6. Mediul de dezvoltare local

### 6.1 Ganache

Ganache este un blockchain Ethereum local (personal) folosit pentru dezvoltare și testare. Oferă:

- **Conturi prefundate**: adrese cu ETH disponibil din start;
- **Minare instantanee**: tranzacțiile sunt confirmate imediat;
- **Interfață GUI**: vizualizare blocuri, tranzacții, conturi, logs;
- **Control total**: poți reseta chain-ul, manipula timestamps, inspecta state.

### 6.2 Hardhat

Hardhat este un framework de dezvoltare pentru Ethereum care oferă:

- compilare Solidity;
- deploy scriptabil;
- testare cu Mocha/Chai;
- console interactiv (`hardhat console`);
- interacțiune cu rețele locale sau publice.

### 6.3 ethers.js

Biblioteca JavaScript folosită pentru interacțiunea cu blockchain-ul Ethereum. Operații comune:

```javascript
// Conectare la rețea
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");

// Obține detalii tranzacție
const tx = await provider.getTransaction("0x...");

// Obține receipt (gasUsed, status, logs)
const receipt = await provider.getTransactionReceipt("0x...");

// Obține bloc (timestamp)
const block = await provider.getBlock(tx.blockNumber);

// Decodificare hex → text
const message = ethers.utils.toUtf8String("0x48656c6c6f"); // "Hello"

// Conversie ETH ↔ Wei
const wei = ethers.utils.parseEther("1.5");     // 1500000000000000000
const eth = ethers.utils.formatEther(wei);       // "1.5"
```

---

## 7. Glosar rapid

| Termen | Definiție |
|---|---|
| **EOA** | Externally Owned Account — cont controlat de cheie privată |
| **EVM** | Ethereum Virtual Machine — mașina de execuție a contractelor |
| **Gas** | Unitate de măsură pentru costul computațional pe EVM |
| **Wei** | Cea mai mică unitate de ETH (1 ETH = 10^18 Wei) |
| **Gwei** | 10^9 Wei, folosit frecvent pentru gas price |
| **Nonce** | Contor secvențial per cont, previne replay attacks |
| **ABI** | Application Binary Interface — interfața de interacțiune cu contractele |
| **CEI** | Checks-Effects-Interactions — pattern defensiv anti-reentrancy |
| **tx hash** | Identificator unic al tranzacției (32 bytes, format `0x...64 hex chars`) |
| **Receipt** | Dovada execuției unei tranzacții (gasUsed, status, logs) |
| **Mempool** | Zona de așteptare pentru tranzacțiile neconfirmate |
| **Fallback** | Funcție specială executată când contractul primește un apel necunoscut |
| **Receive** | Funcție specială executată când contractul primește ETH fără date |

---

## Resurse externe

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/)
- [SWC Registry (Smart Contract Weakness Classification)](https://swcregistry.io/)
- [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
