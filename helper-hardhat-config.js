const networkConfig = {
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    //31337 hardhat network? Solution: deploy a MockV3Aggregator.
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 238500000000

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
