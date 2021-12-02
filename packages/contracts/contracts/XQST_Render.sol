// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import 'hardhat/console.sol';
import './interfaces/INumbers.sol';

contract XQST_RENDER {
  // prettier-ignore
  // TODO make this a bytes[]? bytes4[]?
  // string[256] lookup = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100','101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','121','122','123','124','125','126','127','128','129','130','131','132','133','134','135','136','137','138','139','140','141','142','143','144','145','146','147','148','149','150','151','152','153','154','155','156','157','158','159','160','161','162','163','164','165','166','167','168','169','170','171','172','173','174','175','176','177','178','179','180','181','182','183','184','185','186','187','188','189','190','191','192','193','194','195','196','197','198','199','200','201','202','203','204','205','206','207','208','209','210','211','212','213','214','215','216','217','218','219','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','247','248','249','250','251','252','253','254','255'];
  /* Divide - Return quotient and remainder */

  uint16 constant MAX_COLORS = 256;
  uint8 constant MAX_ROWS = 64;
  uint8 constant MAX_COLS = 64;
  uint8 constant MAX_MULTIPLIER = 16;

  INumbers private _numbers;

  // TODO: incorporate this into the interface, or directly into the rendering step
  string constant RECT_SVG_OPENER =
    '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" version="1.1" viewBox="0 0 ';
  string constant RECT_TRANSFORM = '<g transform="scale(16 16)">';

  struct Pixel {
    uint8 x;
    uint8 y;
    uint8 width;
    uint8 colorIndex;
  }

  struct SVGCursor {
    Pixel[8] pixels;
    Pixel[8] rlePixels;
    uint8 numColors;
    uint8 numRLEPixels;
    bytes data;
  }

  constructor(address numbersAddr_) {
    _numbers = INumbers(numbersAddr_);
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

  function rlePixel2(
    SVGCursor memory pos,
    SVGMetadata memory metadata,
    uint256 offset
  ) internal view returns (bytes memory) {
    return
      abi.encodePacked(
        '<rect fill="',
        metadata.palette[pos.rlePixels[0 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.rlePixels[0 + offset].x],
        '" y="',
        metadata.lookup[pos.rlePixels[0 + offset].y],
        '" height="1" width="',
        metadata.lookup[pos.rlePixels[0 + offset].width],
        '"/><rect fill="',
        metadata.palette[pos.rlePixels[1 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.rlePixels[1 + offset].x],
        '" y="',
        metadata.lookup[pos.rlePixels[1 + offset].y],
        '" height="1" width="',
        metadata.lookup[pos.rlePixels[1 + offset].width],
        '"/>'
      );
  }

  function rlePixel(
    SVGCursor memory pos,
    SVGMetadata memory metadata,
    uint256 offset
  ) internal view returns (bytes memory) {
    return
      abi.encodePacked(
        '<rect fill="#',
        metadata.palette[pos.rlePixels[0 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.rlePixels[0 + offset].x],
        '" y="',
        metadata.lookup[pos.rlePixels[0 + offset].y],
        '" height="1" width="',
        metadata.lookup[pos.rlePixels[0 + offset].width],
        '"/>'
      );
  }

  function rlePixelN(SVGCursor memory pos, SVGMetadata memory metadata)
    internal
    view
  {
    uint256 remainingLength = pos.numRLEPixels;
    uint256 index;

    delete (pos.data);

    while (remainingLength > 0) {
      index = pos.numRLEPixels - remainingLength;

      if (remainingLength % 2 == 0) {
        pos.data = bytes.concat(pos.data, rlePixel2(pos, metadata, index));
        remainingLength -= 2;
        continue;
      }
      pos.data = bytes.concat(pos.data, rlePixel(pos, metadata, index));
      remainingLength -= 1;
      continue;
    }

    delete (pos.numRLEPixels);
  }

  // TODO remove lookup business, have it in the right format
  function pixel4(
    SVGCursor memory pos,
    uint256 offset,
    SVGMetadata memory metadata
  ) internal view returns (bytes memory) {
    // console.log('pixel4');
    return
      abi.encodePacked(
        '<use href="#',
        metadata.lookup[pos.pixels[0 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.pixels[0 + offset].x],
        '" y="',
        metadata.lookup[pos.pixels[0 + offset].y],
        '"/><use href="#',
        metadata.lookup[pos.pixels[1 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.pixels[1 + offset].x],
        '" y="',
        metadata.lookup[pos.pixels[1 + offset].y],
        '"/><use href="#',
        abi.encodePacked(
          metadata.lookup[pos.pixels[2 + offset].colorIndex],
          '" x="',
          metadata.lookup[pos.pixels[2 + offset].x],
          '" y="',
          metadata.lookup[pos.pixels[2 + offset].y],
          '"/><use href="#',
          metadata.lookup[pos.pixels[3 + offset].colorIndex],
          '" x="',
          metadata.lookup[pos.pixels[3 + offset].x],
          '" y="',
          metadata.lookup[pos.pixels[3 + offset].y],
          '"/>'
        )
      );
  }

  function pixel(
    SVGCursor memory pos,
    uint256 offset,
    SVGMetadata memory metadata
  ) internal view returns (bytes memory) {
    // console.log('pixel');
    return
      abi.encodePacked(
        '<use href="#',
        metadata.lookup[pos.pixels[0 + offset].colorIndex],
        '" x="',
        metadata.lookup[pos.pixels[0 + offset].x],
        '" y="',
        metadata.lookup[pos.pixels[0 + offset].y],
        '"/>'
      );
  }

  function pixelN(SVGCursor memory pos, SVGMetadata memory metadata)
    internal
    view
  {
    uint256 remainingLength = pos.numColors;
    uint256 index;

    delete (pos.data);

    while (remainingLength > 0) {
      index = pos.numColors - remainingLength;

      if (remainingLength % 4 == 0) {
        pos.data = bytes.concat(pos.data, pixel4(pos, index, metadata));
        remainingLength -= 4;
        continue;
      }
      pos.data = bytes.concat(pos.data, pixel(pos, index, metadata));
      remainingLength -= 1;
      continue;
    }

    delete (pos.numColors);
  }

  function getRectSVG(SVGMetadata memory svgData, SVGBuffers memory buffers)
    public
    view
  {
    SVGCursor memory pos;

    uint8 colorIndex;
    uint256 c;
    uint256 pixelNum;

    while (pixelNum < svgData.totalPixels) {
      colorIndex = svgData.colorIndexLookup[pixelNum];

      // If this color is the background we dont need to paint it with the cursor
      if (colorIndex == svgData.backgroundColorIndex && svgData.hasBackground) {
        pixelNum++;
        continue;
      }

      c = 1;

      while ((pixelNum + c) % svgData.width != 0) {
        if (colorIndex == svgData.colorIndexLookup[pixelNum + c]) c++;
        else break;
      }

      if (c > 1) {
        pos.rlePixels[pos.numRLEPixels].width = uint8(c);
        pos.rlePixels[pos.numRLEPixels].colorIndex = colorIndex;
        pos.rlePixels[pos.numRLEPixels].x = uint8(pixelNum % svgData.width);
        pos.rlePixels[pos.numRLEPixels].y = uint8(pixelNum / svgData.width);
        pos.numRLEPixels++;
      } else {
        pos.pixels[pos.numColors].width = 1;
        pos.pixels[pos.numColors].colorIndex = colorIndex;
        pos.pixels[pos.numColors].x = uint8(pixelNum % svgData.width);
        pos.pixels[pos.numColors].y = uint8(pixelNum / svgData.width);
        pos.numColors++;
      }

      pixelNum += c; // doing this costs significant gas? why?
      if (pos.numColors == 8 || pixelNum == svgData.totalPixels) {
        pixelN(pos, svgData);

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
      }

      if (pos.numRLEPixels == 8 || pixelNum == svgData.totalPixels) {
        rlePixelN(pos, svgData);

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
      }
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

    uint8[] colorIndexLookup;
    bytes8[] palette;
    bytes[] lookup;
  }

  struct SVGBuffers {
    uint16 currWorkingBufSize;
    uint16 maxWorkingBufSize;
    uint16 currOutputBufSize;
    uint16 maxOutputBufSize;
    bytes[] outputBuffer;
    bytes[] workingBuffer;
  }

  function _setColorIndexLookup(bytes memory data, SVGMetadata memory svgData)
    internal
    view
  {
    uint256 startGas = gasleft();
    uint8 workingByte;
    svgData.colorIndexLookup = new uint8[](svgData.totalPixels + 8); // add extra byte for safety
    if (svgData.bpp == 1) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 8) {
        workingByte = uint8(data[i / 8 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 7;
        svgData.colorIndexLookup[i + 1] = (workingByte >> 6) & 0x01;
        svgData.colorIndexLookup[i + 2] = (workingByte >> 5) & 0x01;
        svgData.colorIndexLookup[i + 3] = (workingByte >> 4) & 0x01;
        svgData.colorIndexLookup[i + 4] = (workingByte >> 3) & 0x01;
        svgData.colorIndexLookup[i + 5] = (workingByte >> 2) & 0x01;
        svgData.colorIndexLookup[i + 6] = (workingByte >> 1) & 0x01;
        svgData.colorIndexLookup[i + 7] = workingByte & 0x01;
      }
    } else if (svgData.bpp == 2) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 4) {
        workingByte = uint8(data[i / 4 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 6;
        svgData.colorIndexLookup[i + 1] = (workingByte >> 4) & 0x03;
        svgData.colorIndexLookup[i + 2] = (workingByte >> 2) & 0x03;
        svgData.colorIndexLookup[i + 3] = workingByte & 0x03;
      }
    } else if (svgData.bpp == 4) {
      for (uint256 i = 0; i < svgData.totalPixels; i += 2) {
        workingByte = uint8(data[i / 2 + svgData.dataStart]);
        svgData.colorIndexLookup[i] = workingByte >> 4;
        svgData.colorIndexLookup[i + 1] = workingByte & 0x0F;
      }
    } else {
      for (uint256 i = 0; i < svgData.totalPixels; i++) {
        svgData.colorIndexLookup[i] = uint8(data[i + svgData.dataStart]);
      }
    }

    console.log('color lut builing gas used', startGas - gasleft());
  }

  /* RECT RENDERER */
  function renderSVG(bytes memory data, bytes8[] calldata palette)
    public
    view
    returns (string memory)
  {
    require(
      palette.length <= MAX_COLORS,
      'number of colors is greater than max'
    );
    require(palette.length > 0, 'cannot have 0 colors');
    require(data.length >= 8, 'missing header');

    console.logBytes(data);

    uint256 startGas = gasleft();
    SVGMetadata memory svgData;
    SVGBuffers memory buffers;

    /* Setup the SVG */
    _decodeHeader(data, svgData);
    _setupBuffers(svgData, buffers);
    _initSymbols(buffers, svgData);
    _setColorIndexLookup(data, svgData);

    console.log('num colors: ', svgData.numColors);

    getRectSVG(svgData, buffers);

    console.log('Gas Used Rect', startGas - gasleft());
    console.log('Gas Left Rect', gasleft());

    buffers.outputBuffer[buffers.currOutputBufSize - 1] = bytes.concat(
      buffers.outputBuffer[buffers.currOutputBufSize - 1],
      '</g></svg>'
    );

    startGas = gasleft();
    // output the output buffer to string
    string memory result = string(
      packN(buffers.outputBuffer, buffers.currOutputBufSize)
    );

    console.log('Gas Used Result', startGas - gasleft());
    console.log('Gas Left Result', gasleft());

    return result;
  }

  function _initSymbols(SVGBuffers memory buffers, SVGMetadata memory svgData)
    internal
    view
  {
    bytes[] memory symbolBuffer = new bytes[](16); // TODO tune buffer size
    svgData.lookup = new bytes[](svgData.palette.length);
    uint256 symbolBufferSize = 0;

    for (uint256 i = 0; i < svgData.palette.length; i++) {
      svgData.lookup[i] = _numbers.getNum8(uint8(i));

      symbolBuffer[symbolBufferSize] = abi.encodePacked(
        symbolBuffer[symbolBufferSize],
        '<symbol id="',
        svgData.lookup[i],
        '" width="1" height="1" viewBox="0 0 1 1"><rect fill="#',
        svgData.palette[i],
        // palette[i],
        '" width="1" height="1"/></symbol>'
      );

      if ((i > 0 && i % 16 == 0) || i == svgData.palette.length - 1) {
        symbolBufferSize++;
      }
    }

    buffers.outputBuffer[0] = bytes.concat(
      buffers.outputBuffer[0],
      packN(symbolBuffer, symbolBufferSize)
    );
    buffers.currOutputBufSize++;

    console.log('symbols done');
  }

  function _decodeHeader(bytes memory data, SVGMetadata memory svgMetadata)
    internal
    view
  {
    uint64 header;

    assembly {
      header := mload(add(data, 8))
    }

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
      ? (svgMetadata.numColors * 8) + 8
      : 8;

    // TODO require that the palette data section is the correct length

    bytes8[] memory p = new bytes8[](svgMetadata.numColors);
    bytes8 d;
    uint256 offset = 32 + svgMetadata.paletteStart;
    for (uint256 i = 0; i < svgMetadata.numColors; i++) {
      assembly {
        d := mload(add(data, offset))
      }
      // console.log('color', string(abi.encodePacked(d)));
      p[i] = d;
      offset += 8;
    }

    svgMetadata.palette = p;
    // console.logBytes(abi.encodePacked(p));

    _setColorParams(svgMetadata);

    // TODO add necessary requires
    require(
      svgMetadata.height <= MAX_ROWS,
      'number of rows is greater than max'
    );
    require(
      svgMetadata.width <= MAX_COLS,
      'number of columns is greater than max'
    );
    if (svgMetadata.hasBackground) {
      require(
        svgMetadata.backgroundColorIndex < svgMetadata.numColors,
        'background color index is greater than number of colors'
      );
    }

    console.log(
      'expected data len',
      svgMetadata.dataStart + (svgMetadata.totalPixels / svgMetadata.ppb),
      'actual data len',
      data.length
    );
    // require(
    //   data.length ==
    //     svgMetadata.dataStart + (svgMetadata.totalPixels / svgMetadata.ppb),
    //   'data length is incorrect'
    // );
  }

  function _setupBuffers(SVGMetadata memory meta, SVGBuffers memory buffers)
    internal
    view
  {
    buffers.currWorkingBufSize = 0;
    buffers.currOutputBufSize = 0;

    // TODO tune max sizes
    // buffers.maxWorkingBufSize = (
    //   (meta.height >= meta.width)
    //     ? meta.height / 2 < 10 ? 10 : meta.height / 2
    //     : meta.width / 2
    // );
    buffers.maxWorkingBufSize = (
      (meta.height >= meta.width) ? meta.height / 2 + 5 : meta.width / 2 + 5
    );
    buffers.maxOutputBufSize = buffers.maxWorkingBufSize;
    buffers.outputBuffer = new bytes[](buffers.maxOutputBufSize);
    buffers.workingBuffer = new bytes[](buffers.maxWorkingBufSize);

    if (meta.hasBackground) {
      console.log('has background');
      buffers.outputBuffer[0] = abi.encodePacked(
        RECT_SVG_OPENER,
        _numbers.getNum(meta.width * 16),
        ' ',
        _numbers.getNum(meta.height * 16),
        '">',
        RECT_TRANSFORM,
        '<rect fill=#"',
        meta.palette[meta.backgroundColorIndex],
        '" height="',
        meta.lookup[meta.height],
        '" width="',
        meta.lookup[meta.width],
        '"/>'
      );
    } else {
      console.log('no background');
      buffers.outputBuffer[0] = abi.encodePacked(
        RECT_SVG_OPENER,
        _numbers.getNum(meta.width * 16),
        ' ',
        _numbers.getNum(meta.height * 16),
        '">',
        RECT_TRANSFORM
      );
    }
  }

  function decodeHeader(bytes calldata data)
    public
    view
    returns (SVGMetadata memory)
  {
    SVGMetadata memory svgMetadata;
    _decodeHeader(data, svgMetadata);
    return svgMetadata;
  }

  function _setColorParams(SVGMetadata memory svgData) internal pure {
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
