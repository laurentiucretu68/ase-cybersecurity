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
#   ✅ Installs Ganache CLI
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
REPO_URL="https://github.com/lcretu/ase-cybersecurity.git"  # UPDATE THIS!
LAB_DIR="$HOME/lab4-blockchain-defi"
STUDENT_USER="student"
STUDENT_PASS="cybersec2026"

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
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

print_success "Essential tools installed"

################################################################################
print_header "🟢 Step 3: Installing Node.js 18 LTS"
################################################################################

if check_command node; then
    NODE_VERSION=$(node --version)
    print_info "Current Node.js version: $NODE_VERSION"
    read -p "Reinstall Node.js 18? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping Node.js installation"
    else
        INSTALL_NODE=true
    fi
else
    INSTALL_NODE=true
fi

if [ "$INSTALL_NODE" = true ]; then
    print_info "Installing Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION installed"
    print_success "NPM $NPM_VERSION installed"
fi

################################################################################
print_header "⚡ Step 4: Installing Ganache CLI"
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

if [ -d "$LAB_DIR" ]; then
    print_warning "Lab directory already exists: $LAB_DIR"
    read -p "Delete and re-clone? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$LAB_DIR"
        CLONE_REPO=true
    fi
else
    CLONE_REPO=true
fi

if [ "$CLONE_REPO" = true ]; then
    print_info "Cloning repository from $REPO_URL..."
    git clone "$REPO_URL" "$HOME/ase-cybersecurity"
    
    # Create symlink for easy access
    ln -sf "$HOME/ase-cybersecurity/2026/lab4-blockchain-defi" "$LAB_DIR"
    
    print_success "Repository cloned to $HOME/ase-cybersecurity"
    print_success "Symlink created: $LAB_DIR"
fi

################################################################################
print_header "📦 Step 8: Installing NPM Dependencies"
################################################################################

print_info "Installing npm dependencies (this may take a few minutes)..."
cd "$LAB_DIR"

npm install --silent

if [ $? -eq 0 ]; then
    print_success "NPM dependencies installed successfully"
else
    print_error "NPM installation failed"
    exit 1
fi

################################################################################
print_header "🔧 Step 9: Running Setup Verification"
################################################################################

print_info "Running setup verification script..."
node scripts/verify-setup.js

################################################################################
print_header "🎨 Step 10: Creating Desktop Shortcuts"
################################################################################

DESKTOP_DIR="$HOME/Desktop"
mkdir -p "$DESKTOP_DIR"

# Start Ganache shortcut
cat > "$DESKTOP_DIR/Start-Ganache.desktop" << 'EOF'
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

chmod +x "$DESKTOP_DIR/Start-Ganache.desktop"

# VS Code Lab shortcut
cat > "$DESKTOP_DIR/Open-Lab.desktop" << EOF
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

chmod +x "$DESKTOP_DIR/Open-Lab.desktop"

# Lab README shortcut
cat > "$DESKTOP_DIR/Lab-Instructions.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Lab Instructions
Comment=Open lab instructions in browser
Exec=firefox "$LAB_DIR/GETTING_STARTED.md"
Icon=firefox
Terminal=false
Categories=Education;
EOF

chmod +x "$DESKTOP_DIR/Lab-Instructions.desktop"

print_success "Desktop shortcuts created"

################################################################################
print_header "👤 Step 11: Creating Student User (Optional)"
################################################################################

if id "$STUDENT_USER" &>/dev/null; then
    print_info "User '$STUDENT_USER' already exists"
else
    read -p "Create student user '$STUDENT_USER' with password '$STUDENT_PASS'? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating user '$STUDENT_USER'..."
        
        sudo useradd -m -s /bin/bash "$STUDENT_USER"
        echo "$STUDENT_USER:$STUDENT_PASS" | sudo chpasswd
        sudo usermod -aG sudo "$STUDENT_USER"
        
        # Copy lab to student home
        sudo cp -r "$HOME/ase-cybersecurity" "/home/$STUDENT_USER/"
        sudo ln -sf "/home/$STUDENT_USER/ase-cybersecurity/2026/lab4-blockchain-defi" "/home/$STUDENT_USER/lab4-blockchain-defi"
        sudo chown -R "$STUDENT_USER:$STUDENT_USER" "/home/$STUDENT_USER/ase-cybersecurity"
        sudo chown -R "$STUDENT_USER:$STUDENT_USER" "/home/$STUDENT_USER/lab4-blockchain-defi"
        
        # Copy desktop shortcuts
        sudo mkdir -p "/home/$STUDENT_USER/Desktop"
        sudo cp "$DESKTOP_DIR"/*.desktop "/home/$STUDENT_USER/Desktop/"
        sudo chown -R "$STUDENT_USER:$STUDENT_USER" "/home/$STUDENT_USER/Desktop"
        
        print_success "Student user created"
        print_info "Username: $STUDENT_USER"
        print_info "Password: $STUDENT_PASS"
    fi
fi

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
echo "  ✅ Ganache $(ganache --version 2>&1 | head -1)"
echo "  ✅ VS Code with Solidity extensions"
echo "  ✅ Firefox browser"
echo "  ✅ Lab repository and dependencies"
echo ""
echo "📁 Lab location: $LAB_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. Reboot the VM (recommended)"
echo "  2. Double-click 'Start-Ganache' on Desktop"
echo "  3. Double-click 'Open-Lab' to open VS Code"
echo "  4. Read 'Lab-Instructions' to get started"
echo ""
echo "📖 Manual start commands:"
echo "  cd ~/lab4-blockchain-defi"
echo "  npm run init:student -- --student-id <id>"
echo "  ./start-ganache.sh              # Start blockchain"
echo "  npm run deploy:all              # Deploy contracts"
echo "  npm run verify-setup            # Verify setup"
echo "  code .                          # Open in VS Code"
echo ""
echo "🦊 Don't forget to:"
echo "  - Install MetaMask in Firefox"
echo "  - Configure MetaMask for localhost:7545"
echo "  - Import Ganache accounts (see vm-setup/README.md)"
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
