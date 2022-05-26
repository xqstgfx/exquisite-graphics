import fs from 'fs-extra';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { XQSTGFX__factory } from '../typechain';
import hre from 'hardhat';
import 'hardhat-change-network';

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
    chainId == 4 ? 'rinkeby' : chainId == 80001 ? 'mumbai' : 'mainnet';

  hre.changeNetwork(deployNetwork);

  if (!addressBook.render) {
    console.log('Deploying exquisite graphics...');
    const deployTx = await new XQSTGFX__factory(wallet).deploy();
    console.log('Deploy TX: ', deployTx.deployTransaction.hash);
    await deployTx.deployed();
    console.log('exquisite graphics deployed at ', deployTx.address);
    addressBook.render = deployTx.address;
    await fs.writeFile(addressesPath, JSON.stringify(addressBook, null, 2));
    console.log('Waiting for more confirmations before verify…');
    const tx = await deployTx.deployTransaction.wait(10);
    console.log('Verifying contract...');
  }

  await hre.run('verify:verify', {
    address: addressBook.render,
    constructorArguments: []
  });

  console.log('Deployed!');
}

start().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
