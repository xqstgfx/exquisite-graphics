import fs from 'fs-extra';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ExquisiteVault__factory } from '../typechain';
import hre from 'hardhat';
import 'hardhat-change-network';
import { parseUnits } from 'ethers/lib/utils';

async function start() {
  const args = require('minimist')(process.argv.slice(2));

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required');
  }
  const chainId = args.chainId;

  const path = `${process.cwd()}/.env.${chainId}`;
  const env = require('dotenv').config({ path }).parsed;
  const provider = new JsonRpcProvider(env.RPC_ENDPOINT);
  const wallet = new Wallet(`0x${env.PRIVATE_KEY}`, provider);
  const addressesPath = `${process.cwd()}/addresses/${chainId}${
    args.dev ? '-dev' : ''
  }.json`;
  const addressBook = JSON.parse(
    await fs.readFileSync(addressesPath).toString()
  );
  const deployNetwork =
    chainId == 4
      ? 'rinkeby'
      : chainId == 80001
      ? 'mumbai'
      : chainId == 137
      ? 'polygon'
      : chainId == 5
      ? 'goerli'
      : chainId == 100
      ? 'gnosis'
      : 'mainnet';

  hre.changeNetwork(deployNetwork);

  if (!addressBook.vault) {
    console.log('Deploying exquisite vault...');
    const deployTx = await new ExquisiteVault__factory(wallet).deploy({
      // gasPrice: parseUnits('47.0', 'gwei')
    });
    console.log('Deploy TX: ', deployTx.deployTransaction.hash);
    await deployTx.deployed();
    console.log('exquisite vault deployed at ', deployTx.address);
    addressBook.vault = deployTx.address;
    await fs.writeFile(addressesPath, JSON.stringify(addressBook, null, 2));
    console.log('Waiting for more confirmations before verify…');
    const tx = await deployTx.deployTransaction.wait(5);
    console.log('Verifying contract...');
  }

  await hre.run('verify:verify', {
    address: addressBook.vault,
    constructorArguments: []
  });

  console.log('Deployed!');
}

start().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
