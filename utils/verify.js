const { run } = require("hardhat")
//const { modules } = require("web3")

const verify = async (contractAddress, args) => {
    console.log("Verifying conctract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
