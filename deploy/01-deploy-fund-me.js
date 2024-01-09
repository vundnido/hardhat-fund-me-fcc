const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

/* One way to write deploy function */
// function deployFunc(hre) {
//     console.log("Testing")
// }

// module.exports.default = deployFunc

/* Better way */
// module.exports = async (hre) => {
//     //hre.getNamedAccounts
//     //hre.deployments
//     const { getNamedAccounts, deployments } = hre
// }

/* More efficient way to pull parameters from hre, syntactic sugar */

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //if ChainId is X use priceFeedAddress Y
    //if ChainId is Z use priceFeedAddress A etc
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

    /*When testing under localhost or hardhat network we need a mock of the priceFeed oracle to test contract
    If the priceFeed contract does not exist, we deploy a minimal version of it for our local testing*/

    /* What happens when we change blockchains? Don't want to keep changing priceFeed address manually in PriceConverter.sol. Answer: PriceFeed parameterized in FundMe.sol constructor. PriceFeedAddress populated depending on blockchain used. */
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //pass priceFeedAddress to constructor
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, //1 for hardhat network. >1 and it will hang while deploying.
    })

    log("FundMe deployed!")

    //verify code programattically
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("--------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
