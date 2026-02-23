# 📘 Ghid pentru Instructor - The DeFi Heist Lab

Acest document oferă instructorului toate informațiile necesare pentru a pregăti, distribui și evalua laboratorul de Blockchain Security.

## 📋 Cuprins

1. [Pregătirea Laboratorului](#pregătirea-laboratorului)
2. [Distribuirea către Studenți](#distribuirea-către-studenți)
3. [Suport Tehnic pe Parcurs](#suport-tehnic)
4. [Evaluare și Notare](#evaluare-și-notare)
5. [Răspunsuri și Soluții](#răspunsuri-și-soluții)
6. [Întrebări Frecvente](#întrebări-frecvente)

---

## 🔧 Pregătirea Laboratorului

### Generare Instanțe Unice Per Student (Recomandat)

Laboratorul suportă instanțe deterministe per student. Rulează:

```bash
cd 2026/lab4-blockchain-defi
export LAB_INSTANCE_SALT="<secret_salt_curs>"
npm run init:student -- --student-id student1@stud.ase.ro --force
npm run init:student -- --student-id student2@stud.ase.ro --force
```

Sau batch (fișier cu 1 student/linie):

```bash
cat > students.txt <<EOF
student1@stud.ase.ro
student2@stud.ase.ro
student3@stud.ase.ro
EOF

npm run init:batch -- --file students.txt --salt "$LAB_INSTANCE_SALT" --force
```

Poți porni de la template-ul: `instructor/students.example.txt`.

Ce se generează:
- `student/instance.json` + `student/instance.env` (distribuite studentului)
- `instructor/expected/<student_id>.json` (cheie de verificare pentru notare)

Recomandare distribuție: pachet zip separat per student, cu propriile fișiere din `student/`.

Reset rapid între serii/laboratoare:

```bash
npm run clean:generated
```

### Opțiunea 1: Crearea VM-ului Pre-configurat (Recomandat)

#### Metodă RAPIDĂ: Setup Automat cu Script 🎯

Am creat un **script automat** care configurează totul! 

**Pași simpli**:

1. **Instalează Ubuntu 22.04 LTS în VirtualBox**
   - RAM: 8 GB (minimum 4 GB)
   - Storage: 25 GB
   - CPU: 2 cores (minimum)

2. **Rulează scriptul de setup automat**:
   ```bash
   # În Ubuntu fresh install, deschide terminal:
   git clone https://github.com/[USERNAME]/ase-cybersecurity.git
   cd ase-cybersecurity/2026/lab4-blockchain-defi/vm-setup
   chmod +x setup-vm.sh
   ./setup-vm.sh
   ```

3. **Așteaptă 15-20 minute** ☕
   - Scriptul face TOTUL automat
   - Afișează progres color-coded
   - Creează desktop shortcuts
   - Opțional creează user `student`

4. **Gata!** ✅

**Ce face scriptul**:
- ✅ Update sistem Ubuntu
- ✅ Instalează Node.js 18 LTS
- ✅ Instalează Ganache CLI
- ✅ Instalează VS Code + extensii Solidity
- ✅ Instalează Firefox
- ✅ Clonează repo-ul laboratorului
- ✅ Instalează toate dependențele npm
- ✅ Creează desktop shortcuts
- ✅ Creează user `student` (opțional)
- ✅ Verifică setup-ul
- ✅ Cleanup

**Documentație completă**: Vezi `vm-setup/VM-QUICK-GUIDE.md`

---

#### Metodă MANUALĂ (dacă preferi control total):

1. **Instalează Ubuntu 22.04 LTS în VirtualBox/VMware**
   - RAM: 8 GB
   - Storage: 20 GB
   - CPU: 2 cores

2. **Instalează toate dependențele**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Ganache globally
   sudo npm install -g ganache
   
   # Install VS Code
   wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
   sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
   sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
   sudo apt update
   sudo apt install code
   
   # Install Firefox (pentru MetaMask)
   sudo apt install firefox
   ```

3. **Clone repo-ul în VM**
   ```bash
   cd ~
   git clone https://github.com/[your-username]/ase-cybersecurity.git
   cd ase-cybersecurity/2026/lab4-blockchain-defi
   npm install
   ```

4. **Setup MetaMask în Firefox**
   - Instalează extensia MetaMask
   - Configurează pentru localhost:7545
   - Importă primul account din Ganache

5. **Testează setup-ul**
   ```bash
   npm run verify-setup
   ./start-ganache.sh
   npm run deploy:all
   ```

6. **Curăță VM-ul**
   ```bash
   # Șterge history
   history -c
   rm ~/.bash_history
   
   # Șterge cache
   sudo apt clean
   npm cache clean --force
   
   # Reduce dimensiunea
   sudo dd if=/dev/zero of=/EMPTY bs=1M
   sudo rm -f /EMPTY
   ```

7. **Exportă ca OVA**
   ```
   File → Export Appliance → Save as .ova
   ```

8. **Upload pe cloud storage**
   - Google Drive (recomandat pentru studenți ASE)
   - OneDrive
   - Dropbox
   - Link în README-ul laboratorului

#### Credențiale VM Recomandate:
- Username: `student`
- Password: `cybersec2026`
- Root password: `cybersec2026admin`

---

### Opțiunea 2: Fără VM - Instrucțiuni pentru Studenți

Dacă nu folosești VM, studenții urmează ghidul din `vm-setup/README.md` pentru instalare manuală.

**Avantaje**: Flexibilitate, învață setup-ul  
**Dezavantaje**: 30-60 min setup, probleme de compatibilitate

---

## 📤 Distribuirea către Studenți

### Ce primesc studenții:

1. **README principal** - Overview și obiective
2. **Challenge guides** - 3 fișiere markdown detaliate
3. **Contracte vulnerabile** - Pentru analiză
4. **Scripturi helper** - Pentru deployment și testing
5. **VM link** (opțional) - Mediu pre-configurat

### Postare pe Google Classroom - Template:

```markdown
📚 **Lab 4: The DeFi Heist - Blockchain Security & Smart Contracts**

🎯 **Obiectiv**: Învățarea vulnerabilităților smart contracts prin scenarii practice

📅 **Deadline**: [Data] 23:59
📊 **Punctaj**: 100 puncte (10% din nota finală)

---

**🔗 Materiale:**

1. [GitHub Repository](link-to-repo)
2. [VM Download](link-to-vm) (Opțional - 8 GB)
3. [Video Tutorial Setup](link-to-video) (Opțional)

**📋 Livrabile:**

Upload pe Classroom următoarele fișiere:

- `challenge1-solution.md` - Investigația blockchain forensics
- `challenge2-report.md` - Analiza și exploitul reentrancy
- `MyVaultAttacker.sol` - Contractul de attack (Challenge 2)
- `challenge3-investigation.md` - Private key discovery + access control

**BONUS (+10p)**: Raport de securitate complet cu recomandări pentru toate vulnerabilitățile.

---

**⚠️ ATENȚIE:**

- Lucrați DOAR pe rețeaua locală (Ganache)
- NU atacați contracte reale pe mainnet/testnets
- Tehnicile sunt exclusiv pentru scopuri educaționale

**❓ Întrebări?**

- Office Hours: Joi 16:00-18:00 (programare la: lcretu@bitdefender.com)
- Q&A Thread pe Classroom
- Discord: [link] (dacă există)

---

**Succes! 🚀**
```

---

## 🆘 Suport Tehnic pe Parcurs

### Probleme Comune și Soluții

#### 1. "Cannot connect to Ganache"

**Cauză**: Ganache nu rulează sau portul e blocat

**Soluție**:
```bash
# Verifică dacă rulează
ps aux | grep ganache

# Kill și restart
pkill -f ganache
./start-ganache.sh
```

#### 2. "Error: Nonce too high" în MetaMask

**Cauză**: MetaMask e desincronizat după restart Ganache

**Soluție**: Reset Account în MetaMask → Settings → Advanced → Reset Account

#### 3. "Out of Gas" în Challenge 2

**Cauză**: Recursivitatea consumă prea mult gas

**Soluție**: Limitează numărul de reentrancy calls în contract:
```solidity
uint256 public maxAttacks = 3; // Start mic
```

#### 4. "Cannot find private key" în Challenge 3

**Hint-uri (fără a da răspunsul direct)**:
- "Ai verificat fișierele backup?"
- "Ce fișiere ascunse există? (ls -la)"
- "Bash history poate conține comenzi cu chei exportate"

#### 5. Node.js version issues

**Soluție**: Folosiți Node 16+ (recomandat 18 LTS)
```bash
nvm install 18
nvm use 18
```

---

## 📊 Evaluare și Notare

### Grila de Notare

### Corectare Semi-Automată (Nou)

Poți genera un raport de punctaj automat pentru fiecare student:

```bash
npm run grade:submission -- \
  --student-id student1@stud.ase.ro \
  --submission-dir ./submissions/student1
```

Rezultatul este salvat implicit în:
- `instructor/grading/<student_id_slug>.json`

Opțiuni utile:

```bash
# Fără rularea exploit-check runtime (doar analiză fișiere)
npm run grade:submission -- \
  --student-id student1@stud.ase.ro \
  --submission-dir ./submissions/student1 \
  --no-exploit-check

# Output custom
npm run grade:submission -- \
  --student-id student1@stud.ase.ro \
  --submission-dir ./submissions/student1 \
  --out ./reports/student1.json
```

Notă: scoring-ul este semi-automat, recomandat să faci și o verificare manuală rapidă.

#### Challenge 1: Blockchain Forensics (20p)

| Criteriu | Puncte | Detalii |
|----------|--------|---------|
| Identificare lanț complet | 5p | Toate adresele intermediare documentate |
| Adresa finală corectă | 3p | Destinația finală identificată |
| Calcul gas fees corect | 2p | Total fees calculat precis |
| Extragere mesaj hex | 5p | Hex data extras complet |
| Decodare mesaj | 5p | Text decodat corect |

**Total Challenge 1**: 20p

#### Challenge 2: Reentrancy Attack (40p)

| Criteriu | Puncte | Detalii |
|----------|--------|---------|
| Identificare vulnerabilitate | 8p | Explicație clară a bug-ului |
| Explicare pattern | 7p | Checks-Effects-Interactions |
| Contract compilează | 5p | Fără erori de sintaxă |
| Contract deployed | 5p | Deployment reușit pe Ganache |
| Exploit funcționează | 10p | Fură minimum 50% din vault |
| Documentație | 5p | Raport complet și clar |

**BONUS**: +5p pentru drenare 100% a vault-ului

**Total Challenge 2**: 40p (+5p bonus)

#### Challenge 3: Access Control & Private Keys (40p)

| Criteriu | Puncte | Detalii |
|----------|--------|---------|
| Găsire private key | 10p | Identifică locația și extrage cheia |
| Validare și import | 5p | Importă în MetaMask/script |
| Identificare bug Access Control | 8p | Explică proposeAdmin() vulnerability |
| Proof of Concept | 7p | Test sau script demonstrativ |
| Exploit reușit | 7p | Devine admin și drenează |
| Documentație | 3p | Raport complet |

**BONUS**: +5p pentru propunere de remediere securizată

**Total Challenge 3**: 40p (+5p bonus)

---

### Grila Finală

| Total Puncte | Notă |
|--------------|------|
| 95-110 | 10 |
| 85-94 | 9 |
| 75-84 | 8 |
| 65-74 | 7 |
| 55-64 | 6 |
| 45-54 | 5 |
| < 45 | Sub 5 |

**Note**:
- Punctele bonus pot depăși 100, dar nota max rămâne 10
- Plagiatul = 0 puncte (folosiți diff tools pentru verificare)

---

## 🔐 Răspunsuri și Soluții

### Challenge 1: Blockchain Forensics

**Răspuns**: Mesajul decodat ar trebui să fie ceva de genul:
```
"The next target is DeFi Protocol X. Follow the money to 0x..."
```

**Setup**: Tranzacțiile sunt generate în `scripts/setup-challenge1.js`

### Challenge 2: Reentrancy Attack

**Soluție completă**: Vezi `contracts/VaultAttacker.sol` (versiunea completă, nu template-ul)

**Key points**:
- Receive function apelează din nou `withdraw()`
- Pattern-ul vulnerabil: external call ÎNAINTE de state update
- Soluție: Checks-Effects-Interactions sau ReentrancyGuard

### Challenge 3: Access Control

**Private Key Locations**:
1. `.env.backup` - creat de scriptul de deploy
2. `.bash_history_fake` - simulat
3. `.secret_config.json` - hidden config

**Access Control Bug**:
```solidity
// VULNERABIL
function proposeAdmin(address _newAdmin) public {
    pendingAdmin = _newAdmin; // ❌ Lipsește require(msg.sender == admin)
}
```

**Exploit**:
```javascript
// Oricine poate:
await vault.proposeAdmin(attacker.address);
await vault.acceptAdmin();
await vault.emergencyWithdraw();
```

---

## ❓ Întrebări Frecvente

### Q: Cât timp trebuie să aloce studenții?

**A**: 3-4 ore total:
- Challenge 1: 30-45 min
- Challenge 2: 90-120 min (cel mai complex)
- Challenge 3: 60-90 min

### Q: Pot lucra în echipe?

**A**: Recomandat max 2 studenți/echipă. Mai mult de 2 → diffuzează responsabilitatea.

### Q: Ce fac dacă un student nu poate instala VM-ul?

**A**: Opțiuni:
1. Setup manual (ghid în `vm-setup/README.md`)
2. Cloud VM (AWS/Azure/GCP free tier)
3. Remote Desktop către un server comun (dacă ai resurse)
4. Pair programming cu un coleg care are VM functional

### Q: Cum verific plagiatul?

**A**: 
1. Verifică unicitatea implementării contractului de attack
2. Compară rapoartele (diff tools)
3. Întrebări orale în office hours
4. Logica diferă între soluții chiar dacă rezultatul e același

### Q: Student a găsit o vulnerabilitate nouă în contracte?

**A**: Excelent! Puncte bonus și posibil subieect de prezentare.

### Q: VM-ul nu pornește pe Mac cu M1/M2?

**A**: Folosiți UTM în loc de VirtualBox, sau setup manual pe macOS direct.

---

## 📚 Resurse Adiționale pentru Instructor

### Video Tutorials (pentru studenți)

Creează video-uri scurte (5-10 min fiecare):
1. **Setup Guide** - Cum se importă VM-ul și se pornește Ganache
2. **Hardhat Basics** - Compile, deploy, interact
3. **MetaMask Setup** - Configurare pentru localhost
4. **Remix IDE** - Alternative pentru edit & deploy

### Sesiuni Live Coding (Opțional)

Săptămâna 1:
- **Luni**: Introducere în Solidity și Hardhat (1h)
- **Miercuri**: Demonstrație Reentrancy Attack (30 min)
- **Joi**: Office Hours Q&A (2h)

### Extensii pentru Studenți Avansați

După finalizarea lab-ului, propune:
1. **Challenge 4**: Flash Loan Attack
2. **Challenge 5**: Price Oracle Manipulation
3. **Challenge 6**: Scrie un audit report profesional

---

## 📞 Contact Support

**Pentru probleme tehnice cu lab-ul:**
- Email: lcretu@bitdefender.com
- Office Hours: Joi 16:00-18:00

**Pentru sugestii de îmbunătățire:**
- GitHub Issues: [link-to-repo]/issues
- Pull Requests welcome!

---

**Succes în predarea acestui laborator! 🎓**

*Last updated: February 2026*
