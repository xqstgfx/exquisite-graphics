// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/INumbers.sol';

contract XQST_RENDER {
  // prettier-ignore
  string[256] lookup = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100','101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','121','122','123','124','125','126','127','128','129','130','131','132','133','134','135','136','137','138','139','140','141','142','143','144','145','146','147','148','149','150','151','152','153','154','155','156','157','158','159','160','161','162','163','164','165','166','167','168','169','170','171','172','173','174','175','176','177','178','179','180','181','182','183','184','185','186','187','188','189','190','191','192','193','194','195','196','197','198','199','200','201','202','203','204','205','206','207','208','209','210','211','212','213','214','215','216','217','218','219','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','247','248','249','250','251','252','253','254','255'];

  uint16 constant MAX_COLORS = 256;
  uint8 constant MAX_ROWS = 64;
  uint8 constant MAX_COLS = 64;
  uint8 constant MAX_MULTIPLIER = 16;

  INumbers private _numbers;

  // TODO: incorporate this into the interface, or directly into the rendering step
  string constant PATH_SVG_OPENER =
    '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 -0.5 ';
  string constant RECT_SVG_OPENER =
    '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ';
  string constant RECT_STYLES = '<style>rect{height:1px;width:1px;}</style>';
  string constant RECT_TRANSFORM = '<g transform="scale(16 16)">';
  string constant CLOSE_SVG_OPENER = '">';
  string constant PATH_SVG_CLOSER = '</g></svg>';
  string constant RECT_PREFIX = '<rect fill="';
  string constant PATH_PREFIX = '<path stroke="';
  string constant PATH_START_DATA = '" d="';
  string constant END_TAG = '"/>';

  struct SVGCursor {
    uint8 x;
    uint8 y;
    uint8 numColors;
    string[4] color;
    bytes data;
  }

  constructor(address numbersAddr_) {
    _numbers = INumbers(numbersAddr_);
  }

  function isEmptyString(bytes memory s) internal pure returns (bool) {
    return (s.length == 0);
  }

  function pack12(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3],
        data[startIndex + 4],
        data[startIndex + 5],
        data[startIndex + 6],
        data[startIndex + 7],
        data[startIndex + 8],
        data[startIndex + 9],
        data[startIndex + 10],
        data[startIndex + 11]
      );
  }

  function pack8(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3],
        data[startIndex + 4],
        data[startIndex + 5],
        data[startIndex + 6],
        data[startIndex + 7]
      );
  }

  function pack4(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3]
      );
  }

  function pack3(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return
      bytes.concat(
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2]
      );
  }

  function pack2(bytes[] memory data, uint256 startIndex)
    internal
    pure
    returns (bytes memory)
  {
    return bytes.concat(data[startIndex], data[startIndex + 1]);
  }

  function packN(bytes[] memory data, uint256 length)
    internal
    view
    returns (bytes memory)
  {
    uint256 startGas = gasleft();
    bytes memory packedData;
    uint256 remainingLength = length;
    uint256 index;

    while (remainingLength > 0) {
      index = length - remainingLength;

      if (remainingLength % 12 == 0) {
        packedData = bytes.concat(packedData, pack12(data, index));
        remainingLength -= 12;
        continue;
      }
      if (remainingLength % 8 == 0) {
        packedData = bytes.concat(packedData, pack8(data, index));
        remainingLength -= 8;
        continue;
      }
      if (remainingLength % 4 == 0) {
        packedData = bytes.concat(packedData, pack4(data, index));
        remainingLength -= 4;
        continue;
      }
      if (remainingLength % 3 == 0) {
        packedData = bytes.concat(packedData, pack3(data, index));
        remainingLength -= 3;
        continue;
      }
      if (remainingLength % 2 == 0) {
        packedData = bytes.concat(packedData, pack2(data, index));
        remainingLength -= 2;
        continue;
      }
      packedData = bytes.concat(packedData, data[index]);
      remainingLength -= 1;
      continue;
    }

    return packedData;
  }

  function pixel4(SVGCursor memory pos, uint256 offset)
    internal
    view
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="',
        pos.color[0],
        '" x="',
        lookup[pos.x + offset],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>',
        '<rect fill="',
        pos.color[1],
        '" x="',
        lookup[pos.x + offset + 1],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>',
        abi.encodePacked(
          '<rect fill="',
          pos.color[2],
          '" x="',
          lookup[pos.x + offset + 2],
          '" y="',
          lookup[pos.y],
          '" height="1" width="1"/>',
          '<rect fill="',
          pos.color[3],
          '" x="',
          lookup[pos.x + offset + 3],
          '" y="',
          lookup[pos.y],
          '" height="1" width="1"/>'
        )
      );
  }

  function pixel3(SVGCursor memory pos, uint256 offset)
    internal
    view
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="',
        pos.color[0],
        '" x="',
        lookup[pos.x + offset],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>',
        '<rect fill="',
        pos.color[1],
        '" x="',
        lookup[pos.x + offset + 1],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>',
        abi.encodePacked(
          '<rect fill="',
          pos.color[2],
          '" x="',
          lookup[pos.x + offset + 2],
          '" y="',
          lookup[pos.y],
          '" height="1" width="1"/>'
        )
      );
  }

  function pixel2(SVGCursor memory pos, uint256 offset)
    internal
    view
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="',
        pos.color[0],
        '" x="',
        lookup[pos.x + offset],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>',
        '<rect fill="',
        pos.color[1],
        '" x="',
        lookup[pos.x + offset + 1],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>'
      );
  }

  function pixel(SVGCursor memory pos, uint256 offset)
    internal
    view
    returns (bytes memory)
  {
    return
      abi.encodePacked(
        '<rect fill="',
        pos.color[0],
        '" x="',
        lookup[pos.x + offset],
        '" y="',
        lookup[pos.y],
        '" height="1" width="1"/>'
      );
  }

  function pixelN(SVGCursor memory pos) internal view {
    uint256 remainingLength = pos.numColors;
    uint256 index;

    delete (pos.data);

    while (remainingLength > 0) {
      index = pos.numColors - remainingLength;

      if (remainingLength % 4 == 0) {
        pos.data = bytes.concat(pos.data, pixel4(pos, index));
        remainingLength -= 4;
        continue;
      }
      if (remainingLength % 3 == 0) {
        pos.data = bytes.concat(pos.data, pixel3(pos, index));
        remainingLength -= 3;
        continue;
      }
      if (remainingLength % 2 == 0) {
        pos.data = bytes.concat(pos.data, pixel2(pos, index));
        remainingLength -= 2;
        continue;
      }
      pos.data = bytes.concat(pos.data, pixel(pos, index));
      remainingLength -= 1;
      continue;
    }
  }

  function _getColorIndex(
    bytes memory data,
    uint256 pixelNum,
    SVGMetadata memory svgData
  ) internal view returns (uint8) {
    if (svgData.ppb == 1) {
      return uint8(data[pixelNum + svgData.dataStart]);
    }

    return
      uint8(
        (uint8(data[pixelNum / svgData.ppb + svgData.dataStart]) >>
          ((8 - svgData.bpp) - ((pixelNum % svgData.ppb) * svgData.bpp))) &
          svgData.mask
      );
  }

  // TODO: for Data format
  function getColors(
    bytes memory data,
    string[] calldata palette,
    uint256 pixelNum,
    uint256 numCol,
    SVGCursor memory pos,
    SVGMetadata memory svgData
  ) internal view {
    uint8 i;

    // min of 4 and row length?
    uint8 min = 4 < numCol ? 4 : uint8(numCol);

    for (i = 0; i < min; i++) {
      uint8 colorIndex = _getColorIndex(data, pixelNum + i, svgData);
      pos.color[i] = palette[colorIndex];

      if ((pixelNum + i) % numCol == (numCol - 1)) {
        i++;
        break;
      }
    }
    pos.numColors = i;
  }

  function getRectSVG(
    bytes memory data,
    string[] calldata palette,
    SVGMetadata memory svgData,
    SVGBuffers memory buffers
  ) public view {
    SVGCursor memory pos;

    console.log('total pixels', svgData.totalPixels);

    for (uint256 pixelNum = 0; pixelNum < svgData.totalPixels; pixelNum) {
      pos.x = uint8(pixelNum % svgData.width);
      pos.y = uint8(pixelNum / svgData.width);
      getColors(data, palette, pixelNum, svgData.width, pos, svgData);
      pixelN(pos);

      buffers.workingBuffer[buffers.currWorkingBufSize] = pos.data;
      buffers.currWorkingBufSize++;

      if (buffers.currWorkingBufSize == buffers.maxWorkingBufSize) {
        buffers.outputBuffer[buffers.currOutputBufSize] = packN(
          buffers.workingBuffer,
          buffers.currWorkingBufSize
        );
        buffers.currOutputBufSize++;
        buffers.currWorkingBufSize = 0;
      }

      pixelNum += pos.numColors;
    }

    if (buffers.currWorkingBufSize > 0) {
      buffers.outputBuffer[buffers.currOutputBufSize] = packN(
        buffers.workingBuffer,
        buffers.currWorkingBufSize
      );
      buffers.currOutputBufSize++;
    }
  }

  struct SVGMetadata {
    /* HEADER START */
    uint8 version;
    uint16 width;
    uint16 height;
    uint16 numColors;
    uint8 backgroundColorIndex;
    uint8 reserved; // Reserved for future use
    bool hasPalette;
    bool hasBackground;
    bool isRLE;
    /* HEADER END */

    /* CALCULATED DATA START */
    uint16 totalPixels;
    uint8 bpp;
    uint8 ppb;
    uint8 mask;
    uint16 paletteStart;
    uint16 dataStart;
    /* CALCULATED DATA END */
  }

  struct SVGBuffers {
    uint16 currWorkingBufSize;
    uint16 maxWorkingBufSize;
    uint16 currOutputBufSize;
    uint16 maxOutputBufSize;
    bytes[] outputBuffer;
    bytes[] workingBuffer;
  }

  /* RECT RENDERER */
  function renderSVG(bytes memory data, string[] calldata palette)
    public
    view
    returns (string memory)
  {
    require(
      palette.length <= MAX_COLORS,
      'number of colors is greater than max'
    );
    require(palette.length > 0, 'cannot have 0 colors');
    // TODO: add this back in
    // require(
    //   data.length == numRows * numCols,
    //   'Amount of data provided does not match the number of rows and columns'
    // );

    uint256 startGas = gasleft();
    SVGMetadata memory svgData;
    SVGBuffers memory buffers;

    _decodeHeader(data, svgData, 1);

    require(svgData.height <= MAX_ROWS, 'number of rows is greater than max');
    require(svgData.width <= MAX_COLS, 'number of columns is greater than max');

    buffers.currWorkingBufSize = 0;
    buffers.currOutputBufSize = 0;
    buffers.maxWorkingBufSize =
      (
        (svgData.height >= svgData.width)
          ? svgData.height / 2
          : svgData.width / 2
      ) +
      5;
    buffers.maxOutputBufSize =
      (
        (svgData.height >= svgData.width)
          ? svgData.height / 2
          : svgData.width / 2
      ) +
      5;
    buffers.outputBuffer = new bytes[](buffers.maxOutputBufSize);
    buffers.workingBuffer = new bytes[](buffers.maxWorkingBufSize);

    getRectSVG(data, palette, svgData, buffers);

    console.log('Gas Used', startGas - gasleft());
    console.log('Gas Left', gasleft());

    buffers.outputBuffer[0] = abi.encodePacked(
      RECT_SVG_OPENER,
      _numbers.getNum(svgData.width * 16),
      ' ',
      _numbers.getNum(svgData.height * 16),
      '">',
      RECT_TRANSFORM,
      buffers.outputBuffer[0]
    );

    buffers.outputBuffer[buffers.currOutputBufSize - 1] = bytes.concat(
      buffers.outputBuffer[buffers.currOutputBufSize - 1],
      '</g></svg>'
    );

    // output the output buffer to string
    return string(packN(buffers.outputBuffer, buffers.currOutputBufSize));
  }

  function _decodeHeader(
    bytes memory data,
    SVGMetadata memory svgMetadata,
    uint256 depth
  ) internal view returns (SVGMetadata memory) {
    uint64 header;

    console.logBytes(data);

    assembly {
      // header := calldataload(add(44, mul(depth, 32)))
      header := mload(add(data, 8))
    }

    console.log('header', header);

    svgMetadata.version = uint8(header >> 56);
    svgMetadata.width = uint16((header >> 48) & 0xFF);
    svgMetadata.height = uint16((header >> 40) & 0xFF);
    svgMetadata.numColors = uint16(header >> 24);
    svgMetadata.backgroundColorIndex = uint8(header >> 16);
    svgMetadata.hasPalette = ((header >> 2) & 0x1) == 1 ? true : false;
    svgMetadata.hasBackground = ((header >> 1) & 0x1) == 1 ? true : false;
    svgMetadata.isRLE = (header & 0x1) == 1 ? true : false;

    svgMetadata.totalPixels = svgMetadata.width * svgMetadata.height;
    svgMetadata.paletteStart = svgMetadata.hasPalette ? 8 : 0;
    svgMetadata.dataStart = svgMetadata.hasPalette
      ? (svgMetadata.numColors * 4) + 8
      : 8;

    _setColorParams(svgMetadata);
  }

  function decodeHeader(bytes calldata data)
    public
    view
    returns (SVGMetadata memory)
  {
    SVGMetadata memory svgMetadata;
    _decodeHeader(data, svgMetadata, 0);
    return svgMetadata;
  }

  function _setColorParams(SVGMetadata memory svgData) internal view {
    if (svgData.numColors > 16) {
      // Use 256 Colors
      svgData.bpp = 8;
      svgData.ppb = 1;
      svgData.mask = 0xff;
    } else if (svgData.numColors > 4) {
      // Use 16 Colors
      svgData.bpp = 4;
      svgData.ppb = 2;
      svgData.mask = 0xf;
    } else if (svgData.numColors > 2) {
      // Use 4 Colors
      svgData.bpp = 2;
      svgData.ppb = 4;
      svgData.mask = 0x3;
    } else {
      // Use 2 Color
      svgData.bpp = 1;
      svgData.ppb = 8;
      svgData.mask = 0x1;
    }
  }
}
