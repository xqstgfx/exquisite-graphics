import { expect, util } from 'chai';
import { ethers, waffle } from 'hardhat';
import fs from 'fs';

import chroma from 'chroma-js';

import { XQSTGFX } from '../typechain';
import { arrayify, hexlify } from '@ethersproject/bytes';
import { utils } from 'ethers';
import sharp from 'sharp';

const PRIME_NUMBERS = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53
]; // 16 prime numbers
const POWERS_OF_TWO = [1, 2, 4, 8, 16, 32, 64, 128, 256]; // 9 powers of 2
const ODD_NUMBERS = [9, 15, 21, 27, 33, 35, 45, 51]; // 8 odd numbers
const EVEN_NUMBERS = [6, 10, 24, 36, 42, 48, 52, 56]; // 8 even numbers
const ONE = [1]; // 1 one
const BASIC_COLOR_DEPTHS = [1, 2, 4, 16, 27, 56, 157, 256]; // covers (one, 1bpp, 2bpp, 4bpp, odd, even, prime, 8bpp)

const SAM =
  '0x0140400010000003bdbdbdffc2c2c2ffc7c7c7ffcdcdcdffd6d6d6ffb4b4b4ffaaaaaaffa0a0a0ff898989ff727272ff4d4d4dff3e3e3eff5e5e5eff2c2c2cff181818ff090909ff00000000000000110111111112111222222222223333333343444444444444440000000000000101111111122112112122222223233333333443444444444444000000000100100101111112221112221222222223233333434444444444444400000000000101011111222221112212222222323233333334343444444444440000000000100111222111111112222222222222333333333434444444444444000000001111110011112221111112222222232223333333333434344444444400000001111110001112222211122222222222222333333334334444444444440000001111110000112222121122222222232233333333333333434444444444000001000001101111122111111222222232233333333333343444432333444400010000011101111112222111111222222233323333333333433432222333440000000001011111111111111121222222222332323333333333343222233334000011000100011111112111111112122211233323333333333333332234444400000000100101111221111111121122222323323323333433333222233444440000010001001111111111111111212222232323233333333343232233344434001000001001010111111111121222222322323333333333333433333333323400000000010000101111111111111122222233323233333333333321122333340000100000010101011111111112122222222233233334333211111233434444000101010100100111111111111112122222232233333333222222333344444400010111010011101111111121121222122223323211123332333233433434440001010111110111111111222222222232222222223222332223333333433434000000010111011101111111212212222222222321222222223333333333434400000000010111100000111111111111222222122222222232332333333333340000000100001000010111111110121111222222101221222232333333344433000001111111000010000001111111121211112211222222222232233320000000000000000100011005500101011111111111111222222223222222005555550000010111101111100550011101111111111111112231001111105566666666000000001111100000050000001000111111112233210000055666777677777750500500000000005550000000000100001120000000556777777777777777775555555500505555655000000000000012215555556776677777777777777777555555555000555665500100000002211105666666776667777777777766776755555555055555566500000000105001005666667776777666677777666666666555555555505555550001220005500111566767677676666676766655000005565556555555555550000500050000011155656555666556666555550055555555566666500005550000500050055000010055505555555555666665555055015566666655505555555050000055500000010055500005655655555500012222555555555555666665555555555555000100000000001000550005000112111155565555556566655655555555550500001000500000011010111111121111116665566655665555897abcb77690000000000010000101011101012232133333666666656655555788b9ba87777c5000005600001001111101111121122212116566666650000097697c988867ac686557000801000112233443322222012100666676766000088c8de887b8996966659500008052212001321100110060010077656766c59899cd5a996686c66c96dc5c98101005555555055555551500055566795c876979e78ba5555569ca658b7a75750556710067650550065105505656967686698dcca7d75556576879a6757755598760970607670555666650500666600566660cacc9988955bc978d977875568167ca9c100575656777777766766600057a9bbbdbca8921b815bb9b7951ccaa8aa115c188aa999676005050966655caaacaabccccbaab8cabaabaabbbca7b8ccb8aac9b9ca89aa0aabcc896bbacccdcca9db95a359cdbdab98899cca99a79acbbbbabb9bb9abbabcc8baaaaaaaabcbdddbdbedc9c999ccccccaaccacaabcacaaab9aac8aaaac8caccccaaccccacccddeadbbbbac9bb99cccabbdcaddcbbba9c9999cca998c9cca9ccc98c9c9899c9bddd9ddabdbdbdbedddcaccaa9a9cddbddeeeabdc8898999899989999ca999899bdbabcababbddbdefadbc9ac9bbcceeeededbccc9998888898899c9999c9999cdcbabdcbbbeabaaddeebbedddbeddbdbbeddbbdabdbddbaedeedcc988888889fc9bbddbabbddaddbddeabbbbdddeeadbadddbddbba9cc9bbbdbaddb999ab99bf9ddabdbedaeedbddbaaaebabbdaffadaaabdddbdeabbbebddefbabbdadedcbdbaebbdfdefedededdbdbeebdfdfdee9cbbebaedbfddcdfedfeffeedefedfedeeeefdfffffffffffeeeeeffefefeffebaefffdeedffefefbfffffffeffffdffffbffefffffffffffffdefeffffeefffeefffeffeeefefdbfffeffdebfdefeedfdefeffffefffffffeeefdeffffffffffeffeffffeefffefdffebffedfdafeedceefffffffffffffffffffefffffefefffffffffffffffeeeffecfeeefbdeeedfdffefffffffffffffffffffffffffffffffffefeffffffefaeeafedeeeeeedbedfffefffffeffffffeffffffffffffffffffffefffffffffabcbffbefdededefeffffffffffffefffffffefffffffffffffffeffffffffffebcbfefeeddfeededefffffffffffffffffffeffffffffffffffffeeffffffffebdbbfeddeeffdede';

const RAINBOW_SCALE = chroma
  .scale(['#f00', '#0f0', '#00f', '#fe0000'])
  .mode('hsl');
const CUBEHELIX_SCALE = chroma.cubehelix().gamma(0.6).scale();

function getSVG(
  colorScale: chroma.Scale<chroma.Color>,
  nRows: number,
  nCols: number,
  nColors: number
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

function saveSVG(data: string, suiteName: string, name: string) {
  // mkdir test/svg
  fs.mkdir(`test/svg/${suiteName}`, (e) => {
    if (e && e.code != 'EEXIST') {
      console.log(e);
    }
  });
  fs.writeFile(`test/svg/${suiteName}/${name}.svg`, data, (e) => {
    if (e) console.log(e);
    else console.log(`wrote test/svg/${suiteName}/${name}.svg`);
  });
}

type PixelOptions = {
  backgroundEnabled?: number;
  backgroundColorIndex?: number;
  paletteInHeader?: number;
};

function generatePixelHeader(
  width: number,
  height: number,
  nColors: number,
  version: number = 1,
  options?: PixelOptions
) {
  if (options) {
    // console.log('options', options);
  }
  let header = '';
  let lastByte = 0;

  if (options) {
    if (options.backgroundEnabled && options.backgroundEnabled == 1) {
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

  // console.log('0x' + header);

  return header;
}

const b16StringLUT = new Map<string, string>([
  ['0', '30'],
  ['1', '31'],
  ['2', '32'],
  ['3', '33'],
  ['4', '34'],
  ['5', '35'],
  ['6', '36'],
  ['7', '37'],
  ['8', '38'],
  ['9', '39'],
  ['a', '61'],
  ['b', '62'],
  ['c', '63'],
  ['d', '64'],
  ['e', '65'],
  ['f', '66']
]);

function generatePalette(palette: string[], genPalette: number) {
  if (genPalette == 0) return '';

  // console.log(palette);

  let s = '';

  palette.map((color) => {
    s += color.replace('#', '');
  });

  // console.log(s);

  return s;
}

async function renderCubeHelixRLE(
  renderer: XQSTGFX,
  suiteName: string,
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
  )}33000000111111112222222233333300`;

  const result = await renderer.draw(data);

  // TODO fix getSVG to do both
  if (backgroundEnabled) {
  } else {
    // expect(result).to.equal(
    //   getSVG(CUBEHELIX_SCALE, numRows, numCols, numColors)
    // );
  }
  saveSVG(
    result,
    suiteName,
    `NEW_HELIX_${numColors}COLORS_${numCols}x${numRows}`
  );
}

async function renderCubeHelix(
  renderer: XQSTGFX,
  suiteName: string,
  numRows: number,
  numCols: number,
  numColors: number,
  random: boolean = false,
  iteration: number = 0,
  backgroundEnabled: number = 1,
  backgroundColorIndex: number = 0,
  paletteInHeader: number = 1
) {
  const options: PixelOptions = {
    backgroundEnabled,
    backgroundColorIndex,
    paletteInHeader
  };

  let data;
  if (!random) {
    data = `0x${generatePixelHeader(
      numCols,
      numRows,
      numColors,
      1,
      options
    )}${generatePalette(
      CUBEHELIX_SCALE.colors(numColors),
      paletteInHeader
    )}${generatePixels(numRows, numCols, numColors)}`;
  } else {
    const numRandomBytes = (numCols * numRows) / getPixelInfo(numColors).ppb;
    const randBytes = hexlify(utils.randomBytes(numRandomBytes)).replace(
      '0x',
      ''
    );

    data = `0x${generatePixelHeader(
      numCols,
      numRows,
      numColors,
      1,
      options
    )}${generatePalette(
      CUBEHELIX_SCALE.colors(numColors),
      paletteInHeader
    )}${randBytes}`;
  }

  const result = await renderer.draw(data);

  // TODO fix getSVG to do both
  if (backgroundEnabled) {
  } else {
    // expect(result).to.equal(
    //   getSVG(CUBEHELIX_SCALE, numRows, numCols, numColors)
    // );
  }
  saveSVG(
    result,
    suiteName,
    `NEW_HELIX_${numColors}COLORS_${numCols}x${numRows}_${iteration}`
  );
}

async function renderRainbow(
  renderer: XQSTGFX,
  suiteName: string,
  numRows: number,
  numCols: number,
  numColors: number
) {
  const options: PixelOptions = {
    backgroundEnabled: 0,
    backgroundColorIndex: 0,
    paletteInHeader: 1
  };
  const data = `0x${generatePixelHeader(
    numCols,
    numRows,
    numColors,
    1,
    options
  )}${generatePalette(RAINBOW_SCALE.colors(numColors), 1)}${generatePixels(
    numRows,
    numCols,
    numColors
  )}`;

  const result = await renderer.draw(data);
  saveSVG(
    result,
    suiteName,
    `RAINBOW_${numColors}COLORS_${numCols}x${numRows}`
  );

  return result;
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
  let renderer: XQSTGFX;

  before(async () => {
    // 1
    const signers = await ethers.getSigners();

    // 2
    const rendererFactory = await ethers.getContractFactory('XQSTGFX');
    renderer = (await rendererFactory.deploy()) as XQSTGFX;
  });

  beforeEach(async () => {});

  describe(`Get Header`, function () {
    it(`Should get the header`, async function () {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 16;

      // console.log('0x0110100010C02000' + generatePixels(16, 16, 16).slice(2));
      const result = await renderer.decodeHeader(
        '0x' +
          generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS) +
          generatePalette(RAINBOW_SCALE.colors(NUM_COLORS), 1) +
          generatePixels(WIDTH, HEIGHT, NUM_COLORS)
        // ['0x1111222233334444']
        // generatePixels(16, 16, 16)
      );
      // console.log(result);
    });
  });

  /* ~~~~~~~~~~~~~~ TEST 1 -> 256 COLORS: 56x56 ~~~~~~~~~~~~~~ */
  // for (let cdIndex = 0; cdIndex < BASIC_COLOR_DEPTHS.length; cdIndex++) {
  // for (let cdIndex = 0; cdIndex < 1; cdIndex++) {
  //   for (let size = 56; size <= 56; size++) {
  //     describe(`${size}x${size} - ${BASIC_COLOR_DEPTHS[cdIndex]} Colors`, function () {
  //       it(`Should render ${size}x${size} with ${BASIC_COLOR_DEPTHS[cdIndex]} Colors`, async function () {
  //         const WIDTH = size;
  //         const HEIGHT = size;
  //         const NUM_COLORS = BASIC_COLOR_DEPTHS[cdIndex];

  //         const done = await renderCubeHelix(
  //           renderer,
  //           'SWEEP_BASIC_COLORS_AND_ALL_SQUARE_SIZES',
  //           HEIGHT,
  //           WIDTH,
  //           NUM_COLORS
  //         );
  //       });
  //     });
  //   }
  // }

  /* ~~~~~~~~~~~~~~ TEST SCOTT ~~~~~~~~~~~~~~ */
  // describe(`24x16 - 2 Colors`, function () {
  //   it(`Should render 24x16 with 2 Colors`, async function () {
  //     const WIDTH = 24;
  //     const HEIGHT = 16;
  //     const NUM_COLORS = 2;

  //     const done = await renderCubeHelix(
  //       renderer,
  //       'SCOTT',
  //       HEIGHT,
  //       WIDTH,
  //       NUM_COLORS
  //     );
  //   });
  // });

  // for (let i = 1; i < 100; i++) {
  //   describe(`24x16 - 2 Colors`, function () {
  //     it(`Should render 24x16 with 2 Colors`, async function () {
  //       const WIDTH = 24;
  //       const HEIGHT = 16;
  //       const NUM_COLORS = 2;

  //       const done = await renderCubeHelix(
  //         renderer,
  //         'SCOTT',
  //         HEIGHT,
  //         WIDTH,
  //         NUM_COLORS,
  //         true,
  //         i
  //       );
  //     });
  //   });
  // }

  describe(`SAM`, function () {
    it(`Should render SAM`, async function () {
      const WIDTH = 64;
      const HEIGHT = 64;
      const NUM_COLORS = 16;

      const done = await renderer.draw(SAM);
      // console.log(done);

      const png = await sharp(Buffer.from(done))
        .resize(WIDTH, HEIGHT)
        .png()
        .toFile('sam.png');
      // .toBuffer();
      // console.log(png);
    }).timeout(1000000);
  });

  /* ~~~~~~~~~~~~~~ TEST 1 -> 256 COLORS: 56x56 ~~~~~~~~~~~~~~ */
  for (let v = 256; v <= 256; v += 1) {
    describe(`56x56 - ${v} Colors`, function () {
      it(`Should render 56x56 with ${v} Colors`, async function () {
        const WIDTH = 65;
        const HEIGHT = 65;
        const NUM_COLORS = 256;

        const done = await renderRainbow(
          renderer,
          'MAX',
          HEIGHT,
          WIDTH,
          NUM_COLORS
        );

        // console.log(done);

        const png = await sharp(Buffer.from(done))
          .resize(WIDTH, HEIGHT)
          .png()
          .toFile('test.png');
        // .toBuffer();
        // console.log(png);
      }).timeout(1000000);
    });
  }

  // it.only('should render', async function () {
  //   console.log(
  //     await renderer.renderSVG(
  //       '0x011f1f000300000330303030303066666335613337376666666666666666666618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618618600'
  //     )
  //   );
  // });

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
  // for (let v = 56; v <= 64; v += 1) {
  //   describe(`${v}x${v} - 16 Colors`, function () {
  //     it(`Should render ${v}x${v} with 16 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 16;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // /* ~~~~~~~~~~~~~~ TEST 16 COLORS: 1x1 -> 56x56 BACKGROUND COLOR ~~~~~~~~~~~~~~ */
  // for (let v = 52; v <= 56; v += 1) {
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
  // for (let v = 16; v <= 16; v += 4) {
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
  // for (let v = 56; v <= 56; v += 1) {
  //   describe(`${v}x${v} - 256 Colors`, function () {
  //     it(`Should render ${v}x${v} with 256 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 256;

  //       const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //     });
  //   });
  // }

  // for (let v = 4; v <= 4; v += 1) {
  //   describe(`${v}x${v} - 256 Colors`, function () {
  //     it(`Should render ${v}x${v} with 256 Colors`, async function () {
  //       const WIDTH = v;
  //       const HEIGHT = v;
  //       const NUM_COLORS = 256;

  //       const done = await renderCubeHelixRLE(
  //         renderer,

  //         HEIGHT,
  //         WIDTH,
  //         NUM_COLORS
  //       );
  //     });
  //   });
  // }

  // describe(`26x13 - 256 Colors`, function () {
  //   it(`Should render 26x13 with 256 Colors`, async function () {
  //     const WIDTH = 33;
  //     const HEIGHT = 11;
  //     const NUM_COLORS = 256;

  //     const done = await renderCubeHelix(renderer, HEIGHT, WIDTH, NUM_COLORS);
  //   });
  // });

  // TODO test RLE
  // TODO test all prime combonations

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
