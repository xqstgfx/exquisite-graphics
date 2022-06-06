// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IThankYou {
  event ThankYouMessage(address sender, string message);

  /// @notice A way to say "Thank You"
  function ty() external payable;

  /// @notice A way to say "Thank You"
  function ty(string memory message) external payable;

  /// @notice Able to receive ETH from anyone
  receive() external payable;
}
