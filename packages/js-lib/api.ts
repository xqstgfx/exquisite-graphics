// TODO figure out how this thing should be organized

type rgba = { r: number; g: number; b: number; a: number };
type PixelColor = string | rgba;
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

// Functions to reconstruct SVG from binary pixel format

const getSVG = (data: string) => {};

// Functions for most builders, working with simple pixel formats

/* 
FUNCTION SET 1 

Functions where the dev just supplies all the colors they are using as strings, 
and the function can infer the palette and convert it to the correct format 
*/

/* Function that takes an array of pixel objects and returns the binary format for the renderer */
const getBinarySVG_Array = (
  pixels: { x: number; y: number; color: string }[]
) => {};

/* Function that takes a map from {x, y} -> color and returns the binary format for the renderer */
const getBinarySVG_Map = (pixels: Map<{ x: number; y: number }, string>) => {};

/* Function that takes a 2d array of pixels. Something like where the outer array represents y
   and the inner array represents x and returns the binary format for the renderer */
const getBinarySVG_2DArr = (pixels: string[][]) => {};

// TODO add support for the ndarray concept that scott pointed out

// Functions for Hardcore Builders working with binary pixel format directly

type PixelBufferOptions = {
  width: number;
  height: number;
  numColors: number;
  paletteIncluded?: boolean;
  palette?: string[];
  backgroundIncluded?: boolean;
  backgroundIndex: number;
};

const CreatePixelBuffer = (
  width: number,
  height: number,
  numColors: number
): number => {
  return 1;
};

const SetPixel = (
  buffer: number,
  x: number,
  y: number,
  color: string,
  palette: string[]
): void => {};
