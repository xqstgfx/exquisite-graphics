// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IXQST_Render {
  function renderSVG(bytes memory data) external view returns (string memory);
}
