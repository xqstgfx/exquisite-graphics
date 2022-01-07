import React, { useState } from 'react';
import chroma from 'chroma-js';
import { useWallet } from '@gimmixorg/use-wallet';
import { ENSName } from 'react-ens-name';

import { getSVGPixels } from '@exquisite-graphics/js';

const RAINBOW_SCALE = chroma
  .scale([
    '#f00',
    '#ffa500',
    '#ffff00',
    '#008000',
    '#0000ff',
    '#4b0082',
    '#8a2be2'
  ])
  .mode('hsl');
const CUBEHELIX_SCALE = chroma.cubehelix().gamma(0.6).scale();
const GREYSCALE = chroma.scale(['white', 'black']);
const MATRIX = chroma.scale(['green', 'black']);

const getScale = (color: number) => {
  switch (color) {
    case 1:
      return { scale: CUBEHELIX_SCALE, name: 'cubehelix' };
    case 2:
      return { scale: RAINBOW_SCALE, name: 'rainbow' };
    case 3:
      return { scale: GREYSCALE, name: 'greyscale' };
    case 4:
      return { scale: MATRIX, name: 'matrix' };

    default:
      return { scale: CUBEHELIX_SCALE, name: 'cubehelix' };
  }
};

function rowGenerator(
  color: number,
  nRows: number,
  nCols: number,
  nColors: number
) {
  const colorScale = getScale(color).scale;
  const palette = colorScale.colors(nColors);

  let pixels: { x: number; y: number; color: string }[] = [];

  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      let colorIndex = (row * nCols + col) % nColors;
      pixels.push({ x: col, y: row, color: palette[colorIndex] });
    }
  }

  return pixels;
}

function circleGenerator(
  color: number,
  nRows: number,
  nCols: number,
  nColors: number
) {
  const distanceFrom = (x: number, y: number, cx: number, cy: number) => {
    return Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2));
  };

  const getValue = (x: number, y: number) => {
    const radius = Math.max(nCols / 2, nRows / 2);
    const distance = distanceFrom(x, y, nCols / 2, nRows / 2);

    return distance / (radius * Math.sqrt(Math.E));
  };

  const colorScale = getScale(color).scale;
  const palette = colorScale.colors(nColors);

  let pixels: { x: number; y: number; color: string }[] = [];

  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      let colorIndex = Math.floor(getValue(col, row) * nColors);
      pixels.push({
        x: col,
        y: row,
        color: palette[colorIndex]
      });
    }
  }

  return pixels;
}

const IndexPage = () => {
  const { connect, account } = useWallet();

  const [width, setWidth] = useState(16);
  const [height, setHeight] = useState(16);
  const [numColors, setNumColors] = useState(256);
  const [colorPalette, setColorPalette] = useState(1);
  const [generator, setGenerator] = useState(1);

  return (
    <div className="index">
      <div>
        {account ? (
          <ENSName address={account} />
        ) : (
          <button onClick={() => connect()}>Connect Wallet</button>
        )}
      </div>
      <div>
        <h3>Width</h3>
        <div>
          <input
            type="range"
            min="1"
            max="64"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            style={{ width: '256px' }}
          />
          {width}
        </div>
      </div>
      <div>
        <h3>Height</h3>
        <div>
          <input
            type="range"
            min="1"
            max="64"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value))}
            style={{ width: '256px' }}
          />
          {height}
        </div>
      </div>
      <div>
        <h3>Num Colors</h3>
        <div>
          <input
            type="range"
            min="1"
            max="256"
            value={numColors}
            onChange={(e) => setNumColors(parseInt(e.target.value))}
            style={{ width: '256px' }}
          />
          {numColors}
        </div>
      </div>
      <div>
        <h3>Color Palette</h3>
        <div>
          <input
            type="range"
            min="1"
            max="4"
            value={colorPalette}
            onChange={(e) => setColorPalette(parseInt(e.target.value))}
            style={{ width: '256px' }}
          />
          {getScale(colorPalette).name}
        </div>
      </div>
      <div>
        <h3>Generator</h3>
        <div>
          <input
            type="range"
            min="1"
            max="2"
            value={generator}
            onChange={(e) => setGenerator(parseInt(e.target.value))}
            style={{ width: '256px' }}
          />
          {generator == 1 ? 'row' : 'circle'}
        </div>
      </div>

      <div
        style={{ width: 512, height: 512, display: 'flex' }}
        dangerouslySetInnerHTML={{
          __html: getSVGPixels(
            generator == 1
              ? rowGenerator(colorPalette, height, width, numColors)
              : circleGenerator(colorPalette, height, width, numColors)
          )
        }}
      ></div>

      {/* Connect wallet */}
      {/* Put an SVG on the page */}
      {/* Sliders for SVG */}
      <style jsx>{`
        .index {
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
