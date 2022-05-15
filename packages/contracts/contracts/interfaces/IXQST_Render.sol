// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IXQST_Render {
  struct SVGMetadata {
    // TODO
    // XQSTBitmapHeader header;

    /* HEADER START */
    uint8 version;
    uint16 width;
    uint16 height;
    uint16 numColors;
    uint8 backgroundColorIndex;
    uint8 reserved; // Reserved for future use
    bool alpha;
    bool hasBackground;
    /* HEADER END */

    /* CALCULATED DATA START */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint16 paletteStart;
    uint16 dataStart;
    /* CALCULATED DATA END */

    uint8[] colorIndexLookup;
    bytes8[] palette;
    bytes[] lookup; // number lookup table
  }

  function renderSVG(bytes memory data) external view returns (string memory);
}
