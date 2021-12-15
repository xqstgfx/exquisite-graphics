struct XQSTBitmapHeader {
  uint8 version;
  uint16 width;
  uint16 height;
  uint16 numColors;
  uint8 backgroundColorIndex;
  uint8 reserved; // Reserved for future use
  bool hasPalette;
  bool hasBackground;
  /* HEADER END */

  /* CALCULATED DATA START */
  uint16 totalPixels;
  uint8 bpp;
  uint8 ppb;
  uint16 paletteStart;
  uint16 dataStart;
}

// function decodeHeader(
//   bytes memory data,
//   XQSTBitmapHeader memory svgMetadata,
//   bytes8[] memory palette
// ) external;
