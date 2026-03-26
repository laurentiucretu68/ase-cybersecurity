# Lab 3: Matchday Leak - Docker, Oracle & SQL Injection

> Rol: esti security analyst pentru o aplicatie interna de scouting construita in graba pentru meciul `Turcia - Romania`. Baza de date ruleaza in Docker, iar interfata web expune un flux vulnerabil la SQL injection.

## Obiective

La finalul laboratorului vei sti:
- cum sa pornesti o baza Oracle intr-un container Docker;
- cum sa inspectezi structura unei baze de date relationale simple;
- cum sa identifici si exploatezi controlat o vulnerabilitate SQL injection intr-o aplicatie web;
- cum sa explici de ce bind variables si least privilege reduc impactul vulnerabilitatii.

## Resurse

- [THEORY.md](THEORY.md) - comenzi SQL de baza, Docker, Oracle si explicatia vulnerabilitatii

---

## Cerinte

- Docker + Docker Compose Plugin
- Python `3.11+`
- browser web

### Instalare Docker

Instaleaza Docker folosind documentatia oficiala, in functie de sistemul tau de operare:
- macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
- Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- Linux: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose Plugin](https://docs.docker.com/compose/install/)

Recomandare practica:
- pe macOS si Windows, cea mai simpla varianta este Docker Desktop; acesta include deja si `docker compose`;
- pe Linux, poti instala fie Docker Desktop, fie Docker Engine + Compose Plugin;
- daca esti pe Linux si vrei sa rulezi comenzile din laborator fara `sudo`, adauga utilizatorul tau in grupul `docker`.

Dupa instalare, verifica:

```bash
docker --version
docker compose version
```

### Instalare Python

Instaleaza Python `3.11` sau mai nou din sursa oficiala:
- pagina principala de download: [python.org/downloads](https://www.python.org/downloads/)
- Windows: [Using Python on Windows](https://docs.python.org/3/using/windows.html)
- macOS: [Using Python on macOS](https://docs.python.org/3/using/mac.html)

Recomandare practica:
- daca folosesti installer-ul oficial pe Windows, asigura-te ca Python este disponibil in `PATH`;
- pe Linux, poti instala Python si din managerul de pachete al distributiei, dar verifica sa ai cel putin versiunea `3.11`.

Dupa instalare, verifica:

```bash
python3 --version
pip3 --version
```

Nota pentru Windows:
- daca `python3` nu este disponibil, foloseste `py`;
- activarea mediului virtual se face cu `.venv\Scripts\activate`.

Important:
- baza de date este gazduita in Docker;
- backend-ul si interfata web ruleaza local, pe host;
- cerintele sunt individuale: datele sensibile se genereaza pe baza numarului tau de student `N`.

---

## Setup

### 1. Porneste baza Oracle in Docker

```bash
cd ~/ase-cybersecurity/2026/lab3
docker compose up -d db
```

Asteapta pana cand containerul este pornit complet, apoi opreste urmarirea logurilor cu `Ctrl+C`.

### 2. Genereaza instanta individuala pe baza numarului `N`

```bash
python3 scripts/init_student.py --student-number <1-100>
```

Scriptul:
- genereaza date unice pentru studentul tau;
- scrie `student/generated/student-seed.sql`;
- scrie `student/generated/student-db-credentials.sql` cu parola DB specifica studentului;
- creeaza `student/instance.json`;
- alege un `challenge profile` pe baza lui `N`;
- pregateste `student/submissions/lab3-results.json` cu exact campurile cerute pentru profilul tau.

Pentru a regenera instanta pentru acelasi `N`:

```bash
python3 scripts/init_student.py --student-number <1-100> --force
```

### 3. Initializeaza schema laboratorului

```bash
docker compose exec -T db bash -lc "sqlplus -s / as sysdba @/workspace/db/bootstrap.sql"
```

Scriptul:
- creeaza userul aplicatiei `matchday`;
- creeaza tablespace-ul dedicat `matchday_data`;
- aplica parola DB specifica studentului din `student/generated/student-db-credentials.sql`;
- creeaza tabelele laboratorului;
- incarca datele de baza ale laboratorului;
- incarca datele individuale generate pentru studentul tau.

### 3.1. Inspectare optionala intr-un client SQL/GUI

Daca vrei sa inspectezi baza de date intr-un client precum `DBGate`, `DBeaver`, `DataGrip` sau alt GUI SQL, foloseste:
- `Host` / `Server`: `127.0.0.1`
- `Port`: `1521`
- `Connection type`: `Service name`
- `Service name`: `FREEPDB1`
- `User`: valoarea `dbCredentials.user` din `student/instance.json`
- `Password`: valoarea `dbCredentials.password` din `student/instance.json`

### 3.2. Exercitii de acomodare cu SQL

Daca nu ai mai lucrat cu SQL, rezerva 10-15 minute pentru exercitiile de acomodare din `THEORY.md`.

Recomandare:
- conecteaza-te ca `matchday` intr-un client SQL/GUI sau prin `sqlplus`;
- parcurge sectiunea `Exercitii de acomodare cu SQL` din `THEORY.md`;
- incepe cu `SELECT`, `WHERE`, `ORDER BY`, apoi treci la `JOIN`, `COUNT` si `GROUP BY`.

Important:
- exercitiile sunt de incalzire si folosesc doar date de baza sau publice;
- ele nu inlocuiesc exploatarea din interfata web;
- nu folosi SQL direct pentru a completa livrabilul challenge-ului.

### 4. Instaleaza dependintele backend-ului

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Ruleaza aplicatia web

```bash
python app.py
```

### 6. Dupa exploatare, repara query-ul vulnerabil

Dupa ce termini partea de exploatare:
- deschide `app.py`;
- gaseste functia `run_player_search`;
- inlocuieste concatenarea vulnerabila cu bind variables;
- ruleaza din nou `python app.py`;
- verifica in UI ca badge-ul `Query mode` devine `secure`.

---

## Scenariu

Aplicatia interna ofera:
- o pagina de matchday dashboard pentru meciul `Turcia - Romania`;
- o cautare de jucatori dupa echipa si nume;
- rapoarte publice afisate in UI;

Problema: backend-ul construieste nesigur query-ul folosit de formularul de cautare jucatori.

Pentru a face vulnerabilitatea mai usor de observat in laborator, parametrul de cautare ajunge direct in forma:

```sql
AND p.player_name LIKE '<input>'
```

Datele sensibile sunt generate individual pe baza numarului `N`, iar pe langa valori diferite, fiecare student primeste si un `challenge profile` care schimba lista exacta de campuri ce trebuie extrase.

Valorile sensibile extrase prin SQL injection sunt derivate din `instanceId`, astfel incat fiecare instanta de student are amprenta proprie in datele interne.

Important: profilele sunt calibrate la acelasi nivel de dificultate; se schimba obiectivele (campurile cerute), nu complexitatea tehnica a exploatarii.

Fiecare profil are si un tip dedicat de SQL injection (`challengeInjectionType`), generat automat in `instance.json` si in fisierul de submission.

Asta inseamna ca doi studenti pot avea:
- valori diferite pentru aceleasi campuri;
- sau chiar seturi diferite de campuri cerute.

Pe langa scenariul individual generat din `N`, baza include si date de context pentru alte echipe, meciuri si rapoarte, astfel incat seed-ul sa fie mai bogat si mai realist.

---

## Schema bazei de date

Laboratorul foloseste 4 tabele principale:

### 1. `teams`

Rol: stocheaza echipele din scenariu.

### 2. `matches`

Rol: stocheaza meciul demonstrativ asociat instantei studentului.

### 3. `players`

Rol: stocheaza loturile echipelor.

### 4. `scouting_reports`

Rol: stocheaza rapoarte publice si interne despre meci.

### Ce date nu ar trebui sa fie publice in interfata web

Nu ar trebui sa fie expuse direct in UI:
- randurile din `scouting_reports` care au `visibility = 'internal'`;
- `report_title` pentru rapoartele interne;
- `report_text` pentru rapoartele interne;
- `access_code`;
- valorile extrase din notele interne, de tip `FORMATION`, `KEY_PLAYER`, `REMARK`, `PRESSING`, `WATCHLIST`;

---

## Challenge

### Matchday Leak (100p)

Challenge-ul are doua parti.

#### Partea A - Exploatare (70p)

Folosind aplicatia web si cunostintele din `THEORY.md`, exploateaza SQL injection-ul si identifica datele cerute de profilul tau de challenge.

Hint-uri de lucru:
- daca vrei sa vezi in principal randurile injectate, foloseste un prefix care nu ar trebui sa potriveasca niciun jucator, de exemplu `NU_EXISTA%`;
- unele campuri nu sunt stocate in coloane separate, ci in `report_text`, sub forma `CHEIE=valoare`;
- cand ai extras un `report_text`, separa logic bucata relevanta dupa delimitatorul `|`.

Exemple de campuri care pot aparea, in functie de profil:
- `match_id`
- `internal_report_title`
- `access_code`
- `formation`
- `key_player`
- `remark`
- `pressing_window`
- `watchlist`
- `venue`
- `kickoff_label`

#### Partea B - Remediere (30p)

Dupa ce extragi datele:
1. modifica `app.py` astfel incat functia `run_player_search` sa foloseasca bind variables;
2. reporneste aplicatia;
3. ruleaza din nou payload-ul folosit la exploatare;
4. verifica faptul ca datele interne nu mai apar in rezultate;
5. verifica faptul ca interfata afiseaza `Query mode: secure`.

Hint-uri pentru fix:
- pastreaza acelasi `SELECT`, dar inlocuieste interpolarea stringurilor cu `:team` si `:search`;
- verificarea minima corecta este: acelasi payload nu mai afiseaza date interne, iar SQL-ul din UI contine placeholder-ele Oracle.

---

## Livrabil

Fisier de completat:

`student/submissions/lab3-results.json`

Template-ul contine:

```json
{
  "studentNumber": 5,
  "instanceId": "lab3-005-XXXXXXXX",
  "challengeProfile": "profile_x",
  "challengeInjectionType": "union_x",
  "usedPayload": "",
  "...campurile exacte generate pentru profilul tau...": "",
  "mitigationImplemented": false,
  "blockedPayloadAfterFix": ""
}
```

Campurile dintre `studentNumber` si `mitigationImplemented` difera in functie de profilul tau de challenge.

Campurile exacte pe profil sunt:
- `profile_a`: `match_id`, `internal_report_title`, `access_code`, `formation`, `key_player`
- `profile_b`: `match_id`, `internal_report_title`, `access_code`, `formation`, `remark`
- `profile_c`: `match_id`, `internal_report_title`, `access_code`, `pressing_window`, `watchlist`
- `profile_d`: `match_id`, `access_code`, `formation`, `key_player`, `remark`
- `profile_e`: `match_id`, `internal_report_title`, `formation`, `remark`, `pressing_window`
- `profile_f`: `match_id`, `access_code`, `key_player`, `pressing_window`, `watchlist`

Cum afli concret campurile tale:
- deschide `student/instance.json` si citeste lista `requiredFields`;
- daca ai nevoie de titlul fix al notei Turciei, il gasesti separat in `turkeyPressingReportTitle`;
- sau deschide direct `student/submissions/lab3-results.json`, care este deja pre-populat cu cheile exacte pentru profilul tau.

`blockedPayloadAfterFix` trebuie sa contina exact payload-ul pe care l-ai folosit la exploatare si pe care l-ai re-testat dupa fix.

## Observatii

- aplicatia foloseste in mod implicit varianta vulnerabila a query-ului;
- studentul trebuie sa modifice manual functia `run_player_search` pentru partea de remediere;