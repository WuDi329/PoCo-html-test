export interface EventsMap {
  [event: string]: any;
}

export interface DefaultEventsMap {
  [event: string]: Callback;
}

export type Callback = (
  this: ThisType<any>,
  ...args: any[]
) => void | Promise<void>;

export type EventNames<T extends EventsMap> = keyof T & (string | symbol);

export type EventHandler<
  T extends EventsMap,
  R extends EventNames<T>
> = OmitThisParameter<T[R]>;

export type EventParameters<
  T extends EventsMap,
  R extends EventNames<T>
> = Parameters<OmitThisParameter<T[R]>>;

export type ReservedOrUserEventNames<
  ReservedEventsMap extends EventsMap,
  UserEvents extends EventsMap
> = EventNames<ReservedEventsMap> | EventNames<UserEvents>;

export type ReservedOrUserHandler<
  ReservedEvents extends EventsMap,
  UserEvents extends EventsMap,
  Ev extends ReservedOrUserEventNames<ReservedEvents, UserEvents>
> = FallbackToUntypedHandler<
  Ev extends EventNames<ReservedEvents>
    ? OmitThisParameter<ReservedEvents[Ev]>
    : Ev extends EventNames<UserEvents>
    ? OmitThisParameter<UserEvents[Ev]>
    : never
>;

export type ReservedOrUserEventParameters<
  ReservedEvents extends EventsMap,
  UserEvents extends EventsMap,
  Ev extends ReservedOrUserEventNames<ReservedEvents, UserEvents>
> = Parameters<ReservedOrUserHandler<ReservedEvents, UserEvents, Ev>>;

type FallbackToUntypedHandler<T> = [T] extends [never]
  ? (...args: any[]) => void | Promise<void>
  : T;
