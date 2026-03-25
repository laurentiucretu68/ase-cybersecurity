import json
import os
import re
import socket
from contextlib import closing
from pathlib import Path

import oracledb
from flask import Flask, render_template, request

app = Flask(__name__)

APP_TITLE = "Scurgere de date la meci"
DEFAULT_TEAM = "Romania"
DEFAULT_SEARCH = "%"
INSTANCE_JSON_PATH = Path(__file__).resolve().parent / "student" / "instance.json"
TEAM_LABELS = {
    "Romania": "Romania",
    "Turkey": "Turcia",
    "Georgia": "Georgia",
    "Serbia": "Serbia",
}
SEARCH_MODE_LABELS = {
    "secure": "securizat",
    "vulnerable": "vulnerabil",
}
FIELD_LABELS = {
    "match_id": "Gaseste identificatorul meciului din scenariul tau.",
    "internal_report_title": "Recupereaza titlul principalului raport intern al Romaniei.",
    "access_code": "Extrage codul intern de acces al Romaniei.",
    "formation": "Identifica formula de joc din raportul intern al Romaniei.",
    "key_player": "Identifica jucatorul-cheie al Romaniei din nota tactica.",
    "remark": "Extrage observatia tactica din raportul intern al Romaniei.",
    "venue": "Identifica stadionul asociat scenariului tau.",
    "kickoff_label": "Identifica eticheta de start asociata scenariului tau.",
    "pressing_window": "Extrage intervalul de pressing al Turciei din nota interna.",
    "watchlist": "Extrage watchlist-ul Turciei din nota interna.",
}
PROFILE_LABELS = {
    "profile_a": "Scurgerea standard a Romaniei",
    "profile_b": "Varianta tactica a Romaniei",
    "profile_c": "Romania plus pressing-ul Turciei",
    "profile_d": "Corelare interna Romania",
    "profile_e": "Romania plus fereastra de pressing",
    "profile_f": "Rezumat intern Romania si Turcia",
}
REPORT_TITLE_LABELS = {
    "Public Match Brief": "Brief public de meci",
    "Turkey Pressing Window": "Fereastra de pressing a Turciei",
}
STAGE_LABELS = {
    "UEFA matchday briefing": "briefing UEFA de matchday",
}
DEFAULT_REQUIRED_FIELDS = [
    {"key": "match_id", "label": FIELD_LABELS["match_id"]},
    {
        "key": "internal_report_title",
        "label": FIELD_LABELS["internal_report_title"],
    },
    {
        "key": "access_code",
        "label": FIELD_LABELS["access_code"],
    },
    {
        "key": "formation",
        "label": FIELD_LABELS["formation"],
    },
    {
        "key": "key_player",
        "label": FIELD_LABELS["key_player"],
    },
]


def db_dsn() -> str:
    host = os.getenv("LAB3_DB_HOST", "127.0.0.1")
    port = os.getenv("LAB3_DB_PORT", "1521")
    service = os.getenv("LAB3_DB_SERVICE", "FREEPDB1")
    return f"{host}:{port}/{service}"


def db_default_credentials() -> tuple[str, str]:
    instance_context = load_instance_context()
    if instance_context and isinstance(instance_context, dict):
        credentials = instance_context.get("dbCredentials")
        if isinstance(credentials, dict):
            user = credentials.get("user")
            password = credentials.get("password")
            if isinstance(user, str) and isinstance(password, str) and user and password:
                return user, password
    return "matchday", "Matchday123!"


def db_connection():
    default_user, default_password = db_default_credentials()
    return oracledb.connect(
        user=os.getenv("LAB3_DB_USER", default_user),
        password=os.getenv("LAB3_DB_PASSWORD", default_password),
        dsn=db_dsn(),
    )


def fetch_rows(sql: str, params: dict | None = None) -> list[dict]:
    with closing(db_connection()) as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute(sql, params or {})
            columns = [item[0].lower() for item in cursor.description]
            return [dict(zip(columns, row)) for row in cursor]


def load_instance_context() -> dict | None:
    if not INSTANCE_JSON_PATH.exists():
        return None

    try:
        with INSTANCE_JSON_PATH.open("r", encoding="utf8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None


def localize_team_name(team_name: str | None) -> str:
    if not team_name:
        return ""
    return TEAM_LABELS.get(team_name, team_name)


def localize_search_mode(mode: str) -> str:
    return SEARCH_MODE_LABELS.get(mode, mode)


def localize_kickoff_label(label: str | None) -> str:
    if not label:
        return ""

    if label.startswith("Student scenario #") and " kickoff - " in label:
        prefix, kickoff_time = label.split(" kickoff - ", 1)
        student_tag = prefix.removeprefix("Student scenario #")
        return f"Scenariul studentului #{student_tag} - start la {kickoff_time}"

    return label


def localize_stage(stage: str | None) -> str:
    if not stage:
        return ""
    return STAGE_LABELS.get(stage, stage)


def localize_report_title(title: str | None) -> str:
    if not title:
        return ""
    return REPORT_TITLE_LABELS.get(title, title)


def localize_instance_context(instance_context: dict | None) -> dict | None:
    if not instance_context:
        return None

    localized = dict(instance_context)
    student_number = localized.get("studentNumber")

    if isinstance(student_number, int):
        localized["studentLabel"] = f"Studentul #{student_number:03d}"

    localized["scenarioLabel"] = "Turcia vs Romania"
    profile_id = localized.get("challengeProfileId")
    localized["challengeProfileLabel"] = PROFILE_LABELS.get(
        profile_id,
        localized.get("challengeProfileLabel", ""),
    )
    return localized


def resolve_required_fields(instance_context: dict | None) -> list[dict]:
    if not instance_context:
        return DEFAULT_REQUIRED_FIELDS

    required_fields = instance_context.get("requiredFields")
    if not isinstance(required_fields, list) or not required_fields:
        return DEFAULT_REQUIRED_FIELDS

    localized_fields = []
    for field in required_fields:
        field_key = field.get("key")
        localized_fields.append(
            {
                "key": field_key,
                "label": FIELD_LABELS.get(field_key, field.get("label", field_key)),
                "valueType": field.get("valueType", "string"),
            }
        )
    return localized_fields


def get_match_card() -> dict | None:
    sql = """
    SELECT m.match_id,
           home.team_name AS home_team_name,
           away.team_name AS away_team_name,
           m.venue,
           m.kickoff_label,
           m.stage
    FROM matches m
    JOIN teams home ON home.team_id = m.home_team_id
    JOIN teams away ON away.team_id = m.away_team_id
    ORDER BY m.match_id DESC
    FETCH FIRST 1 ROWS ONLY
    """
    rows = fetch_rows(sql)
    if not rows:
        return None

    row = rows[0]
    row["match_label"] = (
        f"{localize_team_name(row['home_team_name'])} vs "
        f"{localize_team_name(row['away_team_name'])}"
    )
    row["kickoff_label"] = localize_kickoff_label(row.get("kickoff_label"))
    row["stage"] = localize_stage(row.get("stage"))
    return row


def get_public_reports() -> list[dict]:
    sql = """
    SELECT sr.report_title,
           sr.report_text,
           sr.visibility
    FROM scouting_reports sr
    WHERE sr.visibility = :visibility
    ORDER BY sr.report_id DESC
    """
    rows = fetch_rows(sql, {"visibility": "public"})
    for row in rows:
        row["visibility"] = "public" if row.get("visibility") == "public" else row.get("visibility")
        row["report_title"] = localize_report_title(row.get("report_title"))
    return rows


def run_player_search(team: str, search: str) -> tuple[str, list[dict]]:
    sanitized_search = search
    simple_tautology_patterns = (
        r"(?i)\bor\b\s*'1'\s*=\s*'1'",
        r"(?i)\bor\b\s*1\s*=\s*1\b",
        r"(?i)\bor\b\s*'a'\s*=\s*'a'",
    )
    for pattern in simple_tautology_patterns:
        sanitized_search = re.sub(pattern, "OR_BLOCKED", sanitized_search)

    sql = f"""
    SELECT p.player_name AS item_label,
           t.team_name AS context_label,
           p.position AS category_label,
           TO_CHAR(p.shirt_number) AS detail_value
    FROM players p
    JOIN teams t ON t.team_id = p.team_id
    WHERE t.team_name = '{team}'
      AND p.player_name LIKE '{sanitized_search}'
    ORDER BY 1
    """
    return sql.strip(), fetch_rows(sql)


def query_mode_from_sql(sql: str) -> str:
    placeholders = (":team", ":search")
    return "secure" if all(item in sql for item in placeholders) else "vulnerable"


def oracle_error_message(exc: Exception) -> str:
    if hasattr(exc, "args") and exc.args:
        return str(exc.args[0])
    return str(exc)


def find_available_port(host: str, start_port: int, max_attempts: int = 20) -> int:
    port = start_port
    attempts = 0

    while attempts < max_attempts:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            try:
                sock.bind((host, port))
                return port
            except OSError:
                port += 1
                attempts += 1

    raise RuntimeError(
        f"Could not find a free port starting at {start_port} after {max_attempts} attempts."
    )


@app.route("/")
def index():
    team = request.args.get("team", DEFAULT_TEAM)
    search = request.args.get("q", DEFAULT_SEARCH)
    instance_context = localize_instance_context(load_instance_context())
    required_fields = resolve_required_fields(instance_context)

    public_reports = []
    match_card = None
    search_results = []
    debug_sql = ""
    db_error = ""
    search_error = ""

    try:
        match_card = get_match_card()
        public_reports = get_public_reports()
    except oracledb.Error as exc:
        db_error = oracle_error_message(exc)

    if not db_error:
        try:
            debug_sql, search_results = run_player_search(team, search)
        except oracledb.Error as exc:
            search_error = oracle_error_message(exc)

    for row in search_results:
        row["context_label"] = localize_team_name(row.get("context_label"))

    search_mode = query_mode_from_sql(debug_sql) if debug_sql else "vulnerable"
    search_mode_label = localize_search_mode(search_mode)

    return render_template(
        "index.html",
        app_title=APP_TITLE,
        db_error=db_error,
        debug_sql=debug_sql,
        match_card=match_card,
        public_reports=public_reports,
        search=search,
        search_error=search_error,
        search_mode=search_mode,
        search_mode_label=search_mode_label,
        search_results=search_results,
        instance_context=instance_context,
        required_fields=required_fields,
        team=team,
        teams=[
            {"value": "Romania", "label": "Romania"},
            {"value": "Turkey", "label": "Turcia"},
        ],
    )


@app.route("/health")
def health():
    try:
        fetch_rows("SELECT 'ok' AS status_message FROM dual")
        return {"status": "ok"}
    except oracledb.Error as exc:
        return {"status": "error", "message": oracle_error_message(exc)}, 500


if __name__ == "__main__":
    host = os.getenv("LAB3_APP_HOST", "127.0.0.1")
    start_port = int(os.getenv("LAB3_APP_PORT", "5000"))
    port = find_available_port(host, start_port)
    display_host = "127.0.0.1" if host == "0.0.0.0" else host

    print(f"Lab 3 web UI: http://{display_host}:{port}")
    app.run(host=host, port=port, debug=False)
