// Functions for Hardcore Builders working with binary pixel format directly

import { getDataHexString } from './utils/palette';
import { isRGBA, isString, Pixel, PixelColor, PixelMap, Point } from './api';

export type ExquisiteBitmapHeader = {
  version: number;
  width: number;
  height: number;
  numColors: number;
  paletteIncluded: boolean;
  backgroundIncluded: boolean;
  backgroundIndex: number;
};

type PixelDataInfo = {
  ppb: number;
  bpp: number;
  mask: number;
};

export class PixelBuffer {
  header: ExquisiteBitmapHeader;
  palette: PixelColor[];
  pixelInfo: PixelDataInfo;

  // TODO; Use Buffer instead of string
  headerBuffer: Buffer = Buffer.from('0', 'hex');
  paletteBuffer: Buffer = Buffer.from('0', 'hex');
  dataBuffer: Buffer = Buffer.from('0', 'hex');

  constructor(header?: ExquisiteBitmapHeader, palette?: PixelColor[]) {
    if (header && palette) {
      // TODO: validate options
      this.header = header;
      this.palette = palette;
      validateOptions(header);
      this.pixelInfo = getPixelInfo(this.header.numColors);
      this._setHeader();
      this._setPalette();
      this._initData();
    } else {
      this.header = {
        version: 0,
        width: 0,
        height: 0,
        numColors: 0,
        paletteIncluded: false,
        backgroundIncluded: false,
        backgroundIndex: 0
      };
      this.palette = [];
      this.pixelInfo = { ppb: 0, bpp: 0, mask: 0 };
    }
  }

  from(data: string) {
    // TODO: validate data (the passed in string)
    // console.log(data);

    // read header
    const header = readHeader(data);
    // console.log('header', header);
    if (header == null) return;
    this.header = header;

    this.palette = readPalette(data, header);
    validateOptions(header);
    this.pixelInfo = getPixelInfo(this.header.numColors);
    this._setHeader();
    this._setPalette();
    this._initData();

    // set data
    this.dataBuffer = Buffer.from(
      data.replace('0x', '').substring(16 + header.numColors * 16),
      'hex'
    );
  }

  _initData(): void {
    this.dataBuffer = Buffer.from(
      '00'.repeat(
        Math.ceil((this.header.width * this.header.height) / this.pixelInfo.ppb)
      ),
      'hex'
    );
  }

  _setHeader(): void {
    this.headerBuffer = generateHeader(this.header);
  }

  _setPalette(): void {
    this.paletteBuffer = generatePalette(this.palette);
  }

  setPixel(x: number, y: number, color: number): void {
    if (x >= this.header.width) return;
    if (y >= this.header.height) return;

    const bpp = this.pixelInfo.bpp;
    const ppb = this.pixelInfo.ppb;
    const mask = this.pixelInfo.mask;
    const pixelNum = x + this.header.width * y;
    const index = Math.floor(pixelNum / this.pixelInfo.ppb);

    let d = this.dataBuffer[index];
    // TODO: validate that the number is within range

    // clear-bit
    d = d & ~(mask << (bpp * (ppb - 1 - (pixelNum % ppb))));

    // set-bit
    d = d | (color << (bpp * (ppb - 1 - (pixelNum % ppb))));
    this.dataBuffer[index] = d;
  }

  getPixel(x: number, y: number): number {
    const bpp = this.pixelInfo.bpp;
    const ppb = this.pixelInfo.ppb;
    const mask = this.pixelInfo.mask;

    const pixelNum = x + this.header.width * y;
    const index = Math.floor(pixelNum / this.pixelInfo.ppb);
    const d = this.dataBuffer[index];

    return (d >> (bpp * (ppb - 1 - (pixelNum % ppb)))) & mask;
  }

  getPixelColor(x: number, y: number): PixelColor {
    const colorIndex = this.getPixel(x, y);
    return this.palette[colorIndex];
  }

  getPixelBuffer(): string {
    const header = this.headerBuffer.toString('hex');
    const palette = this.paletteBuffer.toString('hex');
    const data = this.dataBuffer.toString('hex');
    return `0x${header}${palette}${data}`;
  }

  getHeader(): string {
    return `0x${this.headerBuffer.toString('hex')}`;
  }

  getPalette(): string {
    return `0x${this.paletteBuffer.toString('hex')}`;
  }

  getData(): string {
    return `0x${this.dataBuffer.toString('hex')}`;
  }

  // TODO, this might make sense to move out of the class?
  toPixels(): Pixel[] {
    const pixels: Pixel[] = [];
    for (let y = 0; y < this.header.height; y++) {
      for (let x = 0; x < this.header.width; x++) {
        const color = this.getPixelColor(x, y);
        pixels.push({ x, y, color });
      }
    }
    return pixels;
  }

  toPixel2DArr(): PixelColor[][] {
    const pixels: PixelColor[][] = [];
    // console.log('palette', this.palette);

    // console.log(this.header);
    for (let y = 0; y < this.header.height; y++) {
      const row: PixelColor[] = [];
      for (let x = 0; x < this.header.width; x++) {
        row.push(this.getPixelColor(x, y));
      }
      pixels.push(row);
    }
    return pixels;
  }

  toPixelMap(): PixelMap {
    const pixelMap: PixelMap = new Map<Point, PixelColor>();
    for (let y = 0; y < this.header.height; y++) {
      for (let x = 0; x < this.header.width; x++) {
        const color = this.getPixelColor(x, y);
        pixelMap.set({ x, y }, color);
      }
    }
    return pixelMap;
  }
}

const validateOptions = (header: ExquisiteBitmapHeader): boolean => {
  if (header.version != 1) {
    // only version 1 exists
    return false;
  }

  if (header.width < 1 || header.width > 56) {
    // width must be between 1 and 56
    return false;
  }

  if (header.height < 1 || header.height > 56) {
    // height must be between 1 and 56
    return false;
  }

  if (header.numColors < 1 || header.numColors > 256) {
    // numColors must be between 1 and 256
    return false;
  }

  // if (header.numColors != header.palette.length) {
  //   // numColors must match the length of the palette
  //   return false;
  // }

  if (header.backgroundIncluded && header.backgroundIndex < header.numColors) {
    // background index must be less than numColors
    return false;
  }

  return true;
};

function generatePalette(palette: PixelColor[]): Buffer {
  let s = '';

  palette.map((color) => {
    if (isRGBA(color)) {
      // TODO handle RGBA
      // s += getDataHexString(
      //   `#${color.r.toString(16).padStart(2, '0')}${color.g
      //     .toString(16)
      //     .padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}${
      //     color.a ? color.a.toString(16).padStart(2, '0') : '00'
      //   }`
      // );
    } else if (isString(color)) {
      s += getDataHexString(color);
    }
  });

  return Buffer.from(s, 'hex');
}

const readPalette = (
  data: string,
  header: ExquisiteBitmapHeader
): PixelColor[] => {
  // TODO: validate data

  const d = data.replace('0x', '').substring(16, 16 + header.numColors * 16);
  const buffer = Buffer.from(d, 'hex');

  const palette: PixelColor[] = [];

  for (let i = 0; i < header.numColors; i++) {
    palette.push(
      `#${buffer
        .readUInt32LE(i * 8)
        .toString(16)
        .padStart(8, '0')}`
    );
  }

  // console.log('read palette', palette);

  return palette;
};

const readHeader = (data: string): ExquisiteBitmapHeader | null => {
  const rawData = data.replace('0x', '');

  if (rawData.length < 16) {
    // console.log('data does not include header');
    return null;
  }

  const headerData = Buffer.from(rawData.substring(0, 16), 'hex');
  // console.log(headerData);

  const version = headerData.readUInt8();
  const width = headerData.readUInt8(1);
  const height = headerData.readUInt8(2);
  const numColors = headerData.readUInt16BE(3);
  const backgroundIndex = headerData.readUInt8(5);
  const paletteIncluded = ((headerData.readUInt8(7) >> 1) & 0x01) == 1;
  const backgroundIncluded = (headerData.readUInt8(7) & 0x01) == 1;

  // console.log(version);

  const header: ExquisiteBitmapHeader = {
    version,
    width,
    height,
    numColors,
    backgroundIncluded,
    backgroundIndex,
    paletteIncluded
  };

  return header;
};

const generateHeader = (header: ExquisiteBitmapHeader): Buffer => {
  let headerData = '';
  let lastByte = 0;

  if (header) {
    // TODO, use get bit and set bit to do this.
    if (header.paletteIncluded && header.paletteIncluded == true) {
      lastByte |= 1 << 1;
    }

    if (header.backgroundIncluded && header.backgroundIncluded == true) {
      lastByte |= 1;
    }
  }

  headerData += `${header.version.toString(16).padStart(2, '0')}`;
  headerData += `${header.width.toString(16).padStart(2, '0')}`;
  headerData += `${header.height.toString(16).padStart(2, '0')}`;
  headerData += `${header.numColors.toString(16).padStart(4, '0')}`;

  if (header && header.backgroundIndex) {
    headerData += `${header.backgroundIndex.toString(16).padStart(2, '0')}`;
  } else {
    headerData += '00';
  }

  headerData += '000'; // reserved
  headerData += lastByte;

  return Buffer.from(headerData, 'hex');
};

const getPixelInfo = (numColors: number): PixelDataInfo => {
  if (numColors > 16) return { ppb: 1, bpp: 8, mask: 0xff };
  if (numColors > 4) return { ppb: 2, bpp: 4, mask: 0x0f };
  if (numColors > 2) return { ppb: 4, bpp: 2, mask: 0x03 };
  return { ppb: 8, bpp: 1, mask: 0x01 };
};

// Convert a hex string to a byte array
function hexToBytes(hex: string) {
  for (var bytes: number[] = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes: number[]) {
  for (var hex: string[] = [], i = 0; i < bytes.length; i++) {
    var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xf).toString(16));
  }
  return hex.join('');
}
