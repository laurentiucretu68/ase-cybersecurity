const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadInstance } = require("./lib/instance-config");

const DEFAULT_WORKSPACE_NAME = process.env.LAB_GANACHE_GUI_WORKSPACE_NAME || "BLOCKCHAIN-DEFI";
const DEFAULT_VISIBLE_ACCOUNTS = 1;
const DEFAULT_GUI_HARDFORK = process.env.LAB_GANACHE_GUI_HARDFORK || "merge";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(targetPath, data) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(data, null, 2)}\n`);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function sanitizeWorkspaceName(name) {
  return name.replace(/\s/g, "-").replace(/[^a-zA-Z0-9\-_.]/g, "_") || "_";
}

function resetChaindata(chaindataDir) {
  fs.rmSync(chaindataDir, { recursive: true, force: true });
  ensureDir(chaindataDir);
}

function resolveGanacheUiDir() {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdgConfigHome, "Ganache", "ui");
}

function createWorkspaceSettings({
  name,
  isDefault,
  mnemonic,
  visibleAccounts,
  chainId,
  port,
  defaultBalanceEth,
  gasPriceWei,
  gasLimit
}) {
  return {
    name,
    flavor: "ethereum",
    libVersion: 7,
    isDefault,
    verboseLogging: false,
    randomizeMnemonicOnStart: false,
    logsDirectory: null,
    projects: [],
    server: {
      flavor: "ethereum",
      hostname: "127.0.0.1",
      port,
      network_id: chainId,
      default_balance_ether: Number(defaultBalanceEth),
      total_accounts: visibleAccounts,
      unlocked_accounts: [],
      locked: false,
      vmErrorsOnRPCResponse: true,
      logger: null,
      verbose: false,
      gasLimit,
      gasPrice: Number(gasPriceWei),
      hardfork: DEFAULT_GUI_HARDFORK,
      fork: null,
      fork_block_number: null,
      mnemonic
    }
  };
}

function main() {
  const instance = loadInstance();
  const chain = instance.chain || {};

  const visibleAccounts = parsePositiveInt(
    process.env.LAB_VISIBLE_ACCOUNTS,
    DEFAULT_VISIBLE_ACCOUNTS
  );
  const chainId = parsePositiveInt(process.env.LAB_CHAIN_ID, Number(chain.chainId) || 1337);
  const port = parsePositiveInt(process.env.LAB_PORT, Number(chain.port) || 7545);
  const gasLimit = parsePositiveInt(process.env.LAB_GAS_LIMIT, Number(chain.gasLimit) || 6000000);
  const defaultBalanceEth = String(
    process.env.LAB_DEFAULT_BALANCE_ETH || chain.defaultBalanceEth || "100"
  );
  const gasPriceWei = String(process.env.LAB_GAS_PRICE_WEI || chain.gasPriceWei || "20000000000");
  const mnemonic = process.env.LAB_MNEMONIC || chain.mnemonic;

  if (!mnemonic) {
    throw new Error("Ganache GUI configuration requires LAB_MNEMONIC or an initialized instance.");
  }

  const uiDir = resolveGanacheUiDir();
  const defaultWorkspaceDir = path.join(uiDir, "default");
  const defaultChaindataDir = path.join(defaultWorkspaceDir, "chaindata");
  const namedWorkspaceDir = path.join(
    uiDir,
    "workspaces",
    sanitizeWorkspaceName(DEFAULT_WORKSPACE_NAME)
  );
  const namedChaindataDir = path.join(namedWorkspaceDir, "chaindata");
  const globalSettingsDir = path.join(uiDir, "global");

  ensureDir(path.join(uiDir, "workspaces"));
  ensureDir(globalSettingsDir);
  ensureDir(defaultWorkspaceDir);
  ensureDir(namedWorkspaceDir);

  resetChaindata(defaultChaindataDir);
  resetChaindata(namedChaindataDir);

  writeJson(path.join(globalSettingsDir, "Settings"), {
    googleAnalyticsTracking: false,
    cpuAndMemoryProfiling: false,
    firstRun: false,
    last_flavor: "ethereum"
  });

  const sharedSettings = {
    mnemonic,
    visibleAccounts,
    chainId,
    port,
    defaultBalanceEth,
    gasPriceWei,
    gasLimit
  };

  writeJson(
    path.join(defaultWorkspaceDir, "Settings"),
    createWorkspaceSettings({
      ...sharedSettings,
      name: "Quickstart",
      isDefault: true
    })
  );

  writeJson(
    path.join(namedWorkspaceDir, "Settings"),
    createWorkspaceSettings({
      ...sharedSettings,
      name: DEFAULT_WORKSPACE_NAME,
      isDefault: false
    })
  );

  console.log(`Ganache GUI profile prepared in ${uiDir}`);
  console.log(`Quickstart and workspace '${DEFAULT_WORKSPACE_NAME}' now use ${visibleAccounts} visible account(s)`);
  console.log(`RPC: http://127.0.0.1:${port} | network_id: ${chainId} | hardfork: ${DEFAULT_GUI_HARDFORK}`);
}

main();
