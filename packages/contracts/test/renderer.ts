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
  let renderer: GenericRenderer;

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

  // // /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 16x16 -> 32x32 ~~~~~~~~~~~~~~ */
  // for (let v = 16; v <= 56; v += 4) {
  //   describe(`${v}x${v} - 16 Colors`, function () {
  //     it(`Should render ${v}x${v} with 16 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 16;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // //   /* ~~~~~~~~~~~~~~ TEST 2 -> 16 COLORS: 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 2; v <= 16; v += 1) {
  //   describe(`56x56 - ${v} Colors`, function () {
  //     it(`Should render 56x56 with ${v} Colors`, async function () {
  //       const WIDTH = 56;
  //       const HEIGHT = 56;
  //       const NUM_COLORS = v;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // //   /* ~~~~~~~~~~~~~~ TEST 2 -> 16 COLORS: 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 2; v <= 16; v += 1) {
  //   describe(`56x56 - ${v} Colors`, function () {
  //     it(`Should render 56x56 with ${v} Colors`, async function () {
  //       const WIDTH = 56;
  //       const HEIGHT = 56;
  //       const NUM_COLORS = v;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  //   /* ~~~~~~~~~~~~~~ TEST 16 -> 256 COLORS: 32x32 ~~~~~~~~~~~~~~ */
  // for (let v = 16; v <= 256; v += 16) {
  //   describe(`32x32 - ${v} Colors`, function () {
  //     it(`Should render 32x32 with ${v} Colors`, async function () {
  //       const WIDTH = 32;
  //       const HEIGHT = 32;
  //       const NUM_COLORS = v;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  //   /* ~~~~~~~~~~~~~~ TEST 16 -> 256 COLORS: 56x56 ~~~~~~~~~~~~~~ */
  for (let v = 16; v <= 64; v += 16) {
    describe(`56x56 - ${v} Colors`, function () {
      it(`Should render 56x56 with ${v} Colors`, async function () {
        const WIDTH = 56;
        const HEIGHT = 56;
        const NUM_COLORS = v;

        const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
      });
    });
  }

  //   /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 4x16 -> 16x16 ~~~~~~~~~~~~~~ */
  //   for (let v = 4; v <= 16; v += 4) {
  //     describe(`${v}x${16} - 16 Colors`, function () {
  //       it(`Should render ${v}x${16} with 16 Colors`, async function () {
  //         const WIDTH = v;
  //         const HEIGHT = 16;
  //         const NUM_COLORS = 16;

  //         const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //       });
  //     });
  //   }

  //   /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 16x4 -> 16x16 ~~~~~~~~~~~~~~ */
  //   for (let v = 4; v <= 16; v += 4) {
  //     describe(`${16}x${v} - 16 Colors`, function () {
  //       it(`Should render ${16}x${v} with 16 Colors`, async function () {
  //         const WIDTH = 16;
  //         const HEIGHT = v;
  //         const NUM_COLORS = 16;

  //         const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //       });
  //     });
  //   }
});
