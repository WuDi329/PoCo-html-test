export type Nullable<T> = T | null;

export interface PocoStorage {
  getItem<T>(key: string): Promise<Nullable<T>> | Nullable<T>;

  getItemOrDefault<T>(key: string, value: T): Promise<T> | T;

  setItem<T>(key: string, value: T): Promise<void> | void;

  removeItem<T>(
    key: string,
    errorIfNotExist?: boolean
  ): Promise<Nullable<T>> | Nullable<T>;

  keys(): Iterable<string>;

  clear(): Promise<void> | void;
}
