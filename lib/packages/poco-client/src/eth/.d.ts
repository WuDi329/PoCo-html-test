declare module "@truffle/contract" {
  export default function contract<T>(json: object): Truffle.Contract<T>;
}

declare const TruffleContract:
  | ((json: object) => Truffle.Contract<any>)
  | undefined;
