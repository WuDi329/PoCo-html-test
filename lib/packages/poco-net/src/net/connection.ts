import _ from "lodash";
import {
  DefaultEventsMap,
  EventDispatcher,
  EventsMap,
  ReservedOrUserEventNames,
} from "@poco/util";
import { PocoMessagePayload } from "../protocol";
import { PocoConnectionType, Address, PocoConnectionStatus } from "./types";

export type PocoConnectionClosedReason =
  | "user closed"
  | "invalid protocol"
  | "missing address"
  | "duplicate address";

export type PocoConnectionEvents = {
  status: (
    this: ThisType<PocoConnection<PocoConnectionEvents>>,
    status: PocoConnectionStatus
  ) => void;
  connected: (this: ThisType<PocoConnection<PocoConnectionEvents>>) => void;
  disconnected: (
    this: ThisType<PocoConnection<PocoConnectionEvents>>,
    reason: PocoConnectionClosedReason
  ) => void;
  message: (
    this: ThisType<PocoConnection<PocoConnectionEvents>>,
    message: PocoMessagePayload
  ) => void;
  error: (
    this: ThisType<PocoConnection<PocoConnectionEvents>>,
    error: string
  ) => void;
};

export abstract class PocoConnection<
  Events extends EventsMap = DefaultEventsMap,
  ReservedEvents extends EventsMap = PocoConnectionEvents
> extends EventDispatcher<Events, ReservedEvents> {
  public connectionType: PocoConnectionType;
  public localAddress: Address;

  protected connectionStatus: PocoConnectionStatus;

  constructor(connectionType: PocoConnectionType, localAddress: Address) {
    super();

    this.connectionType = connectionType;
    this.localAddress = localAddress;
    this.connectionStatus = "new";
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  public status(): PocoConnectionStatus {
    return this.connectionStatus;
  }

  protected setStatus(status: PocoConnectionStatus): void {
    if (status === this.connectionStatus) return;

    this.connectionStatus = status;

    // @ts-ignore
    // it's illegal to type system here, but I can not find a better solution yet.
    this.triggerEvent("status", status);

    if (status === "failed") {
      this.disconnect();
    }
  }

  abstract send<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    type: Event,
    ...payload: any
  ): Promise<void> | void;
}

export abstract class PocoPeerConnection<
  Events extends EventsMap = DefaultEventsMap,
  ReservedEvents extends EventsMap = PocoConnectionEvents
> extends PocoConnection<Events, ReservedEvents> {
  public remoteAddress: Address;

  constructor(
    connectionType: PocoConnectionType,
    localAddress: Address,
    remoteAddress: Address
  ) {
    super(connectionType, localAddress);

    this.remoteAddress = remoteAddress;
  }
}
