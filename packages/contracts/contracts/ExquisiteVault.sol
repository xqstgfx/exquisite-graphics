// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract ExquisiteVault is Ownable, ReentrancyGuard {
  error WithdrawFailed();
  error NoBalance();

  constructor() {
    transferOwnership(address(0xeD618ED70e06813fe3EDAC7Ed5cac2F6A6E6014C));
  }

  function balance() public view returns (uint256) {
    return address(this).balance;
  }

  function withdraw() public nonReentrant {
    uint256 b = address(this).balance;
    if (b == 0) revert NoBalance();
    (bool success, ) = owner().call{value: b}('');
    if (!success) revert WithdrawFailed();
  }

  function withdrawERC20(IERC20 token) public nonReentrant {
    uint256 b = token.balanceOf(address(this));
    if (b == 0) revert NoBalance();
    bool success = token.transfer(owner(), b);
    if (!success) revert WithdrawFailed();
  }

  receive() external payable {}
}
