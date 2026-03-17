#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTANCE_ENV="$PROJECT_DIR/student/instance.env"
STUDENT_DIR="$PROJECT_DIR/student"

# Defaults for local development.
LAB_CHAIN_ID="${LAB_CHAIN_ID:-1337}"
LAB_PORT="${LAB_PORT:-7545}"
LAB_ACCOUNTS="${LAB_ACCOUNTS:-10}"
LAB_VISIBLE_ACCOUNTS="${LAB_VISIBLE_ACCOUNTS:-1}"
LAB_DEFAULT_BALANCE_ETH="${LAB_DEFAULT_BALANCE_ETH:-100}"
LAB_GAS_PRICE_WEI="${LAB_GAS_PRICE_WEI:-20000000000}"
LAB_GAS_LIMIT="${LAB_GAS_LIMIT:-6000000}"
LAB_MNEMONIC="${LAB_MNEMONIC:-test test test test test test test test test test test junk}"
LAB_AUTO_START="${LAB_AUTO_START:-0}"
LAB_ALLOW_DEFAULT_CONFIG="${LAB_ALLOW_DEFAULT_CONFIG:-0}"

if [[ -f "$INSTANCE_ENV" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$INSTANCE_ENV"
  set +a
  echo "Loaded instance config from student/instance.env"
else
  if [[ "$LAB_ALLOW_DEFAULT_CONFIG" == "1" ]]; then
    echo "student/instance.env not found, using default deterministic config"
    echo "Run: npm run init:student -- --student-id <id> to generate a personalized instance"
  else
    if [[ "$LAB_AUTO_START" == "1" ]]; then
      echo "student/instance.env not found, skipping Ganache autostart"
      echo "Generate an instance first: npm run init:student -- --student-id <id>"
      exit 0
    fi

    echo "student/instance.env not found"
    echo "Generate your instance first:"
    echo "  npm run init:student -- --student-id <id>"
    echo ""
    echo "Only after that rerun:"
    echo "  ./start-ganache.sh"
    echo ""
    echo "For local development only, you can override with:"
    echo "  LAB_ALLOW_DEFAULT_CONFIG=1 ./start-ganache.sh"
    exit 1
  fi
fi

if ! [[ "$LAB_ACCOUNTS" =~ ^[0-9]+$ ]] || ! [[ "$LAB_VISIBLE_ACCOUNTS" =~ ^[0-9]+$ ]]; then
  echo "LAB_ACCOUNTS and LAB_VISIBLE_ACCOUNTS must be positive integers"
  exit 1
fi

if (( LAB_ACCOUNTS < 1 || LAB_VISIBLE_ACCOUNTS < 1 )); then
  echo "LAB_ACCOUNTS and LAB_VISIBLE_ACCOUNTS must be >= 1"
  exit 1
fi

GANACHE_BALANCE_ETH="$LAB_DEFAULT_BALANCE_ETH"

mkdir -p "$STUDENT_DIR"

echo ""
echo "Starting Ganache with:"
echo "  Chain ID: $LAB_CHAIN_ID"
echo "  Port: $LAB_PORT"
echo "  Visible accounts: $LAB_VISIBLE_ACCOUNTS"
echo "  Scenario accounts via mnemonic: $LAB_ACCOUNTS"
echo "  Balance/visible account: $GANACHE_BALANCE_ETH ETH"
echo "  Gas price: $LAB_GAS_PRICE_WEI"
echo "  Gas limit: $LAB_GAS_LIMIT"
echo ""

if lsof -Pi :"$LAB_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Ganache is already running on port $LAB_PORT"
  if [[ "$LAB_AUTO_START" == "1" ]]; then
    echo "Autostart mode detected, keeping the existing Ganache process"
    exit 0
  fi
  read -r -p "Kill and restart? (y/n) " reply
  if [[ "$reply" =~ ^[Yy]$ ]]; then
    kill "$(lsof -t -i:"$LAB_PORT")"
    sleep 2
  else
    echo "Keeping existing Ganache process"
    exit 0
  fi
fi

if command -v ganache >/dev/null 2>&1; then
  GANACHE_CMD=(ganache)
elif command -v ganache-cli >/dev/null 2>&1; then
  GANACHE_CMD=(ganache-cli)
else
  GANACHE_CMD=(npx ganache)
fi

"${GANACHE_CMD[@]}" \
  --networkId "$LAB_CHAIN_ID" \
  --port "$LAB_PORT" \
  --accounts "$LAB_VISIBLE_ACCOUNTS" \
  --defaultBalanceEther "$GANACHE_BALANCE_ETH" \
  --gasPrice "$LAB_GAS_PRICE_WEI" \
  --gasLimit "$LAB_GAS_LIMIT" \
  --mnemonic "$LAB_MNEMONIC" \
  --blockTime 0
