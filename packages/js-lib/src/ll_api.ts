// Functions for Hardcore Builders working with binary pixel format directly

import { getDataHexString } from './utils/palette';
import { isRGBA, isString, PixelColor } from './api';

export type PixelBufferOptions = {
  version: number;
  width: number;
  height: number;
  numColors: number;
  paletteIncluded: boolean;
  palette: PixelColor[];
  backgroundIncluded: boolean;
  backgroundIndex: number;
};

type PixelDataInfo = {
  ppb: number;
  bpp: number;
  mask: number;
};

export class PixelBuffer {
  options: PixelBufferOptions;
  pixelInfo: PixelDataInfo;

  header: string = '';
  palette: string = '';
  data: string = '';

  constructor(options: PixelBufferOptions) {
    // TODO: validate options
    validateOptions(options);
    this.options = options;
    this.pixelInfo = getPixelInfo(this.options.numColors);
    this._setHeader();
    this._setPalette();
    this._initData();
  }

  // from(data: string): PixelBuffer {
  //   // read header
  //   // set options
  //   // set palette
  //   // set data
  // }

  _initData(): void {
    this.data = '00'.repeat(
      Math.ceil((this.options.width * this.options.height) / this.pixelInfo.ppb)
    );
  }

  _setHeader(): void {
    this.header = generateHeader(this.options);
  }

  _setPalette(): void {
    this.palette = generatePalette(this.options.palette);
  }

  setPixel(x: number, y: number, color: number): void {
    if (x >= this.options.width) return;
    if (y >= this.options.height) return;

    const bpp = this.pixelInfo.bpp;
    const ppb = this.pixelInfo.ppb;
    const mask = this.pixelInfo.mask;
    const pixelNum = x + this.options.width * y;
    const index = Math.floor(pixelNum / this.pixelInfo.ppb);

    let dataBytes = hexToBytes(this.data);
    let d = dataBytes[index];
    // TODO: validate that the number is within range

    // clear-bit
    d = d & ~(mask << (bpp * (ppb - 1 - (pixelNum % ppb))));

    // set-bit
    d = d | (color << (bpp * (ppb - 1 - (pixelNum % ppb))));
    dataBytes[index] = d;

    this.data = bytesToHex(dataBytes);
  }

  getPixel(x: number, y: number): number {
    const bpp = this.pixelInfo.bpp;
    const ppb = this.pixelInfo.ppb;
    const mask = this.pixelInfo.mask;

    const pixelNum = x + this.options.width * y;
    const index = Math.floor(pixelNum / this.pixelInfo.ppb);
    const d = hexToBytes(this.data)[index];

    return (d >> (bpp * (ppb - 1 - (pixelNum % ppb)))) & mask;
  }

  // getPixelColor(x: number, y: number): string {

  // }

  getPixelBuffer(): string {
    return `0x${this.header}${this.palette}${this.data}`;
  }

  getHeader(): string {
    return `0x${this.header}`;
  }

  getPalette(): string {
    return `0x${this.palette}`;
  }

  getData(): string {
    return `0x${this.data}`;
  }
}

const validateOptions = (options: PixelBufferOptions): boolean => {
  if (options.version != 1) {
    // only version 1 exists
    return false;
  }

  if (options.width < 1 || options.width > 56) {
    // width must be between 1 and 56
    return false;
  }

  if (options.height < 1 || options.height > 56) {
    // height must be between 1 and 56
    return false;
  }

  if (options.numColors < 1 || options.numColors > 256) {
    // numColors must be between 1 and 256
    return false;
  }

  if (options.numColors != options.palette.length) {
    // numColors must match the length of the palette
    return false;
  }

  if (
    options.backgroundIncluded &&
    options.backgroundIndex < options.numColors
  ) {
    // background index must be less than numColors
    return false;
  }

  return true;
};

function generatePalette(palette: PixelColor[]): string {
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

  console.log(s);

  return s;
}

const readHeader = (data: string): PixelBufferOptions | null => {
  const rawData = data.replace('0x', '');

  if (rawData.length < 16) {
    console.log('data does not include header');
    return null;
  }

  const header = parseInt(rawData.substring(0, 16));

  const version = header >> 56;
  const width = (header >> 48) & 0xff;
  const height = (header >> 40) & 0xff;
  const numColors = (header >> 24) & 0xffff;
  const backgroundIndex = (header >> 16) & 0xff;
  const backgroundIncluded = (header & 0x01) == 1;
  const paletteIncluded = ((header >> 1) & 0x01) == 1;

  const options: PixelBufferOptions = {
    version,
    width,
    height,
    numColors,
    backgroundIncluded,
    backgroundIndex,
    paletteIncluded,
    palette: []
  };

  return options;
};

const generateHeader = (options: PixelBufferOptions): string => {
  if (options) {
    console.log('options', options);
  }
  let header = '';
  let lastByte = 0;

  if (options) {
    // TODO, use get bit and set bit to do this.
    if (options.paletteIncluded && options.paletteIncluded == true) {
      lastByte |= 1 << 1;
    }

    if (options.backgroundIncluded && options.backgroundIncluded == true) {
      lastByte |= 1;
    }
  }

  header += `${options.version.toString(16).padStart(2, '0')}`;
  header += `${options.width.toString(16).padStart(2, '0')}`;
  header += `${options.height.toString(16).padStart(2, '0')}`;
  header += `${options.numColors.toString(16).padStart(4, '0')}`;

  if (options && options.backgroundIndex) {
    header += `${options.backgroundIndex.toString(16).padStart(2, '0')}`;
  } else {
    header += '00';
  }

  header += '000'; // reserved
  header += lastByte;

  console.log('0x' + header);

  return header;
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
