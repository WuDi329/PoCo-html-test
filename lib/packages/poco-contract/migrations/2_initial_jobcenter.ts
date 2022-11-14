import { deployProxy } from "@openzeppelin/truffle-upgrades";
import {
  ContractClass,
  Deployer,
} from "@openzeppelin/truffle-upgrades/dist/utils";
import { JobCenterInstance } from "../types/truffle-contracts";
import chalk from "chalk";
import { logContractAddress } from "./util";

const JobCenter = artifacts.require("JobCenter");

module.exports = async function (
  deployer: Truffle.Deployer & Deployer,
  network: string
) {
  const instance = (await deployProxy(
    JobCenter as unknown as ContractClass,
    [],
    {
      deployer,
      unsafeAllow: [],
    }
  )) as JobCenterInstance;

  console.log(
    "Contract",
    chalk.bold.bgCyan("JobCenter"),
    "deployed to network",
    chalk.magenta(network),
    "at",
    chalk.bgGreen(instance.address)
  );

  await logContractAddress(network, "JobCenter", instance.address);
};
