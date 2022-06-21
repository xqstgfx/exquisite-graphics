// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*
████            ████        ████████            ████████████    ████████████████
████            ████        ████████            ████████████    ████████████████
    ████    ████        ████        ████    ████                    ████
    ████    ████        ████        ████    ████                    ████
        ████            ████        ████        ████████                ████
        ████            ████        ████        ████████                ████
    ████    ████        ████    ████                    ████        ████
    ████    ████        ████    ████                    ████        ████
████            ████        ████    ████    ████████████                ████
████            ████        ████    ████    ████████████                ████


      ████████████████████        ████████████        ████            ████
      ████████████████████        ████████████        ████            ████
  ████                        ████            ████        ████    ████
  ████                        ████            ████        ████    ████
  ████        ████████            ████████                    ████
  ████        ████████            ████████                    ████
  ████                ████    ████                        ████    ████
  ████                ████    ████                        ████    ████
  ████                ████    ████                    ████            ████
  ████                ████    ████                    ████            ████
      ████████████████        ████                    ████            ████
      ████████████████        ████                    ████            ████
*/

import {IExquisiteGraphics} from './interfaces/IExquisiteGraphics.sol';
import {ThankYou} from './utils/ThankYou.sol';
import {ExquisiteUtils as utils} from './utils/ExquisiteUtils.sol';
import {ExquisiteDecoder as decoder} from './utils/ExquisiteDecoder.sol';
import {ExquisiteValidator as validator} from './utils/ExquisiteValidator.sol';
import '@divergencetech/ethier/contracts/utils/DynamicBuffer.sol';

contract ExquisiteGraphics is IExquisiteGraphics {
  using DynamicBuffer for bytes;

  enum DrawType {
    SVG,
    PIXELS
  }

  /// @notice Draw an SVG from the provided data
  /// @param data Binary data in the .xqst format.
  /// @return string the <svg>
  function draw(bytes memory data) public pure returns (string memory) {
    return _draw(data, DrawType.SVG, true);
  }

  /// @notice Draw an SVG from the provided data. No validation
  /// @param data Binary data in the .xqst format.
  /// @return string the <svg>
  function drawUnsafe(bytes memory data) public pure returns (string memory) {
    return _draw(data, DrawType.SVG, false);
  }

  /// @notice Draw the <rect> elements of an SVG from the data
  /// @param data Binary data in the .xqst format.
  /// @return string the <rect> elements
  function drawPixels(bytes memory data) public pure returns (string memory) {
    return _draw(data, DrawType.PIXELS, true);
  }

  /// @notice Draw the <rect> elements of an SVG from the data. No validation
  /// @param data Binary data in the .xqst format.
  /// @return string the <rect> elements
  function drawPixelsUnsafe(bytes memory data)
    public
    pure
    returns (string memory)
  {
    return _draw(data, DrawType.PIXELS, false);
  }

  /// @notice validates if the given data is a valid .xqst file
  /// @param data Binary data in the .xqst format.
  /// @return bool true if the data is valid
  function validate(bytes memory data) public pure returns (bool) {
    return validator._validate(data);
  }

  // Check if the header of some data is an XQST Graphics Compatible file
  /// @notice validates the header for some data is a valid .xqst header
  /// @param data Binary data in the .xqst format.
  /// @return bool true if the header is valid
  function validateHeader(bytes memory data) public pure returns (bool) {
    return validator._validateHeader(decoder._decodeHeader(data));
  }

  /// @notice Decodes the header from a binary .xqst blob
  /// @param data Binary data in the .xqst format.
  /// @return Header the decoded header
  function decodeHeader(bytes memory data) public pure returns (Header memory) {
    return decoder._decodeHeader(data);
  }

  /// @notice Decodes the palette from a binary .xqst blob
  /// @param data Binary data in the .xqst format.
  /// @return bytes8[] the decoded palette
  function decodePalette(bytes memory data)
    public
    pure
    returns (string[] memory)
  {
    return decoder._decodePalette(data, decoder._decodeHeader(data));
  }

  /// @notice Decodes all of the data needed to draw an SVG from the .xqst file
  /// @param data Binary data in the .xqst format.
  /// @return ctx The Draw Context containing all of the decoded data
  function decodeDrawContext(bytes memory data)
    public
    pure
    returns (DrawContext memory ctx)
  {
    _initDrawContext(ctx, data, true);
  }

  /// Initializes the Draw Context from the given data
  /// @param ctx The Draw Context to initialize
  /// @param data Binary data in the .xqst format.
  /// @param safe bool whether to validate the data
  function _initDrawContext(
    DrawContext memory ctx,
    bytes memory data,
    bool safe
  ) internal pure {
    ctx.header = decoder._decodeHeader(data);
    if (safe) {
      validator._validateHeader(ctx.header);
      validator._validateDataLength(ctx.header, data);
    }

    ctx.palette = decoder._decodePalette(data, ctx.header);
    ctx.pixels = decoder._decodePixels(data, ctx.header);
  }

  /// Draws the SVG or <rect> elements from the given data
  /// @param data Binary data in the .xqst format.
  /// @param t The SVG or Rectangles to draw
  /// @param safe bool whether to validate the data
  function _draw(
    bytes memory data,
    DrawType t,
    bool safe
  ) internal pure returns (string memory) {
    DrawContext memory ctx;
    bytes memory buffer = DynamicBuffer.allocate(2**18);

    _initDrawContext(ctx, data, safe);

    t == DrawType.PIXELS
      ? _writeSVGPixels(ctx, buffer)
      : _writeSVG(ctx, buffer);

    return string(buffer);
  }

  /// Writes the entire SVG to the given buffer
  /// @param ctx The Draw Context
  /// @param buffer The buffer to write the SVG to
  function _writeSVG(DrawContext memory ctx, bytes memory buffer)
    internal
    pure
  {
    _writeSVGHeader(ctx, buffer);
    _writeSVGPixels(ctx, buffer);
    buffer.appendSafe('</svg>');
  }

  /// Writes the SVG header to the given buffer
  /// @param ctx The Draw Context
  /// @param buffer The buffer to write the SVG header to
  function _writeSVGHeader(DrawContext memory ctx, bytes memory buffer)
    internal
    pure
  {
    uint256 scale = uint256(ctx.header.scale);
    // default scale to >=512px.
    if (scale == 0) {
      scale =
        512 /
        (
          ctx.header.width > ctx.header.height
            ? ctx.header.width
            : ctx.header.height
        ) +
        1;
    }

    buffer.appendSafe(
      abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ',
        utils.toBytes(ctx.header.width),
        ' ',
        utils.toBytes(ctx.header.height),
        '" width="',
        utils.toBytes(ctx.header.width * scale),
        '" height="',
        utils.toBytes(ctx.header.height * scale),
        '">'
      )
    );
  }

  /// Writes the SVG <rect> elements to the given buffer
  /// @param ctx The Draw Context
  /// @param buffer The buffer to write the SVG <rect> elements to
  function _writeSVGPixels(DrawContext memory ctx, bytes memory buffer)
    internal
    pure
  {
    uint256 colorIndex;
    uint256 width;
    uint256 pixelNum;
    bytes[] memory numberStrings = utils._getNumberStrings(ctx.header);

    // create a rect that fills the entirety of the svg as the background
    if (ctx.header.hasBackground) {
      buffer.appendSafe(
        abi.encodePacked(
          '"<rect fill="#',
          ctx.palette[ctx.header.backgroundColorIndex],
          '" height="',
          numberStrings[ctx.header.height],
          '" width="',
          numberStrings[ctx.header.width],
          '"/>'
        )
      );
    }

    // Write every pixel into the buffer
    while (pixelNum < ctx.header.totalPixels) {
      colorIndex = ctx.pixels[pixelNum];

      // Check if we need to write a new rect to the buffer at all
      if (utils._canSkipPixel(ctx, colorIndex)) {
        pixelNum++;
        continue;
      }

      // Calculate the width of a continuous rect with the same color
      width = 1;
      while ((pixelNum + width) % ctx.header.width != 0) {
        if (colorIndex == ctx.pixels[pixelNum + width]) {
          width++;
        } else break;
      }

      buffer.appendSafe(
        abi.encodePacked(
          '<rect fill="#',
          ctx.palette[colorIndex],
          '" x="',
          numberStrings[pixelNum % ctx.header.width],
          '" y="',
          numberStrings[pixelNum / ctx.header.width],
          '" height="1" width="',
          numberStrings[width],
          '"/>'
        )
      );

      unchecked {
        pixelNum += width;
      }
    }
  }

  /// @notice A way to say "Thank You"
  function ty() external payable {
    ThankYou._ty('');
  }

  /// @notice A way to say "Thank You"
  function ty(string memory message) external payable {
    ThankYou._ty(message);
  }

  /// @notice Able to receive ETH from anyone
  receive() external payable {
    ThankYou._ty('');
  }
}
