// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';

library XQSTHelpers {
  /// Gets a table of numbers
  /// @dev index 0 is the string '0' and index 255 is the string '255'
  /// @param header used to figure out how many numbers we need to store
  /// @return lookup the table of numbers
  function _getNumberLUT(IGraphics.Header memory header)
    internal
    pure
    returns (bytes[] memory lookup)
  {
    uint256 max;

    max = (header.width > header.height ? header.width : header.height) + 1;
    max = header.numColors > max ? header.numColors : max;

    lookup = new bytes[](max);
    for (uint256 i = 0; i < max; i++) {
      lookup[i] = toBytes(i);
    }
  }

  /// Determines if we can skip rendering a pixel
  /// @dev Can skip rendering a pixel under 3 Conditions
  /// @dev 1. The pixel's color is the same as the background color
  /// @dev 2. We are rendering in 0-color mode, and the pixel is a 0
  /// @dev 3. The pixel's color doesn't exist in the palette
  /// @param ctx the render context
  /// @param colorIndex the index of the color for this pixel
  function _canSkipPixel(IRenderContext.Context memory ctx, uint256 colorIndex)
    internal
    pure
    returns (bool)
  {
    //      (note: maybe this is better as an error? not sure.
    //       it's a nice way of adding transparency to the image)
    return ((ctx.header.hasBackground &&
      colorIndex == ctx.header.backgroundColorIndex) ||
      (ctx.header.numColors == 0 && colorIndex == 0) ||
      colorIndex >= ctx.header.numColors);
  }

  /// Returns the bytes representation of a number
  /// @param value the number to convert to bytes
  /// @return bytes representation of the number
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

  /// Gets the ascii hex character for a byte
  /// @param char the byte to get the ascii hex character for
  /// @return uint8 ascii hex character for the byte
  function _getHexChar(bytes1 char) internal pure returns (uint8) {
    return
      (uint8(char) > 9)
        ? (uint8(char) + 87) // ascii a-f
        : (uint8(char) + 48); // ascii 0-9
  }

  /// Converts 3 bytes to a RGBA hex string
  /// @param b the bytes to convert to a color
  /// @return bytes8 the color in RBGA hex format
  function _toColor(bytes3 b) internal pure returns (bytes8) {
    uint64 b6 = 0x0000000000006666;
    for (uint256 i = 0; i < 3; i++) {
      b6 |= (uint64(_getHexChar(b[i] >> 4)) << uint64((6 - (i * 2) + 1) * 8));
      b6 |= (uint64(_getHexChar(b[i] & 0x0F)) << uint64((6 - (i * 2)) * 8));
    }

    return bytes8(b6);
  }

  /// Converts 4 bytes to a RGBA hex string
  /// @param b the bytes to convert to a color
  /// @return bytes8 the color in RBGA hex format
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
