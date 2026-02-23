#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

KEY_REGEX='(^|[^0-9a-fA-F])(0x[0-9a-fA-F]{64})([^0-9a-fA-F]|$)'

echo "Scanning for potential private keys in lab workspace..."

declare -a CANDIDATES=()

add_candidate() {
  local candidate="$1"
  local existing

  if [[ -z "$candidate" ]]; then
    return
  fi

  for existing in "${CANDIDATES[@]-}"; do
    if [[ "$existing" == "$candidate" ]]; then
      return
    fi
  done

  CANDIDATES+=("$candidate")
}

add_candidate ".env"
add_candidate ".env.backup"
add_candidate ".bash_history"
add_candidate ".zsh_history"
add_candidate ".bash_history_fake"
add_candidate ".secret_config.json"

if [[ -f student/instance.json ]]; then
  while IFS= read -r leak_file; do
    add_candidate "$leak_file"
  done < <(node -e '
const fs = require("fs");
const p = "student/instance.json";
if (!fs.existsSync(p)) process.exit(0);
const cfg = JSON.parse(fs.readFileSync(p, "utf8"));
const leakFiles = (cfg.challenge3 && cfg.challenge3.leakFiles) || {};
Object.values(leakFiles).forEach((value) => {
  if (value) console.log(value);
});
')
fi

found=0
for file in "${CANDIDATES[@]}"; do
  if [[ -f "$file" ]]; then
    matches=$(grep -nE "$KEY_REGEX" "$file" || true)
    if [[ -n "$matches" ]]; then
      echo "[+] $file"
      echo "$matches"
      found=1
    fi
  fi
done

# Broad scan in hidden files and backups under the current repo, only if
# no direct hit was found in common locations.
if [[ "$found" -eq 0 ]]; then
  rg_matches=$(rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' --glob '*.bak' --glob '*.old' --glob '*history*' --glob '*.json' --glob '.env*' "$KEY_REGEX" . || true)
  if [[ -n "$rg_matches" ]]; then
    echo "[+] Additional matches from recursive scan"
    echo "$rg_matches"
    found=1
  fi
fi

if [[ "$found" -eq 0 ]]; then
  echo "No private key patterns found."
  exit 1
fi

echo "Scan complete."
