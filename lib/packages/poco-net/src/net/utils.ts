// import { EventsMap, DefaultEventsMap } from "./event";
import { EventsMap, DefaultEventsMap } from "@poco/util";
import { PocoSocketIOConnection, PocoPeerSocketIOConnection } from "./socketIO";
import {
  PocoPeerSocketIOConnectionOptions,
  PocoPeerWebRTCConnectionOptions,
  PocoSocketIOConnectionOptions,
} from "./types";
import { PocoPeerWebRTCConnection } from "./webrtc";

export function createPocoSocketIOConnection<
  Events extends EventsMap = DefaultEventsMap
>(opts: PocoSocketIOConnectionOptions): PocoSocketIOConnection<Events> {
  return new PocoSocketIOConnection<Events>(opts.localAddress, opts);
}

export function createPocoPeerSocketIOConnection<
  Events extends EventsMap = DefaultEventsMap
>(opts: PocoPeerSocketIOConnectionOptions): PocoPeerSocketIOConnection<Events> {
  return new PocoPeerSocketIOConnection<Events>(
    opts.localAddress,
    opts.remoteAddress,
    opts.connection as any,
    opts
  );
}

export function createPocoPeerWebRTCConnection<
  Events extends EventsMap = DefaultEventsMap
>(opts: PocoPeerWebRTCConnectionOptions): PocoPeerWebRTCConnection<Events> {
  return new PocoPeerWebRTCConnection<Events>(
    opts.localAddress,
    opts.remoteAddress,
    opts.connection as any,
    opts
  );
}
