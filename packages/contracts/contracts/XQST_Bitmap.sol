import './interfaces/IXQST_Bitmap.sol';

contract XQST_BITMAP {
  // Only bumped when the header format changes
  uint8 constant VERSION = 1;

  uint16 constant MAX_COLORS = 256;
  uint8 constant MAX_ROWS = 64;
  uint8 constant MAX_COLS = 64;

  // Bumped when this file changes between header format changes
  uint8 constant MINOR_VERSION = 0;

  function createHeaderBytes(
    uint16 width,
    uint16 height,
    uint16 numColors,
    uint8 backgroundColorIndex,
    bool hasPalette,
    bool hasBackground
  ) public returns (bytes memory) {
    uint64 header;
    bytes memory headerBytes;

    header |= VERSION << 56;
    header |= width << 48;
    header |= height << 40;
    header |= numColors << 24;
    header |= backgroundColorIndex << 16;
    header |= (hasPalette ? 1 : 0) << 1;
    header |= hasBackground ? 1 : 0;

    return abi.encodePacked(header);
  }

  function decodeHeader(
    bytes memory data,
    XQSTBitmapHeader memory svgMetadata,
    bytes8[] memory palette
  ) public {
    uint64 header;

    assembly {
      header := mload(add(data, 8))
    }

    svgMetadata.version = uint8(header >> 56);
    svgMetadata.width = uint16((header >> 48) & 0xFF);
    svgMetadata.height = uint16((header >> 40) & 0xFF);
    svgMetadata.numColors = uint16(header >> 24);
    svgMetadata.backgroundColorIndex = uint8(header >> 16);
    svgMetadata.hasPalette = ((header >> 1) & 0x1) == 1 ? true : false;
    svgMetadata.hasBackground = (header & 0x1) == 1 ? true : false;

    svgMetadata.totalPixels = svgMetadata.width * svgMetadata.height;
    svgMetadata.paletteStart = svgMetadata.hasPalette ? 8 : 0;
    svgMetadata.dataStart = svgMetadata.hasPalette
      ? (svgMetadata.numColors * 8) + 8
      : 8;

    require(
      svgMetadata.height <= MAX_ROWS,
      'number of rows is greater than max'
    );
    require(
      svgMetadata.width <= MAX_COLS,
      'number of columns is greater than max'
    );

    require(
      svgMetadata.numColors <= MAX_COLORS,
      'number of colors is greater than max'
    );
    require(svgMetadata.numColors > 0, 'cannot have 0 colors');

    // if (svgMetadata.hasPalette) {
    //   require(
    //     data.length >= svgMetadata.paletteStart + svgMetadata.numColors * 8,
    //     'palette data section is incorrect length'
    //   );

    //   svgMetadata.palette = new bytes8[](svgMetadata.numColors);
    //   bytes8 d;
    //   uint256 offset = 32 + svgMetadata.paletteStart;

    //   for (uint256 i = 0; i < svgMetadata.numColors; i++) {
    //     assembly {
    //       d := mload(add(data, offset))
    //     }
    //     svgMetadata.palette[i] = d;
    //     offset += 8;
    //   }
    // } else {
    //   require(
    //     palette.length == svgMetadata.numColors,
    //     'palette length mismatch'
    //   );
    //   svgMetadata.palette = palette;
    // }

    _setColorParams(svgMetadata);

    if (svgMetadata.hasBackground) {
      require(
        svgMetadata.backgroundColorIndex < svgMetadata.numColors,
        'background color index is greater than number of colors'
      );
    }

    // if there is 1 color and there is a background then we don't need to check the data length
    if (svgMetadata.numColors > 1 || !svgMetadata.hasBackground) {
      uint256 pixelDataLen = svgMetadata.totalPixels % 2 == 0
        ? (svgMetadata.totalPixels / svgMetadata.ppb)
        : (svgMetadata.totalPixels / svgMetadata.ppb) + 1;
      require(
        data.length == svgMetadata.dataStart + pixelDataLen,
        'data length is incorrect'
      );
    }
  }

  function _setColorParams(XQSTBitmapHeader memory svgData) internal pure {
    if (svgData.numColors > 16) {
      // Use 256 Colors
      svgData.bpp = 8;
      svgData.ppb = 1;
    } else if (svgData.numColors > 4) {
      // Use 16 Colors
      svgData.bpp = 4;
      svgData.ppb = 2;
    } else if (svgData.numColors > 2) {
      // Use 4 Colors
      svgData.bpp = 2;
      svgData.ppb = 4;
    } else {
      // Use 2 Color
      svgData.bpp = 1;
      svgData.ppb = 8;
    }
  }
}
