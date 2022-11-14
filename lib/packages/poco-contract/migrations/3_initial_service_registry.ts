import { deployProxy } from "@openzeppelin/truffle-upgrades";
import {
  ContractClass,
  Deployer,
} from "@openzeppelin/truffle-upgrades/dist/utils";
import { ServiceRegistryInstance } from "../types/truffle-contracts";
import chalk from "chalk";
import { logContractAddress } from "./util";

const ServiceRegistry = artifacts.require("ServiceRegistry");

module.exports = async function (
  deployer: Truffle.Deployer & Deployer,
  network: string,
  accounts: string[]
) {
  const instance = (await deployProxy(
    ServiceRegistry as unknown as ContractClass,
    [],
    {
      deployer,
      unsafeAllow: [],
    }
  )) as ServiceRegistryInstance;

  console.log(
    "Contract",
    chalk.bold.bgCyan("ServiceRegistry"),
    "deployed to network",
    chalk.magenta(network),
    "at",
    chalk.bgGreen(instance.address)
  );

  if (network === "development") {
    console.log(chalk.bgMagenta("WARN"), "register mock messenger service");

    await instance.setRecord(
      {
        endpoint: "http://localhost:8080",
        role: "0",
      },
      { from: accounts[accounts.length - 1] }
    );
  }

  await logContractAddress(network, "ServiceRegistry", instance.address);
};
