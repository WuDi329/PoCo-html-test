<script setup lang="ts">
import { $ref } from "vue/macros";
import {
  PocoSocketIOConnection,
  PocoPeerSocketIOConnection,
  PocoPeerWebRTCConnection,
  createPocoSocketIOConnection,
  createPocoPeerSocketIOConnection,
  createPocoPeerWebRTCConnection,
} from "@poco/net";

let localAddress = $ref("");
let remoteAddress = $ref("");
let history = $ref("");
let socketIOMessage = $ref("");
let webRTCMessage = $ref("");
let localVideo = $ref<HTMLVideoElement>();
let remoteVideo = $ref<HTMLVideoElement>();

let localStream: MediaStream;
let remoteStream: MediaStream;

let socket: PocoSocketIOConnection;
let peer: PocoPeerSocketIOConnection;
let rtc: PocoPeerWebRTCConnection;

const setupPeerConnection = async () => {
  peer.on("message", (message) => {
    history += `SocketIO: ${JSON.stringify(message)}\n`;
  });

  peer.on("webrtc offer", async (offer) => {
    rtc = new PocoPeerWebRTCConnection(
      peer.remoteAddress,
      peer.localAddress,
      peer as any,
      {
        offer: offer,
      }
    );

    rtc.on("status", (status) => {
      history += `WebRTC status: ${JSON.stringify(status)}\n`;
    });

    rtc.on("message", (message) => {
      history += `WebRTC message: ${JSON.stringify(message)}\n`;
    });

    rtc.onTrack(async (event) => {
      remoteVideo.srcObject = event.streams[0];
    });

    // localStream = await navigator.mediaDevices.getDisplayMedia();

    // localStream.getTracks().forEach(track => {
    //     rtc.addTrack(track, localStream)
    // })

    // localStream.getTracks().forEach(track => {
    //     rtc.addTransceiver(track, {
    //         streams: [localStream]
    //     })
    // })

    await rtc.connect();
  });
};

const createConnection = async () => {
  socket = createPocoSocketIOConnection({
    type: "socketIO",
    uri: "http://localhost:8080",
    localAddress,
  });

  socket.on("peer setup", async (from, to) => {
    history += `peer connection request from ${from}\n`;

    if (to != localAddress) {
      return;
    }

    remoteAddress = from;

    peer = createPocoPeerSocketIOConnection({
      type: "socketIO",
      localAddress,
      remoteAddress,
      connection: socket as any,
      timeout: 5000,
    }) as any;

    setupPeerConnection();

    await peer.connect();
  });

  socket.on("peer connected", () => {
    history += `peer connection established successfully\n`;
  });

  await socket.connect();
};

const createPeerConnection = async () => {
  peer = createPocoPeerSocketIOConnection({
    type: "socketIO",
    localAddress,
    remoteAddress,
    connection: socket as any,
    timeout: 5000,
  }) as any;

  setupPeerConnection();

  await peer.connect();
};

const sendMessageBySocketIO = async () => {
  if (peer.status() !== "connected") return;

  const messageToSend = socketIOMessage.trim();

  if (messageToSend.length === 0) return;

  peer.send("message", { messege: messageToSend });
};

const sendMessageByWebRTC = async () => {
  if (rtc.status() !== "connected") return;

  const messageToSend = webRTCMessage.trim();

  if (messageToSend.length === 0) return;

  rtc.send("message", { message: messageToSend });
};

const createWebRTCPeerConnection = async () => {
  // localStream = await navigator.mediaDevices.getDisplayMedia()

  // localVideo.srcObject = localStream;

  rtc = createPocoPeerWebRTCConnection({
    type: "webrtc",
    localAddress,
    remoteAddress,
    connection: peer,
  });

  // localStream.getTracks().forEach(track => {
  //     rtc.addTransceiver(track, {
  //         direction: "sendonly",
  //         streams: [localStream],
  //     })
  // })

  // rtc.onTrack(async event => {
  //     remoteVideo.srcObject = event.streams[0];
  // })

  // rtc.setupChannels();

  rtc.on("status", (status) => {
    history += `WebRTC status: ${JSON.stringify(status)}\n`;
  });

  rtc.on("message", (message) => {
    history += `WebRTC message: ${JSON.stringify(message)}\n`;
  });

  await rtc.connect();
};
</script>

<template>
  <div class="p-8">
    <div class="flex">
      <div class="flex-grow">
        <div class="flex h-12 items-center">
          <div>Local Address:</div>
          <input type="text" v-model="localAddress" class="border mx-2" />
          <button
            @click="createConnection"
            class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300"
          >
            connect
          </button>
        </div>
        <div class="flex h-12 items-center">
          <div>Remote Address:</div>
          <input type="text" v-model="remoteAddress" class="border mx-2" />
          <button
            @click="createPeerConnection"
            class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300"
          >
            connect
          </button>
        </div>
        <div class="flex h-12 items-center">
          <div class="pr-2">WebRTC Connection:</div>
          <button
            @click="createWebRTCPeerConnection"
            class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300"
          >
            connect
          </button>
        </div>
        <div class="flex h-12 items-center">
          <div>Socket.IO Message</div>
          <input type="text" v-model="socketIOMessage" class="border mx-2" />
          <button
            @click="sendMessageBySocketIO"
            class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300"
          >
            send
          </button>
        </div>
        <div class="flex h-12 items-center">
          <div>WebRTC Message</div>
          <input type="text" v-model="webRTCMessage" class="border mx-2" />
          <button
            @click="sendMessageByWebRTC"
            class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300"
          >
            send
          </button>
        </div>
        <div class="flex flex-col justify-center">
          <div>History:</div>
          <textarea v-model="history" class="border w-72 h-64 mt-2"></textarea>
        </div>
      </div>
      <div class="flex-grow">
        <h2 class="py-2 text-lg">Local Video:</h2>
        <div class="relative w-[400px] h-[300px] bg-black my-2">
          <video ref="localVideo" width="400" height="300" autoplay></video>
        </div>
        <h2 class="py-2 text-lg">Remote Video:</h2>
        <div class="relative w-[400px] h-[300px] bg-black my-2">
          <video ref="remoteVideo" width="400" height="300" autoplay></video>
        </div>
      </div>
    </div>
  </div>
</template>
