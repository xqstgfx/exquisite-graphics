// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './IGraphics.sol';

interface IRenderContext {
  struct Context {
    bytes data;
    IGraphics.Header header;
    bytes8[] palette;
    uint8[] pixelColorLUT; // lookup the color index for a pixel
    bytes[] numberLUT; // lookup the string representation of a number
  }
}
