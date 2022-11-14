import { M as MP4PullDemuxer, S as SampleLock, V as VIDEO_STREAM_TYPE, D as DECODER_QUEUE_SIZE_MAX, d as debugLog, W as WebmMuxer } from './SampleLock-727057f9.js';

var framecount = 0;
var chunkCount = 0;
let videoTranscoder = null;
const vp9_params = {
    profile: 0,
    level: 10,
    bit_depth: 8,
    chroma_subsampling: 1
};
onmessage = async function (e) {
    const msg = e.data;
    if (videoTranscoder === null)
        videoTranscoder = new VideoTranscoder();
    switch (msg.type) {
        case 'initialize':
            console.log('video transcoder: case initialize is triggered');
            let videoDemuxer = new MP4PullDemuxer();
            let muxer = new WebmMuxer();
            const encodeconfig = await videoTranscoder.initialize(videoDemuxer, muxer, msg.buffer);
            this.self.postMessage({
                type: 'initialize-done',
                workerType: 'video',
                config: {
                    width: encodeconfig?.width,
                    height: encodeconfig?.height,
                    frame_rate: encodeconfig?.framerate,
                    codec_id: 'V_VP9',
                    ...vp9_params
                }
            });
            break;
        case 'start-transcode':
            console.log('video transcoder is below');
            console.log(videoTranscoder.encoder);
            console.log(videoTranscoder.decoder);
            console.log('video transcoder: case start-transcode is triggered');
            videoTranscoder.fillFrameBuffer();
            break;
    }
};
class VideoTranscoder {
    encoder;
    decoder;
    lock;
    over = false;
    demuxer;
    muxer;
    fillInProgress = false;
    async initialize(demuxer, muxer, buffer) {
        this.fillInProgress = false;
        this.demuxer = demuxer;
        this.muxer = muxer;
        this.over = false;
        this.lock = new SampleLock();
        await this.demuxer?.initialize(VIDEO_STREAM_TYPE, buffer);
        console.log('videotranscoder finish initialize demuxer');
        const decodeconfig = this.demuxer?.getDecoderConfig();
        const encodeconfig = await this.muxer?.getEncoderConfig();
        console.log('encodeconfig');
        console.log(encodeconfig);
        this.decoder = new VideoDecoder({
            output: this.bufferFrame.bind(this),
            error: e => console.error(e),
        });
        console.assert(VideoDecoder.isConfigSupported(decodeconfig));
        this.decoder.configure(decodeconfig);
        this.encoder = new VideoEncoder({
            output: this.consumeFrame.bind(this),
            error: e => console.error(e)
        });
        console.log('encoder is below');
        console.log(this.encoder);
        console.assert(VideoEncoder.isConfigSupported(encodeconfig));
        this.encoder.configure(encodeconfig);
        return encodeconfig;
    }
    async fillFrameBuffer() {
        if (this.frameBufferFull()) {
            console.log('video frame buffer full');
            setTimeout(this.fillFrameBuffer.bind(this), 20);
        }
        if (this.fillInProgress) {
            return;
        }
        this.fillInProgress = true;
        while (((this.decoder?.decodeQueueSize) < DECODER_QUEUE_SIZE_MAX) &&
            ((this.encoder?.encodeQueueSize) < DECODER_QUEUE_SIZE_MAX) && !this.over) {
            let chunk = await this.demuxer?.getNextChunk();
            console.log('get chunk');
            console.log(chunk);
            if (!chunk) {
                this.over = true;
            }
            else {
                chunkCount++;
                this.decoder?.decode(chunk);
            }
        }
        this.fillInProgress = false;
        if (!this.over && this.encoder?.encodeQueueSize === 0)
            setTimeout(this.fillFrameBuffer.bind(this), 0);
    }
    frameBufferFull() {
        return (this.encoder?.encodeQueueSize >= DECODER_QUEUE_SIZE_MAX);
    }
    bufferFrame(frame) {
        debugLog(`bufferFrame(${frame.timestamp})`);
        this.encoder?.encode(frame);
        frame.close();
    }
    async consumeFrame(chunk) {
        const data = new ArrayBuffer(chunk.byteLength);
        chunk.copyTo(data);
        self.postMessage({
            type: 'video-data',
            timestamp: chunk.timestamp,
            duration: chunk.duration,
            is_key: chunk.type === 'key',
            data
        }, [data]);
        await this.lock?.status;
        this.lock?.lock();
        framecount++;
        this.lock?.unlock();
        console.log('video framecount');
        console.log(framecount);
        if (!this.over && this.encoder?.encodeQueueSize === 0)
            this.fillFrameBuffer();
        if (this.encoder?.encodeQueueSize === 0 && this.decoder?.decodeQueueSize === 0 && this.over) {
            if (framecount === chunkCount - 1) {
                console.log('current video');
                console.log(framecount);
                console.log(chunkCount);
                console.log('post exit message to self...');
                console.log(framecount);
                self.postMessage({ type: 'exit' });
            }
        }
    }
}
//# sourceMappingURL=video_transcoder-e5396df8.js.map
