import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'hardhat-change-network';
import '@primitivefi/hardhat-marmite';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: '0.8.9',
  networks: {
    hardhat: {
      blockGasLimit: 100_000_000
    },
    mumbai: {
      chainId: 80001,
      url: require('dotenv').config({ path: '.env.80001' }).parsed.RPC_ENDPOINT
    },
    rinkeby: {
      chainId: 4,
      url: require('dotenv').config({ path: '.env.4' }).parsed.RPC_ENDPOINT
    },
    polygon: {
      chainId: 137,
      url: require('dotenv').config({ path: '.env.137' }).parsed.RPC_ENDPOINT
    },
    mainnet: {
      chainId: 1,
      url: require('dotenv').config({ path: '.env.1' }).parsed.RPC_ENDPOINT
    }
  },
  etherscan: {
    apiKey: 'KCEM61R2DK9FZJRW1QX6RD51MWENTRGTG4'
    // apiKey: 'T1SWFR6QNDS9HX4QFA1VH2E3HXK9AC96TT'
  },
  mocha: {
    timeout: 30000
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: 'USD',
    gasPrice: 150,
    token: 'MATIC'
  }
};
