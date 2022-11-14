import { PocoStorage } from "./storage";

export class PocoStorageError extends Error {
  public storage: PocoStorage;

  constructor(storage: PocoStorage, error: string) {
    super(error);

    this.storage = storage;
  }
}

export class PocoStorageKeyNotFoundError extends PocoStorageError {
  constructor(storage: PocoStorage, key: string) {
    super(storage, `${key} not found`);
  }
}
