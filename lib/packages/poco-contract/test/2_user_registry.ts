import { ServiceRegistryInstance } from "../types/truffle-contracts";
import web3 from "web3";
import chai from "chai";
import chainPromise from "chai-as-promised";
import { BN } from "bn.js";
import chaiBN from "chai-bn";

const { expect } = chai.use(chainPromise).use(chaiBN(BN));

const ServiceRegistry = artifacts.require("ServiceRegistry");
const ContractName = "ServiceRegistry";

contract(ContractName, (accounts) => {
  let instance: ServiceRegistryInstance;
  let owner: string;
  let user1: string;
  let user2: string;
  let randomString: string;

  before(async () => {
    instance = await ServiceRegistry.deployed();

    [owner, user1, user2] = accounts;

    randomString = (Math.random() * 1000).toString();
  });

  it("expect user can set their registry", async () => {
    const { logs } = await instance.setRecord(
      { role: 0, endpoint: randomString },
      {
        from: owner,
      }
    );

    const { event, args } = logs[0];

    expect(event).to.be.equal("NewService");
    expect((args as any)[0]).to.be.a.bignumber.that.equals(new BN(0));
    expect((args as any)[1]).to.be.equal(owner);
    expect((args as any)[2]).to.be.equal(randomString);
  });

  it("expect user can get other's registry", async () => {
    const { endpoint } = await instance.getRecord(owner, {
      from: user1,
    });

    expect(endpoint).to.be.equal(randomString);
  });

  it("expect user can update their registry", async () => {
    const randomString = Math.random().toString();

    const { logs } = await instance.setRecord(
      { role: 0, endpoint: randomString },
      {
        from: owner,
      }
    );

    const { event, args } = logs[0];

    expect(event).to.be.equal("NewService");
    expect((args as any)[0]).to.be.a.bignumber.that.equals(new BN(0));
    expect((args as any)[1]).to.be.equal(owner);
    expect((args as any)[2]).to.be.equal(randomString);
  });
});
