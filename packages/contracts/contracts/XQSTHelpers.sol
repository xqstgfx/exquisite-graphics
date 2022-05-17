// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';

library helpers {
  function _getPixelColorLUT(bytes memory data, IGraphics.Header memory header)
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

  function _getNumberLUT(IGraphics.Header memory header)
    internal
    pure
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

  function _canSkipPixel(IRenderContext.Context memory ctx, uint256 colorIndex)
    internal
    pure
    returns (bool)
  {
    return ((ctx.header.hasBackground &&
      colorIndex == ctx.header.backgroundColorIndex) ||
      (ctx.header.numColors == 0 && colorIndex == 0));
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

  function _getHexChar(bytes1 char) internal pure returns (uint8) {
    return
      (uint8(char) > 9)
        ? (uint8(char) + 87) // ascii a-f
        : (uint8(char) + 48); // ascii 0-9
  }

  function _toColor(bytes3 b) internal pure returns (bytes8) {
    uint64 b6 = 0x0000000000006666;
    for (uint256 i = 0; i < 3; i++) {
      b6 |= (uint64(_getHexChar(b[i] >> 4)) << uint64((6 - (i * 2) + 1) * 8));
      b6 |= (uint64(_getHexChar(b[i] & 0x0F)) << uint64((6 - (i * 2)) * 8));
    }

    return bytes8(b6);
  }

  function _toHexBytes8(bytes4 b) internal pure returns (bytes8) {
    uint64 b8;
    for (uint256 i = 0; i < 4; i++) {
      b8 = b8 | (uint64(_getHexChar(b[i] >> 4)) << uint64((6 - (i * 2)) * 8));
      b8 =
        b8 |
        (uint64(_getHexChar(b[i + 1] & 0x0F)) << uint64((6 - (i * 2) + 1) * 8));
    }

    return bytes8(b8);
  }
}
