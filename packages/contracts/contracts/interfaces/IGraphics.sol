// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IGraphics {
  struct Header {
    /* HEADER START */
    uint8 version; // 8 bits
    uint16 width; // 8 bits
    uint16 height; // 8 bits
    uint16 numColors; // 16 bits
    uint8 backgroundColorIndex; // 8 bits
    uint16 scale; // 10 bits
    uint8 reserved; // 4 bits
    bool alpha; // 1 bit
    bool hasBackground; // 1 bit
    /* HEADER END */

    /* CALCULATED DATA START */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint16 paletteStart;
    uint16 dataStart;
    /* CALCULATED DATA END */
  }

  function draw(bytes memory data) external view returns (string memory);

  function drawUnsafe(bytes memory data) external view returns (string memory);

  function drawRects(bytes memory data) external view returns (string memory);

  function drawRectsUnsafe(bytes memory data)
    external
    view
    returns (string memory);
}
