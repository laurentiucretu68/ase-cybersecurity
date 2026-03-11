# 📝 Temă Practică - Recuperarea Parolelor din Arhive Protejate

## 🔢 Numerotare Participanți
Fiecare student primește un număr unic <code><strong><span style="color:red;">N</span></strong></code>, același care v-a fost alocat la tema anterioară.

## 📚 Context
Această activitate abordează problema recuperării unei parole dintr-un document criptat/parolat. În cazul documentelor cu dimensiuni mari, criptarea asimetrică devine ineficientă, fiind preferată criptarea simetrică. În această abordare, în cadrul fișierului este salvat și un hash al parolei/cheii utilizate la criptare.

Din acest motiv, au fost dezvoltate diverse programe care permit:
* Extragerea hash-ului parolei din fișierul protejat
* Rularea unui scenariu automat pentru recuperarea parolei originale

## 🎯 Obiectiv
Utilizarea programului `John the Ripper` pentru a recupera parola unei arhive de tip **ZIP**.

## 🛠️ Resurse Necesare
- **Program**: [John the Ripper](https://www.openwall.com/john/)
  
  **Instalare pentru Windows:**
  - Descarcă [versiunea Windows (john-1.9.0-jumbo-1-win64.zip)](https://www.openwall.com/john/k/john-1.9.0-jumbo-1-win64.zip)
  - Alternativ, descarcă de [aici](https://drive.google.com/file/d/1BHHOHCam7lxkHUo4Y9_5NrEXQPl93KOT)
  - Extrage arhiva într-un folder (ex: `C:\john`)
  - Nu este necesară instalare, programul poate fi rulat direct din folderul extras
  
  **Instalare pentru macOS:**
  - **Opțiunea 1**: Folosind Homebrew:
    ```
    brew install john-jumbo
    ```
  - **Opțiunea 2**: Compilare manuală:
    ```
    curl -L https://www.openwall.com/john/k/john-1.9.0-jumbo-1.tar.xz -o john.tar.xz
    tar -xf john.tar.xz
    cd john-1.9.0-jumbo-1/src
    ./configure && make
    ```
  **Instalare pentru Linux (Debian/Ubuntu):**
    ```
    sudo apt-get update
    sudo apt-get install john
    ```

- **Arhivă protejată**: Descarcă fișierul <code><strong><span style="color:red;">N</span>.zip</strong></code> din [folderul de arhive](https://drive.google.com/drive/folders/1I0aiGGBcEkUH9SaV48ViQEjJFWZ548On)
- **Text pentru dicționar**: Descarcă fișierul <code><strong><span style="color:red;">N</span>_raw.txt</strong></code> din [folderul de texte](https://drive.google.com/drive/folders/1ihXaHFTg9QlHnK6Tjxt4xK-pfyuFcQ2t)
- **Formular de răspuns**: Disponibil [aici](https://forms.gle/qFwhdiK3t12fxevo6)


## 📋 Pași de Rezolvare

### Pasul 1: Descărcarea și Pregătirea Materialelor
- Descarcă și dezarhivează programul `John the Ripper`
- Descarcă fișierul tău <code><strong><span style="color:red;">N</span>.zip</strong></code> și <code><strong><span style="color:red;">N</span>_raw.txt</strong></code>
- **Indiciu important**: Parola arhivei este un cuvânt din textul descărcat

### Pasul 2: Crearea Dicționarului de Parole
Pentru extragerea eficientă a cuvintelor din text, vă sugerăm  scrierea unui script Python [Link instalare Python](https://www.python.org/downloads/)


### Pasul 3: Extragerea Hash-ului Parolei
- Deschide un terminal/linie de comandă
- Navighează la directorul unde ai dezarhivat John the Ripper
- Rulează comanda pentru a extrage hash-ul parolei:
  ```
  zip2john.exe N.zip > N.hash
  ```
  (înlocuiește `N` cu numărul tău unic)

### Pasul 4: Recuperarea Parolei
- Rulează John the Ripper cu dicționarul creat:
  ```
  john --wordlist=dictionar_parole.txt N.hash
  ```

### Pasul 5: Vizualizarea Parolei Descoperite
- Pentru a afișa parola găsită:
  ```
  john --show N.hash
  ```

### Pasul 6: Verificarea Rezultatului
- Folosește parola descoperită pentru a deschide arhiva ZIP
- Verifică și notează conținutul arhivei

## 📤 Livrabil
Completează [formularul de răspuns](https://forms.gle/qFwhdiK3t12fxevo6) cu:
- Numărul tău unic
- Parola descoperită
- Conținutul arhivei dezarhivate

## ⏰ Termen Limită
Tema trebuie finalizată și formularul completat până la data de **19 martie 2025** (inclusiv).

## 💡 Sfaturi Utile
- Pe sistemele Unix/Mac, comanda `zip2john` poate fi folosită fără extensia `.exe`
- Dacă dicționarul este foarte mare, procesul poate dura mai mult timp
- Asigură-te că toate căile către fișiere sunt corecte în comenzile tale