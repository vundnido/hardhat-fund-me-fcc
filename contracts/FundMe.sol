// SPDX-License-Identifier: MIT
//pragma
pragma solidity ^0.8.8;
//Imports
import "./PriceConverter.sol";
//import "hardhat/console.sol"; //solhint throws error if console file imported. Research.
//Error Codes
error FundMe__NotOwner(); //more efficient than require statements. saves gas.
error FundMe__NotEnoughEther();
error FundMe__CallFailed();

//Interfaces, Libraries

//Contracts

/** @title A contract for crowd funding.
 *  @author Vundnido
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    //Type Declarations
    using PriceConverter for uint256;

    //State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18; //must include decimals when comparing to other price values
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    //Events

    //Modifiers
    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        } //more gas efficient
        _;
    }

    //Functions
    //Functions Order:
    ////constructor
    ////receive
    ////fallback
    ////external
    ////public
    ////internal
    ////private
    ////view / pure
    constructor(address priceFeedAddress) {
        //priceFeedAddress depends on blockchain we deploy to
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     *  @notice This function funds this contract.
     *  @dev This implements price feeds as our library
     */
    function fund() public payable {
        if (
            msg.value.getConversionRate(s_priceFeed) <= MINIMUM_USD //msg.value = 18 decimals
        ) {
            revert FundMe__NotEnoughEther();
        }
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0); //reset the array. new address array with 0 elements inside.
        /* ways to send funds from contract to user calling withdraw */
        // payable(msg.sender).transfer(address(this).balance); //will automatically revert if transfer fails

        /* does not automatically revert if send fails. */
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed.");

        /*recommended way to send ETH in most cases*/
        (bool callSuccess /*bytes memory dataReturned*/, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        if (!callSuccess) {
            revert FundMe__CallFailed();
        }
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        /* Mappings can't be stored in memory!*/
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess /*bytes memory dataReturned*/, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        if (!callSuccess) {
            revert FundMe__CallFailed();
        }
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
