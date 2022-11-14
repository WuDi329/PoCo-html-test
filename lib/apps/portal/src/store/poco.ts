import { defineStore } from "pinia";
import {
  createPocoClient,
  Networks,
  PocoClient,
  PocoServiceRole,
  PocoClientLog,
  PocoClientLogLevel,
  PocoClientLogCategory,
  PocoClientJob,
  PocoClientServiceInfo,
} from "@poco/client";
import { BigNumber, ethers } from "ethers";
import { useState } from "./state";

interface UserInfo {
  account: string;
  balanceInWei: BigNumber;
}

interface NetworkInfo {
  networkName: Networks;
  blockNum: number;
  chainId: string;
}

declare global {
  interface Window {
    pocoClientInstance: PocoClient | undefined;
  }
}

export const usePoco = defineStore("poco", {
  state: () => {
    return {
      initialized: false,
      userInfo: {
        account: "",
        balanceInWei: BigNumber.from(0),
      } as UserInfo,
      networkInfo: {
        networkName: "development" as Networks,
        blockNum: 0,
        chainId: "",
      } as NetworkInfo,
      services: {
        messenger: [] as PocoClientServiceInfo[],
      },
      logs: [] as (PocoClientLog & { id: number })[],
      jobs: [] as (PocoClientJob & { buffer: Uint8Array | undefined })[],
      jobFileMapping: new Map<string, File>(),
    };
  },
  actions: {
    async setup(network: Networks) {
      if (this.initialized || window.pocoClientInstance) {
        console.warn("Poco can not be initialized twice!");
        return;
      }

      window.pocoClientInstance = await createPocoClient(network);

      const instance = window.pocoClientInstance;

      instance.on("Log", this.log.bind(this));
      instance.on("NewJob", (jobId, owner, messenger) => {
        this.jobs.push({
          jobId,
          owner,
          messenger,
          claimer: "",
          status: "pending",
          isOwn: owner === this.userAccount,
          progressInfo: "",
          buffer: undefined,
        });
      });

      instance.on("JobProcessUpdate", (jobId, info) => {
        const job = this.jobs.find((e) => e.jobId.eq(jobId));

        if (!job) {
          this.log(
            "warn",
            "client",
            new Date(),
            `Unknown job id ${jobId.toString()} emit progress update.`
          );
          return;
        }

        job.progressInfo = info;
      });

      instance.on("JobStatusUpdate", (jobId, status) => {
        const job = this.jobs.find((e) => e.jobId.eq(jobId));

        if (!job) {
          this.log(
            "warn",
            "client",
            new Date(),
            `Unknown job id ${jobId.toString()} emit status update.`
          );
          return;
        }

        job.status = status;
      });

      instance.on("JobResultAvailable", (jobId, buffer) => {
        const job = this.jobs.find((e) => e.jobId.eq(jobId));

        if (!job) {
          this.log(
            "warn",
            "client",
            new Date(),
            `Unknown job id ${jobId.toString()} emit result.`
          );
          return;
        }

        job.buffer = buffer;
        job.status = "done";
      });

      instance.on("AccountChanged", (account) => {
        this.userInfo.account = account;
      })

      instance.on("AccountDisconnected", () => {
        const state = useState();

        state.setGlobalCoveringMessage("Account disconnected.")
        state.setGlobalCoveringStatus("error")
        state.showGlobalCovering()

        this.userInfo.account = ""
      })

      instance.on("ChainIdChanged", (_) => {
        window.location.reload()
      })

      await instance.setup();

      this.userInfo = {
        account: instance.localAddress,
        balanceInWei: await instance.getBalance(),
      };

      this.networkInfo = {
        networkName: network,
        chainId: instance.chainId,
        blockNum: await instance.getBlockNumber(),
      };

      this.services.messenger = Array.from(
        instance.getServices(PocoServiceRole.MESSENGER)
      );

      this.jobs = Array.from(instance.getAllJobs()).map(
        (e) => {
          return {
            ...e,
            buffer: undefined,
          };
        }
      );

      this.initialized = true;
    },
    log(
      level: PocoClientLogLevel,
      category: PocoClientLogCategory,
      time: Date,
      message: string
    ) {
      this.logs.push({
        id: this.logs.length,
        category,
        level,
        time,
        message,
      });
    },
    async postJob() {
      if (!window.pocoClientInstance) {
        throw new Error("client not ready");
      }

      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
      });

      const file = await fileHandle.getFile();

      const jobId = await window.pocoClientInstance.postJob({
        file: file,
        messenger: this.services.messenger[0].provider,
      });

      this.jobFileMapping.set(jobId.toString(), file);
    },
    async resetJobFile(jobId: BigNumber, file: File) {
      window.pocoClientInstance!.setJobFile(jobId, file)

      this.jobFileMapping.set(jobId.toString(), file)
    }
  },
  getters: {
    userBalance(state) {
      const balanceInEther = ethers.utils.formatUnits(
        state.userInfo.balanceInWei,
        "ether"
      );

      return balanceInEther.substring(0, balanceInEther.indexOf(".") + 5);
    },

    userAccount: (state) => state.userInfo.account,
    networkName: (state) => state.networkInfo.networkName,
    networkBlockNum: (state) => state.networkInfo.blockNum.toString(),
    networkChainId: (state) => state.networkInfo.chainId,
    clientInstance: (_) => window.pocoClientInstance,
  },
});
