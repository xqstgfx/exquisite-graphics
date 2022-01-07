import { Pixel } from './api';
import { PixelBuffer } from './ll_api';

// This file is for constructing SVG's in JS from the binary format.
export const renderSVGPixels = (pixels: Pixel[]) => {};

export const renderSVG = (data: string) => {
  const buffer = new PixelBuffer();
  buffer.from(data);
  const pixels = buffer.toPixel2DArr();

  // console.log('PIXELS', pixels);

  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const pixel = pixels[y][x];
      // console.log(`${x},${y} ${pixel}`);
    }
  }
};
