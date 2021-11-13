import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import fs from 'fs';

import chroma from 'chroma-js';

import GenericRendererArtifact from '../artifacts/contracts/GenericRenderer.sol/GenericRenderer.json';
import { GenericRenderer } from '../typechain';

const { deployContract } = waffle;

const RAINBOW_SCALE = chroma
  .scale(['#f00', '#0f0', '#00f', '#f00'])
  .mode('hsl');
const CUBEHELIX_SCALE = chroma.cubehelix().gamma(0.6).scale();

function saveSVG(data: string, name: string) {
  // mkdir test/svg
  fs.mkdir('test/svg', (e) => {
    if (e && e.code != 'EEXIST') {
      console.log(e);
    }
  });
  fs.writeFile(`test/svg/${name}.svg`, data, (e) => {
    if (e) console.log(e);
    else console.log(`wrote test/svg/${name}.svg`);
  });
}

async function renderCubeHelix(
  renderer: GenericRenderer,
  numRows: number,
  numCols: number,
  numColors: number
) {
  const result = await renderer.renderSVG(
    generatePixels(numRows, numCols, numColors),
    CUBEHELIX_SCALE.colors(numColors),
    numRows,
    numCols
  );
  saveSVG(result, `HELIX_${numColors}COLORS_${numCols}x${numRows}`);
}

async function renderRainbow(
  renderer: GenericRenderer,
  numRows: number,
  numCols: number,
  numColors: number
) {
  const result = await renderer.renderSVG(
    generatePixels(numRows, numCols, numColors),
    RAINBOW_SCALE.colors(numColors),
    numRows,
    numCols
  );
  saveSVG(result, `RAINBOW_${numColors}COLORS_${numCols}x${numRows}`);
}

function generatePixels(nRows: number, nCols: number, nColors: number) {
  var s = '0x';
  for (var i = 0; i < nRows * nCols; i++) {
    let colorIndex = i % nColors;
    if ((colorIndex % nColors) / 16 < 1) {
      s += '0' + colorIndex.toString(16);
    } else {
      s += colorIndex.toString(16);
    }
  }
  return s;
}

describe('Renderer', () => {
  let numbers: ;

  beforeEach(async () => {
    // 1
    const signers = await ethers.getSigners();

    // 2
    renderer = (await deployContract(
      signers[0],
      GenericRendererArtifact
    )) as GenericRenderer;
  });

  // /* ~~~~~~~~~~~~~~ TEST 2 COLORS: 16x16 -> 32x32 ~~~~~~~~~~~~~~ */
  // for (let v = 16; v <= 56; v += 4) {
  //   describe(`${v}x${v} - 2 Colors`, function () {
  //     it(`Should render ${v}x${v} with 2 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 2;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

});
