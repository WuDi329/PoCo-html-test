export interface PocoMediaConnection {
  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): void;
  addTransceiver(trackOrKind: MediaStreamTrack | string, init?: any): void;
  onTrack(
    callback: (this: PocoMediaConnection, event: RTCTrackEvent) => void
  ): void;
}
