// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import 'hardhat/console.sol';
import './interfaces/INumbers.sol';

contract XQST_RENDER {
  uint16 constant MAX_COLORS = 256;
  uint8 constant MAX_ROWS = 64;
  uint8 constant MAX_COLS = 64;
  uint8 constant MAX_MULTIPLIER = 16;

  INumbers private _numbers;

  struct Pixel {
    bytes x;
    bytes y;
    bytes width;
    uint8 colorIndex;
  }

  struct SVGCursor {
    Pixel[8] pixels;
    Pixel[8] rlePixels;
    uint8 numColors;
    uint8 numRLEPixels;
    bytes data;
  }

  struct SVGBuffers {
    SVGBuffer working;
    SVGBuffer output;
  }

  struct SVGBuffer {
    uint16 size;
    uint16 maxSize;
    bytes[] buffer;
  }

  struct SVGMetadata {
    uint8 version;
    uint16 width;
    uint16 height;
    uint16 numColors;
    uint8 backgroundColorIndex;
    uint8 reserved; // Reserved for future use
    bool hasPalette;
    bool hasBackground;
    /* Calculated Metadata */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint16 paletteStart;
    uint16 dataStart;
  }

  struct SVG {
    SVGMetadata meta;
    uint8[] data;
    bytes8[] palette;
    SVGBuffers buffers;
    SVGCursor cursor;
    // Int to Bytes
    bytes[] numberLUT;
  }

  constructor(address numbersAddr_) {
    _numbers = INumbers(numbersAddr_);
  }

  function pack12(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3],
        data[startIndex + 4],
        data[startIndex + 5],
        data[startIndex + 6],
        data[startIndex + 7],
        data[startIndex + 8],
        data[startIndex + 9],
        data[startIndex + 10],
        data[startIndex + 11]
      );
  }

  function pack8(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3],
        data[startIndex + 4],
        data[startIndex + 5],
        data[startIndex + 6],
        data[startIndex + 7]
      );
  }

  function pack4(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3]
      );
  }

  function pack3(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2]
      );
  }

  function pack2(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return bytes.concat(data[startIndex], data[startIndex + 1]);
  }

  function packN(bytes[] memory data, uint256 length)
    internal
    pure
    returns (bytes memory)
  {
    bytes memory packedData;
    uint256 remainingLength = length;
    uint256 index;

    while (remainingLength > 0) {
      index = length - remainingLength;

      if (remainingLength % 12 == 0) {
        packedData = bytes.concat(packedData, pack12(data, index));
        remainingLength -= 12;
        continue;
      }
      if (remainingLength % 8 == 0) {
        packedData = bytes.concat(packedData, pack8(data, index));
        remainingLength -= 8;
        continue;
      }
      if (remainingLength % 4 == 0) {
        packedData = bytes.concat(packedData, pack4(data, index));
        remainingLength -= 4;
        continue;
      }
      if (remainingLength % 3 == 0) {
        packedData = bytes.concat(packedData, pack3(data, index));
        remainingLength -= 3;
        continue;
      }
      if (remainingLength % 2 == 0) {
        packedData = bytes.concat(packedData, pack2(data, index));
        remainingLength -= 2;
        continue;
      }
      packedData = bytes.concat(packedData, data[index]);
      remainingLength -= 1;
      continue;
    }

    return packedData;
  }

  function rlePixel2(SVG memory svg, uint256 offset)
    internal
    pure
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="#',
        svg.palette[svg.cursor.rlePixels[0 + offset].colorIndex],
        '" x="',
        svg.cursor.rlePixels[0 + offset].x,
        '" y="',
        svg.cursor.rlePixels[0 + offset].y,
        '" height="1" width="',
        svg.cursor.rlePixels[0 + offset].width,
        '"/><rect fill="#',
        svg.palette[svg.cursor.rlePixels[1 + offset].colorIndex],
        '" x="',
        svg.cursor.rlePixels[1 + offset].x,
        '" y="',
        svg.cursor.rlePixels[1 + offset].y,
        '" height="1" width="',
        svg.cursor.rlePixels[1 + offset].width,
        '"/>'
      );
  }

  function rlePixel(SVG memory svg, uint256 offset)
    internal
    pure
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="#',
        svg.palette[svg.cursor.rlePixels[0 + offset].colorIndex],
        '" x="',
        svg.cursor.rlePixels[0 + offset].x,
        '" y="',
        svg.cursor.rlePixels[0 + offset].y,
        '" height="1" width="',
        svg.cursor.rlePixels[0 + offset].width,
        '"/>'
      );
  }

  function rlePixelN(SVG memory svg) internal pure {
    uint256 remainingLength = svg.cursor.numRLEPixels;
    uint256 index;

    delete (svg.cursor.data);

    while (remainingLength > 0) {
      index = svg.cursor.numRLEPixels - remainingLength;

      if (remainingLength % 2 == 0) {
        svg.cursor.data = bytes.concat(svg.cursor.data, rlePixel2(svg, index));
        remainingLength -= 2;
        continue;
      }
      svg.cursor.data = bytes.concat(svg.cursor.data, rlePixel(svg, index));
      remainingLength -= 1;
      continue;
    }

    delete (svg.cursor.numRLEPixels);
  }

  function pixel4(SVG memory svg, uint256 offset)
    internal
    pure
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<use href="#',
        svg.numberLUT[svg.cursor.pixels[0 + offset].colorIndex],
        '" x="',
        svg.cursor.pixels[0 + offset].x,
        '" y="',
        svg.cursor.pixels[0 + offset].y,
        '"/><use href="#',
        svg.numberLUT[svg.cursor.pixels[1 + offset].colorIndex],
        '" x="',
        svg.cursor.pixels[1 + offset].x,
        '" y="',
        svg.cursor.pixels[1 + offset].y,
        '"/><use href="#',
        abi.encodePacked(
          svg.numberLUT[svg.cursor.pixels[2 + offset].colorIndex],
          '" x="',
          svg.cursor.pixels[2 + offset].x,
          '" y="',
          svg.cursor.pixels[2 + offset].y,
          '"/><use href="#',
          svg.numberLUT[svg.cursor.pixels[3 + offset].colorIndex],
          '" x="',
          svg.cursor.pixels[3 + offset].x,
          '" y="',
          svg.cursor.pixels[3 + offset].y,
          '"/>'
        )
      );
  }

  function pixel(SVG memory svg, uint256 offset)
    internal
    pure
    returns (bytes memory)
  {
    // console.log('pixel');
    return
      abi.encodePacked(
        '<use href="#',
        svg.numberLUT[svg.cursor.pixels[0 + offset].colorIndex],
        '" x="',
        svg.cursor.pixels[0 + offset].x,
        '" y="',
        svg.cursor.pixels[0 + offset].y,
        '"/>'
      );
  }

  function pixelN(SVG memory svg) internal pure {
    uint256 remainingLength = svg.cursor.numColors;
    uint256 index;

    delete (svg.cursor.data);

    while (remainingLength > 0) {
      index = svg.cursor.numColors - remainingLength;

      if (remainingLength % 4 == 0) {
        svg.cursor.data = bytes.concat(svg.cursor.data, pixel4(svg, index));
        remainingLength -= 4;
        continue;
      }
      svg.cursor.data = bytes.concat(svg.cursor.data, pixel(svg, index));
      remainingLength -= 1;
      continue;
    }

    delete (svg.cursor.numColors);
  }

  function getRectSVG(SVG memory svg) public pure {
    uint8 colorIndex;
    uint256 c;
    uint256 pixelNum;

    while (pixelNum < svg.meta.totalPixels) {
      colorIndex = svg.data[pixelNum];

      // If this color is the background we dont need to paint it with the cursor
      if (
        colorIndex == svg.meta.backgroundColorIndex && svg.meta.hasBackground
      ) {
        pixelNum++;
        continue;
      }

      c = 1;

      while ((pixelNum + c) % svg.meta.width != 0) {
        if (colorIndex == svg.data[pixelNum + c]) c++;
        else break;
      }

      if (c > 1) {
        svg.cursor.rlePixels[svg.cursor.numRLEPixels].width = svg.numberLUT[c];
        svg.cursor.rlePixels[svg.cursor.numRLEPixels].colorIndex = colorIndex;
        svg.cursor.rlePixels[svg.cursor.numRLEPixels].x = svg.numberLUT[
          pixelNum % svg.meta.width
        ];
        svg.cursor.rlePixels[svg.cursor.numRLEPixels].y = svg.numberLUT[
          pixelNum / svg.meta.width
        ];
        svg.cursor.numRLEPixels++;
      } else {
        svg.cursor.pixels[svg.cursor.numColors].width = svg.numberLUT[1];
        svg.cursor.pixels[svg.cursor.numColors].colorIndex = colorIndex;
        svg.cursor.pixels[svg.cursor.numColors].x = svg.numberLUT[
          pixelNum % svg.meta.width
        ];
        svg.cursor.pixels[svg.cursor.numColors].y = svg.numberLUT[
          pixelNum / svg.meta.width
        ];
        svg.cursor.numColors++;
      }

      pixelNum += c; // doing this costs significant gas? why?
      if (svg.cursor.numColors == 8 || pixelNum == svg.meta.totalPixels) {
        pixelN(svg);

        svg.buffers.working.buffer[svg.buffers.working.size] = svg.cursor.data;
        svg.buffers.working.size++;

        if (svg.buffers.working.size == svg.buffers.working.maxSize) {
          svg.buffers.output.buffer[svg.buffers.output.size] = packN(
            svg.buffers.working.buffer,
            svg.buffers.working.size
          );
          svg.buffers.output.size++;
          svg.buffers.working.size = 0;
        }
      }

      if (svg.cursor.numRLEPixels == 8 || pixelNum == svg.meta.totalPixels) {
        rlePixelN(svg);

        svg.buffers.working.buffer[svg.buffers.working.size] = svg.cursor.data;
        svg.buffers.working.size++;

        if (svg.buffers.working.size == svg.buffers.working.maxSize) {
          svg.buffers.output.buffer[svg.buffers.output.size] = packN(
            svg.buffers.working.buffer,
            svg.buffers.working.size
          );
          svg.buffers.output.size++;
          svg.buffers.working.size = 0;
        }
      }
    }

    if (svg.buffers.working.size > 0) {
      svg.buffers.output.buffer[svg.buffers.output.size] = packN(
        svg.buffers.working.buffer,
        svg.buffers.working.size
      );
      svg.buffers.output.size++;
    }
  }

  function _setColorIndexLookup(bytes memory data, SVG memory svg)
    internal
    view
  {
    uint256 startGas = gasleft();
    uint8 workingByte;
    svg.data = new uint8[](svg.meta.totalPixels + 8); // add extra byte for safety
    if (svg.meta.bpp == 1) {
      for (uint256 i = 0; i < svg.meta.totalPixels; i += 8) {
        workingByte = uint8(data[i / 8 + svg.meta.dataStart]);
        svg.data[i] = workingByte >> 7;
        svg.data[i + 1] = (workingByte >> 6) & 0x01;
        svg.data[i + 2] = (workingByte >> 5) & 0x01;
        svg.data[i + 3] = (workingByte >> 4) & 0x01;
        svg.data[i + 4] = (workingByte >> 3) & 0x01;
        svg.data[i + 5] = (workingByte >> 2) & 0x01;
        svg.data[i + 6] = (workingByte >> 1) & 0x01;
        svg.data[i + 7] = workingByte & 0x01;
      }
    } else if (svg.meta.bpp == 2) {
      for (uint256 i = 0; i < svg.meta.totalPixels; i += 4) {
        workingByte = uint8(data[i / 4 + svg.meta.dataStart]);
        svg.data[i] = workingByte >> 6;
        svg.data[i + 1] = (workingByte >> 4) & 0x03;
        svg.data[i + 2] = (workingByte >> 2) & 0x03;
        svg.data[i + 3] = workingByte & 0x03;
      }
    } else if (svg.meta.bpp == 4) {
      for (uint256 i = 0; i < svg.meta.totalPixels; i += 2) {
        workingByte = uint8(data[i / 2 + svg.meta.dataStart]);
        svg.data[i] = workingByte >> 4;
        svg.data[i + 1] = workingByte & 0x0F;
      }
    } else {
      for (uint256 i = 0; i < svg.meta.totalPixels; i++) {
        svg.data[i] = uint8(data[i + svg.meta.dataStart]);
      }
    }

    // console.log('color lut builing gas used', startGas - gasleft());
  }

  /* RECT RENDERER */
  function renderSVG(bytes memory data, bytes8[] memory palette)
    public
    view
    returns (string memory)
  {
    require(data.length >= 8, 'missing header');

    SVG memory svg;
    uint256 startGas = gasleft();

    /* Setup the SVG */
    _decodeHeader(data, palette, svg);
    _setupNumberLookup(svg);
    _setupBuffers(svg);

    if (svg.meta.numColors > 1 || !svg.meta.hasBackground) {
      _initSymbols(svg);
      _setColorIndexLookup(data, svg);
      getRectSVG(svg);
      // console.log('Gas Used Rect', startGas - gasleft());
      // console.log('Gas Left Rect', gasleft());
      svg.buffers.output.buffer[svg.buffers.output.size - 1] = bytes.concat(
        svg.buffers.output.buffer[svg.buffers.output.size - 1],
        '</g></svg>'
      );
    } else {
      svg.buffers.output.buffer[0] = bytes.concat(
        svg.buffers.output.buffer[0],
        '</g></svg>'
      );
      svg.buffers.output.size = 1;
    }

    startGas = gasleft();
    // output the output buffer to string
    string memory result = string(
      packN(svg.buffers.output.buffer, svg.buffers.output.size)
    );

    // console.log('Gas Used Result', startGas - gasleft());
    // console.log('Gas Left Result', gasleft());

    return result;
  }

  function _setupNumberLookup(SVG memory svg) internal view {
    uint256 max;

    max =
      (svg.meta.width > svg.meta.height ? svg.meta.width : svg.meta.height) +
      1;
    max = svg.meta.numColors > max ? svg.meta.numColors : max;

    svg.numberLUT = new bytes[](max);
    for (uint256 i = 0; i < max; i++) {
      svg.numberLUT[i] = _numbers.getNum8(uint8(i));
    }
  }

  function _initSymbols(SVG memory svg) internal view {
    uint256 startGas = gasleft();
    uint16 bufSize = 16;
    bytes[] memory symbolBuffer = new bytes[](bufSize);
    uint256 symbolBufferSize = 0;

    for (uint256 i = 0; i < svg.palette.length; i++) {
      symbolBuffer[symbolBufferSize] = abi.encodePacked(
        symbolBuffer[symbolBufferSize],
        '<symbol id="',
        svg.numberLUT[i],
        '" width="1" height="1" viewBox="0 0 1 1"><rect fill="#',
        svg.palette[i],
        '" width="1" height="1"/></symbol>'
      );

      if ((i > 0 && i % bufSize == 0) || i == svg.palette.length - 1) {
        symbolBufferSize++;
      }
    }

    svg.buffers.output.buffer[0] = bytes.concat(
      svg.buffers.output.buffer[0],
      packN(symbolBuffer, symbolBufferSize)
    );
    svg.buffers.output.size++;

    // console.log('Gas Used Init Symbols', startGas - gasleft());
  }

  function _decodeHeader(
    bytes memory data,
    bytes8[] memory palette,
    SVG memory svg
  ) internal pure {
    uint64 header;

    assembly {
      header := mload(add(data, 8))
    }

    svg.meta.version = uint8(header >> 56);
    svg.meta.width = uint16((header >> 48) & 0xFF);
    svg.meta.height = uint16((header >> 40) & 0xFF);
    svg.meta.numColors = uint16(header >> 24);
    svg.meta.backgroundColorIndex = uint8(header >> 16);
    svg.meta.hasPalette = ((header >> 1) & 0x1) == 1 ? true : false;
    svg.meta.hasBackground = (header & 0x1) == 1 ? true : false;

    svg.meta.totalPixels = svg.meta.width * svg.meta.height;
    svg.meta.paletteStart = svg.meta.hasPalette ? 8 : 0;
    svg.meta.dataStart = svg.meta.hasPalette ? (svg.meta.numColors * 8) + 8 : 8;

    require(svg.meta.height <= MAX_ROWS, 'number of rows is greater than max');
    require(
      svg.meta.width <= MAX_COLS,
      'number of columns is greater than max'
    );

    require(
      svg.meta.numColors <= MAX_COLORS,
      'number of colors is greater than max'
    );
    require(svg.meta.numColors > 0, 'cannot have 0 colors');

    if (svg.meta.hasPalette) {
      require(
        data.length >= svg.meta.paletteStart + svg.meta.numColors * 8,
        'palette data section is incorrect length'
      );

      svg.palette = new bytes8[](svg.meta.numColors);
      bytes8 d;
      uint256 offset = 32 + svg.meta.paletteStart;

      for (uint256 i = 0; i < svg.meta.numColors; i++) {
        assembly {
          d := mload(add(data, offset))
        }
        svg.palette[i] = d;
        offset += 8;
      }
    } else {
      require(palette.length == svg.meta.numColors, 'palette length mismatch');
      svg.palette = palette;
    }

    _setColorParams(svg);

    if (svg.meta.hasBackground) {
      require(
        svg.meta.backgroundColorIndex < svg.meta.numColors,
        'background color index is greater than number of colors'
      );
    }

    // if there is 1 color and there is a background then we don't need to check the data length
    if (svg.meta.numColors > 1 || !svg.meta.hasBackground) {
      uint256 pixelDataLen = svg.meta.totalPixels % 2 == 0
        ? (svg.meta.totalPixels / svg.meta.ppb)
        : (svg.meta.totalPixels / svg.meta.ppb) + 1;
      require(
        data.length == svg.meta.dataStart + pixelDataLen,
        'data length is incorrect'
      );
    }
  }

  function _setupBuffers(SVG memory svg) internal view {
    uint16 maxBufSize = (
      (svg.meta.height >= svg.meta.width)
        ? svg.meta.height / 2
        : svg.meta.width / 2
    ) + 4;
    svg.buffers.working.size = 0;
    svg.buffers.output.size = 0;

    svg.buffers.working.maxSize = maxBufSize;
    svg.buffers.output.maxSize = maxBufSize;
    svg.buffers.output.buffer = new bytes[](svg.buffers.output.maxSize);
    svg.buffers.working.buffer = new bytes[](svg.buffers.working.maxSize);

    if (svg.meta.hasBackground) {
      svg.buffers.output.buffer[0] = abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
        _numbers.getNum(svg.meta.width * 16),
        ' ',
        _numbers.getNum(svg.meta.height * 16),
        '"><g transform="scale(16 16)"><rect fill="#',
        svg.palette[svg.meta.backgroundColorIndex],
        '" height="',
        svg.numberLUT[svg.meta.height],
        '" width="',
        svg.numberLUT[svg.meta.width],
        '"/>'
      );
    } else {
      svg.buffers.output.buffer[0] = abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
        _numbers.getNum(svg.meta.width * 16),
        ' ',
        _numbers.getNum(svg.meta.height * 16),
        '"><g transform="scale(16 16)">'
      );
    }
  }

  function decodeHeader(bytes calldata data, bytes8[] memory palette)
    public
    pure
    returns (SVG memory)
  {
    SVG memory svg;
    _decodeHeader(data, palette, svg);
    return svg;
  }

  function _setColorParams(SVG memory svg) internal pure {
    if (svg.meta.numColors > 16) {
      // Use 256 Colors
      svg.meta.bpp = 8;
      svg.meta.ppb = 1;
    } else if (svg.meta.numColors > 4) {
      // Use 16 Colors
      svg.meta.bpp = 4;
      svg.meta.ppb = 2;
    } else if (svg.meta.numColors > 2) {
      // Use 4 Colors
      svg.meta.bpp = 2;
      svg.meta.ppb = 4;
    } else {
      // Use 2 Color
      svg.meta.bpp = 1;
      svg.meta.ppb = 8;
    }
  }
}
