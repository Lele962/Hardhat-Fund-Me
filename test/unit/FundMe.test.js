const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const {
    isCallTrace
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { DevelopmentChains } = require("../../helper-hardhat-config")

!DevelopmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function() {
          let fundMe
          let deployer
          let MockV3Aggregator
          // const sendValue = "1000000000000000000" // 1 ETH
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function() {
              // deploy our fundMe contract
              // using Hardhat-deploy

              /**
               * @notice fixture is allowed us run entire deploy folder
               * @notice
               * */

              // const accounts = await ethers.getSigner()
              // const accountZero = account[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              MockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function() {
              it("set the aggregator addresses correctly", async function() {
                  const response = await fundMe.priceFeed()
                  assert.equal(response, MockV3Aggregator.address)
              })
          })
          describe("fund", async function() {
              it("Fails if you don't send enough ETH", async function() {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of s_funders", async function() {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.s_funders(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function() {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function() {
                  // Arrange
                  const startingFundMeBalanse = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalanse = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalanse
                          .add(startingFundMeBalanse)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("withdraw ETH from a single founder", async function() {
                  // Arrange
                  const startingFundMeBalanse = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalanse = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalanse
                          .add(startingFundMeBalanse)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw with multipul s_funders", async function() {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalanse = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalanse = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalanse
                          .add(startingFundMeBalanse)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that s_funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function() {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function() {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalanse = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalanse = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalanse
                          .add(startingFundMeBalanse)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that s_funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
