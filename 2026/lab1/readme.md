# Lab 1: Elemente de Criptografie cu OpenSSL

## Introducere

> **OpenSSL** este o bibliotecă open-source utilizată pe scară largă pentru operații criptografice și comunicare securizată pe rețea. Acronimul **SSL** vine de la **Secure Socket Layer**, un protocol criptografic care asigură confidențialitatea și integritatea datelor transmise între două părți (de exemplu, un client și un server).

Atunci când accesezi un site web prin **HTTPS**, browserul tău folosește în spate tocmai protocoale bazate pe SSL/TLS — iar OpenSSL este una dintre cele mai răspândite implementări ale acestor protocoale.

OpenSSL oferă o gamă largă de funcționalități, printre care:

* **Criptare simetrică** — aceeași cheie folosită atât pentru criptare, cât și pentru decriptare (ex: AES)
* **Criptare asimetrică** — o pereche de chei: una publică (pentru criptare) și una privată (pentru decriptare) (ex: RSA)
* **Semnături digitale** — pentru verificarea autenticității și integrității datelor (ex: ECDSA)
* **Generarea de chei și certificate digitale** — folosite în HTTPS, VPN-uri, SSH etc.

<br />

## Instalare OpenSSL

### Linux
```bash
sudo apt update && sudo apt install openssl
```

### macOS
```bash
brew install openssl
```

### Windows
1. Descărcați binarele de la [OpenSSL pentru Windows](https://slproweb.com/products/Win32OpenSSL.html).
2. Instalați și adăugați căile în variabila de mediu `PATH`.

> 💡 Dacă întâmpinați probleme la instalare pe Windows, recomand tutorialul: https://www.youtube.com/watch?v=6zpBKVLox34

### Verificare instalare

După instalare, verifică dacă OpenSSL este disponibil:
```bash
openssl version
```

Ar trebui să obții un output similar cu: `OpenSSL 3.x.x ...`

<br />

---

## 1. Criptare simetrică

Criptarea simetrică utilizează **aceeași cheie** atât pentru criptare, cât și pentru decriptare. Este foarte eficientă din punct de vedere computațional, ceea ce o face ideală pentru criptarea volumelor mari de date (fișiere, baze de date, conexiuni VPN).

**Dezavantajul principal**: ambele părți trebuie să dețină aceeași cheie secretă, iar distribuirea ei securizată poate fi o provocare.

![Symmetric encryption](/img/symmetric.png)

### AES (Advanced Encryption Standard)

> **[AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)** este cel mai utilizat algoritm de criptare simetrică din lume. A fost adoptat ca standard de criptare de către **NIST** (National Institute of Standards and Technology) în anul 2001, înlocuind vechiul standard DES.

Principalele caracteristici ale AES:

* Utilizează **aceeași cheie** pentru criptare și decriptare
* Lungimea variabilă a cheii: AES permite utilizarea cheilor de **128**, **192** sau **256** biți
* **AES-256** este considerat cel mai sigur și este folosit în aplicații militare și guvernamentale
* Funcționează în mai multe **moduri de operare** (CBC, GCM, CTR etc.), fiecare cu proprietăți diferite

### 1.1 Generarea unei chei AES

```bash
openssl rand -base64 32 > cheie_aes.key
```

| Parametru | Descriere |
|-----------|-----------|
| `rand` | Generează un șir aleatoriu de octeți, folosind un generator criptografic securizat |
| `-base64` | Codifică rezultatul în format Base64 (text citibil, ușor de stocat) |
| `32` | Lungimea cheii în octeți (32 octeți × 8 = **256 biți**) |
| `> cheie_aes.key` | Redirectează cheia generată într-un fișier |

### 1.2 Criptarea unui fișier cu AES-256

Mai întâi, creează un fișier de test:
```bash
echo "Acesta este un mesaj secret!" > mesaj.txt
```

Apoi criptează-l:
```bash
openssl enc -aes-256-cbc -in mesaj.txt -out mesaj_criptat.aes -pass file:cheie_aes.key
```

| Parametru | Descriere |
|-----------|-----------|
| `enc` | Activează modul de criptare/decriptare al OpenSSL |
| `-aes-256-cbc` | Algoritmul AES cu cheie de 256 biți în modul **CBC** (Cipher Block Chaining) |
| `-in mesaj.txt` | Fișierul de intrare care va fi criptat |
| `-out mesaj_criptat.aes` | Fișierul de ieșire cu conținutul criptat |
| `-pass file:cheie_aes.key` | Cheia folosită pentru criptare, citită din fișier |

> 💡 **Ce este CBC?** Cipher Block Chaining este un mod de operare în care fiecare bloc de text clar este combinat (XOR) cu blocul criptat anterior înainte de a fi criptat. Acest lucru asigură că blocuri identice de text clar produc blocuri diferite de text cifrat.

### 1.3 Decriptarea unui fișier cu AES-256

```bash
openssl enc -d -aes-256-cbc -in mesaj_criptat.aes -out mesaj_decriptat.txt -pass file:cheie_aes.key
```

| Parametru | Descriere |
|-----------|-----------|
| `enc -d` | Activează modul de **decriptare** (flag-ul `-d`) |
| `-aes-256-cbc` | Același algoritm folosit la criptare |
| `-in mesaj_criptat.aes` | Fișierul criptat |
| `-out mesaj_decriptat.txt` | Fișierul în care se salvează textul decriptat |
| `-pass file:cheie_aes.key` | Aceeași cheie folosită la criptare |

Verificare:
```bash
cat mesaj_decriptat.txt
```

<br />

---

## 2. Criptare asimetrică

Criptarea asimetrică folosește **o pereche de chei** matematice legate între ele:
- **Cheia publică** — poate fi distribuită oricui, este folosită pentru **criptare**
- **Cheia privată** — trebuie păstrată secretă, este folosită pentru **decriptare**

Analogie simplă: imaginează-ți o cutie poștală cu o fantă (cheia publică — oricine poate introduce un mesaj) și o cheie de deschidere (cheia privată — doar proprietarul poate citi mesajele).

Criptarea asimetrică rezolvă **problema distribuției cheilor** din criptarea simetrică, dar este mult mai lentă computațional. De aceea, în practică se folosesc **scheme hibride**: cheia simetrică este generată aleatoriu și criptată cu RSA, iar datele propriu-zise sunt criptate cu AES.

![Asymmetric encryption](/img/asymmetric.png)

### RSA (Rivest-Shamir-Adleman)

> **[RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem))** este cel mai cunoscut algoritm de criptare asimetrică. A fost inventat în 1977 de Ron **R**ivest, Adi **S**hamir și Leonard **A**dleman.

Principalele caracteristici ale RSA:

* **Cheia publică** — utilizată pentru criptare (oricine o poate folosi)
* **Cheia privată** — utilizată pentru decriptare (trebuie păstrată secretă)
* Siguranța RSA se bazează pe dificultatea **factorizării numerelor întregi foarte mari**
* Dimensiuni recomandate: **2048 biți** (minim) sau **4096 biți** (pentru securitate sporită)

> ⚠️ **Limitare importantă**: RSA poate cripta doar date cu dimensiunea mai mică decât cheia (ex: ~245 bytes pentru o cheie de 2048 biți). Pentru fișiere mai mari se folosesc scheme hibride (RSA + AES).

### 2.1 Generarea cheilor RSA

**Generarea cheii private:**
```bash
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
```

| Parametru | Descriere |
|-----------|-----------|
| `genpkey` | Comandă pentru generarea unei chei private |
| `-algorithm RSA` | Specifică algoritmul RSA |
| `-out private_key.pem` | Salvează cheia privată în format PEM |
| `-pkeyopt rsa_keygen_bits:2048` | Dimensiunea cheii: **2048 biți** |

**Generarea cheii publice din cheia privată:**
```bash
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

| Parametru | Descriere |
|-----------|-----------|
| `rsa` | Comandă pentru manipularea cheilor RSA |
| `-pubout` | Extrage componenta publică din cheia privată |
| `-in private_key.pem` | Cheia privată ca sursă |
| `-out public_key.pem` | Salvează cheia publică |

> 💡 Cheia publică este derivată matematic din cheia privată, dar procesul invers (obținerea cheii private din cea publică) este practic imposibil.

### 2.2 Criptarea unui fișier cu cheia publică

```bash
openssl rsautl -encrypt -pubin -inkey public_key.pem -in mesaj.txt -out mesaj_criptat.bin
```

| Parametru | Descriere |
|-----------|-----------|
| `rsautl` | Operații de criptare/decriptare RSA |
| `-encrypt` | Modul de criptare |
| `-pubin` | Indică faptul că cheia furnizată este o cheie publică |
| `-inkey public_key.pem` | Fișierul cu cheia publică |
| `-in mesaj.txt` | Fișierul de criptat |
| `-out mesaj_criptat.bin` | Fișierul rezultat (date binare criptate) |

### 2.3 Decriptarea unui fișier cu cheia privată

```bash
openssl rsautl -decrypt -inkey private_key.pem -in mesaj_criptat.bin -out mesaj_decriptat.txt
```

| Parametru | Descriere |
|-----------|-----------|
| `rsautl` | Operații de criptare/decriptare RSA |
| `-decrypt` | Modul de decriptare |
| `-inkey private_key.pem` | Cheia privată pentru decriptare |
| `-in mesaj_criptat.bin` | Fișierul criptat |
| `-out mesaj_decriptat.txt` | Fișierul cu textul decriptat |

<br />

---

## 3. Semnături digitale

Semnăturile digitale sunt utilizate pentru a verifica **autenticitatea** și **integritatea** unui mesaj sau fișier. Ele garantează două proprietăți esențiale:

1. **Non-repudiere** — Semnatarul nu poate nega ulterior că a semnat documentul, deoarece semnătura este legată unic de cheia sa privată.
2. **Integritate** — Orice modificare a conținutului după semnare invalidează semnătura, deoarece hash-ul documentului se schimbă.

**Cum funcționează:**
1. Se calculează un **hash** (amprentă digitală) al documentului original
2. Hash-ul este **criptat cu cheia privată** a semnatarului → aceasta este semnătura
3. Oricine poate **verifica** semnătura folosind cheia publică a semnatarului

![Digital Signatures](/img/signature.png)

### ECDSA (Elliptic Curve Digital Signature Algorithm)

> **ECDSA** este un algoritm de semnătură digitală bazat pe **criptografia cu curbe eliptice**. Oferă aceleași niveluri de securitate ca RSA, dar cu **chei semnificativ mai mici** (o cheie ECDSA de 256 biți oferă securitate echivalentă cu o cheie RSA de 3072 biți).

Avantaje față de RSA:
* Chei mai mici → semnături mai mici → transmisie mai rapidă
* Performanță mai bună pe dispozitive cu resurse limitate (IoT, smart cards)
* Utilizat pe scară largă în **Bitcoin**, **TLS 1.3**, **SSH**

### 3.1 Generarea cheilor ECDSA

**Generarea cheii private:**
```bash
openssl ecparam -genkey -name prime256v1 -out ecdsa_private.pem
```

| Parametru | Descriere |
|-----------|-----------|
| `ecparam` | Generează parametrii unei curbe eliptice |
| `-genkey` | Generează o cheie privată |
| `-name prime256v1` | Curba eliptică **P-256** (una dintre cele mai utilizate, recomandată de NIST) |
| `-out ecdsa_private.pem` | Salvează cheia privată |

**Generarea cheii publice:**
```bash
openssl ec -in ecdsa_private.pem -pubout -out ecdsa_public.pem
```

| Parametru | Descriere |
|-----------|-----------|
| `ec` | Manipularea cheilor bazate pe curbe eliptice |
| `-in ecdsa_private.pem` | Cheia privată ca sursă |
| `-pubout` | Extrage cheia publică |
| `-out ecdsa_public.pem` | Salvează cheia publică |

### 3.2 Semnarea unui fișier

```bash
openssl dgst -sha256 -sign ecdsa_private.pem -out semnatura.bin mesaj.txt
```

| Parametru | Descriere |
|-----------|-----------|
| `dgst` | Calculează hash-ul criptografic al fișierului |
| `-sha256` | Algoritmul de hashing **SHA-256** |
| `-sign ecdsa_private.pem` | Semnează hash-ul cu cheia privată |
| `-out semnatura.bin` | Salvează semnătura digitală |
| `mesaj.txt` | Fișierul care este semnat |

### 3.3 Verificarea semnăturii

```bash
openssl dgst -sha256 -verify ecdsa_public.pem -signature semnatura.bin mesaj.txt
```

| Parametru | Descriere |
|-----------|-----------|
| `dgst` | Verifică semnătura digitală |
| `-sha256` | Același algoritm de hashing folosit la semnare |
| `-verify ecdsa_public.pem` | Cheia publică pentru verificare |
| `-signature semnatura.bin` | Semnătura de verificat |
| `mesaj.txt` | Fișierul original, verificat că nu a fost modificat |

Dacă semnătura este validă, OpenSSL va afișa: `Verified OK`

<br />

---

## Resurse și Tool-uri Online

### AES
[![Key Generator](https://img.shields.io/badge/Accesare_Tool-Generate_Random-9C27B0)](https://generate-random.org/encryption-key-generator)
[![AES Online Tool](https://img.shields.io/badge/Accesare_Tool-AES_Encryption_Online-4CAF50)](https://aesencryption.net/)

### RSA
[![Devglan RSA Tool](https://img.shields.io/badge/Accesare_Tool-Devglan_RSA-009688)](https://www.devglan.com/online-tools/rsa-encryption-decryption)

### ECDSA
[![ECDSA Tool](https://img.shields.io/badge/Accesare_Tool-EMN178_ECDSA-FF5722)](https://emn178.github.io/online-tools/ecdsa/key-generator/)

### Documentație
- [OpenSSL Official Docs](https://www.openssl.org/docs/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/)
- [OWASP Cryptographic Storage Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
