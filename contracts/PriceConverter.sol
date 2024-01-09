//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        /*ABI
        address 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e   for Rinkeby network
        No longer need to hardcode priceFeed since it is automatically generated in constructor (parametarized)*/
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // );
        //(uint80 roundId, int price, uint startedAt, uint timeStamp, uint80 answeredInRound)
        // = priceFeed.latestRoundData();

        /*only care about price, which is ETH in terms of USD, 8 decimals */
        (, int256 price, , , ) = priceFeed.latestRoundData();

        /* decimals has to match with msg.value, typecasted to uint256 to match type as well*/
        return uint256(price * 1e10);
    }

    /*Not using at the moment. Need to remove hardcoded priceFeed*/
    // function getVersion() internal view returns (uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //         0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    //     );
    //     return priceFeed.version();
    // }

    function getConversionRate(
        uint256 _ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUSD = (ethPrice * _ethAmount) / 1e18;
        return ethAmountInUSD;
    }
}
