import { expect } from 'chai';
import { ethers, getProvider } from 'hardhat';
import fs from 'fs';

import chroma from 'chroma-js';

import { ExquisiteGraphics, ExquisiteVault } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseUnits } from 'ethers/lib/utils';

const SAM =
  '0x0140400010000003bdbdbdffc2c2c2ffc7c7c7ffcdcdcdffd6d6d6ffb4b4b4ffaaaaaaffa0a0a0ff898989ff727272ff4d4d4dff3e3e3eff5e5e5eff2c2c2cff181818ff090909ff00000000000000110111111112111222222222223333333343444444444444440000000000000101111111122112112122222223233333333443444444444444000000000100100101111112221112221222222223233333434444444444444400000000000101011111222221112212222222323233333334343444444444440000000000100111222111111112222222222222333333333434444444444444000000001111110011112221111112222222232223333333333434344444444400000001111110001112222211122222222222222333333334334444444444440000001111110000112222121122222222232233333333333333434444444444000001000001101111122111111222222232233333333333343444432333444400010000011101111112222111111222222233323333333333433432222333440000000001011111111111111121222222222332323333333333343222233334000011000100011111112111111112122211233323333333333333332234444400000000100101111221111111121122222323323323333433333222233444440000010001001111111111111111212222232323233333333343232233344434001000001001010111111111121222222322323333333333333433333333323400000000010000101111111111111122222233323233333333333321122333340000100000010101011111111112122222222233233334333211111233434444000101010100100111111111111112122222232233333333222222333344444400010111010011101111111121121222122223323211123332333233433434440001010111110111111111222222222232222222223222332223333333433434000000010111011101111111212212222222222321222222223333333333434400000000010111100000111111111111222222122222222232332333333333340000000100001000010111111110121111222222101221222232333333344433000001111111000010000001111111121211112211222222222232233320000000000000000100011005500101011111111111111222222223222222005555550000010111101111100550011101111111111111112231001111105566666666000000001111100000050000001000111111112233210000055666777677777750500500000000005550000000000100001120000000556777777777777777775555555500505555655000000000000012215555556776677777777777777777555555555000555665500100000002211105666666776667777777777766776755555555055555566500000000105001005666667776777666677777666666666555555555505555550001220005500111566767677676666676766655000005565556555555555550000500050000011155656555666556666555550055555555566666500005550000500050055000010055505555555555666665555055015566666655505555555050000055500000010055500005655655555500012222555555555555666665555555555555000100000000001000550005000112111155565555556566655655555555550500001000500000011010111111121111116665566655665555897abcb77690000000000010000101011101012232133333666666656655555788b9ba87777c5000005600001001111101111121122212116566666650000097697c988867ac686557000801000112233443322222012100666676766000088c8de887b8996966659500008052212001321100110060010077656766c59899cd5a996686c66c96dc5c98101005555555055555551500055566795c876979e78ba5555569ca658b7a75750556710067650550065105505656967686698dcca7d75556576879a6757755598760970607670555666650500666600566660cacc9988955bc978d977875568167ca9c100575656777777766766600057a9bbbdbca8921b815bb9b7951ccaa8aa115c188aa999676005050966655caaacaabccccbaab8cabaabaabbbca7b8ccb8aac9b9ca89aa0aabcc896bbacccdcca9db95a359cdbdab98899cca99a79acbbbbabb9bb9abbabcc8baaaaaaaabcbdddbdbedc9c999ccccccaaccacaabcacaaab9aac8aaaac8caccccaaccccacccddeadbbbbac9bb99cccabbdcaddcbbba9c9999cca998c9cca9ccc98c9c9899c9bddd9ddabdbdbdbedddcaccaa9a9cddbddeeeabdc8898999899989999ca999899bdbabcababbddbdefadbc9ac9bbcceeeededbccc9998888898899c9999c9999cdcbabdcbbbeabaaddeebbedddbeddbdbbeddbbdabdbddbaedeedcc988888889fc9bbddbabbddaddbddeabbbbdddeeadbadddbddbba9cc9bbbdbaddb999ab99bf9ddabdbedaeedbddbaaaebabbdaffadaaabdddbdeabbbebddefbabbdadedcbdbaebbdfdefedededdbdbeebdfdfdee9cbbebaedbfddcdfedfeffeedefedfedeeeefdfffffffffffeeeeeffefefeffebaefffdeedffefefbfffffffeffffdffffbffefffffffffffffdefeffffeefffeefffeffeeefefdbfffeffdebfdefeedfdefeffffefffffffeeefdeffffffffffeffeffffeefffefdffebffedfdafeedceefffffffffffffffffffefffffefefffffffffffffffeeeffecfeeefbdeeedfdffefffffffffffffffffffffffffffffffffefeffffffefaeeafedeeeeeedbedfffefffffeffffffeffffffffffffffffffffefffffffffabcbffbefdededefeffffffffffffefffffffefffffffffffffffeffffffffffebcbfefeeddfeededefffffffffffffffffffeffffffffffffffffeeffffffffebdbbfeddeeffdede';

const ALPHA_SCALE = chroma.scale(['#000000ff', '#00000000']);
const RAINBOW_SCALE = chroma
  .scale(['red', 'orange', 'yellow', 'green', 'blue', 'purple'])
  .mode('hsl');
const CUBEHELIX_SCALE = chroma.cubehelix().gamma(0.6).scale();
const COLOR_TEST = [1, 2, 4, 8, 16, 256];

function saveRects(
  data: string,
  width: number,
  height: number,
  suiteName: string,
  name: string
) {
  data = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ${width} ${height}">${data}</svg>`;
  const path = `test/images/rects/${suiteName}`;

  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(`${path}/${name}.svg`, data);
}
``;

function saveSVG(data: string, suiteName: string, name: string) {
  const path = `test/images/svg/${suiteName}`;

  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(`${path}/${name}.svg`, data);
}

function generatePixelHeader(
  width: number,
  height: number,
  nColors: number,
  version: number = 1,
  scaleFactor: number = 0,
  alpha: number = 0,
  backgroundColorIndex: number = 0,
  backgroundEnabled: number = 0
) {
  let header = '';
  let last2Bytes = 0;

  if (backgroundEnabled == 1) {
    last2Bytes |= 1;
  }

  if (alpha == 1) {
    last2Bytes |= 1 << 1;
  }

  last2Bytes |= scaleFactor << 6;

  header += `${version.toString(16).padStart(2, '0')}`;
  header += width == 256 ? '00' : `${width.toString(16).padStart(2, '0')}`;
  header += height == 256 ? '00' : `${height.toString(16).padStart(2, '0')}`;
  header += `${nColors.toString(16).padStart(4, '0')}`;

  if (backgroundColorIndex) {
    header += `${backgroundColorIndex.toString(16).padStart(2, '0')}`;
  } else {
    header += '00';
  }

  header += last2Bytes.toString(16).padStart(4, '0');

  return header;
}

function generatePalette(palette: string[], alpha = false) {
  let s = '';
  palette.map((color, index) => {
    if (alpha && index == 0) {
      s += color.replace('#', '') + 'ff';
    } else {
      s += color.replace('#', '');
    }
  });

  return s;
}

async function render(
  renderer: ExquisiteGraphics,
  suiteName: string,
  numRows: number,
  numCols: number,
  numColors: number,
  svg = true,
  unsafe = false,
  scale = RAINBOW_SCALE,
  alpha = false
) {
  const data = `0x${generatePixelHeader(
    numCols,
    numRows,
    numColors,
    1,
    0,
    alpha ? 1 : 0
  )}${generatePalette(scale.colors(numColors), alpha)}${
    generatePixels(numRows, numCols, numColors).data
  }`;

  let result;

  if (svg) {
    if (unsafe) result = await renderer.drawUnsafe(data);
    else result = await renderer.draw(data);
  } else {
    // rects
    if (unsafe) result = await renderer.drawPixelsUnsafe(data);
    else result = await renderer.drawPixels(data);
  }

  if (svg) {
    saveSVG(
      result,
      suiteName,
      !unsafe
        ? `${numColors}COLORS_${numCols}x${numRows}`
        : `UNSAFE_${numColors}COLORS_${numCols}x${numRows}`
    );
  } else {
    // saveRects (this just adds <svg> tag around the rects)
  }

  return result;
}

function generatePixels8bpp(nRows: number, nCols: number, nColors: number) {
  var s = '';
  var indices = [];
  for (var i = 0; i < nRows * nCols; i++) {
    let colorIndex = i % nColors;
    indices.push(colorIndex);
    s += colorIndex.toString(16).padStart(2, '0');
  }
  return { data: s, indices };
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
  var indices = [];

  const { ppb, bpp } = getPixelInfo(nColors);

  let byte = 0;
  for (var i = 0; i <= nRows * nCols; i++) {
    if ((i != 0 && i % ppb == 0) || i == nRows * nCols) {
      s += byte.toString(16).padStart(2, '0');
      byte = 0;
    }

    let colorIndex = i % nColors;
    indices.push(colorIndex);
    const shift = 8 - bpp - (i % ppb) * bpp;
    byte |= colorIndex << shift;
  }

  return { data: s, indices };
}

describe('Renderer', () => {
  let vault: ExquisiteVault;
  let renderer: ExquisiteGraphics;
  let signers: SignerWithAddress[];

  before(async () => {
    signers = await ethers.getSigners();

    const vaultFactor = await ethers.getContractFactory('ExquisiteVault');
    vault = (await vaultFactor.deploy()) as ExquisiteVault;

    console.log(vault.address);

    const rendererFactory = await ethers.getContractFactory(
      'ExquisiteGraphics'
    );
    renderer = (await rendererFactory.deploy()) as ExquisiteGraphics;
  });

  beforeEach(async () => {});

  describe(`Header Decode`, function () {
    it(`Should decode a valid header without revert`, async function () {
      const header = await renderer.decodeHeader('0x0140400010000003');
    });

    // shouldnt decode header if it's not enough data
    it(`Should not decode header if it's not enough data`, async function () {
      await expect(
        renderer.decodeHeader('0x01404000100000')
      ).to.be.revertedWith('MissingHeader()');
    });

    // version is correct
    it('Header version is decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.version).to.equal(1);

      header = await renderer.decodeHeader('0x0240400010000003');
      expect(header.version).to.equal(2);

      header = await renderer.decodeHeader('0x0040400010000003');
      expect(header.version).to.equal(0);

      header = await renderer.decodeHeader('0xff40400010000003');
      expect(header.version).to.equal(255);
    });

    it('Header dimensions are decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.width).to.equal(64);
      expect(header.height).to.equal(64);
      expect(header.totalPixels).to.equal(64 * 64);

      header = await renderer.decodeHeader('0x0100000010000003');
      expect(header.width).to.equal(256);
      expect(header.height).to.equal(256);
      expect(header.totalPixels).to.equal(256 * 256);

      header = await renderer.decodeHeader('0x0101010010000003');
      expect(header.width).to.equal(1);
      expect(header.height).to.equal(1);
      expect(header.totalPixels).to.equal(1);

      header = await renderer.decodeHeader('0x0104010010000003');
      expect(header.width).to.equal(4);
      expect(header.height).to.equal(1);
      expect(header.totalPixels).to.equal(4);

      header = await renderer.decodeHeader('0x0101040010000003');
      expect(header.width).to.equal(1);
      expect(header.height).to.equal(4);
      expect(header.totalPixels).to.equal(4);
    });

    it('Header colors are decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400000000003');
      expect(header.numColors).to.equal(0);
      expect(header.bitsPerPixel).to.equal(1);
      expect(header.pixelsPerByte).to.equal(8);

      header = await renderer.decodeHeader('0x0140400001000003');
      expect(header.numColors).to.equal(1);
      expect(header.bitsPerPixel).to.equal(1);
      expect(header.pixelsPerByte).to.equal(8);

      header = await renderer.decodeHeader('0x0140400002000003');
      expect(header.numColors).to.equal(2);
      expect(header.bitsPerPixel).to.equal(1);
      expect(header.pixelsPerByte).to.equal(8);

      header = await renderer.decodeHeader('0x0140400003000003');
      expect(header.numColors).to.equal(3);
      expect(header.bitsPerPixel).to.equal(2);
      expect(header.pixelsPerByte).to.equal(4);

      header = await renderer.decodeHeader('0x0140400004000003');
      expect(header.numColors).to.equal(4);
      expect(header.bitsPerPixel).to.equal(2);
      expect(header.pixelsPerByte).to.equal(4);

      header = await renderer.decodeHeader('0x0140400005000003');
      expect(header.numColors).to.equal(5);
      expect(header.bitsPerPixel).to.equal(4);
      expect(header.pixelsPerByte).to.equal(2);

      header = await renderer.decodeHeader('0x014040000f000003');
      expect(header.numColors).to.equal(15);
      expect(header.bitsPerPixel).to.equal(4);
      expect(header.pixelsPerByte).to.equal(2);

      header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.numColors).to.equal(16);
      expect(header.bitsPerPixel).to.equal(4);
      expect(header.pixelsPerByte).to.equal(2);

      header = await renderer.decodeHeader('0x0140400011000003');
      expect(header.numColors).to.equal(17);
      expect(header.bitsPerPixel).to.equal(8);
      expect(header.pixelsPerByte).to.equal(1);

      header = await renderer.decodeHeader('0x0140400100000003');
      expect(header.numColors).to.equal(256);
      expect(header.bitsPerPixel).to.equal(8);
      expect(header.pixelsPerByte).to.equal(1);

      header = await renderer.decodeHeader('0x0140400101000003');
      expect(header.numColors).to.equal(257);
      expect(header.bitsPerPixel).to.equal(8);
      expect(header.pixelsPerByte).to.equal(1);
    });

    it('Decode the start of the palette and pixel data', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(72);

      header = await renderer.decodeHeader('0x0140400008000003');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(40);

      header = await renderer.decodeHeader('0x0140400010000001');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(56);

      header = await renderer.decodeHeader('0x0140400008000001');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(32);

      header = await renderer.decodeHeader('0x0140400001000001');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(11);

      header = await renderer.decodeHeader('0x0140400001000002');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(12);

      header = await renderer.decodeHeader('0x0140400000000002');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(8);

      header = await renderer.decodeHeader('0x0140400000000001');
      expect(header.paletteStart).to.equal(8);
      expect(header.dataStart).to.equal(8);
    });

    // background color index is correct
    it('Header background color index is decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.backgroundColorIndex).to.equal(0);

      header = await renderer.decodeHeader('0x0140400001010003');
      expect(header.backgroundColorIndex).to.equal(1);

      header = await renderer.decodeHeader('0x0140400001ff0003');
      expect(header.backgroundColorIndex).to.equal(255);
    });

    // alpha is correct
    it('Header alpha is decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.alpha).to.equal(true);

      header = await renderer.decodeHeader('0x0140400010000001');
      expect(header.alpha).to.equal(false);
    });

    // scale factor is correct
    it('Header scale factor is decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.scale).to.equal(0);

      header = await renderer.decodeHeader('0x0140400010000041');
      expect(header.scale).to.equal(1);

      header = await renderer.decodeHeader('0x0140400010000081');
      expect(header.scale).to.equal(2);

      header = await renderer.decodeHeader('0x01404000100000c1');
      expect(header.scale).to.equal(3);

      header = await renderer.decodeHeader('0x01404000100001c1');
      expect(header.scale).to.equal(7);

      header = await renderer.decodeHeader('0x0140400010000fc1');
      expect(header.scale).to.equal(63);

      header = await renderer.decodeHeader('0x014040001000ffc1');
      expect(header.scale).to.equal(1023);
    });

    // background enabled is correct
    it('Header Background Enabled is decoded properly', async function () {
      let header = await renderer.decodeHeader('0x0140400010000003');
      expect(header.hasBackground).to.equal(true);

      header = await renderer.decodeHeader('0x0140400010000002');
      expect(header.hasBackground).to.equal(false);
    });
  });

  describe(`Header Validate`, function () {
    it('Should not revert when number of pixels is within max (4096)', async function () {
      let result = await renderer.validateHeader('0x0140400010000003');
      result = await renderer.validateHeader('0x0120400010000003');
    });

    it('Revert when number of pixels exceeds max (4096)', async function () {
      await expect(
        renderer.validateHeader('0x0100000010000003')
      ).to.be.revertedWith('ExceededMaxPixels');

      await expect(
        renderer.validateHeader('0x0150400010000003')
      ).to.be.revertedWith('ExceededMaxPixels');
    });

    it('Should succeed when number of colors is within max (256)', async function () {
      let result = await renderer.validateHeader('0x0140400100000003');
      result = await renderer.validateHeader('0x0120400010000003');
    });

    it('Should revert when number of colors exceeds max (256)', async function () {
      await expect(
        renderer.validateHeader('0x0140400110000003')
      ).to.be.revertedWith('ExceededMaxColors');

      await expect(
        renderer.validateHeader('0x01404001f0000003')
      ).to.be.revertedWith('ExceededMaxColors');
    });

    it('Should succeed when the background color index is in of range or is disabled', async function () {
      let result = await renderer.validateHeader('0x0140400010000003');
      result = await renderer.validateHeader('0x0140400010010003');
      result = await renderer.validateHeader('0x0140400000000000');
    });

    it('Should revert when the background color index is out of range and is enabled', async function () {
      await expect(
        renderer.validateHeader('0x0140400000000001')
      ).to.be.revertedWith('BackgroundColorIndexOutOfRange');

      await expect(
        renderer.validateHeader('0x0140400010200001')
      ).to.be.revertedWith('BackgroundColorIndexOutOfRange');
    });
  });

  describe('Pixels validateate', function () {
    it('Should revert when not enough data is sent', async () => {
      await expect(
        renderer.validate('0x014040000000000000')
      ).to.be.revertedWith('NotEnoughData');

      await expect(renderer.validate('0x0101010010000000')).to.be.revertedWith(
        'NotEnoughData'
      );

      // 1 color but no palette given
      await expect(
        renderer.validate('0x01050700010000001000000000')
      ).to.be.revertedWith('NotEnoughData');

      // 1 color but missing data in palette
      await expect(
        renderer.validate('0x0105070001000002ff00331000000000')
      ).to.be.revertedWith('NotEnoughData');
    });
  });

  describe(`Palette`, function () {
    // Decodes RGB palette correctly
    it('Should decode RGB Palette properly', async function () {
      let result = await renderer.decodePalette(
        '0x0105070002000000ff00333300ff1000000000'
      );
      expect(result).to.be.eql(['ff0033', '3300ff']);
    });

    // Decodes RGBA palette correctly
    it('Should decode RGBA Palette properly', async function () {
      let result = await renderer.decodePalette(
        '0x0105070002000002ff0033553300ff551000000000'
      );
      expect(result).to.be.eql(['ff003355', '3300ff55']);
    });

    // Palette set properly for 0 and 1 color
    it('Should decode palette for 0 and 1 color properly', async function () {
      let result = await renderer.decodePalette(
        '0x0105070001000000ff00331000000000'
      );
      expect(result).to.be.eql(['ff0033']);
      result = await renderer.decodePalette(
        '0x0105070000000000ff00331000000000'
      );
      expect(result).to.be.eql(['', '']);
    });

    it("Shouldn't decode a palette when not enough data provided", async function () {
      // no alpha
      await expect(
        renderer.decodePalette('0x0105070001000000ff00')
      ).to.be.revertedWith('NotEnoughData');
      // with alpha
      await expect(
        renderer.decodePalette('0x0105070001000002ff0033')
      ).to.be.revertedWith('NotEnoughData');
    });
  });

  describe('Pixels', function () {
    it(`Decodes data properly for 0 colors`, async () => {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 0;

      const header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 0, 0);
      const pixelData = 'a'.repeat((WIDTH * HEIGHT) / 4);
      const data = `0x${header}${pixelData}`;

      const result = await renderer.decodeDrawContext(data);

      for (let i = 0; i < WIDTH * HEIGHT; i++) {
        expect(result.pixels[i]).to.be.eql(i % 2 == 0 ? 1 : 0);
      }
    });

    COLOR_TEST.map(async (numColors) => {
      it(`Decodes data properly for ${numColors} colors`, async () => {
        const WIDTH = 16;
        const HEIGHT = 16;
        const header = generatePixelHeader(
          WIDTH,
          HEIGHT,
          numColors,
          1,
          0,
          0,
          0,
          0
        );
        const palette = generatePalette(RAINBOW_SCALE.colors(numColors), false);
        const pixelData = generatePixels(WIDTH, HEIGHT, numColors);
        const data = `0x${header}${palette}${pixelData.data}`;

        const result = await renderer.decodeDrawContext(data);

        for (let i = 0; i < WIDTH * HEIGHT; i++) {
          expect(result.pixels[i]).to.be.eql(pixelData.indices[i]);
        }
      });
    });
  });

  describe(`Colors`, function () {
    it(`Should be able to render in 0 Colors`, async function () {
      // 16x16 test pattern, first pixel on second pixel off.
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 0;

      const header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 0, 0);
      const pixelData = 'a'.repeat((WIDTH * HEIGHT) / 4);
      const data = `0x${header}${pixelData}`;

      // we should get alternating red and black pixels, the black pixels are not rendered. effectively transparent
      const image = await renderer.draw(data);
      const rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'COLOR_SWEEP', `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`);
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'COLOR_SWEEP',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );
    });
    it(`Should be able to render in 1 Color without Background`, async function () {
      let WIDTH = 16;
      let HEIGHT = 16;
      const NUM_COLORS = 1;

      let header = generatePixelHeader(
        WIDTH,
        HEIGHT,
        NUM_COLORS,
        1,
        0,
        0,
        0,
        0
      );
      let pixelData = '5'.repeat((WIDTH * HEIGHT) / 4);
      let data = `0x${header}ff0000${pixelData}`;

      // we should get alternating red and black pixels, the black pixels are not rendered. effectively transparent
      let image = await renderer.draw(data);
      let rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'COLOR_SWEEP', `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`);
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'COLOR_SWEEP',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );

      WIDTH = 5;
      HEIGHT = 7;
      header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 0, 0, 0, 0);
      pixelData = '5555555555';
      data = `0x${header}ff0000${pixelData}`;

      // we should get alternating red and black pixels, the black pixels are not rendered. effectively transparent
      image = await renderer.draw(data);
      rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'COLOR_SWEEP', `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`);
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'COLOR_SWEEP',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );
    });
    it(`Should be able to render in 1 Color with Background`, async function () {
      // we expect the whole image to be red.
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 1;

      const header = generatePixelHeader(
        WIDTH,
        HEIGHT,
        NUM_COLORS,
        1,
        0,
        0,
        0,
        1
      );
      const pixelData = '5'.repeat((WIDTH * HEIGHT) / 4);
      const data = `0x${header}ff0000${pixelData}`;

      const image = await renderer.draw(data);
      const rectImage = await renderer.drawPixels(data);
      saveSVG(
        image,
        'COLOR_SWEEP',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}_BACKGROUND`
      );
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'COLOR_SWEEP',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );
    });
    it(`Should be able to render in 2-256 Colors`, async function () {
      const WIDTH = 16;
      const HEIGHT = 16;
      for (let i = 2; i <= 256; i++) {
        console.log('Rendering ' + i + ' Colors');
        const NUM_COLORS = i;

        const done = await render(
          renderer,
          'COLOR_SWEEP',
          HEIGHT,
          WIDTH,
          NUM_COLORS
        );
      }
    }).timeout(1000000);

    it(`Should be able to render RGB`, async function () {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 256;

      await render(
        renderer,
        'RGB',
        HEIGHT,
        WIDTH,
        NUM_COLORS,
        true,
        false,
        RAINBOW_SCALE,
        false
      );
    });

    it(`Should be able to render RGBA`, async function () {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 256;

      await render(
        renderer,
        'RGBA',
        HEIGHT,
        WIDTH,
        NUM_COLORS,
        true,
        false,
        ALPHA_SCALE,
        true
      );
    });

    it('Should fail to render an image with an RGB palette specified, but alpha in header', async () => {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 256;

      const header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 0, 1);
      const palette = generatePalette(RAINBOW_SCALE.colors(NUM_COLORS));
      const pixelData = generatePixels(WIDTH, HEIGHT, NUM_COLORS).data;
      const data = `0x${header}${palette}${pixelData}`;

      await expect(renderer.draw(data)).to.be.revertedWith('NotEnoughData');
    });

    it(`Should be able to render transparent pixels when above NUM_COLORS`, async function () {
      // 6 colors, index 6 and 7 both render no pixel
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 6;

      const header = generatePixelHeader(
        WIDTH,
        HEIGHT,
        NUM_COLORS,
        1,
        0,
        0,
        0,
        0
      );
      const palette = generatePalette(RAINBOW_SCALE.colors(NUM_COLORS));
      const data = generatePixels(WIDTH, HEIGHT, 8).data;

      const image = await renderer.draw(`0x${header}${palette}${data}`);
      const rectImage = await renderer.drawPixels(
        `0x${header}${palette}${data}`
      );
      saveSVG(
        image,
        'TRANSPARENT_PIXELS',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'TRANSPARENT_PIXELS',
        `${NUM_COLORS}COLORS_${WIDTH}x${HEIGHT}`
      );
    });
  });

  describe(`Sizes`, function () {
    it(`Should be able to render Square sizes up to 64x64`, async function () {
      // const SIZES = [64];
      const SIZES = [1, 2, 3, 4, 5, 8, 16, 31, 32, 33, 42, 63, 64];
      const NUM_COLORS = 64;

      for (let i = 0; i < SIZES.length; i++) {
        const WIDTH = SIZES[i];
        const HEIGHT = SIZES[i];

        const done = await render(
          renderer,
          'SQUARE_SIZE_SWEEP',
          HEIGHT,
          WIDTH,
          NUM_COLORS
        );
      }
    });
    it(`Should be able to render in Rectangular sizes up to 4096 pixels total - 2 colors`, async function () {
      const SIZES = [
        1, 2, 3, 4, 5, 8, 16, 31, 32, 33, 42, 63, 64, 95, 96, 128, 196, 255, 256
      ];
      const NUM_COLORS = 2;

      for (let i = 0; i < SIZES.length; i++) {
        for (let j = 0; j < SIZES.length; j++) {
          if (SIZES[i] * SIZES[j] <= 4096) {
            console.log('Rendering ' + SIZES[i] + ' ' + SIZES[j] + ' pixels');
            const WIDTH = SIZES[i];
            const HEIGHT = SIZES[j];

            const done = await render(
              renderer,
              'RECT_SIZE_SWEEP',
              HEIGHT,
              WIDTH,
              NUM_COLORS
            );
          }
        }
      }
    }).timeout(1000000);

    it(`Fail to render SVG safely in sizes >4096 pixels total`, async function () {
      const WIDTH = 65;
      const HEIGHT = 65;
      const NUM_COLORS = 64;

      const header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS);
      const palette = generatePalette(RAINBOW_SCALE.colors(NUM_COLORS));
      const pixelData = generatePixels(WIDTH, HEIGHT, NUM_COLORS).data;
      const data = `0x${header}${palette}${pixelData}`;

      await expect(renderer.draw(data)).to.be.revertedWith(
        'ExceededMaxPixels()'
      );
      await expect(renderer.drawPixels(data)).to.be.revertedWith(
        'ExceededMaxPixels()'
      );
    });

    it(`Render SVG unsafely in sizes >4096 pixels total`, async function () {
      const WIDTH = 65;
      const HEIGHT = 65;
      const NUM_COLORS = 64;

      const header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS);
      const palette = generatePalette(RAINBOW_SCALE.colors(NUM_COLORS));
      const pixelData = generatePixels(WIDTH, HEIGHT, NUM_COLORS).data;
      const data = `0x${header}${palette}${pixelData}`;

      const image = await renderer.drawUnsafe(data);
      const rectImage = await renderer.drawPixelsUnsafe(data);
      saveSVG(image, 'MAX', `${WIDTH}x${HEIGHT}x${NUM_COLORS}_UNSAFE`);
      saveRects(
        rectImage,
        WIDTH,
        HEIGHT,
        'MAX',
        `${WIDTH}x${HEIGHT}x${NUM_COLORS}_UNSAFE`
      );
    });
  });

  describe(`Scaling`, function () {
    it(`Test scaling SVG's works as expected`, async function () {
      const WIDTH = 16;
      const HEIGHT = 16;
      const NUM_COLORS = 256;

      // scale is 0
      let header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 0);
      const palette = generatePalette(RAINBOW_SCALE.colors(NUM_COLORS));
      const pixelData = generatePixels(WIDTH, HEIGHT, NUM_COLORS).data;
      let data = `0x${header}${palette}${pixelData}`;

      let decodedHeader = await renderer.decodeHeader(data);
      expect(decodedHeader.scale).to.equal(0);
      let image = await renderer.draw(data);
      saveSVG(image, 'SCALE', `SCALE_0`);

      // scale is 1
      header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 1);
      data = `0x${header}${palette}${pixelData}`;
      decodedHeader = await renderer.decodeHeader(data);
      expect(decodedHeader.scale).to.equal(1);
      image = await renderer.draw(data);
      saveSVG(image, 'SCALE', `SCALE_1`);

      // scale is 32
      header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 32);
      data = `0x${header}${palette}${pixelData}`;
      decodedHeader = await renderer.decodeHeader(data);
      expect(decodedHeader.scale).to.equal(32);
      image = await renderer.draw(data);
      saveSVG(image, 'SCALE', `SCALE_32`);

      // scale is 256
      header = generatePixelHeader(WIDTH, HEIGHT, NUM_COLORS, 1, 256);
      data = `0x${header}${palette}${pixelData}`;
      decodedHeader = await renderer.decodeHeader(data);
      expect(decodedHeader.scale).to.equal(256);
      image = await renderer.draw(data);
      saveSVG(image, 'SCALE', `SCALE_256`);
    });
  });

  describe(`Integrations`, function () {
    it(`Should render Sam's Image`, async function () {
      const image = await renderer.draw(SAM);
      const rectImage = await renderer.drawPixels(SAM);
      saveSVG(image, 'INTEGRATIONS', 'SAM');
      saveRects(rectImage, 64, 64, 'INTEGRATIONS', `SAM`);
    }).timeout(1000000);

    it(`Should be able to render okpc`, async function () {
      // This is artwork 64 - Balance
      const data =
        '0x01181000000000000071FF01FC7F03FE3F07E71F07E71F0FFF0F0FFE0F0FFC0F0FC00F0F800F0F000F07181F07181F03803F01C07F0071FF0000000000000000';

      // we should get the balance image
      const image = await renderer.draw(data);
      const rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'INTEGRATIONS', `OKPC`);
      saveRects(rectImage, 24, 16, 'INTEGRATIONS', `OKPC`);
    });

    it(`Should be able to render Blitmap`, async function () {
      // This is artwork 0 - Genesis
      const header = generatePixelHeader(32, 32, 4, 1, 0, 0, 0, 0);
      const paletteAndPixelData =
        '0000000600ffd5719efff568000000000000000015555555555555541555555555555554140514555555555414451455555555541445045555555554144510555555555414451455555555541405145555555554155555555555555415555555555555541401114051451554145511445145155414550140514115541455114451441554145511445145155414011144514515541555555555555554155555555555555400000000000000002aaaaaaaaaaaaaa82aaaaaaaaaaaaaa800000000000000003ffffffffffffffc3ffffffffffffffc0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      const data = `0x${header}${paletteAndPixelData}`;

      // we should get the balance image
      const image = await renderer.draw(data);
      const rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'INTEGRATIONS', `BLITMAP`);
      saveRects(rectImage, 32, 32, 'INTEGRATIONS', `BLITMAP`);
    });

    it(`Should be able to render Blitmap with OKPC colors`, async function () {
      // This is artwork 0 - Genesis
      const header = generatePixelHeader(32, 32, 4, 1, 0, 0, 0, 0);
      const paletteAndPixelData =
        '00000000DC82F8B73EFF44B7000000000000000015555555555555541555555555555554140514555555555414451455555555541445045555555554144510555555555414451455555555541405145555555554155555555555555415555555555555541401114051451554145511445145155414550140514115541455114451441554145511445145155414011144514515541555555555555554155555555555555400000000000000002aaaaaaaaaaaaaa82aaaaaaaaaaaaaa800000000000000003ffffffffffffffc3ffffffffffffffc0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      const data = `0x${header}${paletteAndPixelData}`;

      // we should get the balance image
      const image = await renderer.draw(data);
      const rectImage = await renderer.drawPixels(data);
      saveSVG(image, 'INTEGRATIONS', `BLITMAP_OKPC`);
      saveRects(rectImage, 32, 32, 'INTEGRATIONS', `BLITMAP_OKPC`);
    });
  });

  describe('Thank You', function () {
    it(`Vault should recieve Thank You ETH + Message when sent to Exquisite Graphics`, async function () {
      const signer = signers[0];
      await renderer
        .connect(signer)
        ['ty(string)']('Thank you', { value: parseUnits('0.05', 'ether') });
      expect(await vault.balance()).to.equal(parseUnits('0.05', 'ether'));
    });

    it(`Vault should recieve Thank You ETH when sent to Exquisite Graphics`, async function () {
      const signer = signers[0];
      await renderer
        .connect(signer)
        ['ty()']({ value: parseUnits('0.05', 'ether') });
      expect(await vault.balance()).to.equal(parseUnits('0.1', 'ether'));
    });

    it(`Vault should recieve ETH directly when sent to Exquisite Graphics`, async function () {
      const signer = signers[0];
      await signer.sendTransaction({
        to: renderer.address,
        value: parseUnits('0.1', 'ether')
      });
      expect(await vault.balance()).to.equal(parseUnits('0.2', 'ether'));
    });

    it('Vault should be able to widthdraw ETH', async function () {
      const signer = signers[0];
      await vault.connect(signer).withdraw();
      expect(
        await ethers.provider.getBalance(
          '0xd286064cc27514b914bab0f2fad2e1a89a91f314'
        )
      ).to.equal(parseUnits('0.2', 'ether'));
      expect(await vault.balance()).to.eq(parseUnits('0', 'ether'));
    });

    it('Vault cant widthdraw 0 ETH', async function () {
      const signer = signers[0];
      await expect(vault.connect(signer).withdraw()).to.be.revertedWith(
        'NoBalance()'
      );
    });
  });
});
