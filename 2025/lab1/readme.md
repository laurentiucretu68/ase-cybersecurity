# OpenSSL

## Introducere

> `OpenSSL` este o bibliotecă open-source utilizată pentru criptarea și comunicarea securizată pe rețea. Acronimul **SSL** vine de la **Secure Socket Layer**, un protocol criptografic care asigură confidențialitatea și integritatea datelor transmise între două părți (un client și un server).

`OpenSSL` oferă o gamă largă de funcționalități, precum:

* **Criptare simetrică**
* **Criptare asimetrică**
* **Generarea de chei și certificate digitale**

<br />

## Instalare `openssl`

### Linux
```bash
sudo apt update && sudo apt install openssl
```

### MacOS
```bash
brew install openssl
```

### Windows
1. Descărcați binarele de la [OpenSSL pentru Windows](https://slproweb.com/products/Win32OpenSSL.html).
2. Instalați și adăugați căile în variabila de mediu `PATH`.

* Dacă aveți probleme, recomand tutorialul: https://www.youtube.com/watch?v=6zpBKVLox34

<br />

## Criptare simetrică

Criptarea simetrică utilizează aceeași cheie pentru criptare și decriptare. Este eficientă pentru volume mari de date. 

![Symmetric encryption](/img/symmetric.png)

### AES
> [**AES**](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) (Advanced Encryption Standard) este un algoritm de criptare simetrică utilizat pentru protejarea datelor. A fost adoptat ca standard de criptare de către **NIST** (National Institute of Standards and Technology) în anul 2001.

Principalele caracteristici ale **AES**:

* Utilizează aceeași cheie pentru criptare și decriptare.
* Lungimea variabilă a cheii: **AES** permite utilizarea cheilor de 128 biți, 192 biți sau 256 biți, cu **AES-256** fiind considerat cel mai sigur.


#### Generarea unei chei AES
```bash
openssl rand -base64 32 > cheie_aes.key
```
* `rand` - generează un șir aleatoriu de octeți
* `-base64` - convertește octeții generați într-un format codificat
* `32` - specifică lungimea cheii în octeți (32 octeți = 256 biți)
* `> cheie_aes.key` - salvează cheia generată într-un fișier numit `cheie_aes.key`

#### Criptarea unui fișier folosind AES-256
```bash
openssl enc -aes-256-cbc -in mesaj.txt -out mesaj_criptat.aes -pass file:cheie_aes.key
```
* `enc` - folosește OpenSSL pentru criptare
* `-aes-256-cbc` - utilizează algopritmul AES cu o cheie de 256 biți în mod CBC (Cipher Block Chaining)
* `-in mesaj.txt` - specifică fișierul de intrare care va fi criptat
* `-out mesaj_criptat.aes` - specifică fișierul de ieșire unde va fi salvat conțiutul criptat
* `-pass file:cheie_aes.key` - utilizează cheia stocată în fișierul `cheie_aes.key` pentru criptare

#### Decriptarea unui fișier folosind AES-256
```bash
openssl enc -d -aes-256-cbc -in mesaj_criptat.aes -out mesaj_decriptat.txt -pass file:cheie_aes.key
```
* `enc -d` - folosește OpenSSL pentru decriptare
* `-aes-256-cbc` - utilizează AES-256 în mod CBC (aceeași metodă folosită la criptare)
* `-in mesaj_criptat.aes` - specifică fișierul criptat care trebuie decriptat
* `-out mesaj_decriptat.txt` - specifică fișierul de ieșire unde va fi salvat textul decriptat
* `-pass file:cheie_aes.key` - utilizează cheia stocată în `cheie_aes.key` pentru decriptare

<br />


## Criptare asimetrică

Criptarea simetrică utilizează două chei: o **cheie publică** (pentru criptare) și o **cheie privată** (pentru decriptare). Aceasta este ideală pentru schimbul securizat de chei sau semnături digitale.

![Asymmetric encryption](/img/asymmetric.png)

### RSA
> **[RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem))**  este un algoritm de criptare asimetrică, utilizat pentru securizarea comunicațiilor și semnăturile digitale. A fost inventat în 1977 de Ron **Rivest**, Adi **Shamir** și Leonard **Adleman**, de unde și numele său.

Principalele caracteristici ale **RSA**:

* **Folosirea a două chei**:
    * **Cheia publică** - utilizată pentru criptare (oricine o poate folosi).
    * **Cheia privată** - utilizată pentru decriptare (trebuie păstrată secretă).
    
* Siguranța **RSA** provine din complexitatea matematică a factorizării numerelor întregi mari.


#### Generarea cheilor RSA

* **Generarea cheii private**
    ```bash
    openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
    ```
    * `genpkey` - comandă pentru generarea unei chei private
    * `-algorithm RSA` - specifică utilizarea algoritmului RSA
    * `-out private_key.pem` - salvează cheia privată în fișierul `private_key.pem`
    * `-pkeyopt rsa_keygen_bits:2048` - specifică dimensiunea cheii **RSA** (*2048 biți*, valoare considerată sigură)

* **Generarea cheii publice din cheia privată**
    ```bash
    openssl rsa -pubout -in private_key.pem -out public_key.pem
    ```
    * `rsa` - utilizează OpenSSL pentru manipularea cheilor RSA
    * `-pubout` - extrage cheia publică din cheia privată
    * `-in private_key.pem` - specifică cheia privată ca sursă
    * `-out public_key.pem` - salvează cheia publică în `public_key.pem`

#### Criptarea unui fișier cu cheia publică
```bash
openssl rsautl -encrypt -pubin -inkey public_key.pem -in mesaj.txt -out mesaj_criptat.bin
```
* `rsautl` - comandă pentru criptarea și decriptarea datelor folosind RSA
* `-encrypt` - activează modul de criptare
* `-pubin` - specifică faptul că cheia utilizată este cheia publică
* `-inkey public_key.pem` - specifică fișierul care conține cheia publică
* `-in mesaj.txt` - fișierul care trebuie criptat
* `-out mesaj_criptat.bin` - fișierul rezultat, care conține datele criptate în format binar

#### Decriptarea unui fișier cu cheia privată
```bash
openssl rsautl -decrypt -inkey private_key.pem -in mesaj_criptat.bin -out mesaj_decriptat.txt
```
* `rsautl` - comandă pentru criptarea și decriptarea datelor folosind RSA
* `-decrypt` - activează modul de decriptare
* `-inkey private_key.pem` - utilizează cheia privată pentru decriptare
* `-in mesaj_criptat.bin` - specifică fișierul criptat care trebuie decriptat
* `-out mesaj_decriptat.txt` - salvează textul decriptat în `mesaj_decriptat.txt`

<br />



## Semnături digitale

> Semnăturile digitale sunt utilizate pentru a verifica autenticitatea și integritatea unui mesaj sau fișier, oferind două caracteristici esențiale:
1. **Non-repudiere** - Asigură că semnatarul nu poate nega ulterior acțiunea de semnare, datorită asociării unice între semnătură și deținătorul cheii private.
2. **Integritate garantată** - Detectează orice modificare a conținutului după semnare prin algoritmi hash criptografici (SHA-256, SHA3-512).

![Digital Signatures](/img/signature.png)

### ECDSA

> **ECDSA (Elliptic Curve Digital Signature Algorithm)** este un algoritm de semnătură digitală bazat pe criptografia cu curbe eliptice. Acesta oferă aceleași niveluri de securitate ca **RSA**, dar cu chei mult mai mici, ceea ce îl face mai eficient. 

#### Generarea unei chei private ECDSA
```bash
openssl ecparam -genkey -name prime256v1 -out ecdsa_private.pem
```
* `ecparam` - utilizează OpenSSL pentru a genera parametrii unei curbe eliptice
* `-genkey` - specifică faptul că trebuie generată o cheie privată
* `-name prime256v1` - alege curba eliptică **prime256v1**, care este una dintre cele mai utilizate curbe pentru ECDSA.
* `-out ecdsa_private.pem` - salvează cheia privată generată în fișierul `ecdsa_private.pem`


#### Generarea cheii publice ECDSA
```bash
openssl ec -in ecdsa_private.pem -pubout -out ecdsa_public.pem
```
* `ec` - utilizează OpenSSL pentru a manipula chei bazate pe curbe eliptice
* `-in ecdsa_private.pem` - specifică fișierul de cheie privată ca sursă
* `-pubout` - extrage cheia publică din cheia privată
* `-out ecdsa_public.pem` - salvează cheia publică în fișierul `ecdsa_public.pem`


#### Semnarea unui fișier folosind ECDSA
```bash
openssl dgst -sha256 -sign ecdsa_private.pem -out semnatura.bin mesaj.txt
```
* `dgst` - utilizează OpenSSL pentru a calcula un hash criptografic al fișierului și a-l semna
* `-sha256` - specifică utilizarea algoritmului de hashing **SHA-256** pentru generarea hash-ului mesajului
* `-sign ecdsa_private.pem` - utilizează cheia privată `ecdsa_private.pem` pentru a semna hash-ul generat
* `-out semnatura.bin` - salvează semnătura digitală generată în fișierul `semnatura.bin`
* `mesaj.txt` - fișierul care urmează să fie semnat digital


#### Verificarea semnăturii digitale
```bash
openssl dgst -sha256 -verify ecdsa_public.pem -signature semnatura.bin mesaj.txt
```
* `dgst` - utilizează OpenSSL pentru a verifica semnătura digitală
* `-sha256` - specifică utilizarea algoritmului **SHA-256** pentru verificarea hash-ului
* `-verify ecdsa_public.pem` - utilizează cheia publică `ecdsa_public.pem` pentru verificarea autenticității semnăturii
* `-signature semnatura.bin` - specifică fișierul `semnatura.bin`, care conține semnătura digitală ce trebuie verificată
* `mesaj.txt` - fișierul original al cărui conținut trebuie verificat pentru a confirma că nu a fost modificat

<br />


## Tool-uri Online pentru Testare Criptografică

### AES
[![Key Generator](https://img.shields.io/badge/Accesare_Tool-Generate_Random-9C27B0)](https://generate-random.org/encryption-key-generator)  
[![AES Online Tool](https://img.shields.io/badge/Accesare_Tool-AES_Encryption_Online-4CAF50)](https://aesencryption.net/)  

### RSA
[![Devglan RSA Tool](https://img.shields.io/badge/Accesare_Tool-Devglan_RSA-009688)](https://www.devglan.com/online-tools/rsa-encryption-decryption)  

### ECDSA
[![ECDSA Tool](https://img.shields.io/badge/Accesare_Tool-EMN178_ECDSA-FF5722)](https://emn178.github.io/online-tools/ecdsa/key-generator/)  