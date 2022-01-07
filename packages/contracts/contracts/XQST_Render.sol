// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/IXQST_Render.sol';
import '@divergencetech/ethier/contracts/utils/DynamicBuffer.sol';

contract XQST_RENDER {
  using DynamicBuffer for bytes;

  uint16 constant MAX_COLORS = 256;
  uint8 constant MAX_ROWS = 64;
  uint8 constant MAX_COLS = 64;

  struct SVGBuffers {
    bytes buffer;
  }

  struct SVGMetadata {
    // TODO
    // XQSTBitmapHeader header;

    /* HEADER START */
    uint8 version;
    uint16 width;
    uint16 height;
    uint16 numColors;
    uint8 backgroundColorIndex;
    uint8 reserved; // Reserved for future use
    bool hasPalette;
    bool hasBackground;
    /* HEADER END */

    /* CALCULATED DATA START */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint16 paletteStart;
    uint16 dataStart;
    /* CALCULATED DATA END */

    uint8[] colorIndexLookup;
    bytes8[] palette;
    bytes[] lookup; // number lookup table
  }

  function getRectSVG(SVGMetadata memory svgData, SVGBuffers memory buffers)
    public
    pure
  {
    uint8 colorIndex;
    uint256 c;
    uint256 pixelNum;

    while (pixelNum < svgData.totalPixels) {
      colorIndex = svgData.colorIndexLookup[pixelNum];

      // If this color is the background we dont need to paint it with the cursor
      if (colorIndex == svgData.backgroundColorIndex && svgData.hasBackground) {
        pixelNum++;
        continue;
      }

      c = 1;

      while ((pixelNum + c) % svgData.width != 0) {
        if (colorIndex == svgData.colorIndexLookup[pixelNum + c]) c++;
        else break;
      }

      buffers.buffer.appendSafe(
        abi.encodePacked(
          '<rect fill="#',
          svgData.palette[colorIndex],
          '" x="',
          svgData.lookup[pixelNum % svgData.width],
          '" y="',
          svgData.lookup[pixelNum / svgData.width],
          '" height="1" width="',
          svgData.lookup[c],
          '"/>'
        )
      );

      pixelNum += c; // doing this costs significant gas? why?
    }
  }

  function _setColorIndexLookup(bytes memory data, SVGMetadata memory svgData)
    internal
    view
  {
    uint256 startGas = gasleft();
    uint8 workingByte;
    svgData.colorIndexLookup = new uint8[](svgData.totalPixels + 8); // add extra byte for safety
    if (svgData.bpp == 1) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 8) {
        workingByte = uint8(data[i / 8 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 7;
        svgData.colorIndexLookup[i + 1] = (workingByte >> 6) & 0x01;
        svgData.colorIndexLookup[i + 2] = (workingByte >> 5) & 0x01;
        svgData.colorIndexLookup[i + 3] = (workingByte >> 4) & 0x01;
        svgData.colorIndexLookup[i + 4] = (workingByte >> 3) & 0x01;
        svgData.colorIndexLookup[i + 5] = (workingByte >> 2) & 0x01;
        svgData.colorIndexLookup[i + 6] = (workingByte >> 1) & 0x01;
        svgData.colorIndexLookup[i + 7] = workingByte & 0x01;
      }
    } else if (svgData.bpp == 2) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 4) {
        workingByte = uint8(data[i / 4 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 6;
        svgData.colorIndexLookup[i + 1] = (workingByte >> 4) & 0x03;
        svgData.colorIndexLookup[i + 2] = (workingByte >> 2) & 0x03;
        svgData.colorIndexLookup[i + 3] = workingByte & 0x03;
      }
    } else if (svgData.bpp == 4) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 2) {
        workingByte = uint8(data[i / 2 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 4;
        svgData.colorIndexLookup[i + 1] = workingByte & 0x0F;
      }
    } else {
      for (uint256 i = 0; i < svgData.totalPixels; i++) {
        svgData.colorIndexLookup[i] = uint8(data[i + svgData.dataStart]);
      }
    }

    console.log('color lut builing gas used', startGas - gasleft());
  }

  // function renderRects(bytes memory data) public view returns (string memory) {
  //   require(data.length >= 8, 'missing header');
  //   // console.logBytes(data);

  //   SVGMetadata memory svgData;
  //   SVGBuffers memory buffers;
  //   uint256 startGas = gasleft();

  //   _decodeHeader(data, svgData);
  //   _setupNumberLookup(svgData);
  //   _setupBuffers(svgData, buffers);
  //   _initSymbols(buffers, svgData);
  //   _setColorIndexLookup(data, svgData);

  //   getRectSVG(svgData, buffers);

  //   return string(packN(buffers.output.buffer, buffers.output.size));
  // }

  /* RECT RENDERER */
  function renderSVG(bytes memory data) public view returns (string memory) {
    require(data.length >= 8, 'missing header');
    // console.logBytes(data);

    SVGMetadata memory svgData;
    SVGBuffers memory buffers;
    uint256 startGas = gasleft();

    /* Setup the SVG */
    _decodeHeader(data, svgData);
    _setupNumberLookup(svgData);
    _setupBuffers(svgData, buffers);
    _setupSVGHeader(svgData, buffers);

    if (svgData.numColors > 1 || !svgData.hasBackground) {
      _setColorIndexLookup(data, svgData);
      getRectSVG(svgData, buffers);
      console.log('Gas Used Rect', startGas - gasleft());
      console.log('Gas Left Rect', gasleft());
      buffers.buffer.appendSafe('</g></svg>');
    } else {
      buffers.buffer.appendSafe('</g></svg>');
    }

    startGas = gasleft();
    // output the output buffer to string
    string memory result = string(buffers.buffer);

    console.log('Gas Used Result', startGas - gasleft());
    console.log('Gas Left Result', gasleft());

    return result;
  }

  function _setupNumberLookup(SVGMetadata memory svgData) internal view {
    uint256 max;

    max = (svgData.width > svgData.height ? svgData.width : svgData.height) + 1;
    max = svgData.numColors > max ? svgData.numColors : max;

    // TODO, optimize this into bytes8? or bytes16?
    svgData.lookup = new bytes[](max);
    for (uint256 i = 0; i < max; i++) {
      svgData.lookup[i] = toBytes(i);
    }
  }

  function _decodeHeader(bytes memory data, SVGMetadata memory svgMetadata)
    internal
    view
  {
    uint64 header;

    assembly {
      header := mload(add(data, 8))
    }

    svgMetadata.version = uint8(header >> 56);
    svgMetadata.width = uint16((header >> 48) & 0xFF);
    svgMetadata.height = uint16((header >> 40) & 0xFF);
    svgMetadata.numColors = uint16(header >> 24);
    svgMetadata.backgroundColorIndex = uint8(header >> 16);
    svgMetadata.hasPalette = ((header >> 1) & 0x1) == 1 ? true : false;
    svgMetadata.hasBackground = (header & 0x1) == 1 ? true : false;

    svgMetadata.totalPixels = svgMetadata.width * svgMetadata.height;
    svgMetadata.paletteStart = svgMetadata.hasPalette ? 8 : 0;
    svgMetadata.dataStart = svgMetadata.hasPalette
      ? (svgMetadata.numColors * 8) + 8
      : 8;

    require(
      svgMetadata.height <= MAX_ROWS,
      'number of rows is greater than max'
    );
    require(
      svgMetadata.width <= MAX_COLS,
      'number of columns is greater than max'
    );

    require(
      svgMetadata.numColors <= MAX_COLORS,
      'number of colors is greater than max'
    );
    require(svgMetadata.numColors > 0, 'cannot have 0 colors');

    if (svgMetadata.numColors > 0) {
      require(
        data.length >= svgMetadata.paletteStart + svgMetadata.numColors * 8,
        'palette data section is incorrect length'
      );

      svgMetadata.palette = new bytes8[](svgMetadata.numColors);
      bytes8 d;
      uint256 offset = 32 + svgMetadata.paletteStart;

      for (uint256 i = 0; i < svgMetadata.numColors; i++) {
        assembly {
          d := mload(add(data, offset))
        }
        svgMetadata.palette[i] = d;
        offset += 8;
      }
    }

    _setColorParams(svgMetadata);

    if (svgMetadata.hasBackground) {
      require(
        svgMetadata.backgroundColorIndex < svgMetadata.numColors,
        'background color index is greater than number of colors'
      );
    }

    // if there is 1 color and there is a background then we don't need to check the data length
    // TODO revisit this for 0 colors.
    if (svgMetadata.numColors > 1 || !svgMetadata.hasBackground) {
      uint256 pixelDataLen = (svgMetadata.totalPixels % 2 == 0) ||
        svgMetadata.ppb == 1
        ? (svgMetadata.totalPixels / svgMetadata.ppb)
        : (svgMetadata.totalPixels / svgMetadata.ppb) + 1;
      console.log(svgMetadata.totalPixels, data.length);
      console.log(pixelDataLen, svgMetadata.dataStart);
      require(
        data.length >= svgMetadata.dataStart + pixelDataLen,
        'data length is incorrect'
      );
    }
  }

  function _setupBuffers(SVGMetadata memory meta, SVGBuffers memory buffers)
    internal
    view
  {
    buffers.buffer = DynamicBuffer.allocate(2**19);
  }

  function _setupSVGHeader(SVGMetadata memory meta, SVGBuffers memory buffers)
    internal
    view
  {
    if (meta.hasBackground) {
      buffers.buffer.appendSafe(
        abi.encodePacked(
          '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
          toBytes(meta.width * 16),
          ' ',
          toBytes(meta.height * 16),
          '"><g transform="scale(16 16)"><rect fill="#',
          meta.palette[meta.backgroundColorIndex],
          '" height="',
          meta.lookup[meta.height],
          '" width="',
          meta.lookup[meta.width],
          '"/>'
        )
      );
    } else {
      buffers.buffer.appendSafe(
        abi.encodePacked(
          '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
          toBytes(meta.width * 16),
          ' ',
          toBytes(meta.height * 16),
          '"><g transform="scale(16 16)">'
        )
      );
    }
  }

  function decodeHeader(bytes calldata data)
    public
    view
    returns (SVGMetadata memory)
  {
    SVGMetadata memory svgMetadata;
    _decodeHeader(data, svgMetadata);
    return svgMetadata;
  }

  function _setColorParams(SVGMetadata memory svgData) internal pure {
    if (svgData.numColors > 16) {
      // Use 256 Colors
      svgData.bpp = 8;
      svgData.ppb = 1;
    } else if (svgData.numColors > 4) {
      // Use 16 Colors
      svgData.bpp = 4;
      svgData.ppb = 2;
    } else if (svgData.numColors > 2) {
      // Use 4 Colors
      svgData.bpp = 2;
      svgData.ppb = 4;
    } else {
      // Use 2 Color
      svgData.bpp = 1;
      svgData.ppb = 8;
    }
  }

  function toBytes(uint256 value) internal pure returns (bytes memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return '0';
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return buffer;
  }
}
