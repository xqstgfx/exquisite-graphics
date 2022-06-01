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
    uint24 totalPixels; // total pixels in the image
    uint8 bitsPerPixel; // bits per pixel
    uint8 pixelsPerByte; // pixels per byte
    uint16 paletteStart; // number of the byte where the palette starts
    uint16 dataStart; // number of the byte where the data starts
    /* CALCULATED DATA END */
  }

  error ExceededMaxPixels();
  error ExceededMaxRows();
  error ExceededMaxColumns();
  error ExceededMaxColors();
  error BackgroundColorIndexOutOfRange();
  error PixelColorIndexOutOfRange();
  error MissingHeader();
  error NotEnoughData();

  /// @notice Draw an SVG from the provided data
  /// @param data Binary data in the .xqst format.
  /// @return string the <svg>
  function draw(bytes memory data) external view returns (string memory);

  /// @notice Draw an SVG from the provided data. No validation.
  /// @param data Binary data in the .xqst format.
  /// @return string the <svg>
  function drawUnsafe(bytes memory data) external view returns (string memory);

  /// @notice Draw the <rect> elements of an SVG from the data
  /// @param data Binary data in the .xqst format.
  /// @return string the <rect> elements
  function drawRects(bytes memory data) external view returns (string memory);

  /// @notice Draw the <rect> elements of an SVG from the data. No validation
  /// @param data Binary data in the .xqst format.
  /// @return string the <rect> elements
  function drawRectsUnsafe(bytes memory data)
    external
    view
    returns (string memory);
}
