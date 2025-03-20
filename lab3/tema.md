# 📝 Temă Practică - Recuperare date din capturi PCAP

> În cadrul acestui exercițiu practic, veți analiza un fișier PCAP pentru a studia caracteristici ale traficului de rețea.

Fișierele `PCAP` (Packet Capture) sunt un format standard pentru stocarea datelor capturate din rețea. Aceste fișiere conțin înregistrări ale pachetelor ce circulă într-o rețea, inclusiv:

* **Header-ul** complet al pachetului (cu informații precum adrese IP sursă/destinație, porturi, timestamp)
* **Conținutul/payload-ul** pachetului (datele efective transmise)
* **Metadate** despre captură (interfața de rețea folosită, timestamp-uri precise, etc.)

## 🔍 Descrierea problemei
În procesul de recunoaștere, un atacator a reușit să salveze o captură a traficului generat de victimă (`file.pcap`). Printre destinațiile accesate veți identifica servicii care nu au fost securizate corespunzător. Partea interesantă este că unele date de autentificare capturate vor fi utile pentru a descoperi flag-ul acestei probleme.

#### Informații suplimentare:
* Traficul semnificativ a fost transmis peste FTP
* Portul utilizat pentru a transmite date este 1091
* Flag-ul se află într-un fișier ZIP
* **Important**: Pentru această temă, fișierul `file.pcap` se găsește în același director cu acest document (`/lab3/`)

## 🎯 Cerințe

| Nivel | Obiectiv |
|-------|----------|
| **Minim** | Recuperați conținutul a cel puțin 2 fișiere transferate (doar textul/mesajul) |
| **Maxim** | Identificați flag-ul pentru punctaj maxim |

## 🛠️ Instrumente recomandate

####  **Wireshark** - pentru analiza traficului de rețea

**Instalare pentru Windows:**
  - Descărcați de pe [wireshark.org/download](https://www.wireshark.org/download.html)
  - Executați fișierul .exe și urmați pașii din interfața grafică

**Instalare pentru macOS:**
  - Folosiți Homebrew: `brew install --cask wireshark`
  - Sau descărcați .dmg de la [wireshark.org/download](https://www.wireshark.org/download.html)

**Instalare pentru Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install wireshark
```


## 📋 Pași sugerați pentru rezolvare

### 1. Analiza inițială a capturii
- Deschideți file.pcap în **Wireshark**
- Examinați traficul FTP (Filter: `ftp`)
- Investigați conexiunile pe portul 1091 (Filter: `tcp.port==1091`)

### 2. Extragerea credențialelor FTP
- Căutați pachete cu autentificare FTP (Filter: `ftp.request.command==USER || ftp.request.command==PASS`)
- Notați numele de utilizator și parolele găsite

### 3. Identificarea și extragerea fișierului ZIP
- Căutați în trafic semnătura hexazecimală pentru fișiere ZIP (`50 4B 03 04`)
- Extrageți fișierul ZIP folosind opțiunea "Follow TCP Stream" și salvați conținutul binar

### 4. Dezarhivarea și accesarea flag-ului
- Încercați să dezarhivați ZIP-ul folosind credențialele descoperite anterior
- Extrageți și examinați conținutul pentru a găsi flag-ul

## 👨‍💻 Indicii utile

1. **Serviciul FTP** transmite datele în text clar, inclusiv credențialele de autentificare

2. **Semnăturile fișierelor** (hexazecimal):
   - ZIP: `50 4B 03 04`
   - JPEG: `FF D8 FF`
   - TXT: Căutați secvențe de text ASCII

3. **Filtrarea traficului**:
```bash
ftp                   # Filtrează toate pachetele FTP
tcp.port==1091        # Filtrează traficul pe port specific
ftp.request.command   # Examinează comenzi FTP
```

4. **Reconstrucția sesiunilor TCP**:
- În Wireshark: Analiză > Follow > TCP Stream

## 📝 Livrabile

1. Captură de ecran cu cel puțin 2 fișiere recuperate și conținutul lor
2. Documentarea pașilor urmați pentru a găsi flag-ul
3. Flag-ul descoperit (pentru punctaj maxim)

## 📤 Încărcarea rezultatelor

Încărcați rezultatele obținute folosind formularul următor:
[https://forms.gle/9puBvY3MHERQmgcY7](https://forms.gle/9puBvY3MHERQmgcY7)