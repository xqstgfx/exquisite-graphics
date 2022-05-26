// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';
import {XQSTHelpers as helpers} from './XQSTHelpers.sol';
import {XQSTDecode as decode} from './XQSTDecode.sol';

library XQSTValidate {
  uint16 public constant MAX_COLORS = 256;
  uint16 public constant MAX_PIXELS = 10000; // TODO
  uint8 public constant MAX_ROWS = 255; // TODO
  uint8 public constant MAX_COLS = 255; // TODO

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
    if (header.width * header.height > MAX_PIXELS)
      revert IGraphics.ExceededMaxPixels();
    if (header.height > MAX_ROWS) revert IGraphics.ExceededMaxRows();
    if (header.width > MAX_COLS) revert IGraphics.ExceededMaxColumns();
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
    // if 0 - palette has no data. data is binary data of length of the number of pixels
    // if 1 color - palette
    // if > 1 color

    // if (header.numColors > 1 || !header.hasBackground) {
    uint256 pixelDataLen = (header.totalPixels % 2 == 0) || header.ppb == 1
      ? (header.totalPixels / header.ppb)
      : (header.totalPixels / header.ppb) + 1;

    if (data.length < header.dataStart + pixelDataLen)
      revert IGraphics.NotEnoughData();
    // }
    return true;
  }

  // TODO: remove this and below function? not used if we allow blank (non rendered) pixels
  // function _validateDataContents(
  //   bytes memory data,
  //   IGraphics.Header memory header
  // ) internal view returns (bool) {
  //   uint8[] memory pixelColorLUT = decode._getPixelColorLUT(data, header);
  //   for (uint256 i = 0; i < header.totalPixels; i++) {
  //     if (pixelColorLUT[i] >= header.numColors)
  //       revert IGraphics.PixelColorIndexOutOfRange();
  //   }

  //   return true;
  // }

  // function _validateDataContents(IRenderContext.Context memory ctx)
  //   internal
  //   pure
  //   returns (bool)
  // {
  //   for (uint256 i = 0; i < ctx.header.totalPixels; i++) {
  //     if (ctx.pixelColorLUT[i] >= ctx.header.numColors)
  //       revert IGraphics.PixelColorIndexOutOfRange();
  //   }

  //   return true;
  // }
}
