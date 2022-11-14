import { ethers } from "ethers";
import { Networks } from "../eth";
import { PocoClient } from "./client";
import { PocoClientUserRejectRequestError, PocoClientUserRequestAlreadyPendingError } from "./error";

export function getProvider() {
  if (typeof window === "undefined") {
    throw new Error("window is undefined, not in browser enviroment? uh.")
  }

  const ethereum = (window as any).ethereum;

  if (typeof ethereum === "undefined") {
    throw new Error("ethereum is undefined, havn't installed MetaMask? uh.")
  }

  return new ethers.providers.Web3Provider(
    ethereum
  );
}

export async function createPocoClient(
  network?: Networks
): Promise<PocoClient> {
  const web3Provider = getProvider()

  try {
    const chainId = await web3Provider.send("eth_chainId", []);
    const [account] = await web3Provider.send("eth_requestAccounts", []);

    return new PocoClient(
      web3Provider,
      ethers.utils.getAddress(account),
      chainId,
      network
    );
  } catch (err: any) {
    if (err.code === 4001) {
      throw new PocoClientUserRejectRequestError();
    } else if (err.code === -32002) {
      throw new PocoClientUserRequestAlreadyPendingError();
    } else {
      throw new Error(err)
    }
  }
}
