import { BigNumber } from "ethers";
import { PocoServiceRole, Address } from "../eth";

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type PocoClientRegisterServiceOptions = {
  role: PocoServiceRole;
  endpoint: string;
};

export type PocoClientPostJobOptions = {
  file: File;
  messenger: Address;
};

export type PocoSubmitJobOptions = {
  jobId: BigNumber;
  key: string;
};

export type PocoTakeJobOptions = {
  jobId: BigNumber;
};

export type PocoServiceStatus = "online" | "offline" | "busy" | "unknown";
export type PocoJobStatus = "pending" | "running" | "done" | "submitted";

export type PocoService = {
  role: PocoServiceRole;
  provider: string;
  endpoint: string;
};

export type PocoClientServiceInfo = PocoService & { status: PocoServiceStatus };

export type PocoClientJob = {
  jobId: BigNumber;
  owner: Address;
  messenger: Address;
  claimer: Address;
  status: PocoJobStatus;
  isOwn: boolean;
  progressInfo: string;
};

export type PocoClientLogLevel = "debug" | "info" | "warn" | "error";

export type PocoClientLogCategory = "client" | "network";

export type PocoClientLog = {
  level: PocoClientLogLevel;
  category: PocoClientLogCategory;
  time: Date;
  message: string;
};

export interface PocoClientSocketIOConnectionEvents {
  "peer setup": (from: Address, to: Address) => Promise<void>;
  "peer connected": (from: Address, to: Address) => Promise<void>;
}

export interface PocoClientPeerSocketIOEvents {
  "webrtc offer": (offer: RTCSessionDescriptionInit) => Promise<void>;
}
