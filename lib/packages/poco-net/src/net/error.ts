import { EventsMap } from "@poco/util";
import { PocoConnection } from "./connection";

export class PocoConnectionError<
  T extends EventsMap,
  R extends EventsMap
> extends Error {
  public connection: PocoConnection<T, R>;

  constructor(connection: PocoConnection<T, R>, error: string) {
    super(error);

    this.connection = connection;
  }
}

export class PocoConnectionUnknownTypeError extends Error {
  public type: string;

  constructor(type: string) {
    super(`unknown connection type ${type}`);

    this.type = type;
  }
}

export class PocoConnectionClosedError<
  T extends EventsMap,
  R extends EventsMap
> extends PocoConnectionError<T, R> {
  constructor(connection: PocoConnection<T, R>) {
    super(connection, `connection is closed`);
  }
}

export class PocoConnectionTimeoutError<
  T extends EventsMap,
  R extends EventsMap
> extends PocoConnectionError<T, R> {
  constructor(connection: PocoConnection<T, R>) {
    super(connection, `connection timeout`);
  }
}
