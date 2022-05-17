// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';
import {helpers} from './XQSTHelpers.sol';

library XQSTValidate {
  uint16 public constant MAX_COLORS = 256;
  uint16 public constant MAX_PIXELS = 10000; // TODO
  uint8 public constant MAX_ROWS = 255; // TODO
  uint8 public constant MAX_COLS = 255; // TODO

  function _validate(bytes memory data) returns (bool) {
    Context memory ctx;

    context.header = _decodeHeader(data);
    _validateHeader(ctx.header);
    _validateDataLength(ctx.header, data);

    context.palette = _decodePalette(data, context.header);
    context.pixelColorLUT = _decodePixelColorLUT(data, context.header);
    _validateDataContents(ctx);

    return true;
  }

  function _validateHeader(IGraphics.Header memory header)
    internal
    pure
    returns (bool)
  {
    // TODO move to errors? should this be a modifier?
    require(header.width * header.height < MAX_PIXELS, 'image is too large');
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

    return true;
  }

  function _validateDataLength(
    IGraphics.Header memory header,
    bytes memory data
  ) internal pure returns (bool) {
    // if 0
    // if 1 color
    // if > 1 color

    // if (header.numColors > 1 || !header.hasBackground) {
    uint256 pixelDataLen = (header.totalPixels % 2 == 0) || header.ppb == 1
      ? (header.totalPixels / header.ppb)
      : (header.totalPixels / header.ppb) + 1;
    require(
      data.length >= header.dataStart + pixelDataLen,
      'data length is incorrect'
    );
    // }
    return true;
  }

  function _validateDataContents(
    bytes memory data,
    IGraphics.Header memory header
  ) internal pure returns (bool) {
    uint8[] memory pixelColorLUT = helpers._getPixelColorLUT(data, header);
    for (uint256 i = 0; i < header.totalPixels; i++) {
      require(
        pixelColorLUT[i] < header.numColors,
        'pixel color index is greater than number of colors'
      );
    }
  }

  function _validateDataContents(IRenderContext.Context memory ctx)
    internal
    pure
    returns (bool)
  {
    for (uint256 i = 0; i < ctx.header.totalPixels; i++) {
      require(
        ctx.pixelColorLUT[i] < ctx.header.numColors,
        'data contains invalid color index'
      );
    }

    return true;
  }
}
