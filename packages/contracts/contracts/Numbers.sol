// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import 'hardhat/console.sol';

contract Numbers {
  // prettier-ignore
  string[32] lookup = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'];
  bytes1[10] lookupB = [
    bytes1(0x30),
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39
  ];

  /* Divide - Return quotient and remainder */
  function getDivided(uint256 numerator, uint256 denominator)
    public
    pure
    returns (uint256 quotient, uint256 remainder)
  {
    require(denominator > 0);
    quotient = numerator / denominator;
    remainder = numerator - denominator * quotient;
  }

  function getNum(uint256 num) public view returns (string memory) {
    if (num < 32) return lookup[num];

    string[10] memory l = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    string memory s;
    uint256 val = num;

    while (val > 0) {
      (uint256 tmp, uint256 remainder) = getDivided(val, 10);
      val = tmp;
      s = string(abi.encodePacked(l[remainder], s));
    }

    return s;
  }

  function getNum8(uint8 number) public view returns (bytes memory) {
    if (number < 10) {
      return abi.encodePacked(lookupB[number]);
    } else if (number >= 10 && number < 100) {
      bytes memory d = new bytes(2);
      (uint256 quotient, uint256 remainder) = getDivided(number, 10);
      d[0] = lookupB[quotient];
      d[1] = lookupB[remainder];
      return d;
    } else if (number >= 100 && number <= 255) {
      bytes memory d = new bytes(3);
      (uint256 quotient, uint256 remainder) = getDivided(number, 100);
      (uint256 quotient2, uint256 remainder2) = getDivided(remainder, 10);

      // console.log(quotient, remainder, quotient2, remainder2);
      d[0] = lookupB[quotient];
      d[1] = lookupB[quotient2];
      d[2] = lookupB[remainder2];
      return d;
    }
  }
}
