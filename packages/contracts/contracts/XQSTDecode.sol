// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import 'hardhat/console.sol';
import './interfaces/IGraphics.sol';
import {XQSTHelpers as helpers} from './XQSTHelpers.sol';

library XQSTDecode {
  // TODO it would be good to add a ASCII representation of the header format here.
  /// Decode the header from raw binary data into a Header struct
  /// @param data Binary data in the .xqst format.
  /// @return header the header decoded from the data
  function _decodeHeader(bytes memory data)
    internal
    pure
    returns (IGraphics.Header memory header)
  {
    if (data.length < 8) revert IGraphics.MissingHeader();

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

    _setColorDepthParams(header);
  }

  /// Decode the palette from raw binary data into a palette array
  /// @dev Each element of the palette array is a hex color with alpha channel
  /// @param data Binary data in the .xqst format.
  /// @return palette the palette from the data
  function _decodePalette(bytes memory data, IGraphics.Header memory header)
    internal
    pure
    returns (bytes8[] memory palette)
  {
    if (header.numColors > 0) {
      if (data.length < header.dataStart) revert IGraphics.NotEnoughData();

      // the first 32 bytes of `data` represents `data.length` using assembly.
      // we offset 32 bytes to get to the actual data
      uint256 offset = 32 + header.paletteStart;

      if (header.alpha) {
        // read 4 bytes at a time if alpha
        bytes4 d;
        palette = new bytes8[](header.numColors);
        for (uint256 i = 0; i < header.numColors; i++) {
          // load 4 bytes of data at the offset into d
          assembly {
            d := mload(add(data, offset))
          }

          palette[i] = helpers._toHexBytes8(d); // TODO might be good to give this consistent naming as below.
          unchecked {
            offset += 4;
          }
        }
      } else {
        // read 3 bytes at a time if no alpha
        bytes3 d;
        palette = new bytes8[](header.numColors);
        for (uint256 i = 0; i < header.numColors; i++) {
          // load 3 bytes of data at the offset into d
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

  /// Get a table of the color values (index) for each pixel in the image
  /// @param data Binary data in the .xqst format.
  /// @param header the header of the image
  /// @return table table of color index for each pixel
  function _getPixelColorLUT(bytes memory data, IGraphics.Header memory header)
    internal
    pure
    returns (uint8[] memory table)
  {
    // TODO it might be worth testing if we can get the bytes8[] for each pixel directly.
    // ^ first attempt at this didnt look great, mostly bytes8 is a pain to work with
    // uint256 startGas = gasleft();
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

    // console.log('color lut builing gas used', startGas - gasleft());
  }

  /// Set the color depth of the image in the header provided
  /// @param header the header of the image
  function _setColorDepthParams(IGraphics.Header memory header) internal pure {
    if (header.numColors > 16) {
      // 8 bit Color Depth: images with 16 < numColors <= 256
      header.bpp = 8;
      header.ppb = 1;
    } else if (header.numColors > 4) {
      // 4 bit Color Depth: images with 4 < numColors <= 16
      header.bpp = 4;
      header.ppb = 2;
    } else if (header.numColors > 2) {
      // 2 bit Color Depth: images with 2 < numColors <= 4
      header.bpp = 2;
      header.ppb = 4;
    } else {
      // 1 bit Color Depth: images with 0 <= numColors <= 2
      header.bpp = 1;
      header.ppb = 8;
    }
  }
}
