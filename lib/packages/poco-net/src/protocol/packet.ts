import ByteBuffer from "bytebuffer";
import _ from "lodash";
import { PocoMessagePayload } from "./types";
import { deserializeMessagePayload } from "./utils";

export enum PocoProtocolHeaderFlags {
  NO_SEGMENT = 0,
  MORE_SEGMENT = 1,
}

export const PACKET_SOCKET_IO_CONNECTION_MTU = 32 * 1024 * 1024;
export const PACKET_WEB_RTC_CONNECTION_MTU = 64 * 1024;

export const PACKET_HEADER_LENGTH_IN_BYTES = 1;

export class PocoProtocolHeader {
  private parent: PocoProtocolPacket;

  constructor(parent: PocoProtocolPacket) {
    this.parent = parent;
  }

  protected getBits(): Uint8Array {
    const buffer = this.parent.internalBuffer();

    return new Uint8Array(buffer.buffer, 0, PACKET_HEADER_LENGTH_IN_BYTES);
  }

  protected set(flag: PocoProtocolHeaderFlags) {
    if (this.parent.immutable()) {
      throw new Error("invalid state");
    }

    const bits = this.getBits();
    const mask = 1 << flag;

    bits[0] |= mask;
  }

  protected has(flag: PocoProtocolHeaderFlags): boolean {
    const bits = this.getBits();
    const mask = 1 << flag;

    return (bits[0] & mask) !== 0;
  }

  protected unset(flag: PocoProtocolHeaderFlags) {
    if (this.parent.immutable()) {
      throw new Error("invalid state");
    }

    const bits = this.getBits();
    const mask = 1 << flag;

    bits[0] &= ~mask;
  }

  setMoreSegmentFlag() {
    this.set(PocoProtocolHeaderFlags.MORE_SEGMENT);
  }

  setNoMoreSegmentFlag() {
    this.unset(PocoProtocolHeaderFlags.MORE_SEGMENT);
  }

  setNoSegmentFlag() {
    this.set(PocoProtocolHeaderFlags.NO_SEGMENT);
  }

  hasMoreSegmentFlag(): boolean {
    return this.has(PocoProtocolHeaderFlags.MORE_SEGMENT);
  }

  hasNoSegmentFlag(): boolean {
    return this.has(PocoProtocolHeaderFlags.NO_SEGMENT);
  }
}

export class PocoProtocolPacket {
  private buffer: ByteBuffer;
  private packetHeader: PocoProtocolHeader;
  private immutableFlag: boolean;

  constructor(buffer?: ArrayBuffer) {
    if (!buffer) {
      // Default Header
      this.buffer = new ByteBuffer(1, true);
      // this.buffer.writeByte(0);
      this.packetHeader = new PocoProtocolHeader(this);
      this.immutableFlag = false;
    } else {
      // Full Packet
      this.buffer = ByteBuffer.wrap(buffer, undefined, true);
      this.packetHeader = new PocoProtocolHeader(this);
      this.immutableFlag = true;
    }
  }

  immutable(): boolean {
    return this.immutableFlag;
  }

  setBody(buffer: ArrayBuffer | ByteBuffer | Uint8Array) {
    if (this.immutableFlag) {
      throw new Error("invalid state");
    }

    this.buffer.offset = 1;
    this.buffer.append(buffer);
  }

  rawBody(): Uint8Array {
    if (!this.immutableFlag) {
      throw new Error("invalid state");
    }

    const offset = this.buffer.offset + PACKET_HEADER_LENGTH_IN_BYTES;
    const buffer = this.buffer.buffer;

    const body = new Uint8Array(_.isBuffer(buffer) ? buffer.buffer : buffer, offset);

    return body;
  }

  body(): PocoMessagePayload {
    return deserializeMessagePayload(this.rawBody());
  }

  header(): PocoProtocolHeader {
    return this.packetHeader;
  }

  build() {
    this.buffer.flip();
    this.buffer.compact();
    this.immutableFlag = true;
  }

  toArrayBuffer(): ArrayBuffer {
    const buffer = new ArrayBuffer(this.buffer.limit - this.buffer.offset);
    const view = new Uint8Array(buffer);

    for (let i = this.buffer.offset, j = 0; i < this.buffer.limit; i++, j++) {
      view[j] = this.buffer.readUint8(i);
    }

    return buffer;
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer.buffer, this.buffer.offset);
  }

  internalBuffer(): ByteBuffer {
    return this.buffer;
  }
}
