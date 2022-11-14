import { Deployer } from "@openzeppelin/truffle-upgrades/dist/utils/truffle";

const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer: Truffle.Deployer & Deployer) {
  deployer.deploy(Migrations);
};
