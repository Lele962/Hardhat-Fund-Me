const networkConfig = {
    5: {
        name: "Goerli",
        ethUsdPriceFeed: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xf9680d99d6c9589e2a93a78a04a279e509205945"
    }
    //31337
}
const DevelopmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000
module.exports = {
    networkConfig,
    DevelopmentChains,
    DECIMALS,
    INITIAL_ANSWER
}
