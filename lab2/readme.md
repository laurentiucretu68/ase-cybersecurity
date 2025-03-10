# Fundamentele securității în rețele

## 🔢 Adresa IP: "Numărul de telefon" al dispozitivelor
> **Adresa IP** (Internet Protocol) este un identificator numeric atribuit fiecărui dispozitiv conectat la o rețea care utilizează protocolul Internet pentru comunicare. 

### 📡 Tipuri de adrese IP
| Tip                | Exemplu             | Utilizare                     |
|---------------------|---------------------|------------------------------|
| **IPv4**           | `192.168.1.1`      | Versiunea clasică (epuizată)  |
| **IPv6**           | `2001:0db8:85a3::` | Noua versiune (spațiu nelimitat) |
| **Privată**        | `10.0.0.5`         | Doar în rețele locale (LAN)  |
| **Publică**        | `85.122.23.144`    | Accesibilă pe internet       |
| **Statică**        | `172.16.0.10`      | Fixă (servere, imprimante)   |
| **Dinamică**       | `192.168.0.153`    | Schimbată periodic (DHCP)    |

**De ce avem IPv6?**  
IPv4 are doar ~4 miliarde de combinații. IPv6 oferă 3.4×10³⁸ combinații - suficient pentru fiecare dispozitiv de pe Pământ.

**Cum funcționează NAT?**  
Routerul transformă adrese private în publice:  
`Dispozitiv (192.168.1.10) → Router (85.122.23.144) → Internet`

![Public vs Private IP](/img/public_vs_private_ips.png)

---

<br />



## 🌐 Rețele: Grupuri de dispozitive conectate
> O **rețea** reprezintă un sistem organizat de dispozitive care comunică prin reguli comune (protocoale).

### 🔑 Concepte cheie
1. **Subnet (Subrețea)**  
   - Diviziune logică a unei rețele mari  
   - Exemplu: `192.168.1.0/24` = 254 dispozitive (1-254)

2. **Mască de rețea**  
   - Separă adresa IP în partea de rețea și host  
   - `/24` = `255.255.255.0`  

3. **Gateway**  
   - Routerul care leagă rețeaua locală de internet  
   - Adresă tipică: `192.168.1.1` sau `10.0.0.1`

![Network Diagram](/img/network.png)


### 📊 Tabel comparativ clase rețea
| Clasă   | Exemplu           | Hosturi posibile | Utilizare              |
|---------|-------------------|------------------|------------------------|
| **A**   | `10.0.0.0/8`      | 16 milioane      | Mari corporații       |
| **B**   | `172.16.0.0/16`   | 65,536           | Universități, ISP-uri |
| **C**   | `192.168.1.0/24`  | 254              | Rețele casnice        |


### 🔄 Cum interacționează conceptele
1. `DNS` → Traduce nume în IP
2. `IP` → Identifică dispozitivul în rețea
3. `Subnet` → Definește grupul de dispozitive locale
4. `Gateway` → Conectează rețeaua locală la internet

---

<br />



## DNS (Domain Name System) - "Agenda telefonică" a Internetului
> **DNS** este un sistem ierarhic și descentralizat de numire pentru dispozitive conectate la rețele IP, care traduce numele de domenii memorabile (cum ar fi www.example.com) în adresele IP numerice necesare pentru localizarea serviciilor și dispozitivelor.

### Funcționarea DNS
![DNS](/img/dns.png)

<div style="display: flex; gap: 20px; margin-top: 20px">

<div style="flex: 1">

### 👤 Partea utilizatorului

**Pasul 1 - Inițierea cererii**  
- Scrie `example.com` în browser  
- Cere adresa IP corespunzătoare  

**Pasul 8 - Conectare reușită**  
- Primește adresa IP `192.0.0.16`  
- Începe încărcarea site-ului 

</div>

<div style="flex: 1">

### 🌐 Partea serverelor DNS

**Pasul 2-3 - Primul nivel de verificare**  
- Serverul ISP:  
  ✔️ Verifică cache  
  ❌ Dacă nu găsește → întreabă global  

**Pasul 4-5 - Direcționarea către sursă**  
- **Server-rădăcină:**  
  ➔ Trimite la serverul responsabil de domenii `.com`
- **Server TLD:**  
  ➔ Indică serverul oficial al `example.com`

**Pasul 6-7 - Obținerea adresei reale**  
- **Server autoritativ (gazda site-ului):**  
  📍 Furnizează adresa IP exactă: `192.0.0.16 
- **Server ISP local:**  
  💾 Salvează informația pentru viitor  

</div>
</div>

### 🔍 Test DNS resolution
* **Linux & macOS**:
    ```bash
    nslookup example.com
    dig +short example.com
    ```

* **Windows (cmd)**:
    ```cmd
    nslookup example.com
    ```

<br />

---



## 🔒 HTTP vs HTTPS: Cum circulă datele tale pe internet

![HTTP vs HTTPS](/img/http_vs_https.png)


### 📨 HTTP (Hypertext Transfer Protocol)
> Protocol pentru transmiterea documentelor hipermedia, cum ar fi HTML. A fost conceput pentru comunicarea între browsere web și servere web.

| Aspect                   | Detalii                                                                 |
|--------------------------|-------------------------------------------------------------------------|
| **Securitate**         | Fără criptare - conținut vizibil pentru routere, furnizori de internet |
| **Vulnerabilități**   | Expus la intercepții, modificări în tranzit                            |
| **Port standard**     | 80                                                                     |
| **Riscuri comune**     | Furt de date de autentificare, session hijacking                       |

**Exemplu de comunicare HTTP:**  
```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
HTTP/1.1 200 OK                   # Status line (version + code + phrase)
Content-Type: text/html           # Headers
Content-Length: 1234

<!DOCTYPE html>                   # Body
<html>...</html>
```

### 🔐 HTTPS (HTTP Secure)
> Extensia securizată a HTTP. Comunicațiile sunt criptate folosind TLS (Transport Layer Security) sau, în versiuni mai vechi, SSL (Secure Sockets Layer).

#### Elemente de protecție:
1. **Criptare AES-256** - Transformă datele în cod indecriptabil fără cheia potrivită  
2. **Integritate HMAC** - Detectează orice modificare a datelor în tranzit  
3. **Autentificare TLS** - Verifică identitatea serverului prin certificate digitale  

Aceste trei elemente funcționează împreună pentru a asigura o conexiune securizată:
- **Criptarea** protejează conținutul comunicării de interceptare
- **Integritatea** garantează că datele nu sunt modificate în tranzit
- **Autentificarea** asigură că te conectezi la serverul legitim, nu la unul falsificat

#### Componentele unui certificat digital
Certificatele digitale sunt esențiale pentru HTTPS, deoarece permit browserului să verifice identitatea site-ului web:

| Componentă certificat              | Rol                                                                 |
|------------------------------------|---------------------------------------------------------------------|
| 🏷️ **Nume domeniu**               | Pentru ce site e valabil (ex: `*.google.com`)                      |
| 🏛️ **Autoritate emitentă**         | Entitatea care verifică identitatea (ex: Let's Encrypt)            |
| 📅 **Valabilitate**                | Maxim 13 luni (conform standardelor actuale)                       |
| 🔑 **Cheie publică**               | Folosită pentru stabilirea conexiunii securizate                   |
| 🧬 **Amprentă SHA-256**            | Identifică unic certificatul                                       |

---

<br />


## 🍪 Cookies & sessions

> **Cookie-urile** sunt fișiere text mici stocate pe dispozitivul utilizatorului de către site-urile web vizitate. Ele conțin informații despre preferințe, autentificare sau comportamentul utilizatorului pe site.

### 🧩 Tipuri de cookies și utilizări

| Tip de cookie           | Utilizare                          | Durată                    | Exemple                          |
|-------------------------|------------------------------------|--------------------------|---------------------------------|
| **Sesiune**             | Țin minte activitatea curentă      | Până la închiderea browser-ului | Coș de cumpărături, formulare   |
| **Persistente**         | Memorează preferințe pe termen lung| Zile, luni sau ani       | Limba preferată, tema site-ului  |
| **First-party**         | Create de site-ul vizitat direct   | Variabilă                | Login, setări personalizate      |
| **Third-party**         | Create de domenii externe          | Variabilă                | Tracking publicitar, widget-uri   |

### 🔒 Flags de securitate pentru cookies

| Flag                    | Funcționalitate                                       | Exemplu                          |
|-------------------------|------------------------------------------------------|----------------------------------|
| **HttpOnly**            | Previne accesul JavaScript la cookie                  | Protecție împotriva XSS          |
| **Secure**              | Cookie trimis doar prin conexiuni HTTPS               | Prevenirea interceptării         |
| **SameSite**            | Limitează trimiterea cookie-urilor cross-site         | Protecție împotriva CSRF         |
| **Path**                | Limitează cookie-ul la o anumită cale                 | `/forum` vs. întregul site       |
| **Domain**              | Specifică domeniul pentru care e valid cookie-ul      | `example.com` sau subdomenii     |

> **Sesiunea** reprezintă perioada activă în care un utilizator interacționează cu o aplicație web. Aceasta este de obicei gestionată printr-un token de sesiune stocat într-un cookie.

#### Cum funcționează sesiunile:

1. **Autentificare**: Utilizatorul introduce credențiale
2. **Creare sesiune**: Serverul generează un ID de sesiune unic
3. **Stocare**: ID-ul este salvat într-un cookie în browser
4. **Verificare**: La fiecare cerere, serverul validează ID-ul
5. **Expirare**: Sesiunea se termină după un timp de inactivitate sau la logout

### ⚠️ Atacuri comune și protecție

| Atac                         | Descriere                                       | Metode de protecție                  |
|------------------------------|------------------------------------------------|-------------------------------------|
| **Session Hijacking**        | Furtul cookie-ului de sesiune                  | HttpOnly, Secure flags, IP binding  |
| **Session Fixation**         | Forțarea utilizării unui ID de sesiune cunoscut| Regenerarea ID la autentificare     |
| **Cross-Site Scripting (XSS)**| Injectarea de script malițios                  | HttpOnly flag, Content-Security-Policy |
| **Cross-Site Request Forgery**| Executarea de acțiuni nedorite                 | SameSite cookies, tokeni CSRF       |

---

<br />

## Cum detectezi un site fals (phishing/clonat)

### 🚨 Semnale de alarmă
| Ce verifici             | Exemplu Legitim      | Exemplu Phishing       | De ce contează?         |
|-------------------------|----------------------|-------------------------|-------------------------|
| **🔗 URL corect**       | `https://paypal.com` | `https://paypai.com`    | Litere schimbate (ex: `l` → `i`) |
| **📜 Certificat SSL**   | Emis pentru `PayPal` | Emis pentru `Cloudflare`| Certificatul trebuie să corespundă site-ului |
| **🔐 Conexiune securizată** | Lacăt verde         | Lacăt gri/roșu          | HTTPS ≠ securizat automat |

### 🔍 Pași de verificare
1. **Analizează URL-ul**  
   ```diff
   + bun: github.com  
   - rau: githu6.com (cu cifra 6 în loc de b)
   ```

2. **Inspectează certificatul**
    - **Pasul 1:** Click pe lacătul din bara de adresă  
    - **Pasul 2:** Verifică:
        - `Emitentul`: Organizație recunoscută (ex: Let's Encrypt, DigiCert)  
        - `Valabil pentru`: Numele corect al domeniului (ex: `*.google.com`)

3. **Caută erori subtile**
    - Texte neprofesioniste:  
        ```diff
        - "Va rugam reintrodu parola"
        + "Vă rugăm reintroduceți parola"
        ```
    - Elemente vizuale suspecte:
        - Sigle pixelate
        - Logo-uri întrerupte sau distorsionate
        - Culori incorecte
        

4. **Testează cu unelte tehnice** 

    **Pentru Linux/macOS:**
    ```bash
    openssl s_client -connect site-suspect.com:443 | openssl x509 -text -noout
    ```
    1. `openssl s_client -connect site-suspect.com:443`
        * `openssl` - Utilitar pentru lucrul cu protocoale criptografice și certificate
        * `s_client` - Subcomandă care implementează un client SSL/TLS
        * `-connect site-suspect.com:443` - Specifică hostul și portul la care să se conecteze

    2. `openssl x509 -text -noout`
        * `openssl` - Același utilitar
        * `x509` - Subcomandă pentru procesarea certificatelor în format X.509
        * `-text` - Afișează conținutul certificatului în format text lizibil
        * `-noout` - Suprimă afișarea versiunii encoded (codificate) a certificatului

    **Pentru Windows (PowerShell):**
    ```powershell
    Test-NetConnection site-suspect.com -Port 443 | Select-Object TlsHandshake
    ```
    1. `Test-NetConnection site-suspect.com -Port 443`
        * `Test-NetConnection` - Comandă PowerShell pentru diagnosticarea conexiunilor de rețea
        * `site-suspect.com` - Domeniul de verificat
        * `-Port 443` - Specifică portul standard pentru HTTPS
   
    2. `Select-Object TlsHandshake`
        *` Select-Object` - Filtrează rezultatele pentru a afișa doar informații specifice
        * `TlsHandshake` - Proprietatea care indică dacă negocierea TLS a reușit

---

<br />






## 📧 Securitatea email-urilor

> **Email** (electronic mail) este o metodă de schimb de mesaje digitale între persoane folosind dispozitive digitale. Un email conține de obicei: expeditor, destinatar, subiect, corp și potențial atașamente.

### 🛡️ Elementele de securitate ale unui email

#### SPF (Sender Policy Framework)
> SPF este un protocol de autentificare a emailului care permite proprietarului unui domeniu să specifice care servere de email sunt autorizate să trimită email-uri în numele domeniului respectiv.

#### DKIM (DomainKeys Identified Mail)
> DKIM adaugă o semnătură digitală la email-uri, permițând destinatarului să verifice că mesajul nu a fost modificat în tranzit și că a fost trimis de la serverul legitim.

#### DMARC (Domain-based Message Authentication, Reporting & Conformance)
> DMARC este un protocol care folosește SPF și DKIM pentru a îmbunătăți protecția împotriva spoofing-ului și phishing-ului prin email.


### Cum identificăm email-urile de tip spam sau phishing

### 🔍 Semne de alarmă
| Indicator                | Exemplu Legitim            | Exemplu Phishing               |
|--------------------------|----------------------------|---------------------------------|
| **Expeditor**           | `support@paypal.com`       | `support@paypa1.com`           |
| **Link-uri**            | `https://paypal.com/login` | `http://paypa1-security.net`   |
| **Atașamente**          | `Factura.pdf`              | `Invoice_2023.exe`             |
| **Cerințe**             | Confirmă adresa            | "Urgent! Contul tău expiră în 2 ore!" |

### 🔧 Verificare tehnică avansată
**Pași pentru analiza antetelor:**

**Verificare tehnică a email-ului**:
Vizualizarea antetelor complete ale unui email pentru verificarea `SPF`, `DKIM` și `DMARC`

* În **Gmail**: `⋮` (Meniu) → **Show original** → Căutați:
    ```text
   Received-SPF: Pass
   DKIM-Signature: Valid
   DMARC-Result: Pass
   ```
* În **Outlook**: Click dreapta mesaj → **View Message Details** → Verificați:
    ```test
    Authentication-Results: spf=pass; dkim=pass; dmarc=pass
    ```

---

<br />





## Conexiuni VPN (Virtual Private Network)

> **VPN** (Virtual Private Network) este o tehnologie care creează un tunel criptat între dispozitivul utilizatorului și un server, protejând datele transmise și mascând adresa IP reală a utilizatorului.

### ⚙️ Cum funcționează?
1. **Criptare AES-256** - Transformă datele în cod indecriptabil  
2. **Tunelare** - Încapuslează pachetele în "container" securizat  
3. **Mascare IP** - Adresa ta reală este înlocuită cu cea a serverului VPN  
4. **Ruting securizat** - Conexiunea ocolește punctele vulnerabile  

### 📊 Comparație protocoale VPN
| Protocol       | Securitate | Viteză | Use Case              |
|----------------|------------|--------|-----------------------|
| **OpenVPN**    | 🔐🔐🔐🔐   | 🐢      | Securitate maximă      |
| **WireGuard®** | 🔐🔐🔐     | 🚀      | Dispozitive mobile    |
| **IKEv2/IPsec**| 🔐🔐🔐🔐   | 🐇      | Schimbări rețea       |


### 🛠️ Configurare OpenVPN pas cu pas
### 1. Instalare client
**Linux (Debian/Ubuntu):**
```bash
sudo apt update && sudo apt install openvpn resolvconf -y
```
**macOS (Homebrew):**
```bash
brew install openvpn
```
**Windows:**

📥 Descarcă [OpenVPN GUI](https://openvpn.net/client/) și urmează wizard-ul


### 2. Obținerea fișierelor de configurare
Descarcă fișierul `.ovpn` de la furnizorul tău VPN. De obicei, găsești aceste fișiere în secțiunea "Client Area" sau "Download"
- Exemple de furnizori și locații pentru fișierele de configurare:
  * **NordVPN**: Contul tău → Setări → Setări avansate → Descarcă configurația OpenVPN
  * **ProtonVPN**: Dashboard → Downloads → OpenVPN Configuration files
  * **Mullvad**: Site-ul web → Descărcări → Configurații OpenVPN

### 3. Configurarea conexiunii
**Linux (Debian/Ubuntu) & macOS:**
```bash
sudo openvpn --config /cale/catre/fisier.ovpn
```
**Windows:**
1. Click dreapta pe **OpenVPN GUI** → Rulează ca administrator
2. Copiază fișierul .ovpn în folderul `C:\Program Files\OpenVPN\config`
3. Click dreapta pe iconița **OpenVPN** din system tray
4. Selectează "Connect" pentru configurația ta


### 4. Verificarea conexiunii
Pentru toate sistemele:

1. Verifică adresa IP înainte și după conectare:
```bash
curl ifconfig.me
```
2. Verifică dacă DNS-urile sunt routate prin VPN:
```bash
nslookup google.com
```
3. Testează conexiunea către un site
```bash
ping google.com
```

### 5. Deconectare
**Linux (Debian/Ubuntu):**
```bash
sudo killall openvpn
```
**Linux (Debian/Ubuntu) & macOS:**
```bash
brew services stop openvpn
```
**Windows:**
1. Click dreapta pe iconița **OpenVPN** din system tray
2. Selectează "Disconnect"

---
<br />

## 🔗 Resurse utile

### 🌐 Testare rețea
| Resursă                      | Descriere                          | Link                                  |
|------------------------------|------------------------------------|---------------------------------------|
| **Speedtest**             | Benchmark viteza download/upload   | [speedtest.net](https://www.speedtest.net/) |
| **DNS Leak Test**      | Detectează scurgeri DNS            | [dnsleaktest.com](https://www.dnsleaktest.com/) |
| **SSL Labs Analyzer**     | Audit configurație SSL/TLS         | [ssllabs.com](https://www.ssllabs.com/ssltest/) |



### 📧 Securitate email
| Instrument                   | Funcționalitate                    | Link                                  |
|------------------------------|------------------------------------|---------------------------------------|
| **MX Toolbox**           | Verifică SPF/DKIM/DMARC            | [mxtoolbox.com](https://mxtoolbox.com/) |
| **Have I Been Pwned**     | Alertă compromitere conturi        | [haveibeenpwned.com](https://haveibeenpwned.com/) |


### 🛡️ VPN și confidențialitate
| Resursă                      | Recomandare                       | Link                                  |
|------------------------------|-----------------------------------|---------------------------------------|
| **Privacy Tools VPN**     | Top provideri fără logging        | [privacytools.io](https://www.privacytools.io/providers/vpn/) |
| **WireGuard**             | Protocol VPN ultra-performant     | [wireguard.com](https://www.wireguard.com/) |