// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/IXQST_Render.sol';
import {helpers} from './XQSTHelpers.sol';
import '@divergencetech/ethier/contracts/utils/DynamicBuffer.sol';

contract XQST_RENDER {
  using DynamicBuffer for bytes;

  uint16 constant MAX_COLORS = 256;
  uint16 constant MAX_PIXELS = 4096;
  uint8 constant MAX_ROWS = 255;
  uint8 constant MAX_COLS = 255;

  struct Header {
    /* HEADER START */
    uint8 version;
    uint16 width;
    uint16 height;
    uint16 numColors;
    uint8 backgroundColorIndex;
    uint8 reserved; // Reserved for future use
    bool alpha;
    bool hasBackground;
    /* HEADER END */

    /* CALCULATED DATA START */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint16 paletteStart;
    uint16 dataStart;
    /* CALCULATED DATA END */
  }

  struct LookupTables {
    uint8[] colorIndexLookup;
    bytes[] lookup; // number lookup table
  }

  struct Context {
    bytes data;
    Header header;
    LookupTables tables;
    bytes8[] palette;
  }

  function _writeSVGRects(Context memory ctx, bytes memory buffer)
    internal
    view
  {
    uint8 colorIndex;
    uint256 c;
    uint256 pixelNum;

    while (pixelNum < ctx.header.totalPixels) {
      colorIndex = ctx.tables.colorIndexLookup[pixelNum];

      // If this color is the background we dont need to paint it with the cursor
      if (
        ctx.header.hasBackground &&
        colorIndex == ctx.header.backgroundColorIndex
      ) {
        pixelNum++;
        continue;
      }

      c = 1;
      while ((pixelNum + c) % ctx.header.width != 0) {
        if (colorIndex == ctx.tables.colorIndexLookup[pixelNum + c]) {
          unchecked {
            c++;
          }
        } else break;
      }

      buffer.appendSafe(
        abi.encodePacked(
          '<rect fill="#',
          ctx.palette[colorIndex],
          '" x="',
          ctx.tables.lookup[pixelNum % ctx.header.width],
          '" y="',
          ctx.tables.lookup[pixelNum / ctx.header.width],
          '" height="1" width="',
          ctx.tables.lookup[c],
          '"/>'
        )
      );

      unchecked {
        pixelNum += c;
      }
    }
  }

  function _setColorIndexLookup(bytes memory data, Header memory header)
    internal
    view
    returns (uint8[] memory table)
  {
    uint256 startGas = gasleft();
    uint8 workingByte;
    table = new uint8[](header.totalPixels + 8); // add extra byte for safety
    if (header.bpp == 1) {
      for (uint256 i = 0; i < header.totalPixels; i += 8) {
        workingByte = uint8(data[i / 8 + header.dataStart]);
        table[i] = workingByte >> 7;
        table[i + 1] = (workingByte >> 6) & 0x01;
        table[i + 2] = (workingByte >> 5) & 0x01;
        table[i + 3] = (workingByte >> 4) & 0x01;
        table[i + 4] = (workingByte >> 3) & 0x01;
        table[i + 5] = (workingByte >> 2) & 0x01;
        table[i + 6] = (workingByte >> 1) & 0x01;
        table[i + 7] = workingByte & 0x01;
      }
    } else if (header.bpp == 2) {
      for (uint256 i = 0; i < header.totalPixels; i += 4) {
        workingByte = uint8(data[i / 4 + header.dataStart]);
        table[i] = workingByte >> 6;
        table[i + 1] = (workingByte >> 4) & 0x03;
        table[i + 2] = (workingByte >> 2) & 0x03;
        table[i + 3] = workingByte & 0x03;
      }
    } else if (header.bpp == 4) {
      for (uint256 i = 0; i < header.totalPixels; i += 2) {
        workingByte = uint8(data[i / 2 + header.dataStart]);
        table[i] = workingByte >> 4;
        table[i + 1] = workingByte & 0x0F;
      }
    } else {
      for (uint256 i = 0; i < header.totalPixels; i++) {
        table[i] = uint8(data[i + header.dataStart]);
      }
    }

    console.log('color lut builing gas used', startGas - gasleft());
  }

  /* RECT RENDERER */
  // drawRects
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

  //

  // draw or drawSVG?
  function draw(bytes memory data) public view returns (string memory) {
    Context memory ctx;

    // does it make sense to have the buffer in context?
    bytes memory buffer = DynamicBuffer.allocate(2**18);

    uint256 startGas = gasleft();

    // init(ctx, data)

    /* Init */
    ctx.data = data;
    ctx.header = _decodeHeader(data);
    ctx.palette = _decodePalette(data, ctx.header);
    ctx.tables.lookup = _setupNumberLookup(ctx.header);
    ctx.tables.colorIndexLookup = _setColorIndexLookup(data, ctx.header);
    /* End Init */

    /* Write SVG */
    _writeSVGHeader(ctx, buffer);
    _writeSVGRects(ctx, buffer);
    buffer.appendSafe('</svg>');

    startGas = gasleft();
    // output the output buffer to string
    string memory result = string(buffer);
    /* End Write SVG */

    console.log('Gas Used Result', startGas - gasleft());
    console.log('Gas Left Result', gasleft());

    return result;
  }

  function _setupNumberLookup(Header memory header)
    internal
    view
    returns (bytes[] memory lookup)
  {
    uint256 max;

    max = (header.width > header.height ? header.width : header.height) + 1;
    max = header.numColors > max ? header.numColors : max;

    // TODO, optimize this into bytes8? or bytes16?
    lookup = new bytes[](max);
    for (uint256 i = 0; i < max; i++) {
      lookup[i] = helpers.toBytes(i);
    }
  }

  function _decodePalette(bytes memory data, Header memory header)
    internal
    view
    returns (bytes8[] memory palette)
  {
    if (header.numColors > 0) {
      require(
        data.length >= header.dataStart,
        'palette data section is incorrect length'
      );

      // 32 is the length of bytes which we need to offset
      uint256 offset = 32 + header.paletteStart;

      if (header.alpha) {
        // read 4 bytes at a time if alpha
        bytes4 d;
        palette = new bytes8[](header.numColors);
        for (uint256 i = 0; i < header.numColors; i++) {
          assembly {
            d := mload(add(data, offset))
          }
          // TODO rename toColor
          palette[i] = helpers._toHexBytes8(d);

          unchecked {
            offset += 4;
          }
        }
      } else {
        // read 3 bytes at a time if no alpha
        bytes3 d;
        palette = new bytes8[](header.numColors);
        for (uint256 i = 0; i < header.numColors; i++) {
          assembly {
            d := mload(add(data, offset))
          }

          palette[i] = helpers._toColor(d);
          unchecked {
            offset += 3;
          }
        }
      }
    }
  }

  function _decodeHeader(bytes memory data)
    internal
    view
    returns (Header memory header)
  {
    require(data.length >= 8, 'missing header');

    // Fetch the 8 Bytes representing the header from the data
    uint64 h;
    assembly {
      h := mload(add(data, 8))
    }

    header.version = uint8(h >> 56);
    header.width = uint16((h >> 48) & 0xFF);
    header.height = uint16((h >> 40) & 0xFF);
    header.numColors = uint16(h >> 24);
    header.backgroundColorIndex = uint8(h >> 16);
    header.alpha = ((h >> 1) & 0x1) == 1 ? true : false;
    header.hasBackground = (h & 0x1) == 1 ? true : false;

    header.totalPixels = header.width * header.height;
    header.paletteStart = 8;
    header.dataStart = header.alpha
      ? (header.numColors * 4) + 8
      : (header.numColors * 3) + 8;

    require(header.height <= MAX_ROWS, 'number of rows is greater than max');
    require(header.width <= MAX_COLS, 'number of columns is greater than max');

    require(
      header.numColors <= MAX_COLORS,
      'number of colors is greater than max'
    );
    if (header.hasBackground) {
      require(
        header.backgroundColorIndex < header.numColors,
        'background color index is greater than number of colors'
      );
    }

    _setColorParams(header);
  }

  // function _decodeHeader(bytes memory data, SVGMetadata memory svgMetadata)
  //   internal
  //   view
  // {
  //   uint64 header;

  //   assembly {
  //     header := mload(add(data, 8))
  //   }

  //   svgMetadata.version = uint8(header >> 56);
  //   svgMetadata.width = uint16((header >> 48) & 0xFF);
  //   svgMetadata.height = uint16((header >> 40) & 0xFF);
  //   svgMetadata.numColors = uint16(header >> 24);
  //   svgMetadata.backgroundColorIndex = uint8(header >> 16);
  //   svgMetadata.alpha = ((header >> 1) & 0x1) == 1 ? true : false;
  //   svgMetadata.hasBackground = (header & 0x1) == 1 ? true : false;

  //   svgMetadata.totalPixels = svgMetadata.width * svgMetadata.height;
  //   svgMetadata.paletteStart = 8;
  //   svgMetadata.dataStart = svgMetadata.alpha
  //     ? (svgMetadata.numColors * 4) + 8
  //     : (svgMetadata.numColors * 3) + 8;

  //   require(
  //     svgMetadata.height <= MAX_ROWS,
  //     'number of rows is greater than max'
  //   );
  //   require(
  //     svgMetadata.width <= MAX_COLS,
  //     'number of columns is greater than max'
  //   );

  //   require(
  //     svgMetadata.numColors <= MAX_COLORS,
  //     'number of colors is greater than max'
  //   );
  //   require(svgMetadata.numColors > 0, 'cannot have 0 colors');

  //   if (svgMetadata.numColors > 0) {
  //     require(
  //       data.length >= svgMetadata.dataStart,
  //       'palette data section is incorrect length'
  //     );

  //     // 32 is the length of bytes which we need to offset
  //     uint256 offset = 32 + svgMetadata.paletteStart;

  //     if (svgMetadata.alpha) {
  //       // read 4 bytes at a time if alpha
  //       bytes4 d;
  //       svgMetadata.palette = new bytes8[](svgMetadata.numColors);
  //       for (uint256 i = 0; i < svgMetadata.numColors; i++) {
  //         assembly {
  //           d := mload(add(data, offset))
  //         }
  //         svgMetadata.palette[i] = helpers._toHexBytes8(d);
  //         offset += 4;
  //       }
  //     } else {
  //       // read 3 bytes at a time if no alpha
  //       bytes3 d;
  //       svgMetadata.palette = new bytes8[](svgMetadata.numColors);
  //       for (uint256 i = 0; i < svgMetadata.numColors; i++) {
  //         assembly {
  //           d := mload(add(data, offset))
  //         }

  //         svgMetadata.palette[i] = helpers._toColor(d);
  //         unchecked {
  //           offset += 3;
  //         }
  //       }
  //     }
  //   }

  //   _setColorParams(svgMetadata);

  //   if (svgMetadata.hasBackground) {
  //     require(
  //       svgMetadata.backgroundColorIndex < svgMetadata.numColors,
  //       'background color index is greater than number of colors'
  //     );
  //   }

  //   // if there is 1 color and there is a background then we don't need to check the data length
  //   // TODO revisit this for 0 colors.
  //   if (svgMetadata.numColors > 1 || !svgMetadata.hasBackground) {
  //     uint256 pixelDataLen = (svgMetadata.totalPixels % 2 == 0) ||
  //       svgMetadata.ppb == 1
  //       ? (svgMetadata.totalPixels / svgMetadata.ppb)
  //       : (svgMetadata.totalPixels / svgMetadata.ppb) + 1;
  //     console.log(svgMetadata.totalPixels, data.length);
  //     console.log(pixelDataLen, svgMetadata.dataStart);
  //     require(
  //       data.length >= svgMetadata.dataStart + pixelDataLen,
  //       'data length is incorrect'
  //     );
  //   }
  // }

  function _writeSVGHeader(Context memory ctx, bytes memory buffer)
    internal
    view
  {
    buffer.appendSafe(
      abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
        helpers.toBytes(ctx.header.width),
        ' ',
        helpers.toBytes(ctx.header.height),
        '" width="',
        helpers.toBytes(ctx.header.width * 16),
        '" height="',
        helpers.toBytes(ctx.header.height * 16),
        '"><rect fill="#',
        ctx.header.hasBackground
          ? ctx.palette[ctx.header.backgroundColorIndex]
          : bytes8('00000000'),
        '" height="',
        ctx.tables.lookup[ctx.header.height],
        '" width="',
        ctx.tables.lookup[ctx.header.width],
        '"/>'
      )
    );
  }

  function decodeHeader(bytes calldata data)
    public
    view
    returns (Header memory)
  {
    return _decodeHeader(data);
  }

  function decodePalette(bytes calldata data)
    public
    view
    returns (bytes8[] memory)
  {
    return _decodePalette(data, _decodeHeader(data));
  }

  function _setColorParams(Header memory header) internal pure {
    if (header.numColors > 16) {
      // Use 256 Colors
      header.bpp = 8;
      header.ppb = 1;
    } else if (header.numColors > 4) {
      // Use 16 Colors
      header.bpp = 4;
      header.ppb = 2;
    } else if (header.numColors > 2) {
      // Use 4 Colors
      header.bpp = 2;
      header.ppb = 4;
    } else {
      // Use 2 Color
      header.bpp = 1;
      header.ppb = 8;
    }
  }
}
