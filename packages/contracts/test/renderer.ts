import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import fs from 'fs';

import chroma from 'chroma-js';

import { XQSTRENDER, Numbers } from '../typechain';

const RAINBOW_SCALE = chroma
  .scale(['#f00', '#0f0', '#00f', '#f00'])
  .mode('hsl');
const CUBEHELIX_SCALE = chroma.cubehelix().gamma(0.6).scale();

function getSVG(
  colorScale: chroma.Scale<chroma.Color>,
  nRows: number,
  nCols: number,
  nColors: number,
  rleEnabled: boolean = false
) {
  let expectedSVG = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ${
    nCols * 16
  } ${nRows * 16}"><g transform="scale(16 16)">`;
  const palette = colorScale.colors(nColors);

  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      let colorIndex = (row * nCols + col) % nColors;
      expectedSVG += `<rect fill="${palette[colorIndex]}" x="${col}" y="${row}" height="1" width="1"/>`;
    }
  }

  expectedSVG += '</g></svg>';
  return expectedSVG;
}

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

type PixelOptions = {
  backgroundEnabled?: number;
  backgroundColorIndex?: number;
  paletteInHeader?: number;
  rleEnabled?: number;
};

function generatePixelHeader(
  width: number,
  height: number,
  nColors: number,
  version: number = 1,
  options?: PixelOptions
) {
  if (options) {
    console.log('options', options);
  }
  let header = '';
  let lastByte = 0;

  if (options) {
    // TODO, use get bit and set bit to do this.
    if (options.paletteInHeader && options.paletteInHeader == 1) {
      lastByte |= 1 << 2;
    }

    if (options.backgroundEnabled && options.backgroundEnabled == 1) {
      lastByte |= 1 << 1;
    }

    if (options.rleEnabled && options.rleEnabled == 1) {
      lastByte |= 1;
    }
  }

  header += `${version.toString(16).padStart(2, '0')}`;
  header += `${width.toString(16).padStart(2, '0')}`;
  header += `${height.toString(16).padStart(2, '0')}`;
  header += `${nColors.toString(16).padStart(4, '0')}`;

  if (options && options.backgroundColorIndex) {
    header += `${options.backgroundColorIndex.toString(16).padStart(2, '0')}`;
  } else {
    header += '00';
  }

  header += '000'; // reserved
  header += lastByte;

  console.log(header);

  return header;
}

async function renderCubeHelix(
  renderer: XQSTRENDER,
  numRows: number,
  numCols: number,
  numColors: number,
  backgroundEnabled: number = 0,
  backgroundColorIndex: number = 0
) {
  const options: PixelOptions = {
    backgroundEnabled,
    backgroundColorIndex
  };
  const data = `0x${generatePixelHeader(
    numCols,
    numRows,
    numColors,
    1,
    options
  )}${generatePixels(numRows, numCols, numColors)}`;

  const result = await renderer.renderSVG(
    data,
    CUBEHELIX_SCALE.colors(numColors)
  );

  // TODO fix getSVG to do both
  if (backgroundEnabled) {
  } else {
    expect(result).to.equal(
      getSVG(CUBEHELIX_SCALE, numRows, numCols, numColors)
    );
  }
  saveSVG(result, `NEW_HELIX_${numColors}COLORS_${numCols}x${numRows}`);
}

async function renderRainbow(
  renderer: XQSTRENDER,
  numRows: number,
  numCols: number,
  numColors: number
) {
  const data = `0x${generatePixelHeader(
    numCols,
    numRows,
    numColors
  )}${generatePixels(numRows, numCols, numColors)}`;

  const result = await renderer.renderSVG(
    data,
    RAINBOW_SCALE.colors(numColors)
  );
  saveSVG(result, `RAINBOW_${numColors}COLORS_${numCols}x${numRows}`);
}

function generatePixels8bpp(nRows: number, nCols: number, nColors: number) {
  var s = '';
  for (var i = 0; i < nRows * nCols; i++) {
    let colorIndex = i % nColors;
    s += colorIndex.toString(16).padStart(2, '0');
  }
  return s;
}

const getPixelInfo = (nColors: number): { ppb: number; bpp: number } => {
  if (nColors > 16) return { ppb: 1, bpp: 8 };
  if (nColors > 4) return { ppb: 2, bpp: 4 };
  if (nColors > 2) return { ppb: 4, bpp: 2 };
  return { ppb: 8, bpp: 1 };
};

function generatePixels(nRows: number, nCols: number, nColors: number) {
  if (nColors > 16) return generatePixels8bpp(nRows, nCols, nColors);
  var s = '';

  const { ppb, bpp } = getPixelInfo(nColors);

  let byte = 0;
  for (var i = 0; i <= nRows * nCols; i++) {
    if ((i != 0 && i % ppb == 0) || i == nRows * nCols) {
      s += byte.toString(16).padStart(2, '0');
      byte = 0;
    }

    let colorIndex = i % nColors;
    const shift = 8 - bpp - (i % ppb) * bpp;
    byte |= colorIndex << shift;
  }

  return s;
}

describe('Renderer', () => {
  let renderer: XQSTRENDER;
  let numbers: Numbers;

  before(async () => {
    // 1
    const signers = await ethers.getSigners();

    // 2
    const numbersFactory = await ethers.getContractFactory('Numbers');
    numbers = (await numbersFactory.deploy()) as Numbers;

    // 3
    const rendererFactory = await ethers.getContractFactory('XQST_RENDER');
    renderer = (await rendererFactory.deploy(
      // numbers.address
      numbers.address
    )) as XQSTRENDER;
  });

  beforeEach(async () => {});

  describe(`Get Header`, function () {
    it(`Should get the header`, async function () {
      const WIDTH = 1;
      const HEIGHT = 2;
      const NUM_COLORS = 2;

      // console.log('0x0110100010C02000' + generatePixels(16, 16, 16).slice(2));
      const result = await renderer.decodeHeader(
        '0x' + generatePixelHeader(16, 16, 16) + generatePixels(16, 16, 16)
        // generatePixels(16, 16, 16)
      );
      console.log(result);
    });
  });

  // /* ~~~~~~~~~~~~~~ TEST 2 COLORS: 16x16 -> 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 48; v <= 56; v += 4) {
  //   describe(`${v}x${v} - 2 Colors`, function () {
  //     it(`Should render ${v}x${v} with 2 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 2;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // /* ~~~~~~~~~~~~~~ TEST 2 COLORS: 1x2 ~~~~~~~~~~~~~~ */
  // describe(`1x2 - 2 Colors`, function () {
  //   it(`Should render 1x2 with 2 Colors`, async function () {
  //     const WIDTH = 1;
  //     const HEIGHT = 2;
  //     const NUM_COLORS = 2;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // describe(`2x1 - 2 Colors`, function () {
  //   it(`Should render 2x1 with 2 Colors`, async function () {
  //     const WIDTH = 2;
  //     const HEIGHT = 1;
  //     const NUM_COLORS = 2;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // describe(`5x3 - 2 Colors`, function () {
  //   it(`Should render 2x1 with 2 Colors`, async function () {
  //     const WIDTH = 5;
  //     const HEIGHT = 3;
  //     const NUM_COLORS = 2;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // describe(`3x5 - 2 Colors`, function () {
  //   it(`Should render 3x5 with 2 Colors`, async function () {
  //     const WIDTH = 3;
  //     const HEIGHT = 5;
  //     const NUM_COLORS = 2;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // // /* ~~~~~~~~~~~~~~ TEST 4 COLORS: 2x2 ~~~~~~~~~~~~~~ */
  // describe(`2x2 - 4 Colors`, function () {
  //   it(`Should render 2x2 with 4 Colors`, async function () {
  //     const WIDTH = 2;
  //     const HEIGHT = 2;
  //     const NUM_COLORS = 4;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // // /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 4x4 ~~~~~~~~~~~~~~ */
  // describe(`4x4 - 16 Colors`, function () {
  //   it(`Should render 4x4 with 16 Colors`, async function () {
  //     const WIDTH = 4;
  //     const HEIGHT = 4;
  //     const NUM_COLORS = 16;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // // /* ~~~~~~~~~~~~~~ TEST 256 COLORS: 16x16 ~~~~~~~~~~~~~~ */
  // describe(`16x16 - 256 Colors`, function () {
  //   it(`Should render 16x16 with 256 Colors`, async function () {
  //     const WIDTH = 16;
  //     const HEIGHT = 16;
  //     const NUM_COLORS = 256;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 1x1 -> 56x56 ~~~~~~~~~~~~~~ */
  for (let v = 50; v <= 56; v += 1) {
    describe(`${v}x${v} - 16 Colors`, function () {
      it(`Should render ${v}x${v} with 16 Colors`, async function () {
        const WIDTH = v;
        const HEIGHT = v;
        const NUM_COLORS = 16;

        const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
      });
    });
  }

  // /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 1x1 -> 56x56 BACKGROUND COLOR ~~~~~~~~~~~~~~ */
  // for (let v = 48; v <= 56; v += 1) {
  //   describe(`${v}x${v} - 16 Colors - Background Color`, function () {
  //     it(`Should render ${v}x${v} with 16 Colors with a background color`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 16;

  //       const done = await renderCubeHelix(
  //         renderer,
  //         HEIGHT,
  //         WIDTH,
  //         NUM_COLORS,
  //         1,
  //         4
  //       );
  //     });
  //   });
  // }

  // /* ~~~~~~~~~~~~~~ TEST 32 COLORS: 16x16 -> 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 16; v <= 56; v += 4) {
  //   describe(`${v}x${v} - 32 Colors`, function () {
  //     it(`Should render ${v}x${v} with 32 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 32;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // // /* ~~~~~~~~~~~~~~ TEST 64 COLORS: 16x16 -> 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 16; v <= 56; v += 4) {
  //   describe(`${v}x${v} - 64 Colors`, function () {
  //     it(`Should render ${v}x${v} with 64 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 64;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // // /* ~~~~~~~~~~~~~~ TEST 256 COLORS: 16x16 -> 56x56 ~~~~~~~~~~~~~~ */
  // for (let v = 1; v <= 56; v += 1) {
  //   describe(`${v}x${v} - 256 Colors`, function () {
  //     it(`Should render ${v}x${v} with 256 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 256;

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
  //   for (let v = 16; v <= 64; v += 16) {
  //     describe(`56x56 - ${v} Colors`, function () {
  //       it(`Should render 56x56 with ${v} Colors`, async function () {
  //         const WIDTH = 56;
  //         const HEIGHT = 56;
  //         const NUM_COLORS = v;

  //         const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //       });
  //     });
  //   }

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
