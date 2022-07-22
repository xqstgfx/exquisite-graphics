import getPixels from 'get-pixels';
import { getBinarySVG_Array } from '../api';

import { PNG } from 'pngjs';
// import fs from 'fs';

import { PixelBuffer } from '../ll_api';

// export const pngToPixels = async (img: string) => {
//   const pixels: { x: number; y: number; color: string }[] = [];

//   var png = PNG.sync.read(fs.readFileSync(img));
//   if (png.width > 64 || png.height > 64) return pixels;

//   let offset = 0;
//   for (let y = 0; y < png.height; y++) {
//     for (let x = 0; x < png.width; x++) {
//       pixels.push({
//         x,
//         y,
//         color: `#${png.data.readUInt32BE(offset).toString(16).padStart(8, '0')}`
//       });
//       offset += 4;
//     }
//   }

//   return pixels;
// };

// export const pngToData = async (img: string) => {
//   const pixels = await pngToPixels(img);

//   // create PixelBuffer
//   let buffer = getBinarySVG_Array(pixels);

//   if (isError(buffer)) {
//     return;
//   } else {
//     // TODO, return err as a separate object in PixelBuffer
//     buffer = buffer as PixelBuffer;
//     return `${buffer.getPixelBuffer()}`;
//   }
// };

const isError = function (e: any) {
  return (
    e &&
    e.stack &&
    e.message &&
    typeof e.stack === 'string' &&
    typeof e.message === 'string'
  );
};
