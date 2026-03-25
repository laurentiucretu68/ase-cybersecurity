# THEORY.md - Docker, Oracle si SQL Injection

## 1. Imaginea de ansamblu

Acest laborator combina trei idei:

1. **Docker** - baza de date ruleaza izolat intr-un container;
2. **Oracle Database** - stocarea datelor despre meci, echipe si rapoarte;
3. **SQL Injection** - o vulnerabilitate aparuta atunci cand inputul utilizatorului este concatenat direct intr-un query SQL.

Aplicatia are o interfata web simpla. Formularul de cautare trimite date catre backend, iar backend-ul interogheaza baza Oracle.

In acest laborator, scenariul este **individual**: dupa ce primesti numarul tau de student `N`, rulezi scriptul de initializare, iar:
- valorile sensibile sunt generate specific pentru acel `N`;
- profilul de challenge este ales specific pentru acel `N`;
- lista exacta de campuri pe care trebuie sa le extragi poate diferi de la un student la altul.

Profilurile raman la acelasi nivel de dificultate: difera obiectivele (ce campuri trebuie extrase), nu dificultatea tehnica a exploit-ului.

---

## 1.1 Fluxul laboratorului

Laboratorul trebuie parcurs in ordinea urmatoare:

1. pornesti baza de date Oracle in Docker;
2. generezi instanta studentului pe baza lui `N`;
3. rulezi aplicatia web vulnerabila;
4. exploatezi SQL injection-ul si extragi datele interne;
5. repari functia vulnerabila din `app.py`;
6. rulezi din nou acelasi payload si verifici ca nu mai functioneaza.

Partea de remediere este obligatorie. Nu este suficient sa gasesti datele.

---

## 2. Rolul lui Docker in laborator

In acest lab, Docker este folosit doar pentru gazduirea bazei de date.

Avantaje:
- mediul este reproductibil;
- nu trebuie sa instalezi Oracle direct pe host;
- poti reseta usor baza de date;
- poti porni si opri serviciul fara sa afectezi restul sistemului.

Comenzi utile:

```bash
docker compose up -d db
docker compose down -v
```

Interpretare rapida:
- `up -d` porneste containerul in fundal;
- `down -v` opreste containerul si sterge volumele;

---

## 3. Ce stocheaza baza de date

Schema laboratorului este mica si are patru tabele principale:

- `teams`
- `matches`
- `players`
- `scouting_reports`

Relatiile de baza:

- o echipa are mai multi jucatori;
- un meci are doua echipe;
- un meci poate avea mai multe rapoarte;
- unele rapoarte sunt publice, altele interne.

---

## 4. Comenzi SQL esentiale

### 4.1 `SELECT`

`SELECT` este comanda folosita pentru a citi date.

Exemplu:

```sql
SELECT team_name, fifa_code
FROM teams;
```

### 4.2 `WHERE`

`WHERE` filtreaza randurile.

```sql
SELECT player_name, position
FROM players
WHERE team_id = 1;
```

### 4.3 `ORDER BY`

`ORDER BY` sorteaza rezultatele.

```sql
SELECT player_name, shirt_number
FROM players
WHERE team_id = 1
ORDER BY shirt_number;
```

### 4.4 `JOIN`

`JOIN` combina date din mai multe tabele.

```sql
SELECT p.player_name, t.team_name, p.position
FROM players p
JOIN teams t ON t.team_id = p.team_id
ORDER BY t.team_name, p.player_name;
```

### 4.5 `GROUP BY`

`GROUP BY` grupeaza randurile dupa una sau mai multe coloane.

```sql
SELECT t.team_name, COUNT(*) AS total_players
FROM players p
JOIN teams t ON t.team_id = p.team_id
GROUP BY t.team_name;
```

### 4.6 `COUNT`

`COUNT(*)` numara randurile.

```sql
SELECT COUNT(*) AS total_reports
FROM scouting_reports
WHERE visibility = 'public';
```

### 4.7 `INSERT`

`INSERT` adauga date.

```sql
INSERT INTO scouting_reports (
  report_id,
  match_id,
  visibility,
  report_title,
  report_text,
  access_code
) VALUES (
  999,
  301,
  'public',
  'Sample note',
  'Temporary report',
  'TEMP-CODE'
);
```

### 4.8 `UPDATE`

`UPDATE` modifica date existente.

```sql
UPDATE scouting_reports
SET visibility = 'internal'
WHERE report_id = 999;
```

### 4.9 `DELETE`

`DELETE` sterge randuri.

```sql
DELETE FROM scouting_reports
WHERE report_id = 999;
```

### 4.10 Exercitii de acomodare cu SQL

Daca nu ai mai lucrat cu SQL, incepe cu exercitiile de mai jos inainte sa treci la SQL injection.

Reguli pentru exercitiile de acomodare:
- foloseste doar `SELECT`;
- nu modifica datele din baza;
- nu folosi aceste exercitii pentru a completa livrabilul challenge-ului;
- incearca sa scrii singur query-ul inainte sa te uiti la hint.

#### Exercitiul 1 - Lista echipelor

Cerință: afiseaza numele echipelor si codurile lor FIFA.
Hint: tabela potrivita este `teams`.

#### Exercitiul 2 - Jucatorii Romaniei

Cerință:
- afiseaza numele, pozitia si numarul de tricou pentru jucatorii Romaniei;
- sorteaza rezultatele dupa numarul de tricou.

Hint: ai nevoie de `players`, `teams`, `JOIN`, `WHERE` si `ORDER BY`.

#### Exercitiul 3 - Toti jucatorii cu echipa lor

Cerință:
- afiseaza fiecare jucator impreuna cu echipa lui;
- sorteaza rezultatele dupa echipa si apoi dupa numele jucatorului.

Hint: combina `players` cu `teams`.

#### Exercitiul 4 - Cati jucatori are fiecare echipa

Cerință: numara cati jucatori apartin fiecarei echipe.

Hint: ai nevoie de `COUNT(*)` si `GROUP BY`.

#### Exercitiul 5 - Jucatorii cu tricoul 10

Cerință:
- afiseaza jucatorii care au numarul de tricou 10;
- afiseaza si echipa din care fac parte.

Hint: filtreaza dupa `shirt_number = 10`.

#### Exercitiul 6 - Primele 5 rezultate alfabetice

Cerință: afiseaza primii 5 jucatori in ordine alfabetica.

Hint: foloseste `ORDER BY player_name` si `FETCH FIRST 5 ROWS ONLY`.

#### Exercitiul 7 - Rapoarte publice

Cerință: afiseaza titlul si textul rapoartelor publice.

Hint: foloseste tabela `scouting_reports` si filtreaza dupa `visibility = 'public'`.

#### Exercitiul 8 - Cate rapoarte exista pe fiecare tip de vizibilitate

Cerință: afiseaza cate rapoarte sunt `public` si cate sunt `internal`.

Hint: combina `COUNT(*)` cu `GROUP BY visibility`.

---

## 5. Elemente Oracle utile in acest laborator

### 5.1 Tipuri de date

Cele mai folosite tipuri in schema:

- `NUMBER`
- `VARCHAR2`

### 5.2 Concatenarea sirurilor

In Oracle, concatenarea se face cu `||`.

```sql
SELECT home.team_name || ' vs ' || away.team_name AS match_label
FROM matches m
JOIN teams home ON home.team_id = m.home_team_id
JOIN teams away ON away.team_id = m.away_team_id;
```

### 5.3 Conversia la text

Cand vrei sa combini valori numerice cu siruri sau sa le afisezi ca text, folosesti `TO_CHAR`.

```sql
SELECT player_name, TO_CHAR(shirt_number) AS shirt_label
FROM players;
```

### 5.4 Limitarea rezultatelor

Oracle modern suporta:

```sql
SELECT report_title
FROM scouting_reports
FETCH FIRST 2 ROWS ONLY;
```

### 5.5 Tabela `DUAL`

Oracle foloseste frecvent tabela virtuala `DUAL` pentru expresii simple.

```sql
SELECT 'Oracle is running' AS status_message
FROM dual;
```

---

## 6. De unde apare vulnerabilitatea

Vulnerabilitatea apare cand inputul utilizatorului este lipit direct in textul query-ului.

Exemplu vulnerabil:

```python
search = request.args.get("q", "%")

sql = f"""
SELECT p.player_name, t.team_name, p.position
FROM players p
JOIN teams t ON t.team_id = p.team_id
WHERE t.team_name = '{team}'
  AND p.player_name LIKE '{search}'
ORDER BY 1
"""
```

Problema:
- backend-ul presupune ca `search` contine doar text normal;
- SQL-ul rezultat este controlat partial de utilizator;
- daca inputul inchide sirul dintre apostrofuri, utilizatorul poate schimba logica query-ului.

---

## 7. Ce este SQL Injection

**SQL Injection** este o vulnerabilitate prin care utilizatorul modifica structura unui query SQL prin input nesanitizat.

Impact posibil:
- citirea unor date care nu ar trebui sa fie vizibile;
- bypass al filtrelor;
- modificarea sau stergerea datelor;
- compromiterea contului folosit de aplicatie in DB.

---

## 8. Tipuri de payload-uri

### 8.1 Tautology / Boolean-based

Ideea: conditia din `WHERE` este fortata sa fie mereu adevarata.

Exemplu generic:

```text
' OR '1'='1
```

Rezultatul este un query care intoarce mai multe randuri decat ar trebui.

Daca apar rezultate neasteptate, vulnerabilitatea este confirmata. Totusi, pentru challenge foloseste payload-uri mai avansate de tip `UNION SELECT`.

### 8.2 Union-based

Ideea: atacatorul combina rezultatul query-ului original cu rezultatul altui `SELECT`.

Forma generica:

```text
' UNION SELECT col1, col2, col3 FROM alta_tabela --
```

Atentie:
- numarul de coloane trebuie sa fie compatibil;
- tipurile de date trebuie sa poata fi afisate impreuna;
- comentariul `--` este folosit ca sa ignore restul query-ului.

In laboratorul acesta, formularul afiseaza 4 coloane in tabel, deci si `UNION SELECT` trebuie sa proiecteze 4 coloane.

### 8.3 De ce conteaza `--`

In multe query-uri vulnerabile, dupa input mai exista SQL legitim:

```sql
... LIKE '<input>'
ORDER BY 1
```

Daca injectia nu comenteaza restul liniei, query-ul rezultat poate deveni invalid.

---

## 9. Mitigarea corecta: bind variables

Varianta sigura nu concateneaza inputul in query.

Exemplu:

```python
sql = """
SELECT p.player_name, t.team_name, p.position, TO_CHAR(p.shirt_number)
FROM players p
JOIN teams t ON t.team_id = p.team_id
WHERE t.team_name = :team
  AND p.player_name LIKE :search
ORDER BY 1
"""

cursor.execute(sql, {"team": team, "search": search})
```

De ce este mai sigur:
- parametrii sunt tratati ca date, nu ca instructiuni SQL;
- motorul Oracle parseaza query-ul separat de valori;
- apostroful introdus de utilizator nu mai inchide manual siruri in SQL.

### 9.1 Fix-ul cerut in laborator

In `app.py`, functia `run_player_search` porneste intr-o forma vulnerabila.

Ce trebuie sa faci:
- pastrezi aceeasi logica functionala a cautarii;
- inlocuiesti interpolarea directa a lui `team` si `search` cu placeholder-e Oracle;
- rulezi `cursor.execute(..., {"team": ..., "search": ...})`.

### 9.2 Cum verifici ca fix-ul este corect

Dupa modificare:
- repornesti aplicatia;
- reiei exact payload-ul cu care ai extras date interne;
- verifici ca acele date nu mai apar in tabel;
- verifici ca SQL-ul din UI afiseaza `:team` si `:search`;
- verifici ca badge-ul din interfata devine `secure`.

---

## 10. Exemple de query-uri utile pe schema laboratorului

### Lista tuturor jucatorilor Romaniei

```sql
SELECT p.player_name, p.position, p.shirt_number
FROM players p
JOIN teams t ON t.team_id = p.team_id
WHERE t.team_name = 'Romania'
ORDER BY p.shirt_number;
```

### Lista rapoartelor publice

```sql
SELECT report_title, report_text
FROM scouting_reports
WHERE visibility = 'public'
ORDER BY report_id;
```

### Match label complet

```sql
SELECT m.match_id,
       home.team_name || ' vs ' || away.team_name AS match_label,
       m.venue
FROM matches m
JOIN teams home ON home.team_id = m.home_team_id
JOIN teams away ON away.team_id = m.away_team_id;
```