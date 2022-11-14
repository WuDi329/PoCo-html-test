import { BaseContract, providers } from "ethers";
import * as ContractAddress from "@poco/contract/contracts.json";
import { EitherOr } from "../utils";
import { JobCenter__factory, ServiceRegistry__factory } from "@poco/contract";

export type Networks = "development";
export type ContractNames = "JobCenter" | "ServiceRegistry";
export type ContractOptions = EitherOr<
  { network: Networks; address: string },
  "network",
  "address"
>;

export async function getContract<Contract extends BaseContract>(
  provider: providers.Web3Provider,
  name: ContractNames,
  { network, address }: ContractOptions
): Promise<Contract> {
  const contractAddress = address || ContractAddress[network!][name];
  const signer = provider.getSigner();

  let instance: Contract;

  if (name === "JobCenter") {
    // @ts-ignore
    instance = JobCenter__factory.connect(contractAddress, signer);
  } else if (name === "ServiceRegistry") {
    // @ts-ignore
    instance = ServiceRegistry__factory.connect(contractAddress, signer);
  } else {
    throw Error("unreachable");
  }

  return instance;
}
