import { PocoClient } from "./client";

export class PocoClientError extends Error {
  public client: PocoClient;

  constructor(client: PocoClient, error: string) {
    super(error);

    this.client = client;
  }
}

export class PocoClientUserRejectRequestError extends Error {
  constructor() {
    super("User reject to connect account.")
  }
}

export class PocoClientUserRequestAlreadyPendingError extends Error {
  constructor() {
    super("Pending request.")
  }
}

export class PocoClientNotReadyError extends PocoClientError {
  constructor(client: PocoClient) {
    super(client, "PocoClient not ready yet. Have you called setup() before?");

    this.client = client;
  }
}

export class PocoIllegalArgumentError extends PocoClientError {
  constructor(client: PocoClient, expect: string, actual: string) {
    super(
      client,
      `illegal argument, expect: ${JSON.stringify(
        expect
      )} actual: ${JSON.stringify(actual)}`
    );
  }
}
