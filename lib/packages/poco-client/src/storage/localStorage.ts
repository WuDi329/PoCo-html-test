import { PocoStorageKeyNotFoundError } from "./error";
import { Nullable, PocoStorage } from "./storage";

export class PocoLocalStorage implements PocoStorage {
  public category: string;

  constructor(category?: string) {
    this.category = category || "poco";
  }

  private prefix(key: string): string {
    return `${this.category}-${key}`;
  }

  getItem<T>(key: string): Nullable<T> {
    const itemString = localStorage.getItem(this.prefix(key));

    if (itemString === null) return null;

    return JSON.parse(itemString);
  }

  getItemOrDefault<T>(key: string, value: T): T {
    const item = this.getItem<T>(key);

    if (item === null) return value;

    return item;
  }

  setItem<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix(key), JSON.stringify(value));
  }

  removeItem<T>(key: string, errorIfNotExist?: boolean): Nullable<T> {
    const errorFlag = errorIfNotExist || false;
    const item = localStorage.getItem(key);

    if (!item && errorFlag) throw new PocoStorageKeyNotFoundError(this, key);

    if (!item) return null;

    return JSON.parse(item);
  }

  keys(): Iterable<string> {
    const entries: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key) continue;

      if (key.startsWith(this.category))
        entries.push(key.substring(this.prefix.length + 1));
    }

    return entries;
  }

  clear(): void | Promise<void> {
    const entries = this.keys();

    for (const key in entries) {
      localStorage.removeItem(this.prefix(key));
    }
  }
}
