// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IRender {
  function renderSVG(
    bytes calldata data,
    string[] calldata palette,
    uint16 numRows,
    uint16 numCols
  ) external view returns (string memory);
}
