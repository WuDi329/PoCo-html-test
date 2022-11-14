import _ from "lodash";
import {
  EventsMap,
  DefaultEventsMap,
  EventNames,
  ReservedOrUserEventNames,
  ReservedOrUserEventParameters,
  EventParameters,
} from "@poco/util";
import { Socket, ManagerOptions, SocketOptions, io } from "socket.io-client";
import { PocoProtocolPacket, serializePocoMessagePayload } from "../protocol";
import {
  PocoConnection,
  PocoConnectionEvents,
  PocoPeerConnection,
} from "./connection";
import { PocoConnectionError } from "./error";
import { Address, PocoPeerSocketIOConnectionOptions } from "./types";

export class PocoSocketIOConnection<
  Events extends EventsMap = DefaultEventsMap
> extends PocoConnection<Events, PocoConnectionEvents> {
  private socket: Socket;
  private connectRejectCallback: ((reason: any) => void) | null;
  private connectResolveCallback:
    | ((value: void | PromiseLike<void>) => void)
    | null;

  constructor(
    localAddress: Address,
    opts?:
      | Partial<ManagerOptions & SocketOptions & { uri?: string }>
      | undefined
  ) {
    super("socketIO", localAddress);

    const defaultOpts = {
      autoConnect: false,
      transports: ["websocket"],
      protocols: [__POCO_PROTOCOL_VERSION__],
      auth: { address: localAddress },
    };

    this.connectRejectCallback = null;
    this.connectResolveCallback = null;

    if (opts === undefined) {
      this.socket = io(defaultOpts);
    } else if (opts.uri === undefined) {
      this.socket = io(_.defaults(opts, defaultOpts));
    } else {
      this.socket = io(opts.uri, _.defaults(opts, defaultOpts));
    }

    this.socket.on("connect", () => {
      this.setStatus("connected");

      if (this.connectResolveCallback) {
        const callback = this.connectResolveCallback;
        this.connectResolveCallback = null;

        callback();
      }
    });

    this.socket.on("disconnect", (reason: string) => {
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        this.setStatus("closed");
        return;
      }

      this.setStatus("failed");
    });

    this.socket.on("connect_error", (error: Error) => {
      if (this.connectRejectCallback) {
        const callback = this.connectRejectCallback;
        this.connectRejectCallback = null;

        callback(error);

        this.setStatus("failed");
      } else {
        this.setStatus("failed");

        throw error;
      }
    });

    // this.socket.on("message", (buffer: ArrayBuffer) => {
    //     const payload = deserializeMessagePayload(buffer);

    //     this.triggerEvent("message", payload)
    // })

    this.socket.onAny((event, ...args) => {
      const packet = new PocoProtocolPacket(args[0]);

      this.triggerEvent(event, ...packet.body());
    });

    this.on("error", (error: string) => {
      this.setStatus("failed");
      this.socket.close();

      console.error("connection error:", error);

      throw new PocoConnectionError(this, error);
    });
  }

  async connect(): Promise<void> {
    this.setStatus("connecting");

    return new Promise((resolve, reject) => {
      this.connectResolveCallback = resolve;
      this.connectRejectCallback = reject;

      this.socket.connect();
    });
  }

  async disconnect(): Promise<void> {
    this.socket.disconnect();
  }

  send<Event extends ReservedOrUserEventNames<PocoConnectionEvents, Events>>(
    type: Event,
    ...payload: ReservedOrUserEventParameters<
      PocoConnectionEvents,
      Events,
      Event
    >
  ): void | Promise<void> {
    const buffer = serializePocoMessagePayload(payload);
    const packet = new PocoProtocolPacket();

    packet.header().setNoSegmentFlag();
    packet.header().setNoMoreSegmentFlag();
    packet.setBody(buffer);

    packet.build();

    this.socket.emit(type as string, packet.toUint8Array());

    // const packets = toPackets(buffer);

    // for (const packet of packets) {
    //     this.socket.emit(type as string, packet.toUint8Array())
    // }
  }
}

export type PocoPeerAddressPayload = { from: Address; to: Address };

export interface PocoPeerSocketIOConnectionEvents<
  Events extends EventsMap = DefaultEventsMap
> extends PocoConnectionEvents {
  "peer event": <Event extends EventNames<Events>>(
    this: ThisType<PocoPeerSocketIOConnection<Events>>,
    from: Address,
    to: Address,
    event: Event,
    payload: EventParameters<Events, Event>
  ) => void;
  "peer disconnected": (
    this: ThisType<PocoPeerSocketIOConnection<Events>>,
    from: Address,
    to: Address
  ) => void;
  "peer connected": (
    this: ThisType<PocoPeerSocketIOConnection<Events>>,
    from: Address,
    to: Address
  ) => void;
  "peer setup": (
    this: ThisType<PocoPeerSocketIOConnection<Events>>,
    from: Address,
    to: Address
  ) => void;
  "peer destroy": (
    this: ThisType<PocoPeerSocketIOConnection<Events>>,
    from: Address,
    to: Address
  ) => void;
}

export class PocoPeerSocketIOConnection<
  Events extends EventsMap = DefaultEventsMap
> extends PocoPeerConnection<Events> {
  private connection: PocoSocketIOConnection<
    PocoPeerSocketIOConnectionEvents<Events>
  >;
  private options: PocoPeerSocketIOConnectionOptions | undefined;

  constructor(
    localAddress: Address,
    remoteAddress: Address,
    connection: PocoSocketIOConnection<
      PocoPeerSocketIOConnectionEvents<Events>
    >,
    opts?: PocoPeerSocketIOConnectionOptions
  ) {
    super("socketIO", localAddress, remoteAddress);

    this.connection = connection;
    this.options = opts;

    this.connection.on("peer event", (from, to, event, payload) => {
      if (from !== this.remoteAddress || to !== this.localAddress) {
        return;
      }

      // @ts-ignore
      this.triggerEvent(event, ...payload);
    });

    this.connection.on("peer disconnected", () => {
      this.setStatus("closed");
    });

    // this.connection.once("peer connected", () => {
    //     this.setStatus("connected")
    // })
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === "connecting") {
      return;
    }

    if (
      this.connection.status() !== "connected" &&
      this.connection.status() !== "closed"
    ) {
      await this.connection.connect();
    }

    this.setStatus("connecting");
    this.connection.send("peer setup", this.localAddress, this.remoteAddress);

    try {
      await this.connection.once("peer connected", {
        timeout: this.options?.timeout || 10000,
      });

      this.setStatus("connected");
    } catch (error: any) {
      this.setStatus("failed");

      throw new PocoConnectionError(this, error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionStatus == "disconnected") {
      return;
    }

    this.connection.emit("peer destroy", this.localAddress, this.remoteAddress);
    this.setStatus("closed");
  }

  send<Event extends ReservedOrUserEventNames<PocoConnectionEvents, Events>>(
    event: Event,
    ...payload: ReservedOrUserEventParameters<
      PocoPeerSocketIOConnectionEvents,
      Events,
      Event
    >
  ): void | Promise<void> {
    this.connection.send(
      "peer event",
      this.localAddress,
      this.remoteAddress,
      event,
      payload as any
    );
  }
}
