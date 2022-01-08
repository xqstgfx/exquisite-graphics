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
const MATRIX = chroma.scale([
  'green',
  'black',
  'green',
  'black',
  'green',
  'black',
  'green',
  'black',
  'green',
  'black'
]);

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
    const distance = distanceFrom(
      x,
      y,
      Math.floor(nCols / 2),
      Math.floor(nRows / 2)
    );

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
      <h1 style={{ display: 'flex', justifyContent: 'center' }}>
        Exquisite Graphics
      </h1>

      <div className="container">
        <div style={{ gridArea: 'styling' }}>
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

        <div className="art">
          <img
            src={`data:image/svg+xml;base64,${Buffer.from(
              getSVGPixels(
                generator == 1
                  ? rowGenerator(colorPalette, height, width, numColors)
                  : circleGenerator(colorPalette, height, width, numColors)
              )
            ).toString('base64')}`}
          ></img>
        </div>

        <div style={{ gridArea: 'dimensions' }}>
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
      </div>
      {account ? (
        <ENSName address={account} />
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            style={{
              fontFamily: 'VCR_OSD',
              backgroundColor: '#000',
              color: '#fff'
            }}
            onClick={() => connect()}
          >
            Connect Wallet
          </button>
        </div>
      )}

      <style jsx>{`
        .art {
          grid-area: art;
          display: flex;
        }

        .art img {
          width: 512px;
          height: 512px;
        }

        .container {
          display: grid;
          gap: 0.5rem;
          grid-auto-flow: column;
          grid-template-rows: repeat(3, auto);
          grid-template-areas: 'styling art dimensions';
          padding: 4rem;
        }

        @media only screen and (max-width: 768px) {
          .container {
            padding: 0rem;
            margin: 0rem;
            display: grid;
            grid-auto-flow: row;
            gap: 0rem;
            justify-content: center;
            grid-template-areas: 'art' 'styling' 'dimensions';
          }

          .art img {
            width: 85vw;
            height: 85vw;
          }
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
