const { run } = require("hardhat")
//verify solidity code automatically (programmatically) instead of verifying on etherscan website
async function verify(contractAddress, args) {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}
module.exports = { verify }
