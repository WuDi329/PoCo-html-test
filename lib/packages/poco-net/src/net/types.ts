import { ManagerOptions, SocketOptions } from "socket.io-client";
import { PocoConnection, PocoPeerConnection } from "./connection";

export type PocoConnectionType = "websocket" | "webrtc" | "socketIO";

export type Address = string;
export type ChannelId = string;

export type PocoConnectionStatus =
  | "closed"
  | "connected"
  | "connecting"
  | "disconnected"
  | "failed"
  | "new";

export type PocoSocketIOConnectionOptions = {
  type: "socketIO";
  uri: string;
  localAddress: Address;
} & Partial<ManagerOptions & SocketOptions>;

export type PocoPeerSocketIOConnectionOptions = {
  type: "socketIO";
  localAddress: Address;
  remoteAddress: Address;
  connection: PocoConnection;
  timeout: number;
};

export type PocoPeerWebRTCConnectionOptions = {
  type: "webrtc";
  localAddress: Address;
  remoteAddress: Address;
  connection: PocoPeerConnection;
  offer?: RTCSessionDescriptionInit;
  rtcConfiguration?: RTCConfiguration;
  rtcOfferOptions?: RTCOfferOptions;
  rtcAnswerOptions?: RTCAnswerOptions;
};
