const BN256G2 = artifacts.require("BN256G2.sol");
const ZeneKaG16 = artifacts.require("ZeneKaG16.sol");
const ZeneKaGM17 = artifacts.require("ZeneKaGM17.sol");
const ZeneKaPGHR13 = artifacts.require("ZeneKaPGHR13.sol");

module.exports = deployer => {
  // Link libraries
  deployer.deploy(BN256G2);
  deployer.link(BN256G2, [ZeneKaG16, ZeneKaGM17, ZeneKaPGHR13]);

  // Deploy contracts
  const zeneKaG16 = deployer.deploy(ZeneKaG16);
  const zeneKaGM17 = deployer.deploy(ZeneKaGM17);
  const zeneKaPGHR13 = deployer.deploy(ZeneKaPGHR13);
};
