#!/usr/bin/env python3

import argparse
import hashlib
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
STUDENT_DIR = ROOT_DIR / "student"
GENERATED_DIR = STUDENT_DIR / "generated"
INSTANCE_JSON_PATH = STUDENT_DIR / "instance.json"
STUDENT_SEED_PATH = GENERATED_DIR / "student-seed.sql"
DB_CREDENTIALS_SQL_PATH = GENERATED_DIR / "student-db-credentials.sql"
SUBMISSION_PATH = STUDENT_DIR / "submissions" / "lab3-results.json"
TURKEY_PRESSING_REPORT_TITLE = "Fereastra de pressing a Turciei"

ROMANIAN_PLAYERS = [
    "Florin Nita",
    "Andrei Ratiu",
    "Radu Dragusin",
    "Andrei Burca",
    "Nicusor Bancu",
    "Razvan Marin",
    "Marius Marin",
    "Dennis Man",
    "Nicolae Stanciu",
    "Florinel Coman",
    "Denis Dragus",
]

FORMATIONS = [
    "4-2-3-1",
    "4-3-3",
    "4-1-4-1",
    "3-4-2-1",
    "3-5-2",
    "4-4-2",
    "4-4-2 diamond",
    "5-2-2-1",
]

REPORT_PREFIXES = [
    "Pachet tactic Romania",
    "Brief final de meci al Romaniei",
    "Plan intern de meci al Romaniei",
    "Nota de tranzitie a Romaniei",
    "Nota despre rezistenta la pressing a Romaniei",
]

REPORT_SUFFIXES = [
    "Comutare carpatica",
    "Pivot dunarean",
    "Semispatiul drept",
    "Tempo tricolor",
    "Coridorul de iesire din Istanbul",
    "Bloc median compact",
]

REMARKS = [
    "Accelereaza tranzitiile prin semispatiul drept.",
    "Foloseste supraincarcarea din stanga doar dupa ce primul val de pressing este depasit.",
    "Declanseaza rotatia din ultima treime in jurul playmakerului central.",
    "Pastreaza dublul pivot ingust si invita schimbarea diagonala tarzie.",
    "Ataca spatiul din spatele fundasului lateral avansat dupa fiecare recuperare.",
    "Intarzie pasa finala pana cand extrema din partea opusa ataca careul.",
]

VENUES = [
    "Arena de matchday Istanbul",
    "Stadionul tactic Bosfor",
    "Stadionul operational Marmara",
    "Arena de analiza Cornul de Aur",
]

PUBLIC_BRIEF_LINES = [
    "Dashboard-ul afiseaza doar rapoarte publice pentru scenariul tau.",
    "Aplicatia de scouting expune doar sumarul public al meciului demonstrativ.",
    "Fluxul web ar trebui sa afiseze exclusiv datele marcate public.",
]

PRESSING_WINDOWS = [
    "minutele 10-25",
    "minutele 15-30",
    "minutele 20-35",
    "minutele 30-45",
]

TURKEY_WATCHLISTS = [
    "Arda Guler, Hakan Calhanoglu",
    "Kerem Akturkoglu, Ferdi Kadioglu",
    "Baris Alper Yilmaz, Ismail Yuksek",
    "Kenan Yildiz, Merih Demiral",
]

FIELD_CATALOG = {
    "match_id": {
        "answerField": "matchId",
        "label": "Gaseste identificatorul meciului din scenariul tau.",
        "valueType": "number",
    },
    "internal_report_title": {
        "answerField": "reportTitle",
        "label": "Recupereaza titlul principalului raport intern al Romaniei.",
        "valueType": "string",
    },
    "access_code": {
        "answerField": "accessCode",
        "label": "Extrage codul intern de acces al Romaniei.",
        "valueType": "string",
    },
    "formation": {
        "answerField": "formation",
        "label": "Identifica formula de joc din raportul intern al Romaniei.",
        "valueType": "string",
    },
    "key_player": {
        "answerField": "keyPlayer",
        "label": "Identifica jucatorul-cheie al Romaniei din nota tactica.",
        "valueType": "string",
    },
    "remark": {
        "answerField": "remark",
        "label": "Extrage observatia tactica din raportul intern al Romaniei.",
        "valueType": "string",
    },
    "venue": {
        "answerField": "venue",
        "label": "Identifica stadionul asociat scenariului tau.",
        "valueType": "string",
    },
    "kickoff_label": {
        "answerField": "kickoffLabel",
        "label": "Identifica eticheta de start asociata scenariului tau.",
        "valueType": "string",
    },
    "pressing_window": {
        "answerField": "pressingWindow",
        "label": "Extrage intervalul de pressing al Turciei din nota interna.",
        "valueType": "string",
    },
    "watchlist": {
        "answerField": "watchlist",
        "label": "Extrage watchlist-ul Turciei din nota interna.",
        "valueType": "string",
    },
}

CHALLENGE_PROFILES = [
    {
        "id": "profile_a",
        "label": "Scurgerea standard a Romaniei",
        "injectionType": "union_basic_internal",
        "fields": [
            "match_id",
            "internal_report_title",
            "access_code",
            "formation",
            "key_player",
        ],
    },
    {
        "id": "profile_b",
        "label": "Varianta tactica a Romaniei",
        "injectionType": "union_parse_internal_text",
        "fields": [
            "match_id",
            "internal_report_title",
            "access_code",
            "formation",
            "remark",
        ],
    },
    {
        "id": "profile_c",
        "label": "Romania plus pressing-ul Turciei",
        "injectionType": "union_dual_internal_reports",
        "fields": [
            "match_id",
            "internal_report_title",
            "access_code",
            "pressing_window",
            "watchlist",
        ],
    },
    {
        "id": "profile_d",
        "label": "Corelare interna Romania",
        "injectionType": "union_targeted_internal_filter",
        "fields": [
            "match_id",
            "access_code",
            "formation",
            "key_player",
            "remark",
        ],
    },
    {
        "id": "profile_e",
        "label": "Romania plus fereastra de pressing",
        "injectionType": "union_internal_with_cross_note",
        "fields": [
            "match_id",
            "internal_report_title",
            "formation",
            "remark",
            "pressing_window",
        ],
    },
    {
        "id": "profile_f",
        "label": "Rezumat intern Romania si Turcia",
        "injectionType": "union_turkey_focus",
        "fields": [
            "match_id",
            "access_code",
            "key_player",
            "pressing_window",
            "watchlist",
        ],
    },
]

INJECTION_TYPE_CATALOG = {
    "union_basic_internal": {
        "guide": "UNION pe scouting_reports cu filtrare pe randuri interne.",
        "requiredTokens": ["UNION SELECT", "SCOUTING_REPORTS", "INTERNAL"],
    },
    "union_parse_internal_text": {
        "guide": "UNION pe scouting_reports cu parsare explicita a report_text.",
        "requiredTokens": ["UNION SELECT", "SCOUTING_REPORTS", "REGEXP_SUBSTR"],
    },
    "union_dual_internal_reports": {
        "guide": "UNION orientat pe raportul intern al Turciei pentru pressing/watchlist.",
        "requiredTokens": [
            "UNION SELECT",
            "SCOUTING_REPORTS",
            "FEREASTRA DE PRESSING A TURCIEI",
        ],
    },
    "union_targeted_internal_filter": {
        "guide": "UNION pe rapoarte interne, excluzand explicit raportul Turciei.",
        "requiredTokens": [
            "UNION SELECT",
            "SCOUTING_REPORTS",
            "REPORT_TITLE <>",
        ],
    },
    "union_internal_with_cross_note": {
        "guide": "UNION cu corelare intre nota Romaniei si campul PRESSING.",
        "requiredTokens": ["UNION SELECT", "SCOUTING_REPORTS", "PRESSING"],
    },
    "union_turkey_focus": {
        "guide": "UNION focalizat pe campurile WATCHLIST si PRESSING din nota Turciei.",
        "requiredTokens": [
            "UNION SELECT",
            "FEREASTRA DE PRESSING A TURCIEI",
            "WATCHLIST",
        ],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate an individual Lab 3 instance based on the student number."
    )
    parser.add_argument(
        "--student-number",
        required=True,
        type=int,
        help="Student number from the roster (1-100).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing generated instance files.",
    )
    return parser.parse_args()


def ensure_student_number(student_number: int) -> None:
    if student_number < 1 or student_number > 100:
        raise SystemExit("Invalid --student-number. Expected a value between 1 and 100.")


def digest_for(student_number: int, label: str) -> str:
    return hashlib.sha256(f"lab3:{label}:{student_number:03d}".encode("utf8")).hexdigest()


def digest_for_instance(instance_id: str, label: str) -> str:
    return hashlib.sha256(f"lab3:{label}:{instance_id}".encode("utf8")).hexdigest()


def field_token(instance_id: str, field_name: str, size: int = 6) -> str:
    return digest_for_instance(instance_id, f"field:{field_name}")[:size].upper()


def choose(items: list[str], digest: str, offset: int) -> str:
    selector = int(digest[offset : offset + 2], 16)
    return items[selector % len(items)]


def sql_string(value: str) -> str:
    return value.replace("'", "''")


def build_db_password(student_number: int) -> str:
    digest = digest_for(student_number, "db-password")
    # Keep Oracle complexity requirements while remaining deterministic per student.
    return f"Lb3x-{student_number:03d}-{digest[:6]}!A"


def choose_challenge_profile(student_number: int) -> dict:
    digest = digest_for(student_number, "profile")
    selector = int(digest[:2], 16)
    profile = CHALLENGE_PROFILES[selector % len(CHALLENGE_PROFILES)]
    return {
        "id": profile["id"],
        "label": profile["label"],
        "injectionType": profile["injectionType"],
        "fields": list(profile["fields"]),
    }


def build_required_fields(field_ids: list[str]) -> list[dict]:
    return [
        {
            "key": field_id,
            "label": FIELD_CATALOG[field_id]["label"],
            "valueType": FIELD_CATALOG[field_id]["valueType"],
        }
        for field_id in field_ids
    ]


def build_instance(student_number: int) -> dict:
    digest = digest_for(student_number, "instance")
    instance_id = f"lab3-{student_number:03d}-{digest[:8].upper()}"

    formation_digest = digest_for_instance(instance_id, "formation")
    title_digest = digest_for_instance(instance_id, "title")
    remark_digest = digest_for_instance(instance_id, "remark")
    venue_digest = digest_for_instance(instance_id, "venue")
    public_digest = digest_for_instance(instance_id, "public")
    turkey_digest = digest_for_instance(instance_id, "turkey")

    title_base = (
        f"{choose(REPORT_PREFIXES, title_digest, 0)} - "
        f"{choose(REPORT_SUFFIXES, title_digest, 2)}"
    )
    instance_marker = instance_id.split("-")[-1]
    title = f"{title_base} [{instance_marker}]"

    formation_value = f"{choose(FORMATIONS, formation_digest, 0)} [FM={field_token(instance_id, 'formation', 4)}]"
    key_player_value = (
        f"{choose(ROMANIAN_PLAYERS, formation_digest, 2)} "
        f"[KP={field_token(instance_id, 'key_player', 4)}]"
    )
    remark_value = (
        f"{choose(REMARKS, remark_digest, 0)} "
        f"[RM={field_token(instance_id, 'remark', 6)}]"
    )
    venue_value = f"{choose(VENUES, venue_digest, 0)} [VN={field_token(instance_id, 'venue', 4)}]"
    kickoff_hour = 18 + (student_number % 4)
    kickoff_value = (
        f"Scenariul studentului #{student_number:03d} - start la {kickoff_hour:02d}:45 "
        f"[KO={field_token(instance_id, 'kickoff_label', 4)}]"
    )
    pressing_value = f"{choose(PRESSING_WINDOWS, turkey_digest, 0)} [PR={field_token(instance_id, 'pressing_window', 4)}]"
    watchlist_value = f"{choose(TURKEY_WATCHLISTS, turkey_digest, 2)} [WL={field_token(instance_id, 'watchlist', 4)}]"

    challenge_profile = choose_challenge_profile(student_number)
    injection_details = INJECTION_TYPE_CATALOG[challenge_profile["injectionType"]]

    return {
        "studentNumber": student_number,
        "instanceId": instance_id,
        "challengeProfileId": challenge_profile["id"],
        "challengeProfileLabel": challenge_profile["label"],
        "challengeInjectionType": challenge_profile["injectionType"],
        "challengeInjectionGuide": injection_details["guide"],
        "challengeInjectionRequiredTokens": injection_details["requiredTokens"],
        "dbUser": "matchday",
        "dbPassword": build_db_password(student_number),
        "requiredFieldIds": challenge_profile["fields"],
        "matchId": 3000 + int(digest[0:4], 16) % 5000,
        "publicReportId": 15000 + int(digest[4:8], 16) % 5000,
        "internalReportId": 25000 + int(digest[8:12], 16) % 5000,
        "turkeyReportId": 35000 + int(digest[12:16], 16) % 5000,
        "reportTitle": title,
        "formation": formation_value,
        "keyPlayer": key_player_value,
        "remark": remark_value,
        "accessCode": f"ROTR-{instance_marker}-{digest[8:12].upper()}",
        "venue": venue_value,
        "kickoffLabel": kickoff_value,
        "publicLine": choose(PUBLIC_BRIEF_LINES, public_digest, 0),
        "pressingWindow": pressing_value,
        "watchlist": watchlist_value,
        "turkeyPressingReportTitle": TURKEY_PRESSING_REPORT_TITLE,
    }


def build_student_seed_sql(instance: dict) -> str:
    public_text = (
        f"Scenariul studentului #{instance['studentNumber']:03d}: "
        f"{instance['publicLine']}"
    )
    internal_text = (
        f"FORMATION={instance['formation']} | "
        f"KEY_PLAYER={instance['keyPlayer']} | "
        f"REMARK={instance['remark']}"
    )
    turkey_text = (
        f"PRESSING={instance['pressingWindow']} | "
        f"WATCHLIST={instance['watchlist']}"
    )

    return f"""-- Generated by scripts/init_student.py
-- Student number: {instance['studentNumber']}
-- Instance id: {instance['instanceId']}

INSERT INTO matches (
  match_id,
  home_team_id,
  away_team_id,
  venue,
  kickoff_label,
  stage
) VALUES (
  {instance['matchId']},
  2,
  1,
  '{sql_string(instance['venue'])}',
  '{sql_string(instance['kickoffLabel'])}',
  'briefing UEFA de matchday'
);

INSERT INTO scouting_reports (
  report_id,
  match_id,
  visibility,
  report_title,
  report_text,
  access_code
) VALUES (
  {instance['publicReportId']},
  {instance['matchId']},
  'public',
  'Brief public de meci',
  '{sql_string(public_text)}',
  'PUBLIC-ONLY'
);

INSERT INTO scouting_reports (
  report_id,
  match_id,
  visibility,
  report_title,
  report_text,
  access_code
) VALUES (
  {instance['internalReportId']},
  {instance['matchId']},
  'internal',
  '{sql_string(instance['reportTitle'])}',
  '{sql_string(internal_text)}',
  '{sql_string(instance['accessCode'])}'
);

INSERT INTO scouting_reports (
  report_id,
  match_id,
  visibility,
  report_title,
  report_text,
  access_code
) VALUES (
  {instance['turkeyReportId']},
  {instance['matchId']},
  'internal',
  '{sql_string(instance['turkeyPressingReportTitle'])}',
  '{sql_string(turkey_text)}',
  'TR-PRESS-{instance['studentNumber']:03d}'
);

COMMIT;
"""


def build_db_credentials_sql(instance: dict) -> str:
    password = sql_string(instance["dbPassword"])
    return f"""-- Generated by scripts/init_student.py
-- Student number: {instance['studentNumber']}
-- Instance id: {instance['instanceId']}

ALTER USER matchday IDENTIFIED BY "{password}";
"""


def build_instance_json(instance: dict) -> dict:
    return {
        "studentNumber": instance["studentNumber"],
        "instanceId": instance["instanceId"],
        "studentLabel": f"Studentul #{instance['studentNumber']:03d}",
        "scenarioLabel": "Turcia vs Romania",
        "challengeProfileId": instance["challengeProfileId"],
        "challengeProfileLabel": instance["challengeProfileLabel"],
        "challengeInjectionType": instance["challengeInjectionType"],
        "challengeInjectionGuide": instance["challengeInjectionGuide"],
        "challengeInjectionRequiredTokens": instance["challengeInjectionRequiredTokens"],
        "turkeyPressingReportTitle": instance["turkeyPressingReportTitle"],
        "dbCredentials": {
            "user": instance["dbUser"],
            "password": instance["dbPassword"],
        },
        "requiredFields": build_required_fields(instance["requiredFieldIds"]),
    }


def build_submission_template(instance: dict) -> dict:
    payload = {
        "studentNumber": instance["studentNumber"],
        "instanceId": instance["instanceId"],
        "challengeProfile": instance["challengeProfileId"],
        "challengeInjectionType": instance["challengeInjectionType"],
        "usedPayload": "",
    }

    for field_id in instance["requiredFieldIds"]:
        value_type = FIELD_CATALOG[field_id]["valueType"]
        payload[field_id] = 0 if value_type == "number" else ""

    payload["blockedPayloadAfterFix"] = ""
    return payload


def write_text_file(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        raise SystemExit(f"Refusing to overwrite existing file without --force: {path}")
    path.write_text(content, encoding="utf8")


def write_json_file(path: Path, payload: dict, force: bool) -> None:
    if path.exists() and not force:
        raise SystemExit(f"Refusing to overwrite existing file without --force: {path}")
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")


def main() -> None:
    args = parse_args()
    ensure_student_number(args.student_number)

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    SUBMISSION_PATH.parent.mkdir(parents=True, exist_ok=True)

    instance = build_instance(args.student_number)
    write_text_file(STUDENT_SEED_PATH, build_student_seed_sql(instance), args.force)
    write_text_file(DB_CREDENTIALS_SQL_PATH, build_db_credentials_sql(instance), args.force)
    write_json_file(INSTANCE_JSON_PATH, build_instance_json(instance), args.force)
    write_json_file(SUBMISSION_PATH, build_submission_template(instance), args.force)

    print("Lab 3 student instance generated successfully.")
    print(f"  Student number: {args.student_number}")
    print(f"  Instance id: {instance['instanceId']}")
    print(f"  Challenge profile: {instance['challengeProfileId']} ({instance['challengeProfileLabel']})")
    print(f"  Required fields: {', '.join(instance['requiredFieldIds'])}")
    print(f"  DB user: {instance['dbUser']}")
    print(f"  DB password: {instance['dbPassword']}")
    print(f"  Generated SQL: {STUDENT_SEED_PATH.relative_to(ROOT_DIR)}")
    print(f"  Generated DB credentials SQL: {DB_CREDENTIALS_SQL_PATH.relative_to(ROOT_DIR)}")
    print(f"  Submission file: {SUBMISSION_PATH.relative_to(ROOT_DIR)}")
    print("Next step: bootstrap the Oracle schema inside the container.")


if __name__ == "__main__":
    main()
