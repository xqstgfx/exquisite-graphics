// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library helpers {
  function toBytes(uint256 value) internal pure returns (bytes memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return '0';
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return buffer;
  }

  function _getHexChar(bytes1 char) internal pure returns (uint8) {
    return
      (uint8(char) > 9)
        ? (uint8(char) + 87) // ascii a-f
        : (uint8(char) + 48); // ascii 0-9
  }

  function _toColor(bytes3 b) internal pure returns (bytes8) {
    uint64 b6 = 0x0000000000006666;
    for (uint256 i = 0; i < 3; i++) {
      b6 |= (uint64(_getHexChar(b[i] >> 4)) << uint64((6 - (i * 2) + 1) * 8));
      b6 |= (uint64(_getHexChar(b[i] & 0x0F)) << uint64((6 - (i * 2)) * 8));
    }

    return bytes8(b6);
  }

  function _toHexBytes8(bytes4 b) internal pure returns (bytes8) {
    uint64 b8;
    for (uint256 i = 0; i < 4; i++) {
      b8 = b8 | (uint64(_getHexChar(b[i] >> 4)) << uint64((6 - (i * 2)) * 8));
      b8 =
        b8 |
        (uint64(_getHexChar(b[i + 1] & 0x0F)) << uint64((6 - (i * 2) + 1) * 8));
    }

    return bytes8(b8);
  }
}
