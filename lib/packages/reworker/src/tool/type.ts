export const ENCODER_QUEUE_SIZE_MAX = 5;
export const ENABLE_DEBUG_LOGGING = false;
export const VIDEO_STREAM_TYPE = 1;
export const AUDIO_STREAM_TYPE = 0;

export const DECODER_QUEUE_SIZE_MAX = 5;

export function debugLog(msg: string) {
    if (!ENABLE_DEBUG_LOGGING)
      return;
    console.debug(msg);
  }