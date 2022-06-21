// TODO figure out how this thing should be organized

import { PixelBuffer, ExquisiteBitmapHeader } from './ll_api';

type rgba = { r: number; g: number; b: number; a: number };
export type PixelColor = string; // #000 -> #000000 -> 000000ff
type Palette = PixelColor[];
export type Point = {
  x: number;
  y: number;
};

export type Pixel = {
  x: number;
  y: number;
  color: PixelColor; // note this is not an index but the hex code of a color (#ffffff)
};

export type PixelMap = Map<Point, PixelColor>;
export type Pixel2DArr = PixelColor[][];

export function isRGBA(x: any): x is rgba {
  return typeof x === 'object';
}

export function isString(x: any): x is string {
  return typeof x === 'string';
}

// Functions to reconstruct SVG from binary pixel format
export const getSVG = (data: string) => {
  const buffer = new PixelBuffer();
  buffer.from(data);
  return getSVGPixelBuffer(buffer);
};

export const getRects = (data: string) => {
  const buffer = new PixelBuffer();
  buffer.from(data);
  return getSVGRectsPixelBuffer(buffer);
};

// TODO this should definitely be in the LLAPI
export const getSVGPixelBuffer = (buffer: PixelBuffer) => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ${
    buffer.header.width * 16
  } ${buffer.header.height * 16}" height="${
    buffer.header.height * 16
  }" width="${buffer.header.width * 16}"><g transform="scale(16 16)">`;

  buffer.toPixels().map((pixel) => {
    svg += `<rect fill="#${pixel.color}" x="${pixel.x}" y="${pixel.y}" height="1" width="1"/>`;
  });

  svg += '</g></svg>';
  return svg;
};

export const getSVGRectsPixelBuffer = (buffer: PixelBuffer) => {
  return buffer
    .toPixels()
    .map(
      (pixel) =>
        `<rect fill="#${pixel.color}" x="${pixel.x}" y="${pixel.y}" height="1" width="1"/>`
    )
    .join('');
};

export const getSVGPixels = (pixels: Pixel[]) => {
  const buffer = getBinarySVG_Array(pixels) as PixelBuffer;
  return getSVGPixelBuffer(buffer);
};

export const getSVGRects = (pixels: Pixel[]) => {
  const buffer = getBinarySVG_Array(pixels) as PixelBuffer;
  return getSVGRectsPixelBuffer(buffer);
};

// const getPixels
// in the same format you are using in your struct for js rendering
// from an svg as well?

// Functions for most builders, working with simple pixel formats

/* Function that takes an array of pixel objects and returns the binary format for the renderer */
export const getBinarySVG_Array = (pixels: Pixel[]) => {
  let width: number | null = null;
  let height: number | null = null;
  let pixelNums: number[] = [];

  let numColors = 0;
  let palette: Map<string, { color: string; index: number; count: number }> =
    new Map<string, { color: string; index: number; count: number }>();

  // determine dimensions
  // determine palette
  // get count of palette
  pixels.map((pixel) => {
    if (width == null) width = pixel.x;
    if (height == null) height = pixel.y;

    if (pixel.x > width) width = pixel.x;
    if (pixel.y > height) height = pixel.y;

    const pixelColor = pixel.color;
    const paletteColor = palette.get(pixelColor); // TODO need to get pixel.color as rgba or string
    if (paletteColor == undefined) {
      palette.set(pixelColor, {
        color: pixelColor,
        index: numColors,
        count: 1
      });
      numColors++;
    } else {
      palette.set(pixelColor, {
        color: pixelColor,
        index: paletteColor.index,
        count: paletteColor.count + 1
      });
    }
  });

  if (width == null || height == null) return;
  width = width + 1;
  height = height + 1;

  pixels.map((pixel) => {
    pixelNums.push(pixel.x + pixel.y * width!);
  });

  // validate if contigious
  pixelNums = pixelNums.sort((a, b) => a - b);
  for (let i = 0; i < pixelNums.length - 1; i++) {
    if (i == 0 && pixelNums[i] != 0)
      return Error('The smallest pixel is not 0');
    if (pixelNums[i + 1] != pixelNums[i] + 1)
      return Error('Pixels are not contigous.');
  }

  // add pixelnum to array, require 0->max size

  // determine best background color
  let paletteArr: PixelColor[] = [];
  let bestColor: { color: string; index: number; count: number } = {
    color: '',
    index: -1,
    count: -1
  };
  palette.forEach((value) => {
    if (value.count > bestColor.count) bestColor = value;
    paletteArr[value.index] = value.color;
  });

  let alpha = false;
  if (paletteArr.length > 1) {
    const firstColorLen = paletteArr[0].replace('#', '').length;
    if (firstColorLen == 4 || firstColorLen == 8) {
      alpha = true;
    }
  }

  const header: ExquisiteBitmapHeader = {
    version: 1,
    width: width,
    height: height,
    numColors: palette.size,
    scaleFactor: 0,
    alpha,
    backgroundIncluded: true,
    backgroundIndex: bestColor.index
  };

  // initialize buffer
  const buffer = new PixelBuffer(header, paletteArr);

  pixels.map((pixel) => {
    const color = palette.get(pixel.color);

    if (color == undefined) return Error();

    const colorIndex = color.index;
    buffer.setPixel(pixel.x, pixel.y, colorIndex);
  });

  return buffer;
};

/* Function that takes a map from {x, y} -> color and returns the binary format for the renderer */
const getBinarySVG_Map = (pixels: PixelMap) => {};

/* Function that takes a 2d array of pixels. Something like where the outer array represents y
   and the inner array represents x and returns the binary format for the renderer */
export const getBinarySVG_2DArr = (pixels: Pixel2DArr) => {
  let pixelArr: Pixel[] = [];
  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      pixelArr.push({ x: col, y: row, color: pixels[row][col] });
    }
  }

  return getBinarySVG_Array(pixelArr);
};

// TODO add support for the ndarray concept that scott pointed out
