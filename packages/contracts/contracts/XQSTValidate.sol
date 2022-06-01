// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';
import {XQSTHelpers as helpers} from './XQSTHelpers.sol';
import {XQSTDecode as decode} from './XQSTDecode.sol';

library XQSTValidate {
  uint32 public constant MAX_COLORS = 256;
  uint32 public constant MAX_PIXELS = 4096;
  uint32 public constant MAX_ROWS = 256;
  uint32 public constant MAX_COLS = 256;

  /// @notice validates if the given data is a valid .xqst file
  /// @param data Binary data in the .xqst format.
  /// @return bool true if the data is valid
  function _validate(bytes memory data) internal pure returns (bool) {
    IRenderContext.Context memory ctx;

    ctx.header = decode._decodeHeader(data);
    _validateHeader(ctx.header);
    _validateDataLength(ctx.header, data);
    ctx.palette = decode._decodePalette(data, ctx.header);

    return true;
  }

  /// @notice checks if the given data contains a valid .xqst header
  /// @param header the header of the data
  /// @return bool true if the header is valid
  function _validateHeader(IGraphics.Header memory header)
    internal
    pure
    returns (bool)
  {
    if (uint32(header.width) * uint32(header.height) > MAX_PIXELS)
      revert IGraphics.ExceededMaxPixels();
    if (header.height > MAX_ROWS) revert IGraphics.ExceededMaxRows(); // This shouldn't be possible
    if (header.width > MAX_COLS) revert IGraphics.ExceededMaxColumns(); // This shouldn't be possible
    if (header.numColors > MAX_COLORS) revert IGraphics.ExceededMaxColors();

    if (
      header.hasBackground && header.backgroundColorIndex >= header.numColors
    ) {
      revert IGraphics.BackgroundColorIndexOutOfRange();
    }

    return true;
  }

  /// @notice checks if the given data is long enough to render an .xqst image
  /// @param header the header of the data
  /// @param data the data to validate
  /// @return bool true if the data is long enough
  function _validateDataLength(
    IGraphics.Header memory header,
    bytes memory data
  ) internal pure returns (bool) {
    uint256 pixelDataLen = (header.totalPixels % 2 == 0) ||
      header.pixelsPerByte == 1
      ? (header.totalPixels / header.pixelsPerByte)
      : (header.totalPixels / header.pixelsPerByte) + 1;
    if (data.length < header.dataStart + pixelDataLen)
      revert IGraphics.NotEnoughData();
    return true;
  }
}
