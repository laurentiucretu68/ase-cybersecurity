require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

const { ethers } = require("ethers");
const { loadInstance } = require("./scripts/lib/instance-config");

const instance = loadInstance();
const chain = instance.chain;

const sharedAccounts = {
  mnemonic: chain.mnemonic,
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: Number(chain.accounts)
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: Number(chain.chainId),
      accounts: {
        ...sharedAccounts,
        accountsBalance: ethers.utils
          .parseEther(String(chain.defaultBalanceEth))
          .toString()
      }
    },
    localhost: {
      url: `http://127.0.0.1:${chain.port}`,
      chainId: Number(chain.chainId),
      accounts: sharedAccounts,
      gasPrice: Number(chain.gasPriceWei),
      gas: Number(chain.gasLimit)
    },
    ganache: {
      url: `http://127.0.0.1:${chain.port}`,
      chainId: Number(chain.chainId),
      accounts: sharedAccounts,
      gasPrice: Number(chain.gasPriceWei),
      gas: Number(chain.gasLimit)
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};
