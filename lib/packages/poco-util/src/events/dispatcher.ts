import { deepEquals } from "../utils";
import {
  Callback,
  EventParameters,
  EventsMap,
  ReservedOrUserEventNames,
  ReservedOrUserEventParameters,
  ReservedOrUserHandler,
} from "./types";

export type ListenerOptions = {
  async: boolean;
};

export type OnceListenerOptions = ListenerOptions & {
  signal: AbortSignal | undefined;
  timeout: number | undefined;
};

export class EventDispatcher<
  Events extends EventsMap,
  ReservedEvents extends EventsMap = {}
> {
  protected _listenerCount: number;

  protected _listeners: Map<
    ReservedOrUserEventNames<ReservedEvents, Events>,
    {
      callback: Callback;
      option: ListenerOptions;
    }[]
  >;

  protected _onceCallbacks: Map<
    ReservedOrUserEventNames<ReservedEvents, Events>,
    {
      resolveCallback: (...args: any) => void;
      rejectCallback: (reason?: "abort" | "timeout") => void;
      option: OnceListenerOptions;
    }[]
  >;

  constructor() {
    this._listenerCount = 0;
    this._listeners = new Map();
    this._onceCallbacks = new Map();
  }

  protected addListener<
    Event extends ReservedOrUserEventNames<ReservedEvents, Events>
  >(
    event: Event,
    callback: ReservedOrUserHandler<ReservedEvents, Events, Event>,
    opt?: Partial<ListenerOptions>
  ): boolean {
    const option = { async: opt?.async || false };
    const listeners = this._listeners.get(event);

    if (!listeners) {
      this._listeners.set(event, [
        {
          callback,
          option,
        },
      ]);

      return true;
    }

    if (
      listeners.find(
        (e) => e.callback == callback && deepEquals(e.option, option)
      )
    )
      return false;

    listeners.push({
      callback,
      option,
    });

    this._listenerCount += 1;

    return true;
  }

  protected addOnceCallback<
    Event extends ReservedOrUserEventNames<ReservedEvents, Events>
  >(
    event: Event,
    resolveCallback: ReservedOrUserHandler<ReservedEvents, Events, Event>,
    rejectCallback: (reason?: any) => void,
    option: OnceListenerOptions
  ) {
    const listeners = this._onceCallbacks.get(event);

    if (!listeners) {
      this._onceCallbacks.set(event, [
        {
          resolveCallback,
          rejectCallback,
          option,
        },
      ]);

      return;
    }

    listeners.push({
      resolveCallback,
      rejectCallback,
      option,
    });

    this._listenerCount += 1;
  }

  protected removeListener<
    Event extends ReservedOrUserEventNames<ReservedEvents, Events>
  >(
    event: Event,
    callback: ReservedOrUserHandler<ReservedEvents, Events, Event>,
    opt?: Partial<ListenerOptions>
  ): boolean {
    // @ts-ignore
    const option = { async: opt?.async || false };

    const listeners = this._listeners.get(event);

    if (!listeners) return false;

    const index = listeners.findIndex(
      (e) => e.callback == callback && deepEquals(e.option, option)
    );

    if (index < 0) return false;

    listeners.splice(index, 1);

    if (listeners.length === 0) this._listeners.delete(event);

    this._listenerCount -= 1;

    return true;
  }

  protected triggerEvent<
    Event extends ReservedOrUserEventNames<ReservedEvents, Events>
  >(
    event: Event,
    ...payload: ReservedOrUserEventParameters<ReservedEvents, Events, Event>
  ) {
    {
      const listeners = this._listeners.get(event)?.slice();

      if (listeners) {
        for (const {
          callback,
          option: { async },
        } of listeners) {
          if (async) {
            setImmediate(() => {
              callback.apply(this, payload);
            });
          } else {
            callback.apply(this, payload);
          }
        }
      }
    }

    {
      const listeners = this._onceCallbacks.get(event)?.slice();

      if (listeners) {
        for (const {
          resolveCallback,
          rejectCallback,
          option: { async, signal },
        } of listeners) {
          if (async) {
            if (signal && signal.aborted) {
              setImmediate(() => {
                rejectCallback.apply(this, ["abort"]);
              });
            } else {
              setImmediate(() => {
                resolveCallback.call(this, payload);
              });
            }
          } else {
            if (signal && signal.aborted) {
              rejectCallback.apply(this, ["abort"]);
            } else {
              resolveCallback.call(this, payload);
            }
          }
        }

        this._onceCallbacks.delete(event);
      }
    }
  }

  protected removeAllListeners<
    Event extends ReservedOrUserEventNames<ReservedEvents, Events>
  >(event?: Event) {
    if (!event) {
      this._listeners.clear();
      return;
    }

    this._listeners.delete(event);
  }

  on<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event: Event,
    callback: ReservedOrUserHandler<ReservedEvents, Events, Event>,
    opt?: Partial<ListenerOptions>
  ): boolean {
    return this.addListener(event, callback, opt);
  }

  once<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event: Event,
    opt?: Partial<Pick<OnceListenerOptions, "async" | "signal" | "timeout">>
  ): Promise<EventParameters<ReservedEvents & Events, Event>> {
    const promise = new Promise<
      EventParameters<ReservedEvents & Events, Event>
    >((resolve, reject) => {
      this.addOnceCallback(event, resolve as any, reject, {
        async: opt?.async || false,
        signal: opt?.signal,
        timeout: undefined,
      });
    });

    if (opt && opt.timeout) {
      const timeout = opt.timeout;

      return Promise.race([
        new Promise<EventParameters<ReservedEvents & Events, Event>>(
          (_, reject) =>
            setTimeout(() => {
              if (opt && opt.signal && opt.signal.aborted) {
                reject("abort");
              } else {
                reject("timeout");
              }
            }, timeout)
        ),
        promise,
      ]);
    } else {
      return promise;
    }
  }

  off<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event: Event,
    callback: ReservedOrUserHandler<ReservedEvents, Events, Event>,
    opt?: Partial<ListenerOptions>
  ): boolean {
    return this.removeListener(event, callback, opt);
  }

  emit<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event: Event,
    ...payload: ReservedOrUserEventParameters<ReservedEvents, Events, Event>
  ) {
    this.triggerEvent(event, ...payload);
  }

  clear<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event?: Event
  ) {
    this.removeAllListeners(event);
  }

  listenerCount<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event?: Event
  ): number {
    if (!event) return this._listenerCount;

    return this._listeners.get(event)?.length || 0;
  }

  listeners<Event extends ReservedOrUserEventNames<ReservedEvents, Events>>(
    event?: Event
  ): {
    callback: Callback;
    option: ListenerOptions;
  }[] {
    if (!event) {
      return Array.from(this._listeners.values()).flatMap((e) => e);
    }

    return this._listeners.get(event) || [];
  }

  eventNames(): ReservedOrUserEventNames<ReservedEvents, Events>[] {
    return Array.from(this._listeners.keys());
  }
}
