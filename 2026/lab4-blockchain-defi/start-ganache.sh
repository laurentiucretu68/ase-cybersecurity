#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTANCE_ENV="$PROJECT_DIR/student/instance.env"
STUDENT_DIR="$PROJECT_DIR/student"
GANACHE_GUI_PROCESS_PATTERN='ganache-gui|ganache-gui-app|ganache-[0-9.]+-linux-x86_64\.AppImage'

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
LAB_GANACHE_MODE="${LAB_GANACHE_MODE:-auto}"
LAB_GANACHE_GUI_AUTO_OPEN="${LAB_GANACHE_GUI_AUTO_OPEN:-1}"
LAB_GANACHE_GUI_WORKSPACE_NAME="${LAB_GANACHE_GUI_WORKSPACE_NAME:-BLOCKCHAIN-DEFI}"

print_start_summary() {
  local mode="$1"

  echo ""
  echo "Starting Ganache with:"
  echo "  Mode: $mode"
  echo "  Chain ID: $LAB_CHAIN_ID"
  echo "  Port: $LAB_PORT"
  echo "  Visible accounts: $LAB_VISIBLE_ACCOUNTS"
  echo "  Scenario accounts via mnemonic: $LAB_ACCOUNTS"
  echo "  Balance/visible account: $LAB_DEFAULT_BALANCE_ETH ETH"
  echo "  Gas price: $LAB_GAS_PRICE_WEI"
  echo "  Gas limit: $LAB_GAS_LIMIT"
  echo ""
}

port_is_busy() {
  lsof -Pi :"$LAB_PORT" -sTCP:LISTEN -t >/dev/null 2>&1
}

ganache_gui_is_running() {
  pgrep -f "$GANACHE_GUI_PROCESS_PATTERN" >/dev/null 2>&1
}

ganache_gui_command_exists() {
  command -v ganache-gui-app >/dev/null 2>&1 || command -v ganache-gui >/dev/null 2>&1
}

resolve_ganache_mode() {
  case "$LAB_GANACHE_MODE" in
    gui)
      if ganache_gui_command_exists && [[ -n "${DISPLAY:-}" ]]; then
        echo "gui"
      else
        echo "error"
      fi
      ;;
    cli)
      echo "cli"
      ;;
    auto)
      if ganache_gui_command_exists && [[ -n "${DISPLAY:-}" ]]; then
        echo "gui"
      else
        echo "cli"
      fi
      ;;
    *)
      echo "Unsupported LAB_GANACHE_MODE value: $LAB_GANACHE_MODE"
      exit 1
      ;;
  esac
}

prepare_ganache_gui_profile() {
  node "$PROJECT_DIR/scripts/configure-ganache-gui.js"
}

auto_open_ganache_quickstart() {
  local launched_gui="${1:-0}"

  if [[ "$LAB_GANACHE_GUI_AUTO_OPEN" != "1" ]]; then
    return 0
  fi

  if [[ "$launched_gui" != "1" ]]; then
    echo "Ganache GUI profile refreshed. If the Home screen is visible, click Quickstart once."
    return 0
  fi

  if [[ -z "${DISPLAY:-}" ]] || ! command -v xdotool >/dev/null 2>&1; then
    echo "Ganache GUI was preconfigured. If the Home screen is visible, click Quickstart once."
    return 0
  fi

  if port_is_busy; then
    return 0
  fi

  local window_id=""
  local width=""
  local height=""
  local click_x=""
  local click_y=""

  for _ in {1..20}; do
    window_id="$(xdotool search --name '^Ganache$' 2>/dev/null | head -1 || true)"
    if [[ -n "$window_id" ]]; then
      sleep 2
      break
    fi
    sleep 1
  done

  if [[ -z "$window_id" ]]; then
    echo "Ganache GUI launched, but the Quickstart window could not be focused automatically."
    return 0
  fi

  xdotool windowactivate --sync "$window_id" >/dev/null 2>&1 || true
  eval "$(xdotool getwindowgeometry --shell "$window_id")"

  width="${WIDTH:-0}"
  height="${HEIGHT:-0}"

  if [[ "$width" -le 0 || "$height" -le 0 ]]; then
    echo "Ganache GUI launched. If the Home screen is visible, click Quickstart once."
    return 0
  fi

  click_x=$(( width * 35 / 100 ))
  click_y=$(( height * 84 / 100 ))

  xdotool mousemove --window "$window_id" "$click_x" "$click_y" click 1 >/dev/null 2>&1 || true

  for _ in {1..15}; do
    if port_is_busy; then
      echo "Ganache GUI Quickstart is running on port $LAB_PORT"
      return 0
    fi
    sleep 1
  done

  echo "Ganache GUI was configured and launched, but the chain did not auto-start."
  echo "Open Quickstart or workspace '$LAB_GANACHE_GUI_WORKSPACE_NAME' once."
}

start_ganache_gui() {
  local launched_gui=0

  if ganache_gui_is_running; then
    echo "Ganache GUI is already running"
  else
    echo "Launching Ganache GUI..."
    if command -v ganache-gui-app >/dev/null 2>&1; then
      nohup ganache-gui-app >/dev/null 2>&1 &
    else
      nohup env LAB_INTERNAL_GANACHE_GUI_LAUNCH=1 ganache-gui >/dev/null 2>&1 &
    fi
    launched_gui=1
    sleep 1
  fi

  auto_open_ganache_quickstart "$launched_gui"
}

start_ganache_cli() {
  local ganache_cmd=()

  if command -v ganache >/dev/null 2>&1; then
    ganache_cmd=(ganache)
  elif command -v ganache-cli >/dev/null 2>&1; then
    ganache_cmd=(ganache-cli)
  else
    ganache_cmd=(npx ganache)
  fi

  "${ganache_cmd[@]}" \
    --networkId "$LAB_CHAIN_ID" \
    --port "$LAB_PORT" \
    --accounts "$LAB_VISIBLE_ACCOUNTS" \
    --defaultBalanceEther "$LAB_DEFAULT_BALANCE_ETH" \
    --gasPrice "$LAB_GAS_PRICE_WEI" \
    --gasLimit "$LAB_GAS_LIMIT" \
    --mnemonic "$LAB_MNEMONIC" \
    --blockTime 0
}

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

mkdir -p "$STUDENT_DIR"

GANACHE_MODE="$(resolve_ganache_mode)"
if [[ "$GANACHE_MODE" == "error" ]]; then
  echo "Ganache GUI mode was requested, but ganache-gui/ganache-gui-app or DISPLAY is unavailable"
  echo "Use one of:"
  echo "  ./start-ganache.sh                 # auto mode"
  echo "  LAB_GANACHE_MODE=cli ./start-ganache.sh"
  exit 1
fi

print_start_summary "$GANACHE_MODE"

if [[ "$GANACHE_MODE" == "gui" ]]; then
  prepare_ganache_gui_profile
fi

if port_is_busy; then
  echo "Ganache is already running on port $LAB_PORT"
  if [[ "$GANACHE_MODE" == "gui" ]]; then
    echo "Ganache GUI profile was refreshed. Restart the running Ganache process to apply the new GUI account settings."
  fi
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

if [[ "$GANACHE_MODE" == "gui" ]]; then
  start_ganache_gui
else
  start_ganache_cli
fi
