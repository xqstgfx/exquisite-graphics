// TODO figure out how this thing should be organized

import { PixelBuffer, PixelBufferOptions } from './ll_api';

type rgba = { r: number; g: number; b: number; a: number };
export type PixelColor = string | rgba;
type Palette = PixelColor[];
type Point = {
  x: number;
  y: number;
};

type Pixel = {
  x: number;
  y: number;
  color: PixelColor; // note this is not an index but the hex code of a color (#ffffff)
};

type PixelMap = Map<Point, PixelColor>;
type Pixel2DArr = PixelColor[][];

export function isRGBA(x: any): x is rgba {
  return typeof x === 'object';
}

export function isString(x: any): x is string {
  return typeof x === 'string';
}

// Functions to reconstruct SVG from binary pixel format

const getSVG = (data: string) => {};

// const getPixels
// in the same format you are using in your struct for js rendering
// from an svg as well?

// Functions for most builders, working with simple pixel formats

/* Function that takes an array of pixel objects and returns the binary format for the renderer */
export const getBinarySVG_Array = (
  pixels: { x: number; y: number; color: string }[]
) => {
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

    const paletteColor = palette.get(pixel.color);
    if (paletteColor == undefined) {
      palette.set(pixel.color, {
        color: pixel.color,
        index: numColors,
        count: 1
      });
      numColors++;
    } else {
      palette.set(pixel.color, {
        color: pixel.color,
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
  console.log(pixelNums);
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

  const options: PixelBufferOptions = {
    version: 1,
    width: width,
    height: height,
    numColors: palette.size,
    paletteIncluded: true,
    palette: paletteArr,
    backgroundIncluded: true,
    backgroundIndex: bestColor.index
  };

  // initialize buffer
  const buffer = new PixelBuffer(options);

  pixels.map((pixel) => {
    const color = palette.get(pixel.color);

    if (color == undefined) return Error();

    const colorIndex = color.index;
    buffer.setPixel(pixel.x, pixel.y, colorIndex);
  });

  return buffer;
};

/* Function that takes a map from {x, y} -> color and returns the binary format for the renderer */
const getBinarySVG_Map = (pixels: Map<{ x: number; y: number }, string>) => {};

/* Function that takes a 2d array of pixels. Something like where the outer array represents y
   and the inner array represents x and returns the binary format for the renderer */
const getBinarySVG_2DArr = (pixels: string[][]) => {};

// TODO add support for the ndarray concept that scott pointed out
