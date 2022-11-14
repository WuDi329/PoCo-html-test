import express from "express";
import http from "http";
import chalk from "chalk";
import { Server as SocketIOServer, Socket } from "socket.io";
import _ from "lodash";
import {
  PocoProtocolPacket,
  serializePocoMessagePayload,
} from "@poco/net";
import { EventsMap } from "socket.io/dist/typed-events";

// type Events = PocoConnectionEvents
//     & PocoPeerSocketIOConnectionEvents<any>;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = 8080;

const onlineUsers = new Map<string, Socket>();
const pendingPeerConnections = new Set<string>();

function prefix() {
  const now = new Date();

  return chalk.green(
    `[${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}]`
  );
}

function hackSocket<
  X extends EventsMap,
  Y extends EventsMap,
  Z extends EventsMap,
  D
>(socket: Socket<X, Y, Z, D>): Socket<X, Y, Z, D> {
  const oldEmit = socket.emit;

  function emit<Ev extends string>(event: Ev, ...args: any[]): boolean {
    const buffer = serializePocoMessagePayload(args);
    const packet = new PocoProtocolPacket();

    packet.setBody(buffer);
    packet.header().setNoSegmentFlag();
    packet.header().setNoMoreSegmentFlag();
    packet.build();

    // @ts-ignore
    oldEmit.apply(socket, [event, packet.toUint8Array()]);

    return true;
  }

  // @ts-ignore
  socket.emit = emit;

  socket.use((event, next) => {
    if (event[1] && _.isBuffer(event[1])) {
      event[1] = new PocoProtocolPacket(event[1]);
    }

    next();
  });

  // socket.onAnyOutgoing((args) => {
  //     console.log(prefix(), chalk.bgMagenta("Outgoing"), args)
  // })

  return socket;
}

io.on("connection", (_socket) => {
  const address = _socket.handshake.auth.address as string | undefined;
  const protocol = (_socket.conn.transport as any).socket.protocol as
    | string
    | undefined;

  const socket = hackSocket(_socket);
  // const socket = _socket;

  if (!address) {
    socket.emit("error", "missing address");
    setTimeout(() => {
      socket.disconnect(true);
    }, 500);
    return;
  }

  if (!protocol) {
    socket.emit("error", "invalid protocol");
    setTimeout(() => {
      socket.disconnect(true);
    }, 500);
    return;
  }

  const oldConnection = onlineUsers.get(address);

  if (oldConnection && oldConnection.connected) {
    socket.emit("error", "duplicate address");
    setTimeout(() => {
      socket.disconnect(true);
    }, 500);
    return;
  }

  console.log(
    prefix(),
    "User",
    chalk.green(address),
    "with protocol",
    chalk.yellow(protocol),
    "connected."
  );

  onlineUsers.set(address, socket);

  socket.on("disconnect", () => {
    console.log(prefix(), "User", chalk.green(address), "disconnected.");

    onlineUsers.delete(address);
  });

  socket.on("peer event", (packet: PocoProtocolPacket) => {
    const [from, to, event, payload] = packet.body();

    if (from != address) {
      return;
    }

    if (!onlineUsers.has(from)) {
      console.warn(prefix(), "Missing sender in online users", chalk.red(from));
      return;
    }

    if (!onlineUsers.has(to)) {
      console.warn(prefix(), "Missing receiver in online users", chalk.red(to));
      return;
    }

    console.log(
      prefix(),
      chalk.cyanBright("Event"),
      chalk.cyan(event),
      "from",
      chalk.green(from),
      "to",
      chalk.yellow(to)
    );
    // console.log(prefix(), chalk.yellow(JSON.stringify(payload)));

    const receiverSocket = onlineUsers.get(to)!;

    receiverSocket.emit("peer event", from, to, event, payload as any);
  });

  socket.on("peer setup", (packet: PocoProtocolPacket) => {
    const [from, to] = packet.body();

    if (from != address) {
      return;
    }

    if (!onlineUsers.has(from)) {
      console.warn(prefix(), "Missing sender in online users", chalk.red(from));
      return;
    }

    if (!onlineUsers.has(to)) {
      console.warn(prefix(), "Missing receiver in online users", chalk.red(to));
      return;
    }

    const requestId = `${to}-${from}`;

    if (pendingPeerConnections.has(requestId)) {
      console.log(
        prefix(),
        "User",
        chalk.green(from),
        "connected to",
        chalk.green(to),
        "successfully."
      );

      pendingPeerConnections.delete(requestId);

      const receiverSocket = onlineUsers.get(to)!;

      socket.emit("peer connected", from, to);
      receiverSocket.emit("peer connected", from, to);
    } else {
      console.log(
        prefix(),
        "User",
        chalk.green(from),
        "wants to connect user",
        chalk.green(to),
        "."
      );

      pendingPeerConnections.add(`${from}-${to}`);

      const receiverSocket = onlineUsers.get(to)!;

      receiverSocket.emit("peer setup", from, to);
    }
  });

  socket.on("peer destroy", (packet) => {
    const [from, to] = packet.body();

    if (from != address) {
      return;
    }

    if (!onlineUsers.has(from)) {
      console.warn(prefix(), "Missing sender in online users", chalk.red(from));
      return;
    }

    if (!onlineUsers.has(to)) {
      console.warn(prefix(), "Missing receiver in online users", chalk.red(to));
      return;
    }

    const receiverSocket = onlineUsers.get(to)!;

    receiverSocket.emit("peer destroy", from, to);
  });
});

server.listen(port, () => {
  console.log(
    prefix(),
    "Server is running at port",
    chalk.green(port.toString())
  );
});
