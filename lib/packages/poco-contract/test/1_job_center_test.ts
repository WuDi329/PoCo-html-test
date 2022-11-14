import { JobCenterInstance } from "../types/truffle-contracts";
import web3 from "web3";
import chai from "chai";
import chainPromise from "chai-as-promised";
import { BN } from "bn.js";
import chaiBN from "chai-bn";

const { expect } = chai.use(chainPromise).use(chaiBN(BN));

const JobCenter = artifacts.require("JobCenter");
const ContractName = "JobCenter";

contract(ContractName, (accounts) => {
  let instance: JobCenterInstance;
  let owner: string;
  let user1: string;
  let user2: string;

  let randomKey: string;
  let randomSecret: string;
  let messager: string;

  before(async () => {
    instance = await JobCenter.deployed();

    [owner, user1, user2] = accounts;

    randomKey = web3.utils.encodePacked(
      Math.round(Math.random() * 1000).toString()
    )!;

    randomSecret = web3.utils.keccak256(randomKey);
    messager = owner;
  });

  it(`expect ${ContractName} to be deployed`, async () => {
    expect(instance).to.exist;
  });

  it(`expect active job count to be 0`, async () => {
    const activeJobCount = await instance.activeJobCount();

    expect(activeJobCount).to.be.a.bignumber.that.equals(new BN(0));
  });

  it(`expect job count to be 0`, async () => {
    const jobCount = await instance.jobCount();

    expect(jobCount).to.be.a.bignumber.that.equals(new BN(0));
  });

  it(`expect job to be posted`, async () => {
    const { logs } = await instance.postJob(messager, randomSecret);

    const { event } = logs[0];
    const args: { jobId: BN; owner: string } = logs[0].args as any;

    expect(event).to.be.equal("NewJob");
    expect(args.jobId).to.be.a.bignumber.that.equals(new BN(1));
    expect(args.owner).to.be.equal(owner);
  });

  it(`expect job can be listed correctly`, async () => {
    await instance.postJob(messager, randomSecret);

    const jobs = await instance.getJobs();

    expect(jobs.length).to.be.equal(2);
    expect(jobs[0]).to.be.a.bignumber.that.equal(new BN(1));
    expect(jobs[1]).to.be.a.bignumber.that.equal(new BN(2));
  });

  it(`expect active job count to be 2`, async () => {
    const activeJobCount = await instance.activeJobCount();

    expect(activeJobCount).to.be.a.bignumber.that.equals(new BN(2));
  });

  it(`expect job to be submitted`, async () => {
    const { logs } = await instance.submitJob(new BN(1), randomKey);

    const { event } = logs[0];
    expect(event).to.be.equal("SubmitJob");

    const args: { jobId: BN } = logs[0].args as any;

    expect(args.jobId).to.be.a.bignumber.that.equals(new BN(1));
  });

  it(`expect job can be listed correctly`, async () => {
    const jobs = await instance.getJobs();

    expect(jobs.length).to.be.equal(1);
    expect(jobs[0]).to.be.a.bignumber.that.equal(new BN(2));
  });

  it(`expect active job count to be 1`, async () => {
    const activeJobCount = await instance.activeJobCount();

    expect(activeJobCount).to.be.a.bignumber.that.equals(new BN(1));
  });

  it(`expect job count to be 2`, async () => {
    const jobCount = await instance.jobCount();

    expect(jobCount).to.be.a.bignumber.that.equals(new BN(2));
  });
});
