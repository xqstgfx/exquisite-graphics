// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface INumbers {
  function getNum(uint16 num) external view returns (string memory);
}
