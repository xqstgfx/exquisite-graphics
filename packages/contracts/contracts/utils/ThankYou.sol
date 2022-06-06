// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library ThankYou {
  event ThankYouMessage(address sender, string message);

  error ThankYouFailed();

  address public constant addr =
    address(0x5FbDB2315678afecb367f032d93F642f64180aa3); // LOCAL

  // address(0x0f739AFC6E4802f68d426BE97E4B9DF7258d326B); // TODO change this before deploy to real

  function _ty(string memory message) internal {
    if (msg.value > 0) {
      (bool success, ) = addr.call{value: msg.value}('');
      if (!success) revert ThankYouFailed();
    }
    emit ThankYouMessage(msg.sender, message);
  }
}
