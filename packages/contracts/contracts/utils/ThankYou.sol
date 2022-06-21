// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library ThankYou {
  event ThankYouMessage(address sender, string message);

  error ThankYouFailed();

  address public constant addr =
    address(0x20a596e602c56948532B3626FC94db28FA9C41D3);

  function _ty(string memory message) internal {
    if (msg.value > 0) {
      (bool success, ) = addr.call{value: msg.value}('');
      if (!success) revert ThankYouFailed();
    }
    emit ThankYouMessage(msg.sender, message);
  }
}
