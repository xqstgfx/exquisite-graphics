import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import NumbersArtifact from '../artifacts/contracts/Numbers.sol/Numbers.json';
import { Numbers } from '../typechain';

const { deployContract } = waffle;

describe('Renderer', () => {
  let numbers: Numbers;

  beforeEach(async () => {
    // 1
    const signers = await ethers.getSigners();
    // 2
    numbers = (await deployContract(signers[0], NumbersArtifact)) as Numbers;
  });

  describe('do something', function () {
    it('should do something', async function () {
      const oneHundered = await numbers.getNum(100);
      console.log(oneHundered);
      const one337 = await numbers.getNum(1337);
      console.log(one337);
    });
  });
});
