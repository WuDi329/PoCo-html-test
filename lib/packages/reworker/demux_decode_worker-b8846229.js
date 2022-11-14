let workerNum = 0;
let exitNum = 0;
let videoConfig;
let audioConfig;
const video_Worker = new Worker(new URL("video_transcoder-e5396df8.js", import.meta.url), {
    type: "module"
});
const audio_Worker = new Worker(new URL("audio_transcoder-913fea89.js", import.meta.url), {
    type: "module"
});
video_Worker.onmessage = passdata;
video_Worker.onerror = er => console.error(er);
audio_Worker.onmessage = passdata;
audio_Worker.onerror = er => console.error(er);
function passdata(ev) {
    const msg = ev.data;
    switch (msg.type) {
        case 'initialize-done':
            console.log('demux_worker:get transcoder done');
            if (msg.workerType === 'video')
                videoConfig = msg.config;
            else
                audioConfig = msg.config;
            console.log('videoconfig');
            console.log(videoConfig);
            console.log(workerNum);
            if (++workerNum === 2) {
                console.log('in demux worker');
                console.log(videoConfig);
                console.log(audioConfig);
                self.postMessage({
                    type: 'initialize-done',
                    webm_stats_interval: 1000,
                    webm_metadata: {
                        max_cluster_duration: BigInt(2000000000),
                        video: videoConfig,
                        audio: audioConfig
                    }
                });
            }
            break;
        case 'error':
            self.postMessage({
                type: 'error',
                err: msg.err
            });
            break;
        case 'exit':
            console.log('decode worker: get exit from a transcoder');
            if (++exitNum == 2) {
                video_Worker.terminate();
                audio_Worker.terminate();
                self.postMessage(msg);
            }
            break;
        case 'video-data':
            self.postMessage(msg, [msg.data]);
            break;
        case 'audio-data':
            self.postMessage(msg, [msg.data]);
            break;
    }
}
self.addEventListener('message', async function (e) {
    const msg = e.data;
    switch (msg.type) {
        case 'initialize':
            video_Worker.postMessage({
                type: 'initialize',
                buffer: msg.buffer
            });
            audio_Worker.postMessage({
                type: 'initialize',
                buffer: msg.buffer
            });
            console.log("demux_worker: videoTranscoder initialize begin");
            console.log("demux_worker: audioTranscoder initialize begin");
            break;
        case 'start-transcode':
            video_Worker.postMessage({
                type: 'start-transcode'
            });
            audio_Worker.postMessage({
                type: 'start-transcode'
            });
            break;
    }
});
var demux_decode_worker = 0;

export { demux_decode_worker as default };
//# sourceMappingURL=demux_decode_worker-b8846229.js.map
