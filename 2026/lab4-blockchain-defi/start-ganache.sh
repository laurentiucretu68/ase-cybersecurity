#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTANCE_ENV="$PROJECT_DIR/student/instance.env"

# Defaults for local development.
LAB_CHAIN_ID="${LAB_CHAIN_ID:-1337}"
LAB_PORT="${LAB_PORT:-7545}"
LAB_ACCOUNTS="${LAB_ACCOUNTS:-10}"
LAB_DEFAULT_BALANCE_ETH="${LAB_DEFAULT_BALANCE_ETH:-100}"
LAB_GAS_PRICE_WEI="${LAB_GAS_PRICE_WEI:-20000000000}"
LAB_GAS_LIMIT="${LAB_GAS_LIMIT:-6000000}"
LAB_MNEMONIC="${LAB_MNEMONIC:-test test test test test test test test test test test junk}"

if [[ -f "$INSTANCE_ENV" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$INSTANCE_ENV"
  set +a
  echo "Loaded instance config from student/instance.env"
else
  echo "student/instance.env not found, using default deterministic config"
  echo "Run: npm run init:student -- --student-id <id>"
fi

echo ""
echo "Starting Ganache with:"
echo "  Chain ID: $LAB_CHAIN_ID"
echo "  Port: $LAB_PORT"
echo "  Accounts: $LAB_ACCOUNTS"
echo "  Balance/account: $LAB_DEFAULT_BALANCE_ETH ETH"
echo "  Gas price: $LAB_GAS_PRICE_WEI"
echo "  Gas limit: $LAB_GAS_LIMIT"
echo ""

if lsof -Pi :"$LAB_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Ganache is already running on port $LAB_PORT"
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
  --accounts "$LAB_ACCOUNTS" \
  --defaultBalanceEther "$LAB_DEFAULT_BALANCE_ETH" \
  --gasPrice "$LAB_GAS_PRICE_WEI" \
  --gasLimit "$LAB_GAS_LIMIT" \
  --mnemonic "$LAB_MNEMONIC" \
  --blockTime 0
