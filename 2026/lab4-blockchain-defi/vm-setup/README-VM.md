# VM Setup - DeFi Heist Lab

Acest director conține toate resursele pentru crearea și configurarea mașinii virtuale pentru laboratorul de Blockchain Security.

---

## 📁 Fișiere Disponibile

### 🤖 `setup-vm.sh` - Script Automat de Setup
**Script complet automat** care configurează un Ubuntu fresh install cu totul ce trebuie pentru lab.

**Cum se folosește**:
```bash
chmod +x setup-vm.sh
./setup-vm.sh
```

**Durată**: 15-20 minute  
**Necesită**: Ubuntu 22.04 LTS fresh install + internet

---

### 📘 `VM-QUICK-GUIDE.md` - Ghid Rapid Creare VM
**Ghid pas cu pas** pentru:
- Creare VM în VirtualBox
- Instalare Ubuntu
- Rulare script automat
- Export OVA pentru distribuție

**Start aici** dacă creezi VM-ul pentru prima dată!

---

### 📚 `README.md` - Setup Manual Detaliat
**Ghid comprehensiv** pentru instalare manuală (fără script automat).

Util dacă:
- Vrei control total asupra instalării
- Ai probleme cu scriptul automat
- Instalezi pe macOS/Windows nativ

---

## 🚀 Quick Start

### Pentru Instructor (Creare VM):

1. **Citește**: `VM-QUICK-GUIDE.md`
2. **Creează VM** în VirtualBox cu Ubuntu 22.04
3. **Rulează**: `./setup-vm.sh`
4. **Exportă** ca OVA
5. **Distribuie** către studenți

**Total timp**: ~45 minute

---

### Pentru Studenți (Setup Fără VM):

1. **Citește**: `README.md`
2. **Urmează pașii** de instalare manuală
3. **Verifică**: `npm run verify-setup`

**Total timp**: ~30 minute

---

## 🎯 Ce Metodă Să Aleg?

| Metodă | Pro | Contra | Recomandat pentru |
|--------|-----|--------|-------------------|
| **VM + Script Automat** | Rapid, sigur, izolat | Fișier mare (7GB), resurse VM | Instructor (distribuție) |
| **Setup Manual** | Flexibil, învățător | Mai lung, posibile erori | Studenți avansați |
| **VM Pre-configurat** | Zero setup | Download mare | Majoritatea studenților |

---

## 📊 Comparație Timp

| Task | VM + Script | Setup Manual |
|------|-------------|--------------|
| Creare VM | 20 min | - |
| Setup automat | 15 min | - |
| Instalare manuală | - | 30 min |
| **Total** | **35 min** | **30 min** |

**Avantaj VM**: Identical pentru toți studenții, zero debugging environment issues.

---

## ✅ Ce Face Scriptul Automat?

1. ✅ Update sistem Ubuntu
2. ✅ Instalează Node.js 18 LTS
3. ✅ Instalează Ganache CLI
4. ✅ Instalează VS Code + extensii Solidity
5. ✅ Instalează Firefox
6. ✅ Clonează repo-ul laboratorului
7. ✅ Instalează npm dependencies
8. ✅ Creează desktop shortcuts
9. ✅ Creează user `student` (opțional)
10. ✅ Verifică setup complet
11. ✅ Cleanup și optimizare

---

## 🔧 Troubleshooting

### Script dă eroare?

**Verifică**:
```bash
# Verifică conexiunea internet
ping google.com

# Verifică spațiu disk
df -h

# Verifică drepturi
ls -la setup-vm.sh
chmod +x setup-vm.sh
```

**Re-rulează**:
```bash
./setup-vm.sh
```

Scriptul e **idempotent** - poți să-l rulezi de mai multe ori fără probleme.

---

### VM e lentă?

**Crește resursele**:
- RAM: 6-8 GB (Settings → System → Base Memory)
- CPU: 3-4 cores (Settings → System → Processor)
- Video: 128 MB + 3D Acceleration (Settings → Display)

---

### Ganache nu pornește?

```bash
# Reinstalează
sudo npm install -g ganache

# Test
ganache --version

# Pornește manual
ganache --port 7545
```

---

## 📞 Support

**Probleme tehnice?**
- Email: lcretu@bitdefender.com
- GitHub Issues: [repo]/issues

**Documentație**:
- Setup automat: `VM-QUICK-GUIDE.md`
- Setup manual: `README.md`
- Instructor guide: `../INSTRUCTOR_GUIDE.md`

---

## 🎓 Pentru Studenți

**Ai primit VM-ul de la instructor?**

1. Import OVA în VirtualBox
2. Login: `student` / `cybersec2026`
3. Desktop shortcuts:
   - **Start-Ganache** - Pornește blockchain
   - **Open-Lab** - Deschide VS Code
   - **Lab-Instructions** - Citește ghidul
4. Start cu Challenge 1!

**Nu ai VM? Instalează manual**:
- Citește: `README.md`
- Urmează pașii pentru OS-ul tău

---

## 🌟 Features Script Automat

- ✅ **Color-coded output** - Vezi progresul clar
- ✅ **Error handling** - Oprește la prima eroare
- ✅ **Idempotent** - Poți rula de mai multe ori
- ✅ **Progress indicators** - Știi unde ești
- ✅ **Automatic cleanup** - Optimizează spațiu
- ✅ **Desktop shortcuts** - Start rapid
- ✅ **Verification** - Testează tot la final

---

**Succes la configurare! 🚀**

*Creat pentru studenții ASE - Februarie 2026*
