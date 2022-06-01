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
    return ((ctx.header.hasBackground &&
      colorIndex == ctx.header.backgroundColorIndex) ||
      (ctx.header.numColors == 0 && colorIndex == 0) ||
      (ctx.header.numColors > 0 && colorIndex >= ctx.header.numColors));
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

  /// Gets the ascii hex character for a uint8 (byte)
  /// @param char the uint8 to get the ascii hex character for
  /// @return bytes1 ascii hex character for the given uint8
  function _getHexChar(uint8 char) internal pure returns (bytes1) {
    return
      (char > 9)
        ? bytes1(char + 87) // ascii a-f
        : bytes1(char + 48); // ascii 0-9
  }

  /// Converts 4 bytes (uint32) to a RGBA hex string
  /// @param u the uint32 to convert to a color
  /// @return bytes8 the color in RBGA hex format
  function _uint32ToColor(uint32 u) internal pure returns (string memory) {
    bytes memory b = new bytes(8);
    for (uint256 j = 0; j < 8; j++) {
      b[7 - j] = _getHexChar(uint8(uint32(u) & 0x0f));
      u = u >> 4;
    }
    return string(b);
  }

  /// Converts 3 bytes (uint24) to a RGB hex string
  /// @param u the uint24 to convert to a color
  /// @return string the color in RBG hex format
  function _uint24ToColor(uint24 u) internal pure returns (string memory) {
    bytes memory b = new bytes(6);
    for (uint256 j = 0; j < 6; j++) {
      b[5 - j] = _getHexChar(uint8(uint24(u) & 0x0f));
      u = u >> 4;
    }
    return string(b);
  }
}
