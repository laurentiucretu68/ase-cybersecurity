# 🖥️ Ghid Rapid: Creare VM cu Setup Automat

Acest ghid te va ajuta să creezi o mașină virtuală Ubuntu și să o configurezi **automat** pentru laboratorul DeFi Heist folosind scriptul `setup-vm.sh`.

---

## 📋 Ce vei avea la final

✅ VM Ubuntu 22.04 complet configurată  
✅ Node.js, Ganache, VS Code instalate  
✅ Repo clonat și dependențe instalate  
✅ Desktop shortcuts pentru început rapid  
✅ User `student` creat (opțional)  
✅ Gata de folosit pentru lab (după `npm run init:student`)

**Timp total**: ~45 minute (30 min install Ubuntu + 15 min setup automat)

---

## 🚀 Pași Rapizi

### 1. Instalează VirtualBox

**Windows/Mac/Linux**:
- Download: https://www.virtualbox.org/wiki/Downloads
- Instalează VirtualBox + Extension Pack

### 2. Descarcă Ubuntu 22.04 LTS

- Download ISO: https://ubuntu.com/download/desktop
- Versiune: Ubuntu 22.04.x LTS Desktop
- Dimensiune: ~4.7 GB

### 3. Creează VM în VirtualBox

#### a) Click "New" în VirtualBox

**Setări recomandate**:
```
Name: DeFi-Heist-Lab
Type: Linux
Version: Ubuntu (64-bit)

Memory: 4096 MB (4 GB) - minimum
        8192 MB (8 GB) - recomandat

Hard Disk: Create a virtual hard disk now
  - VDI (VirtualBox Disk Image)
  - Dynamically allocated
  - 25 GB (minimum)
```

#### b) Configurare Avansată (Optional dar recomandat)

Settings → System:
- **Processor**: 2 CPUs (sau mai multe)
- **Enable PAE/NX**: ✅

Settings → Display:
- **Video Memory**: 128 MB
- **Graphics Controller**: VMSVGA

Settings → Network:
- **Adapter 1**: NAT (default)

### 4. Instalează Ubuntu în VM

#### a) Start VM și selectează ISO-ul Ubuntu
- First run → Select Ubuntu ISO
- Start

#### b) Instalare Ubuntu (15-20 min)
```
Language: English (sau Romanian)
Installation Type: Normal installation
✅ Download updates while installing
✅ Install third-party software

Installation type: Erase disk and install Ubuntu
  (Nu-ți face griji, e doar VM-ul!)

Username: admin (sau ce vrei tu)
Password: [alege o parolă]
Computer name: defi-heist-lab
```

#### c) După instalare
- Reboot
- Login
- Remove installation media (VM → Devices → Optical Drives → Remove)

### 5. Rulează Scriptul de Setup Automat 🎯

#### a) Deschide Terminal în Ubuntu
```
Ctrl + Alt + T
```

#### b) Descarcă scriptul

**Opțiunea 1 - Din GitHub** (după ce faci push):
```bash
wget https://raw.githubusercontent.com/[USERNAME]/ase-cybersecurity/main/2026/lab4-blockchain-defi/vm-setup/setup-vm.sh
chmod +x setup-vm.sh
```

**Opțiunea 2 - Manual** (pentru acum):
1. Deschide Firefox în VM
2. Navighează la repo-ul tău GitHub
3. Deschide `vm-setup/setup-vm.sh`
4. Click "Raw"
5. Ctrl+S → Save as `setup-vm.sh` în Home
6. În terminal:
   ```bash
   chmod +x ~/setup-vm.sh
   ```

**Opțiunea 3 - Cu Git** (mai rapid):
```bash
# Instalează git dacă nu e instalat
sudo apt update
sudo apt install -y git

# Clone repo-ul
git clone https://github.com/[USERNAME]/ase-cybersecurity.git

# Rulează scriptul
cd ase-cybersecurity/2026/lab4-blockchain-defi/vm-setup
chmod +x setup-vm.sh
```

#### c) Rulează scriptul
```bash
./setup-vm.sh
```

**⏰ Durată**: 15-20 minute (depinde de internet)

**Ce face scriptul automat**:
1. ✅ Update sistem Ubuntu
2. ✅ Instalează Node.js 18 LTS
3. ✅ Instalează Ganache CLI
4. ✅ Instalează VS Code + extensii Solidity
5. ✅ Instalează Firefox
6. ✅ Clonează repo-ul laboratorului
7. ✅ Instalează toate dependențele npm
8. ✅ Creează desktop shortcuts
9. ✅ Creează user `student` (dacă alegi)
10. ✅ Verifică setup-ul
11. ✅ Cleanup

#### d) Verifică instalarea
După ce scriptul termină:
```bash
cd ~/lab4-blockchain-defi
npm run verify-setup
```

Ar trebui să vezi ✅ pentru toate componentele!

### 6. Instalează MetaMask (Manual)

În Firefox din VM:
1. Navighează la: https://addons.mozilla.org/firefox/addon/ether-metamask/
2. Click "Add to Firefox"
3. Configurare:
   - Create wallet sau Import wallet
   - Configurează pentru localhost:7545 (vezi vm-setup/README.md)

### 7. Test Rapid

```bash
cd ~/lab4-blockchain-defi

# Generează instanța unică
npm run init:student -- --student-id <email_ase_sau_matricol>

# Start Ganache
./start-ganache.sh
# (lasă acest terminal deschis)

# În alt terminal:
npm run deploy:all

# Verifică că merge
npm test
```

Dacă totul e ✅, VM-ul e gata!

---

## 📦 Exportare VM pentru Distribuție

După ce totul funcționează:

### 1. Cleanup Final

```bash
# Șterge history
history -c
rm ~/.bash_history

# Șterge cache
sudo apt clean
sudo apt autoremove -y

# Zero out free space (reduce dimensiune OVA)
sudo dd if=/dev/zero of=/EMPTY bs=1M || true
sudo rm -f /EMPTY

# Shutdown
sudo shutdown -h now
```

### 2. Export ca OVA

În VirtualBox (cu VM oprită):

```
File → Export Appliance
→ Select: DeFi-Heist-Lab
→ Format: OVF 2.0
→ Include ISO images: No
→ Export
```

**Dimensiune finală**: ~6-8 GB

### 3. Upload OVA

Upload pe:
- Google Drive (recomandat pentru studenți ASE)
- OneDrive
- Dropbox
- File sharing universitar

### 4. Distribuie Link

Adaugă link-ul în:
- `README.md` principal
- `GETTING_STARTED.md`
- Google Classroom
- Email studenți

---

## 🎯 Instrucțiuni pentru Studenți

După ce le distribui OVA-ul:

### Import OVA în VirtualBox

```
1. Descarcă fișierul .ova (~7 GB)
2. Deschide VirtualBox
3. File → Import Appliance
4. Select .ova file
5. Click "Import"
6. Așteaptă 5-10 minute
7. Start VM
```

### Login

```
Username: student
Password: cybersec2026
```

### Start Lab

Desktop are 3 shortcuts:
1. **Start-Ganache** - Pornește blockchain-ul
2. **Open-Lab** - Deschide VS Code cu lab-ul
3. **Lab-Instructions** - Deschide instrucțiunile

Sau manual:
```bash
cd ~/lab4-blockchain-defi
npm run init:student -- --student-id <email_ase_sau_matricol>
./start-ganache.sh        # Terminal 1
npm run deploy:all        # Terminal 2
code .                    # Deschide VS Code
```

---

## 🔧 Troubleshooting

### Problema: Script dă erori la npm install

**Soluție**:
```bash
cd ~/lab4-blockchain-defi
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problema: Ganache nu pornește

**Soluție**:
```bash
# Verifică dacă e instalat
ganache --version

# Reinstalează
sudo npm install -g ganache

# Test
ganache --version
```

### Problema: VS Code extensions nu se instalează

**Soluție**:
```bash
code --install-extension JuanBlanco.solidity --force
code --install-extension NomicFoundation.hardhat-solidity --force
```

### Problema: VM e foarte lentă

**Soluții**:
1. Crește RAM: Settings → System → Base Memory → 6-8 GB
2. Crește CPU: Settings → System → Processor → 2-4 CPUs
3. Activează 3D acceleration: Settings → Display → Enable 3D Acceleration

### Problema: "Cannot connect to internet" în VM

**Soluție**:
1. Settings → Network → Adapter 1 → NAT
2. Sau: Bridged Adapter (dacă NAT nu merge)

---

## 📊 Specificații Finale VM

După setup automat:

| Component | Detalii |
|-----------|---------|
| **OS** | Ubuntu 22.04 LTS Desktop |
| **RAM** | 4-8 GB |
| **Storage** | ~15 GB used / 25 GB total |
| **Node.js** | v18.x LTS |
| **NPM** | v9.x |
| **Ganache** | v7.7.0+ |
| **VS Code** | Latest + Solidity extensions |
| **Firefox** | Latest + MetaMask ready |
| **Lab** | Fully configured and tested |

---

## ⏱️ Timeline Estimat

| Pas | Timp |
|-----|------|
| Download Ubuntu ISO | 10 min |
| Creare VM în VirtualBox | 2 min |
| Instalare Ubuntu | 15-20 min |
| Setup automat (script) | 15-20 min |
| MetaMask install manual | 2 min |
| Test final | 5 min |
| **TOTAL** | **~45-60 min** |

---

## ✅ Checklist Final

Înainte de distribuție, verifică:

- [ ] Ubuntu se bootează OK
- [ ] Login funcționează (user student)
- [ ] Desktop shortcuts sunt pe desktop
- [ ] Instanța student se poate genera: `npm run init:student -- --student-id <id>`
- [ ] Ganache pornește: `./start-ganache.sh`
- [ ] Contractele se deployează: `npm run deploy:all`
- [ ] VS Code se deschide cu lab-ul
- [ ] Firefox e instalat
- [ ] MetaMask e instalat în Firefox
- [ ] Tests pass: `npm test`
- [ ] Cleanup făcut (history, cache)
- [ ] OVA exportat
- [ ] OVA testat pe alt computer

---

## 🎉 Gata!

Acum ai:
✅ VM funcțional configurat automat  
✅ Script reutilizabil pentru actualizări  
✅ Ghid pentru distribuire către studenți  

**Următorii pași**:
1. Testează VM-ul local
2. Exportă ca OVA
3. Upload pe cloud
4. Distribuie link studenților
5. Enjoy! 🚀

---

## 📞 Support

**Probleme cu scriptul?**
- Email: lcretu@bitdefender.com
- GitHub Issues: [link-to-repo]/issues

**Script location**: `vm-setup/setup-vm.sh`  
**Documentation**: `vm-setup/README.md`

---

**Creat pentru studenții ASE - Februarie 2026**  
**Liviu Cretu - Bitdefender**
