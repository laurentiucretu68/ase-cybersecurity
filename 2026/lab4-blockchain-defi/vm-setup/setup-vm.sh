#!/bin/bash

################################################################################
# DeFi Heist Lab - Automated VM Setup Script
# 
# This script automatically configures a fresh Ubuntu installation with
# everything needed for the Blockchain Security lab.
#
# Usage:
#   1. Install Ubuntu 22.04 LTS in VirtualBox/VMware
#   2. Login and open terminal
#   3. Run: wget https://raw.githubusercontent.com/[your-repo]/setup-vm.sh
#   4. Run: chmod +x setup-vm.sh
#   5. Run: ./setup-vm.sh
#   6. Wait ~20-30 minutes (depending on internet speed)
#   7. Reboot when prompted
#
# What this script does:
#   ✅ Updates system
#   ✅ Installs Node.js 18 LTS
#   ✅ Installs Ganache CLI & GUI
#   ✅ Installs VS Code with extensions
#   ✅ Installs Firefox with MetaMask
#   ✅ Clones lab repository
#   ✅ Installs npm dependencies
#   ✅ Configures desktop shortcuts
#   ✅ Pre-deploys contracts
#   ✅ Creates student user
#
# Requirements:
#   - Fresh Ubuntu 22.04 LTS installation
#   - Internet connection
#   - Sudo privileges
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/laurentiucretu68/ase-cybersecurity.git"  # UPDATE THIS!
REPO_BRANCH="beta"  # Branch to clone for lab4
REPO_FALLBACK_BRANCH="main"  # Fallback branch if configured one is incomplete
REPO_SECONDARY_FALLBACK_BRANCH="master"  # Secondary fallback branch
NODE_MAJOR="20"
RECLONE_IF_EXISTS="false"
STUDENT_USER="student"
STUDENT_PASS="cybersec2026"
STUDENT_HOME="/home/$STUDENT_USER"
REPO_DIR="$STUDENT_HOME/ase-cybersecurity"
LAB_DIR="$STUDENT_HOME/lab4-blockchain-defi"
LAB_REL_PATH="2026/lab4-blockchain-defi"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
GANACHE_GUI_VERSION="2.7.1"
GANACHE_GUI_ASSET="ganache-2.7.1-linux-x86_64.AppImage"
GANACHE_GUI_URL="https://github.com/ConsenSys-archive/ganache-ui/releases/download/v${GANACHE_GUI_VERSION}/${GANACHE_GUI_ASSET}"
GANACHE_GUI_DIR="/opt/ganache-ui"
GANACHE_GUI_APPIMAGE="$GANACHE_GUI_DIR/$GANACHE_GUI_ASSET"
GANACHE_GUI_APP_BIN="/usr/local/bin/ganache-gui-app"
GANACHE_GUI_BIN="/usr/local/bin/ganache-gui"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_warning "$1 is not installed"
        return 1
    fi
}

ensure_student_user() {
    if id "$STUDENT_USER" &>/dev/null; then
        print_info "User '$STUDENT_USER' already exists"
    else
        print_info "Creating user '$STUDENT_USER'..."
        sudo useradd -m -s /bin/bash "$STUDENT_USER"
        echo "$STUDENT_USER:$STUDENT_PASS" | sudo chpasswd
        sudo usermod -aG sudo "$STUDENT_USER"
        print_success "User '$STUDENT_USER' created"
    fi

    sudo mkdir -p "$STUDENT_HOME/Desktop"
    sudo chown -R "$STUDENT_USER:$STUDENT_USER" "$STUDENT_HOME"
}

validate_lab_source_dir() {
    local source_dir="$1"

    if [ -z "$source_dir" ] || ! sudo -u "$STUDENT_USER" test -d "$source_dir"; then
        return 1
    fi

    local required_files=(
        "package.json"
        "start-ganache.sh"
        "scripts/generate-instance.js"
        "scripts/lib/instance-config.js"
        "scripts/verify-setup.js"
        "contracts/SimpleVault.sol"
        "challenges/challenge1-forensics.md"
        "challenges/challenge2-reentrancy.md"
    )
    local missing_files=()

    for rel_path in "${required_files[@]}"; do
        if ! sudo -u "$STUDENT_USER" test -f "$source_dir/$rel_path"; then
            missing_files+=("$rel_path")
        fi
    done

    if [ "${#missing_files[@]}" -eq 0 ]; then
        return 0
    fi

    print_warning "Lab directory exists but is missing required files:"
    for rel_path in "${missing_files[@]}"; do
        print_warning "  - $rel_path"
    done

    return 1
}

try_checkout_branch() {
    local target_branch="$1"

    if [ -z "$target_branch" ]; then
        return 1
    fi

    print_info "Trying fallback repository branch: $target_branch"

    if ! sudo -u "$STUDENT_USER" bash -lc "git -C '$REPO_DIR' ls-remote --exit-code --heads origin '$target_branch' >/dev/null 2>&1"; then
        print_warning "Fallback branch '$target_branch' does not exist on origin"
        return 1
    fi

    if sudo -u "$STUDENT_USER" bash -lc "git -C '$REPO_DIR' fetch origin '$target_branch' --depth=1" \
        && sudo -u "$STUDENT_USER" bash -lc "git -C '$REPO_DIR' checkout -B '$target_branch' 'origin/$target_branch'"; then
        print_success "Checked out fallback branch '$target_branch'"
        return 0
    fi

    print_warning "Could not checkout fallback branch '$target_branch'"
    return 1
}

ensure_instance_config_file() {
    local source_dir="$1"
    local target_file="$source_dir/scripts/lib/instance-config.js"

    if [ -z "$source_dir" ] || ! sudo -u "$STUDENT_USER" test -d "$source_dir"; then
        return 1
    fi

    if sudo -u "$STUDENT_USER" test -f "$target_file"; then
        return 0
    fi

    print_warning "Missing scripts/lib/instance-config.js. Creating compatibility file..."
    sudo -u "$STUDENT_USER" mkdir -p "$source_dir/scripts/lib"

    cat << 'EOF' | sudo -u "$STUDENT_USER" tee "$target_file" > /dev/null
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { ethers } = require("ethers");

const DEFAULT_MNEMONIC = "test test test test test test test test test test test junk";
const HD_PATH_PREFIX = "m/44'/60'/0'/0";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const STUDENT_DIR = path.join(PROJECT_ROOT, "student");

const INSTANCE_JSON_PATH = path.join(STUDENT_DIR, "instance.json");
const INSTANCE_ENV_PATH = path.join(STUDENT_DIR, "instance.env");
const INSTANCE_MANIFEST_PATH = path.join(STUDENT_DIR, "manifest.sig");

const DEFAULT_INSTANCE = {
  version: 1,
  studentId: "default-student",
  instanceId: "lab4-default",
  seedHash: "",
  generatedAt: "",
  chain: {
    chainId: 1337,
    port: 7545,
    accounts: 10,
    defaultBalanceEth: "100",
    gasPriceWei: "20000000000",
    gasLimit: "6000000",
    mnemonic: DEFAULT_MNEMONIC
  },
  challenge1: {
    companyAccountIndex: 0,
    hopAccountIndices: [1, 2, 3],
    transferAmountsEth: ["90.0", "89.5", "89.0"],
    message: "CTF-DEFAULT: follow-the-money",
    messageHex: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("CTF-DEFAULT: follow-the-money"))
  },
  challenge2: {
    depositorAccountIndices: [1, 2, 3, 4],
    initialDepositsEth: ["30", "25", "20", "25"],
    attackDepositEth: "1.5",
    maxAttacks: 5
  },
  grading: {
    token: "CTF-DEFAULT"
  }
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function saveJson(targetPath, data) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(data, null, 2)}\n`);
}

function saveText(targetPath, content) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content.endsWith("\n") ? content : `${content}\n`);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? [...override] : [...base];
  }

  if (!isPlainObject(base)) {
    return override === undefined ? base : override;
  }

  const result = { ...base };
  const source = isPlainObject(override) ? override : {};

  Object.keys(source).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = source[key];

    if (Array.isArray(baseValue)) {
      result[key] = Array.isArray(overrideValue) ? [...overrideValue] : [...baseValue];
      return;
    }

    if (isPlainObject(baseValue)) {
      result[key] = mergeDeep(baseValue, overrideValue);
      return;
    }

    result[key] = overrideValue === undefined ? baseValue : overrideValue;
  });

  return result;
}

function parseMaybeInt(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInstanceEnv(envPath = INSTANCE_ENV_PATH) {
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const env = dotenv.parse(raw);

  return {
    version: DEFAULT_INSTANCE.version,
    studentId: env.LAB_STUDENT_ID || DEFAULT_INSTANCE.studentId,
    instanceId: env.LAB_INSTANCE_ID || DEFAULT_INSTANCE.instanceId,
    chain: {
      chainId: parseMaybeInt(env.LAB_CHAIN_ID, DEFAULT_INSTANCE.chain.chainId),
      port: parseMaybeInt(env.LAB_PORT, DEFAULT_INSTANCE.chain.port),
      accounts: parseMaybeInt(env.LAB_ACCOUNTS, DEFAULT_INSTANCE.chain.accounts),
      defaultBalanceEth:
        env.LAB_DEFAULT_BALANCE_ETH || DEFAULT_INSTANCE.chain.defaultBalanceEth,
      gasPriceWei: env.LAB_GAS_PRICE_WEI || DEFAULT_INSTANCE.chain.gasPriceWei,
      gasLimit: env.LAB_GAS_LIMIT || DEFAULT_INSTANCE.chain.gasLimit,
      mnemonic: env.LAB_MNEMONIC || DEFAULT_INSTANCE.chain.mnemonic
    }
  };
}

function readInstanceJson(instancePath = INSTANCE_JSON_PATH) {
  if (!fs.existsSync(instancePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(instancePath, "utf8"));
}

function loadInstance(options = {}) {
  const { required = false } = options;
  const defaultInstance = deepClone(DEFAULT_INSTANCE);
  const jsonInstance = readInstanceJson();

  if (jsonInstance) {
    return mergeDeep(defaultInstance, jsonInstance);
  }

  if (required) {
    throw new Error(
      `Missing required instance file at ${INSTANCE_JSON_PATH}. Run: npm run init:student -- --student-id <id>`
    );
  }

  const envInstance = parseInstanceEnv();
  if (envInstance) {
    return mergeDeep(defaultInstance, envInstance);
  }

  return defaultInstance;
}

function writeInstanceFiles({ instance, envFileContent, manifest }) {
  if (!instance || !envFileContent || !manifest) {
    throw new Error("writeInstanceFiles requires instance, envFileContent, and manifest.");
  }

  ensureDir(STUDENT_DIR);
  saveJson(INSTANCE_JSON_PATH, instance);
  saveText(INSTANCE_ENV_PATH, envFileContent);
  saveText(INSTANCE_MANIFEST_PATH, manifest);
}

function getAccountFromMnemonic(mnemonic, index = 0) {
  const accountIndex = Number(index);
  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw new Error(`Invalid mnemonic account index: ${index}`);
  }

  const derivationPath = `${HD_PATH_PREFIX}/${accountIndex}`;
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, derivationPath);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic,
    derivationPath
  };
}

module.exports = {
  DEFAULT_INSTANCE,
  PROJECT_ROOT,
  STUDENT_DIR,
  INSTANCE_JSON_PATH,
  INSTANCE_ENV_PATH,
  INSTANCE_MANIFEST_PATH,
  deepClone,
  ensureDir,
  saveJson,
  writeInstanceFiles,
  loadInstance,
  getAccountFromMnemonic
};
EOF

    print_success "Created scripts/lib/instance-config.js"
    return 0
}

################################################################################
# Main Installation Steps
################################################################################

print_header "🚀 DeFi Heist Lab - Automated VM Setup"
echo "This script will configure your VM for the Blockchain Security lab."
echo "Estimated time: 20-30 minutes"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Check if running Ubuntu
if [ ! -f /etc/lsb-release ]; then
    print_error "This script is designed for Ubuntu. Detected: $(uname -s)"
    exit 1
fi

source /etc/lsb-release
print_info "Detected: $DISTRIB_DESCRIPTION"

################################################################################
print_header "👤 Step 0: Ensuring Student User"
################################################################################

ensure_student_user
print_info "Setup target user: $STUDENT_USER ($STUDENT_HOME)"

################################################################################
print_header "📦 Step 1: System Update"
################################################################################

print_info "Updating package lists..."
sudo apt update -qq

print_info "Upgrading existing packages..."
sudo apt upgrade -y -qq

print_success "System updated successfully"

################################################################################
print_header "📦 Step 2: Installing Essential Tools"
################################################################################

print_info "Installing build essentials, git, curl, wget..."
sudo apt install -y \
    build-essential \
    git \
    curl \
    wget \
    xdotool \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

print_success "Essential tools installed"

################################################################################
print_header "🟢 Step 3: Installing Node.js ${NODE_MAJOR} LTS"
################################################################################

if check_command node; then
    NODE_VERSION=$(node --version)
    print_info "Current Node.js version: $NODE_VERSION"
    CURRENT_NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
    if [ "$CURRENT_NODE_MAJOR" -ne "$NODE_MAJOR" ]; then
        print_info "Switching Node.js to ${NODE_MAJOR} LTS for lab compatibility..."
        INSTALL_NODE=true
    else
        print_info "Node.js is already ${NODE_MAJOR} LTS; skipping reinstall"
    fi
else
    INSTALL_NODE=true
fi

if [ "$INSTALL_NODE" = true ]; then
    print_info "Installing Node.js ${NODE_MAJOR} LTS..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt install -y nodejs
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION installed"
    print_success "NPM $NPM_VERSION installed"
fi

################################################################################
print_header "⚡ Step 4: Installing Ganache CLI & GUI"
################################################################################

print_info "Installing Ganache globally..."
sudo npm install -g ganache --silent

if check_command ganache; then
    GANACHE_VERSION=$(ganache --version)
    print_success "Ganache $GANACHE_VERSION installed"
else
    print_error "Ganache installation failed"
    exit 1
fi

print_info "Installing AppImage runtime dependency for Ganache GUI..."
sudo apt install -y libfuse2

print_info "Installing Ganache GUI v${GANACHE_GUI_VERSION}..."
sudo mkdir -p "$GANACHE_GUI_DIR"
sudo wget -q -O "$GANACHE_GUI_APPIMAGE" "$GANACHE_GUI_URL"
sudo chmod +x "$GANACHE_GUI_APPIMAGE"

cat << EOF | sudo tee "$GANACHE_GUI_APP_BIN" > /dev/null
#!/bin/bash
exec "$GANACHE_GUI_APPIMAGE" --no-sandbox "\$@"
EOF

sudo chmod +x "$GANACHE_GUI_APP_BIN"

cat << 'EOF' | sudo tee "$GANACHE_GUI_BIN" > /dev/null
#!/bin/bash

if [ "${LAB_INTERNAL_GANACHE_GUI_LAUNCH:-0}" = "1" ]; then
    exec /usr/local/bin/ganache-gui-app "$@"
fi

if [ -d "$HOME/lab4-blockchain-defi" ]; then
    exec /bin/bash -lc "cd ~/lab4-blockchain-defi && ./start-ganache.sh"
fi

if [ -d "$HOME/ase-cybersecurity/2026/lab4-blockchain-defi" ]; then
    exec /bin/bash -lc "cd ~/ase-cybersecurity/2026/lab4-blockchain-defi && ./start-ganache.sh"
fi

exec /usr/local/bin/ganache-gui-app "$@"
EOF

sudo chmod +x "$GANACHE_GUI_BIN"

if [ -x "$GANACHE_GUI_BIN" ] && [ -x "$GANACHE_GUI_APP_BIN" ]; then
    print_success "Ganache GUI installed at $GANACHE_GUI_BIN"
else
    print_error "Ganache GUI installation failed"
    exit 1
fi

################################################################################
print_header "💻 Step 5: Installing VS Code"
################################################################################

if check_command code; then
    print_info "VS Code already installed"
else
    print_info "Installing VS Code..."
    
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
    sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
    sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
    rm packages.microsoft.gpg
    
    sudo apt update -qq
    sudo apt install -y code
    
    print_success "VS Code installed"
fi

# Install VS Code extensions
print_info "Installing VS Code extensions..."
code --install-extension JuanBlanco.solidity --force
code --install-extension NomicFoundation.hardhat-solidity --force
code --install-extension esbenp.prettier-vscode --force

print_success "VS Code extensions installed"

################################################################################
print_header "🦊 Step 6: Installing Firefox with MetaMask"
################################################################################

if check_command firefox; then
    print_info "Firefox already installed"
else
    print_info "Installing Firefox..."
    sudo apt install -y firefox
    print_success "Firefox installed"
fi

print_warning "MetaMask needs to be installed manually in Firefox"
print_info "Bookmark: https://addons.mozilla.org/firefox/addon/ether-metamask/"

################################################################################
print_header "📚 Step 7: Cloning Lab Repository"
################################################################################

CLONE_REPO=false
if sudo -u "$STUDENT_USER" test -d "$REPO_DIR"; then
    print_warning "Repository directory already exists: $REPO_DIR"
    CURRENT_REPO_BRANCH=$(sudo -u "$STUDENT_USER" git -C "$REPO_DIR" branch --show-current 2>/dev/null || true)
    if [ -n "$CURRENT_REPO_BRANCH" ]; then
        print_info "Existing repository branch: $CURRENT_REPO_BRANCH"
        if [ "$CURRENT_REPO_BRANCH" != "$REPO_BRANCH" ]; then
            print_warning "Configured branch is '$REPO_BRANCH', but existing repo is on '$CURRENT_REPO_BRANCH'"
        fi
    fi
    if [ "$RECLONE_IF_EXISTS" = "true" ]; then
        print_info "RECLONE_IF_EXISTS=true -> removing existing repository"
        sudo rm -rf "$REPO_DIR" "$LAB_DIR"
        CLONE_REPO=true
    else
        print_info "Reusing existing repository (no re-clone prompt)"
        CLONE_REPO=false
    fi
else
    CLONE_REPO=true
fi

if [ "$CLONE_REPO" = true ]; then
    print_info "Cloning repository from $REPO_URL (branch: $REPO_BRANCH)..."
    sudo -u "$STUDENT_USER" git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"
    print_success "Repository cloned to $REPO_DIR"
fi

LAB_SOURCE_DIR="$REPO_DIR/$LAB_REL_PATH"
if ! sudo -u "$STUDENT_USER" test -d "$LAB_SOURCE_DIR"; then
    print_warning "Expected lab path not found: $LAB_SOURCE_DIR"
    LAB_SOURCE_DIR=$(sudo -u "$STUDENT_USER" find "$REPO_DIR" -maxdepth 4 -type d -name "lab4-blockchain-defi" | head -1)
fi

if sudo -u "$STUDENT_USER" test -d "$LAB_SOURCE_DIR"; then
    ensure_instance_config_file "$LAB_SOURCE_DIR" || true
fi

LAB_SOURCE_OK=false
if validate_lab_source_dir "$LAB_SOURCE_DIR"; then
    LAB_SOURCE_OK=true
fi

REPO_EFFECTIVE_BRANCH="$REPO_BRANCH"

if [ "$LAB_SOURCE_OK" != "true" ]; then
    for fallback_branch in "$REPO_FALLBACK_BRANCH" "$REPO_SECONDARY_FALLBACK_BRANCH"; do
        if [ "$LAB_SOURCE_OK" = "true" ]; then
            break
        fi

        if [ -z "$fallback_branch" ] || [ "$fallback_branch" = "$REPO_BRANCH" ]; then
            continue
        fi

        if try_checkout_branch "$fallback_branch"; then
            LAB_SOURCE_DIR="$REPO_DIR/$LAB_REL_PATH"
            if ! sudo -u "$STUDENT_USER" test -d "$LAB_SOURCE_DIR"; then
                LAB_SOURCE_DIR=$(sudo -u "$STUDENT_USER" find "$REPO_DIR" -maxdepth 4 -type d -name "lab4-blockchain-defi" | head -1)
            fi

            if sudo -u "$STUDENT_USER" test -d "$LAB_SOURCE_DIR"; then
                ensure_instance_config_file "$LAB_SOURCE_DIR" || true
            fi

            if validate_lab_source_dir "$LAB_SOURCE_DIR"; then
                LAB_SOURCE_OK=true
                REPO_EFFECTIVE_BRANCH="$fallback_branch"
            fi
        fi
    done
fi

if [ "$LAB_SOURCE_OK" != "true" ]; then
    print_warning "Lab directory is missing or incomplete in repository"

    if [ -n "$LOCAL_REPO_ROOT" ] && [ -d "$LOCAL_REPO_ROOT/$LAB_REL_PATH" ]; then
        print_info "Using local repository fallback: $LOCAL_REPO_ROOT"
        sudo rm -rf "$REPO_DIR"
        sudo cp -a "$LOCAL_REPO_ROOT" "$REPO_DIR"
        sudo chown -R "$STUDENT_USER:$STUDENT_USER" "$REPO_DIR"
        LAB_SOURCE_DIR="$REPO_DIR/$LAB_REL_PATH"

        if sudo -u "$STUDENT_USER" test -d "$LAB_SOURCE_DIR"; then
            ensure_instance_config_file "$LAB_SOURCE_DIR" || true
        fi

        if validate_lab_source_dir "$LAB_SOURCE_DIR"; then
            LAB_SOURCE_OK=true
            REPO_EFFECTIVE_BRANCH="local-fallback"
        fi
    fi
fi

if [ "$LAB_SOURCE_OK" != "true" ]; then
    print_error "Could not locate a complete lab directory in cloned repository or local fallback"
    print_info "Checked path: $REPO_DIR/$LAB_REL_PATH"
    print_info "Fallback branches: $REPO_FALLBACK_BRANCH, $REPO_SECONDARY_FALLBACK_BRANCH"
    print_info "Configured repository URL: $REPO_URL"
    exit 1
fi

# Create symlink for easy access in student home (always refresh)
sudo -u "$STUDENT_USER" rm -rf "$LAB_DIR"
sudo -u "$STUDENT_USER" ln -s "$LAB_SOURCE_DIR" "$LAB_DIR"

if ! sudo -u "$STUDENT_USER" test -d "$LAB_DIR"; then
    print_error "Lab symlink is invalid: $LAB_DIR -> $LAB_SOURCE_DIR"
    exit 1
fi

print_success "Symlink created: $LAB_DIR"

################################################################################
print_header "📦 Step 8: Installing NPM Dependencies"
################################################################################

print_info "Installing npm dependencies as '$STUDENT_USER' (this may take a few minutes)..."
sudo -u "$STUDENT_USER" bash -lc "cd '$LAB_DIR' && npm install --silent"
print_success "NPM dependencies installed successfully"

################################################################################
print_header "🔧 Step 9: Running Setup Verification"
################################################################################

print_info "Running setup verification script as '$STUDENT_USER'..."
if sudo -u "$STUDENT_USER" bash -lc "cd '$LAB_DIR' && node scripts/verify-setup.js"; then
    print_success "Setup verification passed"
else
    print_warning "Setup verification reported pending runtime steps (expected before init/deploy)"
    print_info "After login run: cd ~/lab4-blockchain-defi && npm run init:student -- --student-id <id> && ./start-ganache.sh && npm run deploy:all && npm run verify-setup"
fi

################################################################################
print_header "🎨 Step 10: Creating Desktop Shortcuts"
################################################################################

DESKTOP_DIR="$STUDENT_HOME/Desktop"
AUTOSTART_DIR="$STUDENT_HOME/.config/autostart"
sudo -u "$STUDENT_USER" mkdir -p "$DESKTOP_DIR"
sudo -u "$STUDENT_USER" mkdir -p "$AUTOSTART_DIR"
sudo -u "$STUDENT_USER" rm -f "$DESKTOP_DIR/Open-Ganache-GUI.desktop" "$DESKTOP_DIR/Lab-Instructions.desktop"

# Start Ganache shortcut
cat << 'EOF' | sudo tee "$DESKTOP_DIR/Start-Ganache.desktop" > /dev/null
[Desktop Entry]
Version=1.0
Type=Application
Name=Start Ganache
Comment=Start Ganache blockchain for DeFi Heist Lab
Exec=gnome-terminal -- bash -c "cd ~/lab4-blockchain-defi && ./start-ganache.sh; exec bash"
Icon=utilities-terminal
Terminal=false
Categories=Development;
EOF

sudo chmod +x "$DESKTOP_DIR/Start-Ganache.desktop"

# VS Code Lab shortcut
cat << EOF | sudo tee "$DESKTOP_DIR/Open-Lab.desktop" > /dev/null
[Desktop Entry]
Version=1.0
Type=Application
Name=Open Lab in VS Code
Comment=Open DeFi Heist Lab in VS Code
Exec=code "$LAB_DIR"
Icon=code
Terminal=false
Categories=Development;
EOF

sudo chmod +x "$DESKTOP_DIR/Open-Lab.desktop"
cat << 'EOF' | sudo tee "$AUTOSTART_DIR/Ganache-Autostart.desktop" > /dev/null
[Desktop Entry]
Version=1.0
Type=Application
Name=Ganache Autostart
Comment=Start Ganache automatically for DeFi Heist Lab
Exec=/bin/bash -lc "cd ~/lab4-blockchain-defi && LAB_AUTO_START=1 ./start-ganache.sh >> ~/ganache.log 2>&1"
Terminal=false
X-GNOME-Autostart-enabled=true
Categories=Development;
EOF

sudo chmod +x "$AUTOSTART_DIR/Ganache-Autostart.desktop"
sudo chown -R "$STUDENT_USER:$STUDENT_USER" "$DESKTOP_DIR"
sudo chown -R "$STUDENT_USER:$STUDENT_USER" "$AUTOSTART_DIR"

print_success "Desktop shortcuts and Ganache autostart created"

################################################################################
print_header "👤 Step 11: Student User Summary"
################################################################################

print_success "Student user is configured"
print_info "Username: $STUDENT_USER"
print_info "Password: $STUDENT_PASS"
print_info "Lab path: $LAB_DIR"
print_info "Repository path: $REPO_DIR"
print_info "Repository branch: $REPO_BRANCH"
print_info "Repository fallback branch: $REPO_FALLBACK_BRANCH"
print_info "Repository secondary fallback branch: $REPO_SECONDARY_FALLBACK_BRANCH"
print_info "Repository effective branch: ${REPO_EFFECTIVE_BRANCH:-$REPO_BRANCH}"

################################################################################
print_header "🧹 Step 12: Cleanup and Optimization"
################################################################################

print_info "Cleaning up..."

# Clear apt cache
sudo apt autoremove -y -qq
sudo apt clean

# Clear npm cache
npm cache clean --force --silent

# Clear bash history (for clean VM)
history -c
rm -f ~/.bash_history

print_success "Cleanup complete"

################################################################################
print_header "✅ Setup Complete!"
################################################################################

echo ""
print_success "VM setup completed successfully! 🎉"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 What was installed:"
echo "  ✅ Node.js $(node --version)"
echo "  ✅ NPM $(npm --version)"
echo "  ✅ Ganache CLI $(ganache --version 2>&1 | head -1)"
echo "  ✅ Ganache GUI v${GANACHE_GUI_VERSION}"
echo "  ✅ VS Code with Solidity extensions"
echo "  ✅ Firefox browser"
echo "  ✅ Lab repository and dependencies"
echo ""
echo "📁 Lab location: $LAB_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. Reboot the VM (recommended)"
echo "  2. Login as '$STUDENT_USER'"
echo "  3. Run: npm run init:student -- --student-id <id>"
echo "  4. Wait for next login autostart or run ./start-ganache.sh once"
echo "  5. Double-click 'Open-Lab' to open VS Code"
echo "  6. Use GETTING_STARTED.md for the lab flow"
echo ""
echo "📖 Manual start commands:"
echo "  cd ~/lab4-blockchain-defi"
echo "  npm run init:student -- --student-id <id>"
echo "  ./start-ganache.sh              # Open the preconfigured Ganache GUI"
echo "  LAB_GANACHE_MODE=cli ./start-ganache.sh  # Fallback CLI mode"
echo "  npm run deploy:all              # Deploy contracts"
echo "  npm run verify-setup            # Verify setup"
echo "  code .                          # Open in VS Code"
echo ""
echo "🦊 Don't forget to:"
echo "  - Install MetaMask in Firefox"
echo "  - Configure MetaMask for localhost:7545"
echo "  - Import only the primary Ganache account once per VM"
echo "  - Check ~/ganache.log if you need the startup details"
echo "  - Use the Ganache GUI opened by ./start-ganache.sh, not a manually created workspace"
echo ""
echo "📧 Support: lcretu@bitdefender.com"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Press Enter to finish (or Ctrl+C to exit without reboot)..."

# Ask to reboot
echo ""
read -p "Reboot now? (recommended) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Rebooting in 5 seconds... (Ctrl+C to cancel)"
    sleep 5
    sudo reboot
else
    print_info "Setup complete! Please reboot manually when ready."
fi
