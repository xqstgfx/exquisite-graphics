import { expect } from 'chai';
import { getBinarySVG_Array, getRects, getSVG } from '../src/api';
import { PixelBuffer, ExquisiteBitmapHeader } from '../src/ll_api';
import { pngToData } from '../src/utils/png';
import { renderSVG } from '../src/svg';

const header: ExquisiteBitmapHeader = {
  version: 1,
  width: 3,
  height: 5,
  numColors: 4,
  scaleFactor: 11,
  alpha: false,
  backgroundIncluded: false,
  backgroundIndex: 0
};
const palette = ['#ffffff', '#000', '#ff00ff', '#ff0000'];
const buffer = new PixelBuffer(header, palette);
const SAM_DATA =
  '0x0140400010000003bdbdbdffc2c2c2ffc7c7c7ffcdcdcdffd6d6d6ffb4b4b4ffaaaaaaffa0a0a0ff898989ff727272ff4d4d4dff3e3e3eff5e5e5eff2c2c2cff181818ff090909ff00000000000000110111111112111222222222223333333343444444444444440000000000000101111111122112112122222223233333333443444444444444000000000100100101111112221112221222222223233333434444444444444400000000000101011111222221112212222222323233333334343444444444440000000000100111222111111112222222222222333333333434444444444444000000001111110011112221111112222222232223333333333434344444444400000001111110001112222211122222222222222333333334334444444444440000001111110000112222121122222222232233333333333333434444444444000001000001101111122111111222222232233333333333343444432333444400010000011101111112222111111222222233323333333333433432222333440000000001011111111111111121222222222332323333333333343222233334000011000100011111112111111112122211233323333333333333332234444400000000100101111221111111121122222323323323333433333222233444440000010001001111111111111111212222232323233333333343232233344434001000001001010111111111121222222322323333333333333433333333323400000000010000101111111111111122222233323233333333333321122333340000100000010101011111111112122222222233233334333211111233434444000101010100100111111111111112122222232233333333222222333344444400010111010011101111111121121222122223323211123332333233433434440001010111110111111111222222222232222222223222332223333333433434000000010111011101111111212212222222222321222222223333333333434400000000010111100000111111111111222222122222222232332333333333340000000100001000010111111110121111222222101221222232333333344433000001111111000010000001111111121211112211222222222232233320000000000000000100011005500101011111111111111222222223222222005555550000010111101111100550011101111111111111112231001111105566666666000000001111100000050000001000111111112233210000055666777677777750500500000000005550000000000100001120000000556777777777777777775555555500505555655000000000000012215555556776677777777777777777555555555000555665500100000002211105666666776667777777777766776755555555055555566500000000105001005666667776777666677777666666666555555555505555550001220005500111566767677676666676766655000005565556555555555550000500050000011155656555666556666555550055555555566666500005550000500050055000010055505555555555666665555055015566666655505555555050000055500000010055500005655655555500012222555555555555666665555555555555000100000000001000550005000112111155565555556566655655555555550500001000500000011010111111121111116665566655665555897abcb77690000000000010000101011101012232133333666666656655555788b9ba87777c5000005600001001111101111121122212116566666650000097697c988867ac686557000801000112233443322222012100666676766000088c8de887b8996966659500008052212001321100110060010077656766c59899cd5a996686c66c96dc5c98101005555555055555551500055566795c876979e78ba5555569ca658b7a75750556710067650550065105505656967686698dcca7d75556576879a6757755598760970607670555666650500666600566660cacc9988955bc978d977875568167ca9c100575656777777766766600057a9bbbdbca8921b815bb9b7951ccaa8aa115c188aa999676005050966655caaacaabccccbaab8cabaabaabbbca7b8ccb8aac9b9ca89aa0aabcc896bbacccdcca9db95a359cdbdab98899cca99a79acbbbbabb9bb9abbabcc8baaaaaaaabcbdddbdbedc9c999ccccccaaccacaabcacaaab9aac8aaaac8caccccaaccccacccddeadbbbbac9bb99cccabbdcaddcbbba9c9999cca998c9cca9ccc98c9c9899c9bddd9ddabdbdbdbedddcaccaa9a9cddbddeeeabdc8898999899989999ca999899bdbabcababbddbdefadbc9ac9bbcceeeededbccc9998888898899c9999c9999cdcbabdcbbbeabaaddeebbedddbeddbdbbeddbbdabdbddbaedeedcc988888889fc9bbddbabbddaddbddeabbbbdddeeadbadddbddbba9cc9bbbdbaddb999ab99bf9ddabdbedaeedbddbaaaebabbdaffadaaabdddbdeabbbebddefbabbdadedcbdbaebbdfdefedededdbdbeebdfdfdee9cbbebaedbfddcdfedfeffeedefedfedeeeefdfffffffffffeeeeeffefefeffebaefffdeedffefefbfffffffeffffdffffbffefffffffffffffdefeffffeefffeefffeffeeefefdbfffeffdebfdefeedfdefeffffefffffffeeefdeffffffffffeffeffffeefffefdffebffedfdafeedceefffffffffffffffffffefffffefefffffffffffffffeeeffecfeeefbdeeedfdffefffffffffffffffffffffffffffffffffefeffffffefaeeafedeeeeeedbedfffefffffeffffffeffffffffffffffffffffefffffffffabcbffbefdededefeffffffffffffefffffffefffffffffffffffeffffffffffebcbfefeeddfeededefffffffffffffffffffeffffffffffffffffeeffffffffebdbbfeddeeffdede';

describe('Buffer Init', () => {
  it('Buffer Header Proper', () => {
    expect(buffer.getHeader() == '0x010305000402c002');
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
    // console.log(buffer.getData());
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

    const data = getBinarySVG_Array(pixels);

    if (data == undefined) expect(0).to.eq(1);

    const buffer = data as PixelBuffer;

    // TODO add more to llapi to test more cleanly and keep these
    expect(buffer.getHeader()).to.eq('0x0104040002000001'); // TODO this should now be something different.
    expect(buffer.getPalette()).to.eq('0x000000ffffff');
    expect(buffer.getData()).to.eq('0x5555');
  });
});

describe('5x5 - 2 Colors', () => {
  it('properly sets up buffer for 5x5 with 2 colors', () => {
    let pixels: { x: number; y: number; color: string }[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        pixels.push({ x, y, color: x % 2 == 0 ? '#000' : '#fff' });
      }
    }

    const data = getBinarySVG_Array(pixels);
    if (data == undefined) expect(0).to.eq(1);
    const buffer = data as PixelBuffer;

    expect(buffer.getHeader()).to.eq('0x0105050002000001');
    expect(buffer.getPalette()).to.eq('0x000000ffffff');
    expect(buffer.getData()).to.eq('0x5294a500');
  });
});

describe('test rendering svg from data', async () => {
  it('returns sams svg', async () => {
    console.log(getSVG(SAM_DATA));
  });
});

describe('test rendering rects from data', async () => {
  it('returns sams svg', async () => {
    console.log(getRects(SAM_DATA));
  });
});

describe('test png to data', async () => {
  it('returns the data properly', async () => {
    const data = await pngToData('test/test.png');
  });
});

describe('test png to data to svg', async () => {
  it('returns the svg properly', async () => {
    const data = await pngToData('test/test.png');
    if (data) renderSVG(data);
  });
});
