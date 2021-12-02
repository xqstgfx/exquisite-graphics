// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface INumbers {
  function getNum(uint256 num) external view returns (string memory);

  function getNum8(uint8 number) external view returns (bytes memory);
}
