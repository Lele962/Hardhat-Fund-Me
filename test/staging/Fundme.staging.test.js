const { assert } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { DevelopmentChains } = require("../../helper-hardhat-config")

DevelopmentChains.includes(network.name)
    ? describe.skip
    : describe("Fundme", async function() {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundME", deployer)
          })

          it("allow people to fund and withdraw", async function() {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
