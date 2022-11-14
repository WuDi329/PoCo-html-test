import { Address, getContract, Networks, PocoServiceRole } from "../eth";
import { PocoClientNotReadyError } from "./error";
import {
  PocoClientJob,
  PocoClientLogCategory,
  PocoClientLogLevel,
  PocoClientPostJobOptions,
  PocoClientServiceInfo,
  PocoClientRegisterServiceOptions,
  PocoSubmitJobOptions,
  Optional,
  PocoTakeJobOptions,
  PocoClientSocketIOConnectionEvents,
  PocoClientPeerSocketIOEvents,
  PocoJobStatus,
} from "./type";
import { PocoLocalStorage, PocoStorage } from "../storage";
import {
  PocoSocketIOConnection,
  PocoPeerWebRTCConnection,
  createPocoSocketIOConnection,
  createPocoPeerSocketIOConnection,
  PocoPeerSocketIOConnection,
  createPocoPeerWebRTCConnection,
} from "@poco/net";
import { EventDispatcher } from "@poco/util";
import { BigNumber, ethers, providers } from "ethers";
import { JobCenter, ServiceRegistry } from "@poco/contract";
import { NewJobEvent, SubmitJobEvent } from "@poco/contract/dist/JobCenter";
import {
  NewServiceEvent,
  ServiceUpdateEvent,
} from "@poco/contract/dist/ServiceRegistry";
import { sha256Digest } from "../utils/crypto";
import { lallala } from "@poco/codec"

export interface PocoClientEvents {
  Log: (
    this: ThisType<PocoClient>,
    level: PocoClientLogLevel,
    category: PocoClientLogCategory,
    time: Date,
    message: string
  ) => void;
  JobProcessUpdate: (
    this: ThisType<PocoClient>,
    jobId: BigNumber,
    progressInfo: string
  ) => void;
  JobStatusUpdate: (
    this: ThisType<PocoClient>,
    jobId: BigNumber,
    status: PocoJobStatus
  ) => void;
  JobResultAvailable: (
    this: ThisType<PocoClient>,
    jobId: BigNumber,
    buffer: Uint8Array
  ) => void;
  NewJob: (
    this: ThisType<PocoClient>,
    jobId: BigNumber,
    owner: Address,
    messenger: Address
  ) => void;
  ChainIdChanged: (
    this: ThisType<PocoClient>,
    chainId: string
  ) => void,
  AccountChanged: (
    this: ThisType<PocoClient>,
    account: Address,
  ) => void
  AccountDisconnected: (
    this: ThisType<PocoClient>,
  ) => void
}

export interface PocoClientWebRTCEvents {
  TakeJob: (
    this: ThisType<PocoPeerWebRTCConnection<PocoClientWebRTCEvents>>,
    jobIdInString: string
  ) => void;
  JobError: (
    this: ThisType<PocoPeerWebRTCConnection<PocoClientWebRTCEvents>>,
    jobIdInString: string,
    error: string,
    shouldClose: boolean
  ) => void;
  SendJob: (
    this: ThisType<PocoPeerWebRTCConnection<PocoClientWebRTCEvents>>,
    jobIdInString: string,
    buffer: Uint8Array
  ) => void;
  SubmitJob: (
    this: ThisType<PocoPeerWebRTCConnection<PocoClientWebRTCEvents>>,
    jobIdInString: string,
    buffer: Uint8Array
  ) => void;
  SendJobKey: (
    this: ThisType<PocoPeerWebRTCConnection<PocoClientWebRTCEvents>>,
    jobIdInString: string,
    key: string,
    secret: string
  ) => void;
}

export class PocoClient extends EventDispatcher<PocoClientEvents> {
  public localAddress: Address;
  public chainId: string;

  private provider: providers.Web3Provider;
  private network: Networks;
  private storage: PocoStorage;

  /* Contracts */
  private jobCenter: JobCenter | undefined;
  private serviceRegistry: ServiceRegistry | undefined;

  /* Storage */
  private services: Map<Address, PocoClientServiceInfo>[];
  private jobs: Map<string, PocoClientJob>;

  /* Connections */
  private connections: Map<
    Address,
    PocoSocketIOConnection<PocoClientSocketIOConnectionEvents>
  >;
  private rtcConnections: Map<
    Address,
    PocoPeerWebRTCConnection<PocoClientWebRTCEvents>
  >;

  /* Files */
  private jobToFileMapping: Map<string, File>;

  constructor(
    provider: providers.Web3Provider,
    localAddress: Address,
    chainId: string,
    network?: Networks,
    storage?: PocoStorage
  ) {
    super();

    this.provider = provider;
    this.localAddress = localAddress;
    this.chainId = chainId;
    this.network = network || "development";
    this.storage = storage || new PocoLocalStorage();

    this.services = [];
    this.jobs = new Map();
    this.jobToFileMapping = new Map();

    this.connections = new Map();
    this.rtcConnections = new Map();
  }

  protected log(
    level: PocoClientLogLevel,
    category: PocoClientLogCategory,
    message: string
  ) {
    this.emit("Log", level, category, new Date(), message);
  }

  protected updateJobStatus(jobId: BigNumber, status: PocoJobStatus) {
    this.jobs.get(jobId.toString())!.status = status;

    this.emit("JobStatusUpdate", jobId, status);
  }

  protected updateJobProgress(jobId: BigNumber, info: string) {
    this.jobs.get(jobId.toString())!.progressInfo = info;

    this.emit("JobProcessUpdate", jobId, info);
  }

  private async recover() {
    this.log("info", "client", "Recover services from blockchain.");

    // ServiceRegistry
    let events = (
      await this.serviceRegistry!.queryFilter("*" as any, 0)
    ).reverse();

    const roles = Object.keys(PocoServiceRole).length / 2;

    for (let i = 0; i < roles; i++) {
      this.services.push(new Map());
    }

    for (const eventData of events) {
      const eventName = eventData.event;

      if (eventName === "NewService" || eventName == "ServiceUpdate") {
        const { provider, endpoint, role } = (
          eventData as NewServiceEvent | ServiceUpdateEvent
        ).args;

        const services = this.services[role]!;

        if (services.has(provider)) continue;

        services.set(provider, {
          provider,
          endpoint,
          role: role,
          status: "unknown",
        });
      }
    }

    this.log("info", "client", "Recover jobs from blockchain.");

    // JobCenter
    events = await this.jobCenter!.queryFilter("*" as any, 0);

    for (const eventData of events) {
      const eventName = eventData.event;

      if (eventName === "NewJob") {
        const { jobId, owner, messenger } = (eventData as NewJobEvent).args;
        const jobIdInString = jobId.toString();

        this.jobs.set(jobIdInString, {
          jobId,
          messenger,
          owner,
          status: "pending",
          isOwn: owner === this.localAddress,
          progressInfo: "",
          claimer: "",
        });
      } else if (eventName === "SubmitJob") {
        const { jobId, claimer } = (eventData as SubmitJobEvent).args;
        const jobIdInString = jobId.toString();

        const job = this.jobs.get(jobIdInString)!;

        job.status = "submitted";
        job.claimer = claimer;
        job.progressInfo = `Claimed by ${claimer}`;
      }
    }
  }

  async connectToMessenger() {
    const connections = Array.from(
      this.getServices(PocoServiceRole.MESSENGER)
    ).map((e) => {
      return {
        id: e.provider,
        connection:
          createPocoSocketIOConnection<PocoClientSocketIOConnectionEvents>({
            type: "socketIO",
            uri: e.endpoint,
            localAddress: this.localAddress,
          }),
      };
    });

    const result = await Promise.allSettled(
      connections.map(
        (e) =>
          new Promise((resolve, reject) => {
            e.connection.connect().then(resolve).catch(reject);
          })
      )
    );

    for (let i = 0; i < result.length; i++) {
      const { status } = result[i];
      const { id, connection } = connections[i];

      if (status === "fulfilled" && connection.status() === "connected") {
        this.setupConnection(connection);
        this.connections.set(id, connection);
        this.services[PocoServiceRole.MESSENGER].get(id)!.status = "online";

        this.log("info", "client", `Connect to Messenger ${id} successfully.`);
      } else {
        this.services[PocoServiceRole.MESSENGER].get(id)!.status = "offline";

        this.log("warn", "client", `Failed to connect to Messenger ${id}.`);
      }
    }
  }

  private setupConnection(
    connection: PocoSocketIOConnection<PocoClientSocketIOConnectionEvents>
  ) {
    const setupPeerConnection = (
      peer: PocoPeerSocketIOConnection<PocoClientPeerSocketIOEvents>
    ) => {
      peer.on("webrtc offer", async (offer) => {
        const rtcConnection =
          new PocoPeerWebRTCConnection<PocoClientWebRTCEvents>(
            peer.remoteAddress,
            peer.localAddress,
            peer as any,
            {
              offer: offer,
            }
          );

        rtcConnection.on("connected", () => {
          this.log(
            "info",
            "client",
            `Create WebRTC connection to ${peer.remoteAddress} successfully`
          );

          this.rtcConnections.set(peer.remoteAddress, rtcConnection);
        });

        rtcConnection.on("message", (message) => {
          this.log(
            "info",
            "network",
            `Message from ${rtcConnection.remoteAddress}: ${message}`
          );
        });

        rtcConnection.on("channel open", (channel) => {
          this.log(
            "info",
            "client",
            `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} opened.`
          );
        });

        rtcConnection.on("channel close", (channel) => {
          this.log(
            "info",
            "client",
            `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} closed.`
          );
        });

        rtcConnection.on("channel error", (channel, error) => {
          this.log(
            "info",
            "client",
            `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} got error.`
          );

          console.error(error);
        });

        rtcConnection.on("TakeJob", async (jobIdInString) => {
          const file = this.jobToFileMapping.get(jobIdInString);

          if (!file) {
            this.log("error", "client", `Missing file of job ${jobIdInString}`);
            await rtcConnection.send(
              "JobError",
              jobIdInString,
              "Job file missing",
              true
            );

            this.rtcConnections.delete(rtcConnection.remoteAddress);

            return;
          }

          this.updateJobProgress(
            BigNumber.from(jobIdInString),
            `${rtcConnection.remoteAddress} took the job.`
          );
          this.updateJobStatus(
            BigNumber.from(jobIdInString),
            "running",
          )

          await rtcConnection.send(
            "SendJob",
            jobIdInString,
            new Uint8Array(await file.arrayBuffer())
          );
        });

        rtcConnection.on("SubmitJob", async (jobIdInString, buffer) => {
          const jobId = BigNumber.from(jobIdInString);

          this.updateJobProgress(
            jobId,
            `${rtcConnection.remoteAddress} returned the job result.`
          );
          this.emit("JobResultAvailable", jobId, buffer);

          const { secret, key } = this.storage.getItem(
            `job-${jobIdInString}`
          ) as any;

          await rtcConnection.send("SendJobKey", jobIdInString, key, secret);
        });

        await rtcConnection.connect();
      });
    };

    connection.on("peer setup", async (from, to) => {
      if (to !== this.localAddress) {
        return;
      }

      this.log(
        "info",
        "client",
        `Receive peer connection request from ${from}.`
      );

      const peerConnection =
        createPocoPeerSocketIOConnection<PocoClientPeerSocketIOEvents>({
          type: "socketIO",
          localAddress: this.localAddress,
          remoteAddress: from,
          connection: connection as any,
          timeout: 5000,
        });

      setupPeerConnection(peerConnection);

      await peerConnection.connect();
    });

    connection.on("peer connected", async () => {
      this.log("info", "client", `Peer connection established successfully.`);
    });
  }

  protected setupMetaMaskListeners() {
    const ethereum = (window as any).ethereum;

    if (typeof ethereum == "undefined") {
      throw new Error("ethereum is undefined, havn't installed MetaMask? uh.")
    }

    ethereum.on("chainChanged", (_chainId: string) => {
      this.emit("ChainIdChanged", _chainId)
    })

    ethereum.on("accountsChanged", (accounts: Address[]) => {
      if (accounts.length === 0) {
        this.localAddress = "THIS_IS_AN_ILLEGAL_ADDRESS_ONLY_WHEN_ACCOUNT_DISCONNECTED";
        this.emit("AccountDisconnected")
      } else if (accounts[0] != this.localAddress) {
        this.localAddress = accounts[0];
        this.emit("AccountChanged", this.localAddress)
      }
    })
  }

  async setup(force?: boolean) {
    this.setupMetaMaskListeners();

    this.jobCenter = await getContract<JobCenter>(this.provider, "JobCenter", {
      network: this.network,
    });
    this.serviceRegistry = await getContract<ServiceRegistry>(
      this.provider,
      "ServiceRegistry",
      { network: this.network }
    );

    if (force) {
      this.storage.clear();
    }

    await this.recover();

    this.setupContractEventListeners();

    await this.connectToMessenger();
  }

  private setupContractEventListeners() {
    const newJobFilter = this.jobCenter!.filters.NewJob();

    this.jobCenter!.on(newJobFilter, (jobId, owner, messenger) => {
      this.jobs.set(jobId.toString(), {
        jobId,
        owner,
        messenger,
        isOwn: owner === this.localAddress,
        status: "pending",
        progressInfo: "",
        claimer: "",
      });
      this.emit("NewJob", jobId, owner, messenger);
    });
  }

  async registerService({ role, endpoint }: PocoClientRegisterServiceOptions) {
    if (!this.serviceRegistry) {
      throw new PocoClientNotReadyError(this);
    }

    await (
      await this.serviceRegistry.setRecord({
        role,
        endpoint,
      })
    ).wait();
  }

  async postJob(
    opts: Optional<PocoClientPostJobOptions, "messenger">
  ): Promise<BigNumber> {
    if (!this.jobCenter) {
      throw new PocoClientNotReadyError(this);
    }

    const fileBuffer = await opts.file.arrayBuffer();
    const fileHash = await sha256Digest(fileBuffer);

    const messengerToUse =
      opts?.messenger ||
      Array.from(this.getServices(PocoServiceRole.MESSENGER))[0].provider;

    const key = (
      (await this.getBlockNumber()) *
      Math.random() *
      Date.now()
    ).toString(16);
    const secret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(key));

    const response = await (
      await this.jobCenter.postJob(messengerToUse, secret)
    ).wait();
    const args = (response.events![0] as NewJobEvent).args;
    const jobId = args["jobId"];
    const jobIdInString = jobId.toString();

    this.storage.setItem(`job-${jobIdInString}`, {
      key,
      secret,
      fileHash,
    });

    this.jobToFileMapping.set(jobIdInString, opts.file);

    this.log("info", "client", `New job ${jobIdInString} has been posted.`);

    return jobId;
  }

  async takeJob({ jobId }: PocoTakeJobOptions) {
    if (this.connections.size === 0) {
      throw new PocoClientNotReadyError(this);
    }

    const jobIdInString = jobId.toString();
    const job = this.jobs.get(jobIdInString)!;

    if (!this.connections.has(job.messenger)) {
      this.log(
        "error",
        "client",
        `we have not connect to ${job.messenger} yet`
      );
      throw new Error(`we have not connect to ${job.messenger} yet`);
    }

    this.updateJobStatus(jobId, "running");
    this.updateJobProgress(jobId, "Ready to establish connection.");

    const connection = this.connections.get(job.messenger)!;
    const peerConnection = createPocoPeerSocketIOConnection({
      type: "socketIO",
      localAddress: this.localAddress,
      remoteAddress: job.owner,
      connection: connection as any,
      timeout: 5000,
    });

    await peerConnection.connect();

    this.updateJobProgress(
      jobId,
      "SocketIO peer connection established successfully."
    );

    const rtcConnection =
      createPocoPeerWebRTCConnection<PocoClientWebRTCEvents>({
        type: "webrtc",
        localAddress: this.localAddress,
        remoteAddress: job.owner,
        connection: peerConnection,
      });

    rtcConnection.on("channel open", (channel) => {
      this.log(
        "info",
        "client",
        `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} opened.`
      );
    });

    rtcConnection.on("channel close", (channel) => {
      this.log(
        "info",
        "client",
        `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} closed.`
      );
    });

    rtcConnection.on("channel error", (channel, error) => {
      this.log(
        "info",
        "client",
        `WebRTCChannel ${channel.label} to ${rtcConnection.remoteAddress} got error.`
      );

      console.error(error);
    });

    rtcConnection.on("JobError", async (jobIdInString, error, shouldClose) => {
      this.log(
        "error",
        "network",
        `Error when handling ${jobIdInString}: ${error}`
      );

      if (shouldClose) {
        this.rtcConnections.delete(rtcConnection.remoteAddress);

        this.updateJobStatus(jobId, "pending");

        await rtcConnection.disconnect();
        await peerConnection.disconnect();
      }
    });

    rtcConnection.on("SendJob", async (jobIdInString, buffer) => {
      this.log("info", "network", `Receive buffer of ${jobIdInString}`);

      lallala()

      this.updateJobProgress(
        BigNumber.from(jobIdInString),
        "Job buffer received."
      );

      await rtcConnection.send("SubmitJob", jobIdInString, buffer);
    });

    rtcConnection.on("SendJobKey", async (jobIdInString, key, secret) => {
      const jobId = BigNumber.from(jobIdInString);
      this.updateJobProgress(jobId, "Job key received.");

      const selfSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(key));

      if (selfSecret !== secret) {
        this.log("error", "network", `Mismatched secret get from ${jobId}.`);
        return;
      }

      await this.submitJob({
        jobId: BigNumber.from(jobIdInString),
        key,
      });

      this.log("info", "network", `Job ${jobIdInString} have been submitted.`);
      this.updateJobStatus(jobId, "submitted");
      this.updateJobProgress(jobId, "Job submitted.");
    });

    await rtcConnection.connect();

    this.updateJobProgress(
      jobId,
      "WebRTC connection established successfully."
    );

    this.log(
      "info",
      "client",
      `Create WebRTC connection to ${peerConnection.remoteAddress} successfully.`
    );

    await rtcConnection.send("TakeJob", jobIdInString);

    this.updateJobProgress(jobId, "Sending TakeJob request.");

    this.rtcConnections.set(peerConnection.remoteAddress, rtcConnection);
  }

  async submitJob({ jobId, key }: PocoSubmitJobOptions) {
    if (!this.jobCenter) {
      throw new PocoClientNotReadyError(this);
    }

    await (
      await this.jobCenter.submitJob(jobId, ethers.utils.toUtf8Bytes(key))
    ).wait();
  }

  getServices(role: PocoServiceRole): Iterable<PocoClientServiceInfo> {
    return this.services[role].values();
  }

  getAllJobs(): Iterable<PocoClientJob> {
    return this.jobs.values();
  }

  async getBalance(address?: Address): Promise<BigNumber> {
    if (!this.provider) {
      throw new PocoClientNotReadyError(this);
    }

    const addressToQuery = address || this.localAddress;

    return this.provider.getBalance(addressToQuery);
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new PocoClientNotReadyError(this);
    }

    return this.provider.getBlockNumber();
  }

  setJobFile(jobId: BigNumber, file: File) {
    this.jobToFileMapping.set(jobId.toString(), file);
  }

  getJobFile(jobId: BigNumber): File {
    return this.jobToFileMapping.get(jobId.toString())!;
  }

  hasJobFile(jobId: BigNumber): boolean {
    return this.jobToFileMapping.get(jobId.toString()) !== undefined;
  }
}
