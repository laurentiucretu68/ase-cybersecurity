# Securitatea rețelelor wireless și analiza traficului

## 📡 Rețele wireless

> O **rețea wireless** este un sistem de comunicații care permite dispozitivelor să se conecteze și să schimbe date fără a utiliza cabluri fizice, folosind undele radio pentru transmiterea informațiilor.

### 🔑 Concepte fundamentale

| Concept | Descriere | Exemplu |
|---------|-----------|---------|
| **SSID** | Numele rețelei wireless | "WiFi-Acasă" |
| **Punct de acces** (AP) | Dispozitiv care emite semnal wireless | Router wireless |
| **Rază de acoperire** | Distanța maximă la care semnalul este utilizabil | ~30m în interior |
| **Bandă de frecvență** | Spectrul radio utilizat pentru transmisie | 2.4 GHz sau 5 GHz |
| **Canal** | Subdiviziune a benzii de frecvență | Canalele 1-14 pentru 2.4 GHz |
| **BSSID** | Adresa MAC a punctului de acces | 00:11:22:33:44:55 |

### 📊 Tipuri de rețele wireless

| Tip | Standard | Viteză maximă | Frecvență | Rază acoperire | Utilizare |
|-----|----------|--------------|-----------|---------------|-----------|
| **Wi-Fi 6** (802.11ax) | Cel mai recent | 9.6 Gbps | 2.4 & 5 GHz | ~30m | Smart Home, Streaming 4K |
| **Wi-Fi 5** (802.11ac) | Standard comun | 3.5 Gbps | 5 GHz | ~30m | Streaming HD, jocuri online |
| **Wi-Fi 4** (802.11n) | Standard uzual | 600 Mbps | 2.4 & 5 GHz | ~50m | Navigare web, email |
| **802.11g** | Legacy | 54 Mbps | 2.4 GHz | ~30m | Dispozitive mai vechi |
| **802.11b** | Foarte vechi | 11 Mbps | 2.4 GHz | ~35m | IoT simplu, dispozitive vechi |

### 🔄 Topologii wireless

| Topologie | Descriere | Utilizare |
|-----------|-----------|-----------|
| **Infrastructure** | Dispozitivele se conectează prin puncte de acces centrale | Rețele casnice și de birou |
| **Ad-hoc** | Dispozitivele se conectează direct între ele | Transfer rapid de fișiere între dispozitive |
| **Mesh** | Punctele de acces comunică între ele pentru acoperire extinsă | Case mari, campusuri, spații deschise |

![Topologii wireless](/img/wireless.avif)

---

<br />

## 🔒 Securitatea rețelelor wireless

> Securitatea wireless implică protejarea informațiilor transmise prin unde radio împotriva accesului neautorizat, interceptării și modificării.

### 🛡️ Protocoale de securitate wireless

| Protocol | Nivel securitate | Caracteristici | Vulnerabilități |
|----------|-----------------|----------------|----------------|
| **WEP** (Wired Equivalent Privacy) | ⚠️ Foarte slab | Cheie statică, RC4 | Criptare spartă în minute |
| **WPA** (Wi-Fi Protected Access) | 🔒 Moderat | TKIP, cheie dinamică | Vulnerabil la atacuri de dicționar |
| **WPA2** (Personal/PSK) | 🔒🔒 Bun | AES-CCMP | Vulnerabil la atacuri de dicționar |
| **WPA2 Enterprise** | 🔒🔒🔒 Foarte bun | AES + autentificare RADIUS | Complex de configurat |
| **WPA3** (Personal) | 🔒🔒🔒🔒 Excelent | SAE (Dragonfly), PFS | Riscuri în implementare |

### ⚙️ Metodele de autentificare

| Metodă | Nivel securitate | Implementare | Utilizare |
|--------|-----------------|--------------|-----------|
| **PSK** (Pre-Shared Key) | Moderat | Parolă comună | Acasă, afaceri mici |
| **EAP-TLS** | Înalt | Certificate digitale | Corporații |
| **PEAP** | Înalt | Parolă + cert. server | Mediu academic, corporații |
| **SAE** (WPA3) | Foarte înalt | Dragonfly Handshake | Rețele moderne |

### 🔐 Cele mai bune practici de securizare

1. **Configurare router**
   - **Schimbă SSID-ul** implicit (nu include informații personale în nume)
   - **Dezactivează** transmiterea SSID-ului pentru rețelele sensibile
   - **Actualizează firmware-ul** routerului periodic
   - **Schimbă credențialele** de administrare implicite

2. **Parole și autentificare**
   - **Utilizează parolă puternică** (minim 12 caractere, combinație de litere, cifre, simboluri)
   - **Activează WPA2/WPA3** (niciodată WEP sau WPA)

3. **Segmentare și control**
   - **Creează rețele separate** pentru oaspeți și IoT
   - **Activează filtrare MAC** ca strat suplimentar de securitate

4. **Monitorizare**
   - **Verifică periodic** dispozitivele conectate

---

<br />

## 🔍 Analiza traficului de rețea

> **Analiza traficului de rețea** reprezintă procesul de interceptare, înregistrare și examinare a pachetelor de date transmise într-o rețea pentru a înțelege comportamentul, performanța și securitatea acesteia.

### 🛠️ Instrumente pentru analiza traficului

| Instrument | Tip | Utilizare | Caracteristici |
|------------|-----|-----------|----------------|
| **Wireshark** | Analizor de protocol | Captură și analiză detaliată | Interfață grafică, filtre complexe, decodare protocoale |
| **tcpdump** | Utilitar CLI | Captură în linie de comandă | Ușor de automatizat, performant |

### Tehnici fundamentale de analiză

1. **Captura pachetelor**
   - **Capture filters** - filtrarea la nivel de captură pentru reducerea volumului de date
   - **Port mirroring/SPAN** - configurarea switch-urilor pentru a duplica traficul
   - **Network TAPs** - dispozitive hardware specializate pentru interceptare non-intruzivă
   - **Promiscuous mode** - configurarea interfeței de rețea pentru a capta tot traficul

2. **Analiza datelor capturate**
   - **Display filters** - filtrarea post-captură pentru izolarea traficului specific
   - **Follow TCP Stream** - reconstrucția conversațiilor complete
   - **Protocol hierarchy** - vizualizarea distribuției protocoalelor în traficul capturat
   - **Time-sequence analysis** - examinarea timpilor de răspuns și a latențelor

3. **Detectarea anomaliilor**
   - **Baseline profiling** - stabilirea comportamentului normal al rețelei
   - **Traffic pattern analysis** - identificarea tiparelor anormale
   - **Signature matching** - detectarea semnăturilor cunoscute de atacuri
   - **Heuristic analysis** - detectarea comportamentelor suspecte noi

### 🔐 Exemple de filtre Wireshark utile

| Filtru | Funcție | Exemplu utilizare |
|--------|---------|-------------------|
| `ip.addr == x.x.x.x` | Trafic spre/de la o adresă IP | Monitorizarea unui host specific |
| `http.request.method == "POST"` | Cereri HTTP POST | Detectarea transmiterilor de date |
| `tcp.port == 443` | Trafic HTTPS | Analiza comunicațiilor securizate |
| `dns.qry.name contains "example"` | Interogări DNS specifice | Detectarea exfiltrării de date prin DNS |
