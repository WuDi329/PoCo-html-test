import { PocoConnectionEvents, PocoPeerConnection } from "./connection";
import { Address, ChannelId, PocoPeerWebRTCConnectionOptions } from "./types";
import { PocoMediaConnection } from "./media";
import _ from "lodash";
import { PocoConnectionClosedError } from "./error";
import {
  deserializeMessagePayload,
  PACKET_WEB_RTC_CONNECTION_MTU,
  PocoProtocolPacket,
  serializePocoMessagePayload,
  toPackets,
} from "../protocol";
import {
  DefaultEventsMap,
  EventsMap,
  ReservedOrUserEventNames,
  ReservedOrUserEventParameters,
} from "@poco/util";
import { PocoPeerSocketIOConnectionEvents } from "./socketIO";
import ByteBuffer from "bytebuffer";

export type PocoPeerWebRTCInternalChannel = "message" | "event";

export type PocoPeerWebRTCConnectionEvents = {
  "webrtc offer": (
    this: ThisType<PocoPeerWebRTCConnection>,
    offer: RTCSessionDescriptionInit
  ) => void;
  "webrtc answer": (
    this: ThisType<PocoPeerWebRTCConnection>,
    answer: RTCSessionDescriptionInit
  ) => void;
  "webrtc candidate": (
    this: ThisType<PocoPeerWebRTCConnection>,
    candidate: RTCIceCandidateInit
  ) => void;
  "webrtc destroy": (this: ThisType<PocoPeerWebRTCConnection>) => void;
};

export type PocoPeerWebRTCConnectionInternalEvents = {
  "channel open": (
    this: ThisType<PocoPeerWebRTCConnection>,
    channel: RTCDataChannel
  ) => void;
  "channel close": (
    this: ThisType<PocoPeerWebRTCConnection>,
    channel: RTCDataChannel
  ) => void;
  "channel error": (
    this: ThisType<PocoPeerWebRTCConnection>,
    channel: RTCDataChannel,
    event: RTCErrorEvent
  ) => void;
} & PocoConnectionEvents;

export interface BufferedRTCDataChannel extends RTCDataChannel {
  buffer: ByteBuffer;
}

export class PocoPeerWebRTCConnection<
    Events extends EventsMap = DefaultEventsMap
  >
  extends PocoPeerConnection<Events, PocoPeerWebRTCConnectionInternalEvents>
  implements PocoMediaConnection
{
  protected rtcConnection: RTCPeerConnection;
  protected peerConnection: PocoPeerConnection<PocoPeerWebRTCConnectionEvents>;

  protected options: Partial<PocoPeerWebRTCConnectionOptions>;
  protected channels: Map<ChannelId, BufferedRTCDataChannel>;

  constructor(
    localAddress: Address,
    remoteAddress: Address,
    peerConnection: PocoPeerConnection<PocoPeerWebRTCConnectionEvents>,
    opts?: Partial<PocoPeerWebRTCConnectionOptions>
  ) {
    super("webrtc", localAddress, remoteAddress);

    this.options = _.defaults(opts, {
      rtcConfiguration: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },
    });

    this.channels = new Map();

    this.rtcConnection = new RTCPeerConnection(this.options.rtcConfiguration);
    this.rtcConnection.addEventListener("icecandidate", ({ candidate }) => {
      if (candidate && this.rtcConnection.remoteDescription) {
        this.peerConnection.send("webrtc candidate", candidate);
      }
    });

    this.rtcConnection.addEventListener("iceconnectionstatechange", () => {
      this.setStatus(this.rtcConnection.connectionState);

      switch (this.rtcConnection.iceConnectionState) {
        case "closed":
        case "failed":
        case "disconnected":
          this.cleanup();
      }
    });

    this.rtcConnection.addEventListener("signalingstatechange", () => {
      switch (this.rtcConnection.signalingState) {
        case "closed":
          this.cleanup();
      }
    });

    this.rtcConnection.addEventListener("icegatheringstatechange", () => {});

    this.rtcConnection.addEventListener("connectionstatechange", () => {
      const stage = this.rtcConnection.connectionState;

      this.setStatus(stage);
    });

    this.rtcConnection.addEventListener("datachannel", ({ channel }) => {
      const channelId = channel.label;

      this.channels.set(channelId, this.setupChannel(channel));

      // if (channelId === "poco") {
      //     this.setupChannelListeners(channel);
      // }
    });

    this.peerConnection = peerConnection;

    this.peerConnection.on("webrtc answer", async (answer) => {
      const description = new RTCSessionDescription(answer);

      await this.rtcConnection.setRemoteDescription(description);
    });

    this.peerConnection.on("webrtc candidate", async (candidate) => {
      const iceCandidate = new RTCIceCandidate(candidate);

      await this.rtcConnection.addIceCandidate(iceCandidate);
    });

    this.peerConnection.on("webrtc destroy", () => {
      this.cleanup();
    });
  }

  async connect(): Promise<void> {
    if (this.peerConnection.status() === "new") {
      await this.peerConnection.connect();
    }

    if (this.peerConnection.status() !== "connected") {
      throw new PocoConnectionClosedError(this.peerConnection);
    }

    if (this.options.offer) {
      this.setupOffer(this.options.offer);
    } else {
      // Trigger negotiation
      this.getChannel("poco");

      const offer = await this.rtcConnection.createOffer(
        this.options?.rtcOfferOptions
      );

      await this.rtcConnection.setLocalDescription(offer);

      this.peerConnection.send(
        "webrtc offer",
        this.rtcConnection.localDescription!
      );
    }

    await this.once("connected");
  }

  cleanup() {
    this.rtcConnection.ontrack = null;
    this.rtcConnection.onicecandidate = null;
    this.rtcConnection.oniceconnectionstatechange = null;
    this.rtcConnection.onicegatheringstatechange = null;
    this.rtcConnection.onsignalingstatechange = null;
    this.rtcConnection.onnegotiationneeded = null;

    this.rtcConnection.close();
  }

  async disconnect(): Promise<void> {
    this.peerConnection.send("webrtc destroy");

    this.cleanup();
  }

  private async setupOffer(offer: RTCSessionDescriptionInit) {
    const description = new RTCSessionDescription(offer);

    await this.rtcConnection.setRemoteDescription(description);

    const answer = await this.rtcConnection.createAnswer(
      this.options?.rtcAnswerOptions
    );

    await this.rtcConnection.setLocalDescription(answer);

    this.peerConnection.send(
      "webrtc answer",
      this.rtcConnection.localDescription!
    );
  }

  getRTCConnection(): RTCPeerConnection {
    return this.rtcConnection;
  }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]) {
    this.rtcConnection.addTrack(track, ...streams);
  }

  onTrack(callback: (event: RTCTrackEvent) => void): void {
    this.rtcConnection.addEventListener("track", callback);
  }

  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): void {
    this.rtcConnection.addTransceiver(trackOrKind, init);
  }

  getChannel(id: ChannelId, opts?: RTCDataChannelInit): BufferedRTCDataChannel {
    let channel = this.channels.get(id);

    if (!channel) {
      if (opts && opts.ordered && !opts.ordered) {
        throw new Error(
          "data channel must be ordered to support segmentation."
        );
      }

      channel = this.rtcConnection.createDataChannel(
        id,
        opts
      ) as BufferedRTCDataChannel;
      channel = this.setupChannel(channel);

      this.channels.set(id, channel);
    }

    return channel;
  }

  protected setupChannel(_channel: RTCDataChannel): BufferedRTCDataChannel {
    // const channel = this.getChannel("poco");

    const channel = _channel as BufferedRTCDataChannel;

    channel.buffer = new ByteBuffer();

    channel.addEventListener("open", () => {
      this.triggerEvent("channel open", channel);

      this.triggerEvent("connected");
    });

    channel.addEventListener("close", () => {
      this.triggerEvent("channel close", channel);
    });

    channel.addEventListener("error", (error) => {
      this.triggerEvent("channel error", channel, error as RTCErrorEvent);
    });

    channel.addEventListener("message", ({ data }) => {
      const packet = new PocoProtocolPacket(data);

      channel.buffer.append(packet.rawBody());

      if (
        !packet.header().hasMoreSegmentFlag() ||
        packet.header().hasNoSegmentFlag()
      ) {
        channel.buffer.flip();

        const buffer = new Uint8Array(
          channel.buffer.buffer,
          channel.buffer.offset,
          channel.buffer.limit
        );
        const [event, ...payload] = deserializeMessagePayload(buffer);

        this.triggerEvent(event, ...payload);

        channel.buffer.clear();
      }
    });

    return channel;
  }

  async send<
    Event extends ReservedOrUserEventNames<
      PocoPeerWebRTCConnectionInternalEvents,
      Events
    >
  >(
    event: Event,
    ...payload: ReservedOrUserEventParameters<
      PocoPeerSocketIOConnectionEvents,
      Events,
      Event
    >
  ): Promise<void> {
    const channel = this.getChannel("poco");
    const buffer = serializePocoMessagePayload([event, ...payload]);

    const packets = toPackets(buffer, PACKET_WEB_RTC_CONNECTION_MTU);

    let i = 0;
    while(i < packets.length) {
      if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
        const promise = new Promise((resolve) => {
          channel.onbufferedamountlow = () => {
            channel.onbufferedamountlow = null;
            resolve(undefined);
          }
        })

        await promise;
      } else {
        channel.send(packets[i].toUint8Array());
        i += 1;
      }
    }
  }
}
