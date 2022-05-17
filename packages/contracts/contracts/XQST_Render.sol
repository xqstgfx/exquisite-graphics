// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/IGraphics.sol';
import './interfaces/IRenderContext.sol';
import {helpers} from './XQSTHelpers.sol';
import {XQSTDecode as decode} from './XQSTDecode.sol';
import {XQSTValidate as v} from './XQSTValidate.sol';
import '@divergencetech/ethier/contracts/utils/DynamicBuffer.sol';

contract XQST_RENDER is IGraphics, IRenderContext {
  using DynamicBuffer for bytes;

  enum DrawType {
    SVG,
    RECTS
  }

  function draw(bytes memory data) public view returns (string memory) {
    return _draw(data, DrawType.SVG, true);
  }

  function drawUnsafe(bytes memory data) public view returns (string memory) {
    return _draw(data, DrawType.SVG, false);
  }

  function drawRects(bytes memory data) public view returns (string memory) {
    return _draw(data, DrawType.RECTS, true);
  }

  function drawRectsUnsafe(bytes memory data)
    public
    view
    returns (string memory)
  {
    return _draw(data, DrawType.RECTS, false);
  }

  function valid(bytes memory data) public view returns (bool) {
    return v._validate(data);
  }

  // basically use this to check if something is even XQST Graphics Compatible
  function validHeader(bytes memory data) public view returns (bool) {
    return v._validateHeader(decode._decodeHeader(data));
  }

  // TODO is this really necessary to be public?
  // TODO does decode, decodeHeader, decodePalette, decodeData, all belong
  //      in a xqstgfx utils library/contract?
  //      I would want to also provide the splice options there. Replace palette/Replace Data - to do the blitmap thing.
  function decode(bytes memory data)
    public
    view
    returns (RenderContext memory ctx)
  {
    _init(ctx, data, true);
  }

  function decodeHeader(bytes memory data) public view returns (Header memory) {
    return decode._decodeHeader(data);
  }

  function decodePalette(bytes memory data)
    public
    view
    returns (bytes8[] memory)
  {
    return decode._decodePalette(data, decode._decodeHeader(data));
  }

  function _init(
    Context memory ctx,
    bytes memory data,
    bool safe
  ) private view {
    ctx.header = decode._decodeHeader(data);
    if (safe) {
      v._validateHeader(ctx.header);
      v._validateDataLength(ctx.header, data);
    }

    ctx.palette = decode._decodePalette(data, ctx.header);

    ctx.pixelColorLUT = helpers._getPixelColorLUT(data, ctx.header);
    // TODO is this necessary? It certainly would break the render later on.
    // Do we force this validation when we decode the pixels?
    // This costs 1,326,762 gas at 65x65 in 256 Color.
    if (safe) v._validateDataContents(ctx);

    ctx.numberLUT = helpers._getNumberLUT(ctx.header);
  }

  function _draw(
    bytes memory data,
    DrawType t,
    bool safe
  ) private view returns (string memory) {
    uint256 startGas = gasleft();
    Context memory ctx;
    bytes memory buffer = DynamicBuffer.allocate(2**18);

    _init(ctx, data, safe);

    t == DrawType.RECTS ? _writeSVGRects(ctx, buffer) : _writeSVG(ctx, buffer);

    console.log('Gas Used Result', startGas - gasleft());
    console.log('Gas Left Result', gasleft());

    return string(buffer);
  }

  function _writeSVG(Context memory ctx, bytes memory buffer) private view {
    _writeSVGHeader(ctx, buffer);

    if (ctx.header.numColors == 0 || ctx.header.numColors > 1)
      _writeSVGRects(ctx, buffer);

    buffer.appendSafe('</svg>');
  }

  function _writeSVGHeader(Context memory ctx, bytes memory buffer)
    internal
    view
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
        helpers.toBytes(ctx.header.width),
        ' ',
        helpers.toBytes(ctx.header.height),
        '" width="',
        helpers.toBytes(ctx.header.width * scale),
        '" height="',
        helpers.toBytes(ctx.header.height * scale),
        '">'
      )
    );

    if (ctx.header.hasBackground || ctx.header.numColors == 1) {
      buffer.appendSafe(
        abi.encodePacked(
          '"<rect fill="#',
          ctx.palette[ctx.header.backgroundColorIndex],
          '" height="',
          ctx.numberLUT[ctx.header.height],
          '" width="',
          ctx.numberLUT[ctx.header.width],
          '"/>'
        )
      );
    }
  }

  function _writeSVGRects(Context memory ctx, bytes memory buffer)
    internal
    view
  {
    uint256 colorIndex;
    uint256 c;
    uint256 pixelNum;

    // write every pixel into the buffer
    while (pixelNum < ctx.header.totalPixels) {
      colorIndex = ctx.pixelColorLUT[pixelNum];

      // If this color is the background we dont need to paint it with the cursor
      if (helpers._canSkipPixel(ctx, colorIndex)) {
        pixelNum++;
        continue;
      }

      // Calculate the width of a continuous rect with the same color
      c = 1;
      while ((pixelNum + c) % ctx.header.width != 0) {
        if (colorIndex == ctx.pixelColorLUT[pixelNum + c]) {
          c++;
        } else break;
      }

      // write rect out to the buffer
      buffer.appendSafe(
        abi.encodePacked(
          '<rect fill="#',
          ctx.palette[colorIndex],
          '" x="',
          ctx.numberLUT[pixelNum % ctx.header.width],
          '" y="',
          ctx.numberLUT[pixelNum / ctx.header.width],
          '" height="1" width="',
          ctx.numberLUT[c],
          '"/>'
        )
      );

      unchecked {
        pixelNum += c;
      }
    }
  }
}
