const { assert, expect } = require("chai")
const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") //1 ether
          beforeEach(async () => {
              /* Deploy all contracts using hardhat-deploy */
              // const accounts = await ethers.getSigners()  //gets accounts from hardhat.config
              // const accountZero = accounts[0]
              // const { deployer } = await getNamedAccounts()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"]) //runs all deploy scripts in this project
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", () => {
              it("Sets the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
              it("Sets the owner address correctly", async () => {
                  const response = await fundMe.getOwner()
                  assert.equal(response, deployer)
              })
          })

          describe("fund", () => {
              it("Fails if you dont send enough ETH", async () => {
                  /* expect can catch revert errors, assert cannot */
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "FundMe__NotEnoughEther()" //() are optional. why?
                  )
              })
              it("Updates the addressToAmountFunded mapping correctly", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  /*It seems that assert cannot compare BigNumber to BigNumber */
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to funders array", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunders(0)
                  assert.equal(response, deployer)
              })
              //   it("Calls receive() successfully", async () => {
              //       await fundMe({ value: sendValue })
              //       const response1 = await fundMe.getAddressToAmountFunded(
              //           deployer
              //       )
              //       assert.equal(response1.toString(), sendValue.toString())
              //       const response2 = await fundMe.getFunders(0)
              //       assert.equal(response2, deployer)
              //   })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single funder", async () => {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost)
                  )
              })
              it("Withdraw ETH from multiple funders", async () => {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost)
                  )

                  //Make sure the funders array is reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  //Make sure addressToAmountFunded mapping values are set to 0 for associated accounts after withdraw
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only owner can withdraw funds", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  /* Need ethereum-waffle package to revertWith custom errors properly. Research why it won't work with @nomiclabs/hardhat-waffle */
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner()")
              })
          })

          describe("cheaperWithdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single funder using cheaperWithdraw function", async () => {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost)
                  )
              })
              it("Withdraw ETH from multiple funders using cheaperWithdraw function", async () => {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost)
                  )

                  //Make sure the funders array is reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted
                  //console.log(await fundMe.getFunders({ value: 0 }))

                  //Make sure addressToAmountFunded mapping values are set to 0 for associated accounts after withdraw
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only owner can withdraw funds using cheaperWithdraw function", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  /* Need ethereum-waffle package to revertWith custom errors properly. Research why it won't work with @nomiclabs/hardhat-waffle */
                  await expect(
                      attackerConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__NotOwner()")
              })
          })
      })
