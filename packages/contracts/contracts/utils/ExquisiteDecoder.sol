// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IExquisiteGraphics as xqstgfx} from '../interfaces/IExquisiteGraphics.sol';
import {ExquisiteUtils as utils} from './ExquisiteUtils.sol';

library ExquisiteDecoder {
  /// Decode the header from raw binary data into a Header struct
  /// @param data Binary data in the .xqst format.
  /// @return header the header decoded from the data
  function _decodeHeader(bytes memory data)
    internal
    pure
    returns (xqstgfx.Header memory header)
  {
    if (data.length < 8) revert xqstgfx.MissingHeader();

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
    header.scale = uint16((h >> 6) & 0x3FF);
    header.reserved = uint8((h >> 2) & 0x0F);
    header.alpha = ((h >> 1) & 0x1) == 1 ? true : false;
    header.hasBackground = (h & 0x1) == 1 ? true : false;

    header.paletteStart = 8;
    header.dataStart = header.alpha
      ? (header.numColors * 4) + 8
      : (header.numColors * 3) + 8;

    // if the height or width is '0' this really represents 256
    if (header.height == 0) header.height = 256;
    if (header.width == 0) header.width = 256;

    header.totalPixels = uint24(header.width) * uint24(header.height);

    _setColorDepthParams(header);
  }

  /// Decode the palette from raw binary data into a palette array
  /// @dev Each element of the palette array is a hex color with alpha channel
  /// @param data Binary data in the .xqst format.
  /// @return palette the palette from the data
  function _decodePalette(bytes memory data, xqstgfx.Header memory header)
    internal
    pure
    returns (string[] memory palette)
  {
    if (header.numColors > 0) {
      if (data.length < header.dataStart) revert xqstgfx.NotEnoughData();

      // the first 32 bytes of `data` represents `data.length` using assembly.
      // we offset 32 bytes to read the actual data
      uint256 offset = 32 + header.paletteStart;

      palette = new string[](header.numColors);

      if (header.alpha) {
        // read 4 bytes at a time if alpha
        bytes4 d;
        for (uint256 i = 0; i < header.numColors; i++) {
          // load 4 bytes of data at offset into d
          assembly {
            d := mload(add(data, offset))
          }

          palette[i] = utils._uint32ToColor(uint32(d));
          unchecked {
            offset += 4;
          }
        }
      } else {
        // read 3 bytes at a time if no alpha
        bytes3 d;
        for (uint256 i = 0; i < header.numColors; i++) {
          // load 3 bytes of data at offset into d
          assembly {
            d := mload(add(data, offset))
          }

          palette[i] = utils._uint24ToColor(uint24(d));
          unchecked {
            offset += 3;
          }
        }
      }
    } else {
      palette = new string[](2);
    }
  }

  /// Get a table of the color values (index) for each pixel in the image
  /// @param data Binary data in the .xqst format.
  /// @param header the header of the image
  /// @return table table of color index for each pixel
  function _decodePixels(bytes memory data, xqstgfx.Header memory header)
    internal
    pure
    returns (uint8[] memory table)
  {
    uint8 workingByte;
    table = new uint8[](header.totalPixels + 8); // add extra byte for safety
    if (header.bitsPerPixel == 1) {
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
    } else if (header.bitsPerPixel == 2) {
      for (uint256 i = 0; i < header.totalPixels; i += 4) {
        workingByte = uint8(data[i / 4 + header.dataStart]);
        table[i] = workingByte >> 6;
        table[i + 1] = (workingByte >> 4) & 0x03;
        table[i + 2] = (workingByte >> 2) & 0x03;
        table[i + 3] = workingByte & 0x03;
      }
    } else if (header.bitsPerPixel == 4) {
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
  }

  /// Set the color depth of the image in the header provided
  /// @param header the header of the image
  function _setColorDepthParams(xqstgfx.Header memory header) internal pure {
    if (header.numColors > 16) {
      // 8 bit Color Depth: images with 16 < numColors <= 256
      header.bitsPerPixel = 8;
      header.pixelsPerByte = 1;
    } else if (header.numColors > 4) {
      // 4 bit Color Depth: images with 4 < numColors <= 16
      header.bitsPerPixel = 4;
      header.pixelsPerByte = 2;
    } else if (header.numColors > 2) {
      // 2 bit Color Depth: images with 2 < numColors <= 4
      header.bitsPerPixel = 2;
      header.pixelsPerByte = 4;
    } else {
      // 1 bit Color Depth: images with 0 <= numColors <= 2
      header.bitsPerPixel = 1;
      header.pixelsPerByte = 8;
    }
  }
}
