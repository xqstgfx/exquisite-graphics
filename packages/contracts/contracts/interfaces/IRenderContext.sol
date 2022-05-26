// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './IGraphics.sol';

interface IRenderContext {
  struct Context {
    bytes data; // the binary data in .xqst format
    IGraphics.Header header; // the header of the data
    bytes8[] palette; // hex color for each color in the image
    uint8[] pixelColorLUT; // lookup the color index for a pixel
    bytes[] numberLUT; // lookup the string representation of a number
  }
}
