import { serialize, deserialize } from "bson";
import _ from "lodash";
import { PocoMessagePayload, PocoObject } from "./types";
import { Buffer } from "buffer";
import { PACKET_HEADER_LENGTH_IN_BYTES, PocoProtocolPacket } from "./packet";

export function serializePocoObject(object: PocoObject): Uint8Array {
  return serialize(object);
}

export function deserializePocoObject(buffer: Uint8Array): PocoObject {
  return deserialize(buffer);
}

export function traverseArrayBufferLikeToBuffer(object: any): any {
  if (_.isNull(object) ||
    _.isUndefined(object) ||
    _.isNumber(object) ||
    _.isRegExp(object) ||
    _.isBoolean(object) ||
    _.isDate(object) ||
    _.isMap(object) ||
    _.isString(object) ||
    _.isNative(object) ||
    _.isSet(object) ||
    _.isWeakMap(object) ||
    _.isWeakSet(object) ||
    _.isError(object) ||
    _.isBuffer(object) ) {
    return object;
  } else if (_.isArrayBuffer(object) || _.isTypedArray(object)) {
    return Buffer.from(object);
  } else if (isBinary(object) || isBinary2(object)) {
    return Buffer.from(object.buffer);
  } else if (_.isArray(object)) {
    for (let i = 0; i < object.length; i++)
      object[i] = traverseArrayBufferLikeToBuffer(object[i])
  } else {
    const keys = Object.keys(object);

    for (const key of keys) {
      const value = object[key];

      object[key] = traverseArrayBufferLikeToBuffer(value);
    }
  }

  return object;
}

export function traverseBufferLikeToUint8Array(object: any): any {
  if (_.isNull(object) ||
    _.isUndefined(object) ||
    _.isNumber(object) ||
    _.isRegExp(object) ||
    _.isBoolean(object) ||
    _.isDate(object) ||
    _.isMap(object) ||
    _.isString(object) ||
    _.isNative(object) ||
    _.isSet(object) ||
    _.isWeakMap(object) ||
    _.isWeakSet(object) ||
    _.isError(object) ||
    _.isTypedArray(object)) {
    return object;
  } else if (_.isArrayBuffer(object)) {
    return new Uint8Array(object)
  } else if (_.isBuffer(object) || isBinary(object) || isBinary2(object)) {
    return object.buffer;
  } else if (_.isArray(object)) {
    for (let i = 0; i < object.length; i++)
      object[i] = traverseBufferLikeToUint8Array(object[i])
  } else {
    const keys = Object.keys(object);

    for (const key of keys) {
      const value = object[key];

      object[key] = traverseBufferLikeToUint8Array(value);
    }
  }

  return object;
}

export function serializePocoMessagePayload(
  payload: PocoMessagePayload
): Uint8Array {
  payload = traverseArrayBufferLikeToBuffer(payload);

  // for (let i = 0; i < payload.length; i++) {
  //   if (_.isArrayBuffer(payload[i]) || _.isTypedArray(payload[i])) {
  //     payload[i] = Buffer.from(payload[i]);
  //   }
  // }

  const buffer = serialize(payload);

  // return buffer.buffer.slice(
  //   buffer.byteOffset,
  //   buffer.byteOffset + buffer.byteLength
  // );

  return buffer;
}

export function isBinary(obj: any): boolean {
  return obj.constructor.name === "Binary";
}

export function isBinary2(obj: any): boolean {
  return obj.__proto__.constructor.name === "Binary2";
}

export function deserializeMessagePayload(
  buffer: Uint8Array
): PocoMessagePayload {
  let payload = Object.values(
    deserialize(buffer, {
      allowObjectSmallerThanBufferSize: true,
    })
  );

  payload = traverseBufferLikeToUint8Array(payload)

  // for (let i = 0; i < payload.length; i++) {
  //   if (isBinary2Type(payload[i])) {
  //     payload[i] = payload[i].buffer;
  //   }
  // }

  return payload;
}

export function toPackets(
  buffer: Uint8Array,
  size: number
): PocoProtocolPacket[] {
  const bodySize = size - PACKET_HEADER_LENGTH_IN_BYTES;

  if (buffer.byteLength <= bodySize) {
    const packet = new PocoProtocolPacket();

    packet.header().setNoMoreSegmentFlag();
    packet.header().setNoSegmentFlag();
    packet.setBody(buffer);

    packet.build();

    return [packet];
  }

  const packets = [];

  for (let begin = 0, end = bodySize; ; begin = end, end = end + bodySize) {
    const flag = end < buffer.byteLength;
    const packet = new PocoProtocolPacket();

    packet.setBody(buffer.slice(begin, Math.min(end, buffer.byteLength)));

    if (flag) {
      packet.header().setMoreSegmentFlag();
    } else {
      packet.header().setNoMoreSegmentFlag();
    }

    packet.build();

    packets.push(packet);

    if (!flag) {
      break;
    }
  }

  return packets;
}
