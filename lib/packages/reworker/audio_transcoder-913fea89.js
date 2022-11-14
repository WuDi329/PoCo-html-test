import { M as MP4PullDemuxer, S as SampleLock, A as AUDIO_STREAM_TYPE, E as ENCODER_QUEUE_SIZE_MAX, d as debugLog, W as WebmMuxer } from './SampleLock-727057f9.js';

var frameCount = 0;
var chunkCount = 0;
var rechunkCount = 0;
let audioTranscoder;
onmessage = async function (e) {
    const msg = e.data;
    console.log('in audio data message...');
    if (!audioTranscoder)
        audioTranscoder = new AudioTranscoder();
    switch (msg.type) {
        case 'initialize':
            console.log('audio transcoder: case initialize is triggered');
            let audioDemuxer = new MP4PullDemuxer();
            let muxer = new WebmMuxer();
            console.log('audio_worker: waiting for encodeconfig');
            const encodeconfig = await audioTranscoder.initialize(audioDemuxer, muxer, msg.buffer);
            console.log('audio_worker: getting encodeconfig');
            console.log("audio transcoder: audioTranscoder initialize finished");
            console.log('initialize done');
            this.self.postMessage({
                type: 'initialize-done',
                workerType: 'audio',
                config: {
                    bit_depth: 0,
                    sample_rate: encodeconfig.sampleRate,
                    channels: encodeconfig.numberOfChannels,
                    codec_id: 'A_OPUS'
                }
            });
            break;
        case 'start-transcode':
            console.log('audio: transcoder is below');
            console.log(audioTranscoder.encoder);
            console.log(audioTranscoder.decoder);
            console.log('audio: transcoder: case start-transcode is triggered');
            audioTranscoder.fillDataBuffer();
            break;
    }
};
class AudioTranscoder {
    fillInProgress = false;
    lock;
    demuxer;
    encoder;
    decoder;
    overaudio = false;
    sampleRate = 0;
    channelCount = 0;
    muxer;
    async initialize(demuxer, muxer, buffer) {
        this.fillInProgress = false;
        this.lock = new SampleLock();
        this.demuxer = demuxer;
        this.muxer = muxer;
        this.overaudio = false;
        await this.demuxer.initialize(AUDIO_STREAM_TYPE, buffer);
        console.log('audiotranscoder finish initialize demuxer');
        this.decoder = new AudioDecoder({
            output: this.bufferAudioData.bind(this),
            error: e => console.error(e)
        });
        const decodeconfig = this.demuxer.getDecoderConfig();
        this.sampleRate = decodeconfig.sampleRate;
        this.channelCount = decodeconfig.numberOfChannels;
        console.log('audio decoder below');
        console.log(this.decoder);
        console.assert(AudioDecoder.isConfigSupported(decodeconfig));
        this.decoder.configure(decodeconfig);
        this.encoder = new AudioEncoder({
            output: this.consumeAudioData.bind(this),
            error: e => console.error(e)
        });
        const encodeconfig = {
            codec: 'opus',
            bitrate: 128 * 1000,
            sampleRate: this.sampleRate,
            numberOfChannels: this.channelCount
        };
        console.assert(AudioEncoder.isConfigSupported(encodeconfig));
        this.encoder.configure(encodeconfig);
        return encodeconfig;
    }
    async fillDataBuffer() {
        if (this.audioDataFull()) {
            console.log('audio data full');
            return;
        }
        if (this.fillInProgress)
            return;
        this.fillInProgress = true;
        while (this.decoder.decodeQueueSize < ENCODER_QUEUE_SIZE_MAX &&
            this.encoder.encodeQueueSize < ENCODER_QUEUE_SIZE_MAX && !this.overaudio) {
            let chunk = await this.demuxer.getNextChunk();
            if (!chunk) {
                this.overaudio = true;
            }
            else {
                chunkCount++;
                console.log('chunk data count');
                console.log(chunkCount);
                this.decoder.decode(chunk);
            }
        }
        this.fillInProgress = false;
        if (!this.overaudio && this.encoder.encodeQueueSize === 0)
            setTimeout(this.fillDataBuffer.bind(this), 0);
    }
    audioDataFull() {
        return this.encoder.encodeQueueSize >= ENCODER_QUEUE_SIZE_MAX;
    }
    bufferAudioData(frame) {
        frameCount++;
        debugLog(`bufferFrame(${frame.timestamp})`);
        console.log(frameCount);
        this.encoder.encode(frame);
        frame.close();
    }
    async consumeAudioData(chunk) {
        const data = new ArrayBuffer(chunk.byteLength);
        chunk.copyTo(data);
        self.postMessage({
            type: 'audio-data',
            timestamp: chunk.timestamp,
            duration: chunk.duration,
            is_key: true,
            data
        }, [data]);
        await this.lock.status;
        this.lock.lock();
        rechunkCount++;
        this.lock.unlock();
        console.log('rechunk count');
        console.log(rechunkCount);
        if (!this.overaudio && this.encoder.encodeQueueSize === 0)
            this.fillDataBuffer();
        if (this.encoder.encodeQueueSize === 0 && this.decoder.decodeQueueSize === 0) {
            if (rechunkCount === 10576) {
                self.postMessage({ type: 'exit' });
                console.log('current audio');
                console.log('post exit message to self...');
            }
        }
    }
}
//# sourceMappingURL=audio_transcoder-913fea89.js.map
