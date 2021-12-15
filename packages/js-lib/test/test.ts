import { expect } from 'chai';
import { getBinarySVG_Array } from '../src/api';
import { PixelBuffer, PixelBufferOptions } from '../src/ll_api';

const options: PixelBufferOptions = {
  version: 1,
  width: 3,
  height: 5,
  numColors: 4,
  paletteIncluded: true,
  palette: ['#ffffff', '#000', '#ff00ff', '#ff0000'],
  backgroundIncluded: false,
  backgroundIndex: 0
};
const buffer = new PixelBuffer(options);

describe('Buffer Init', () => {
  it('Buffer Header Proper', () => {
    expect(buffer.getHeader() == '0x0103050004000002');
  });

  it('Buffer Palette Proper', () => {
    expect(
      buffer.getPalette() ==
        '0x666666666666666630303030303030306666303066666666663030303066'
    );
  });

  it('Buffer Data Proper', () => {
    expect(buffer.getData() == '0x00000000');
  });
});

describe('Set Color', () => {
  it('set 0,0 to 1', () => {
    buffer.setPixel(0, 0, 1);
    expect(buffer.getData()).to.equal('0x40000000');
    expect(buffer.getPixel(0, 0)).to.equal(1);
  });

  it('set 1,0 to 2', () => {
    buffer.setPixel(1, 0, 2);
    expect(buffer.getData()).to.equal('0x60000000');
    expect(buffer.getPixel(1, 0)).to.equal(2);
  });

  it('set 1,0 to 0', () => {
    buffer.setPixel(1, 0, 0);
    expect(buffer.getData()).to.equal('0x40000000');
    expect(buffer.getPixel(1, 0)).to.equal(0);
  });

  it('set 2,0 to 3', () => {
    buffer.setPixel(2, 0, 3);
    expect(buffer.getData()).to.equal('0x4c000000');
    expect(buffer.getPixel(2, 0)).to.equal(3);
  });

  // TODO: expect x beyond width to fail
  // TODO: have proper error handling
  // it('set 3,0 to 3', () => {
  //   buffer.setPixel(3, 0, 3);
  //   expect(buffer.getData() == '0x4c000000');
  // });

  it('set 0,1 to 3', () => {
    buffer.setPixel(0, 1, 3);
    expect(buffer.getData()).to.equal('0x4f000000');
    expect(buffer.getPixel(0, 1)).to.equal(3);
  });

  it('set 1,1 to 1', () => {
    buffer.setPixel(1, 1, 1);
    expect(buffer.getData()).to.equal('0x4f400000');
    expect(buffer.getPixel(1, 1)).to.equal(1);
  });

  it('set 2,4 to 1', () => {
    buffer.setPixel(2, 4, 1);
    expect(buffer.getData()).to.equal('0x4f400004');
    expect(buffer.getPixel(2, 4)).to.equal(1);
  });

  it('log data', () => {
    console.log(buffer.getData());
  });
});

describe('4x4 - 2 Colors', () => {
  it('properly sets up buffer for 4x4 with 2 colors', () => {
    let pixels: { x: number; y: number; color: string }[] = [];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        pixels.push({ x, y, color: x % 2 == 0 ? '#000' : '#fff' });
      }
    }
    console.log(pixels);

    const data = getBinarySVG_Array(pixels);

    if (data == undefined) expect(0).to.eq(1);

    const buffer = data as PixelBuffer;

    // TODO add more to llapi to test more cleanly and keep these
    expect(buffer.getHeader()).to.eq('0x0104040002000003');
    expect(buffer.getPalette()).to.eq('0x30303030303066666666666666666666');
    expect(buffer.getData()).to.eq('0x5555');

    console.log('data', data);
  });
});

describe('5x5 - 2 Colors', () => {
  it('properly sets up buffer for 5x5 with 2 colors', () => {
    let pixels: { x: number; y: number; color: string }[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        pixels.push({ x, y, color: x % 2 == 1 ? '#000' : '#fff' });
      }
    }
    console.log(pixels);

    const data = getBinarySVG_Array(pixels);
    console.log('data', data);
  });
});
