// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IGraphics.sol';
import {helpers} from './XQSTHelpers.sol';

library XQSTDecode {
  function _decodeHeader(bytes memory data)
    internal
    pure
    returns (IGraphics.Header memory header)
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
    header.scale = uint16((h >> 6) & 0x3F);
    header.reserved = uint8((h >> 2) & 0x0F);
    header.alpha = ((h >> 1) & 0x1) == 1 ? true : false;
    header.hasBackground = (h & 0x1) == 1 ? true : false;

    header.totalPixels = header.width * header.height;
    header.paletteStart = 8;
    header.dataStart = header.alpha
      ? (header.numColors * 4) + 8
      : (header.numColors * 3) + 8;

    _setColorParams(header);
  }

  function _decodePalette(bytes memory data, IGraphics.Header memory header)
    internal
    pure
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
    } else {
      palette = new bytes8[](2);
      palette[1] = bytes8('');
    }
  }

  function _setColorParams(IGraphics.Header memory header) internal pure {
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
