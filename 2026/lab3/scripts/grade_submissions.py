#!/usr/bin/env python3

import argparse
import json
from pathlib import Path

from init_student import FIELD_CATALOG, INJECTION_TYPE_CATALOG, build_instance

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SUBMISSION_PATH = ROOT_DIR / "student" / "submissions" / "lab3-results.json"
PART_A_POINTS = 70
PART_B_POINTS = 30


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Grade one or more Lab 3 JSON submissions using the deterministic "
            "student instance generator."
        )
    )
    parser.add_argument(
        "paths",
        nargs="*",
        help=(
            "Submission JSON files or directories. If omitted, the script grades "
            "student/submissions/lab3-results.json."
        ),
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        help="Optional path where the grading summary will be written as JSON.",
    )
    return parser.parse_args()


def discover_submission_files(raw_paths: list[str]) -> list[Path]:
    if not raw_paths:
        return [DEFAULT_SUBMISSION_PATH]

    discovered: set[Path] = set()
    for raw_path in raw_paths:
        path = Path(raw_path).expanduser().resolve()
        if path.is_file():
            if path.suffix.lower() == ".json":
                discovered.add(path)
            continue

        if path.is_dir():
            for candidate in sorted(path.rglob("*.json")):
                if "submission-templates" in candidate.parts:
                    continue
                discovered.add(candidate.resolve())

    return sorted(discovered)


def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf8") as handle:
        return json.load(handle)


def is_non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def canonicalize_payload(value: object) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.upper().split())


def payload_matches_injection_type(payload: object, injection_type: str) -> bool:
    details = INJECTION_TYPE_CATALOG.get(injection_type)
    if not details:
        return False

    normalized = canonicalize_payload(payload)
    if not normalized:
        return False

    required_tokens = details.get("requiredTokens", [])
    return all(token in normalized for token in required_tokens)


def normalize_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    return value.strip()


def normalize_number(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return None


def compare_answer(field_id: str, actual: object, expected: object) -> tuple[bool, object | None]:
    value_type = FIELD_CATALOG[field_id]["valueType"]

    if value_type == "number":
        normalized = normalize_number(actual)
        return normalized == expected, normalized

    normalized = normalize_string(actual)
    return normalized == expected, normalized


def grade_submission(path: Path) -> dict:
    result = {
        "path": str(path),
        "status": "ok",
        "studentNumber": None,
        "instanceId": None,
        "challengeProfile": None,
        "partA": 0,
        "partB": 0,
        "score": 0,
        "maxScore": 100,
        "issues": [],
        "fieldChecks": [],
    }

    if not path.exists():
        result["status"] = "invalid"
        result["issues"].append(f"Fisier lipsa: {path}")
        return result

    try:
        payload = read_json(path)
    except (OSError, json.JSONDecodeError) as exc:
        result["status"] = "invalid"
        result["issues"].append(f"JSON invalid: {exc}")
        return result

    if not isinstance(payload, dict):
        result["status"] = "invalid"
        result["issues"].append("Radacina fisierului trebuie sa fie un obiect JSON.")
        return result

    student_number = normalize_number(payload.get("studentNumber"))
    if student_number is None or not 1 <= student_number <= 100:
        result["status"] = "invalid"
        result["issues"].append("Campul studentNumber trebuie sa fie un numar intre 1 si 100.")
        return result

    expected = build_instance(student_number)
    required_field_ids = expected["requiredFieldIds"]
    points_per_field = PART_A_POINTS // len(required_field_ids)

    result["studentNumber"] = student_number
    result["instanceId"] = payload.get("instanceId")
    result["challengeProfile"] = payload.get("challengeProfile")

    if payload.get("instanceId") != expected["instanceId"]:
        result["issues"].append(
            f"instanceId incorect: asteptat {expected['instanceId']}, primit {payload.get('instanceId')!r}."
        )

    if payload.get("challengeProfile") != expected["challengeProfileId"]:
        result["issues"].append(
            "challengeProfile incorect: "
            f"asteptat {expected['challengeProfileId']}, primit {payload.get('challengeProfile')!r}."
        )

    if payload.get("challengeInjectionType") != expected["challengeInjectionType"]:
        result["issues"].append(
            "challengeInjectionType incorect: "
            f"asteptat {expected['challengeInjectionType']}, primit {payload.get('challengeInjectionType')!r}."
        )

    for field_id in required_field_ids:
        expected_key = FIELD_CATALOG[field_id]["answerField"]
        expected_value = expected[expected_key]
        actual_value = payload.get(field_id)
        is_correct, normalized_value = compare_answer(field_id, actual_value, expected_value)

        field_result = {
            "field": field_id,
            "correct": is_correct,
            "expected": expected_value,
            "received": actual_value,
            "normalized": normalized_value,
        }
        result["fieldChecks"].append(field_result)

        if is_correct:
            result["partA"] += points_per_field
        else:
            result["issues"].append(
                f"Raspuns gresit pentru {field_id}: asteptat {expected_value!r}, primit {actual_value!r}."
            )

    used_payload = payload.get("usedPayload")
    blocked_payload = payload.get("blockedPayloadAfterFix")

    if payload_matches_injection_type(used_payload, expected["challengeInjectionType"]):
        result["partB"] += 10
    else:
        result["issues"].append(
            "usedPayload trebuie sa respecte tipul de injectie al profilului "
            f"({expected['challengeInjectionType']})."
        )

    if is_non_empty_string(blocked_payload):
        result["partB"] += 10
    else:
        result["issues"].append(
            "blockedPayloadAfterFix trebuie sa contina payload-ul retestat dupa fix."
        )

    result["score"] = result["partA"] + result["partB"]

    if result["issues"]:
        result["status"] = "issues"

    return result


def print_result(result: dict) -> None:
    header = f"[{result['status'].upper()}] {result['path']}"
    print(header)

    if result["studentNumber"] is not None:
        print(
            f"  Student #{result['studentNumber']:03d} | "
            f"instanceId={result['instanceId']} | profile={result['challengeProfile']}"
        )

    print(
        f"  Scor: {result['score']}/{result['maxScore']} "
        f"(Partea A: {result['partA']}/{PART_A_POINTS}, "
        f"Partea B: {result['partB']}/{PART_B_POINTS})"
    )

    for field_check in result["fieldChecks"]:
        verdict = "OK" if field_check["correct"] else "FAIL"
        print(f"  [{verdict}] {field_check['field']}")

    for issue in result["issues"]:
        print(f"  - {issue}")


def write_report(path: Path, results: list[dict]) -> None:
    summary = {
        "gradedCount": len(results),
        "results": results,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf8")


def main() -> None:
    args = parse_args()
    submission_files = discover_submission_files(args.paths)

    if not submission_files:
        raise SystemExit("Nu au fost gasite fisiere JSON de corectat.")

    results = [grade_submission(path) for path in submission_files]

    for result in results:
        print_result(result)

    total_score = sum(result["score"] for result in results)
    max_score = sum(result["maxScore"] for result in results)
    print("")
    print(
        f"Rezumat: {len(results)} fisiere evaluate | "
        f"Scor total agregat: {total_score}/{max_score}"
    )

    if args.report_json:
        write_report(args.report_json.expanduser().resolve(), results)
        print(f"Raport JSON scris in: {args.report_json.expanduser().resolve()}")


if __name__ == "__main__":
    main()
