import getPixels from 'get-pixels';
import { getBinarySVG_Array } from '../api';

import { PixelBuffer, PixelBufferOptions } from '../ll_api';

export const pngToPixels = async (img: string) => {
  const pixels: { x: number; y: number; color: string }[] = [];
  await getPixels(img, (err, rawPixels) => {
    // TODO error handling
    console.log('error', err);
    if (err) return;

    const width = rawPixels.shape[0];
    const height = rawPixels.shape[1];

    console.log(width, height);

    // TODO error handling
    if (width > 64 || height > 64) return;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelNum = x + y * width;
        const offset = pixelNum * 4;

        const r = rawPixels.data[offset].toString(16).padStart(2, '0');
        const g = rawPixels.data[offset + 1].toString(16).padStart(2, '0');
        const b = rawPixels.data[offset + 2].toString(16).padStart(2, '0');
        const a = rawPixels.data[offset + 3].toString(16).padStart(2, '0');

        const color = `#${r}${g}${b}${a}`;

        pixels.push({ x, y, color });
      }
    }
  });

  console.log(pixels);

  return pixels;
};

export const pngToData = async (img: string) => {
  const pixels = await pngToPixels(img);

  // create PixelBuffer
  let buffer = getBinarySVG_Array(pixels);

  if (isError(buffer)) {
    return;
  } else {
    // TODO, return err as a separate object in PixelBuffer
    buffer = buffer as PixelBuffer;
    return `${buffer.getHeader()}${buffer.getPalette()}${buffer.getData()}`;
  }
};

const isError = function (e: any) {
  return (
    e &&
    e.stack &&
    e.message &&
    typeof e.stack === 'string' &&
    typeof e.message === 'string'
  );
};
