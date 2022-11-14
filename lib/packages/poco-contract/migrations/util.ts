import fs from "fs";
import fsp from "fs/promises";

export async function logContractAddress(
  network: string,
  contract: string,
  address: string,
  file: fs.PathLike = "./contracts.json"
) {
  let config: {
    [network: string]: {
      [contract: string]: string;
    };
  } = {};

  if (fs.existsSync(file)) {
    config = JSON.parse(await fsp.readFile(file, { encoding: "utf-8" }));
  }

  if (network in config) {
    config[network][contract] = address;
  } else {
    config[network] = { [contract]: address };
  }

  await fsp.writeFile(file, JSON.stringify(config, null, 4));
}
