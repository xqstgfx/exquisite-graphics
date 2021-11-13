import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'hardhat-change-network';

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
    mumbai: {
      chainId: 80001,
      url: require('dotenv').config({ path: '.env.80001' }).parsed.RPC_ENDPOINT
    },
    matic: {
      chainId: 137,
      url: require('dotenv').config({ path: '.env.137' }).parsed.RPC_ENDPOINT
    }
  },
  etherscan: {
    apiKey: 'KZ9KA8WH63FHJYFVYCWN7DH7KGBKF3NQ6I'
  }
};
