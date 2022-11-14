// import { start } from 'repl';


// importScripts('./mp4_demuxer.js');


// importScripts('./webm-writer.js')

// let lastMediaTimeCapturePoint = 0;
// let lastMediaTimeSecs = 0;
// let moduleLoadedResolver = null;
// let webmLoadedResolver = null;
// let videoTranscoder = null;
// let frameCount = 0;
// let playing = false;

//initialize部分的判断条件，只有当它为2时，才返回initialize-done
let workerNum = 0;
let exitNum = 0;

//从worker中读到的Config
let videoConfig: VideoEncoderConfig;
let audioConfig: AudioEncoderConfig;
// let modulesReady = new Promise(resolver => (moduleLoadedResolver = resolver));
// 不需要这一步，因为webm是以worker形式导入的。
// let webmReady = new Promise(resolver => (webmLoadedResolver = resolver));


const video_Worker = new Worker(new URL("../worker/video_transcoder.ts", import.meta.url), {
    type: "module"
});
const audio_Worker = new Worker(new URL("../worker/audio_transcoder.ts", import.meta.url), {
    type: "module"
})

video_Worker.onmessage = passdata
video_Worker.onerror = er => console.error(er);

audio_Worker.onmessage = passdata;
audio_Worker.onerror = er => console.error(er);


function passdata(ev: MessageEvent){
  const msg = ev.data;
  switch (msg.type) {
    case 'initialize-done':
      console.log('demux_worker:get transcoder done')
      if(msg.workerType === 'video')
        videoConfig = msg.config;
      else
        audioConfig = msg.config;
        //这里先不加入音频
      console.log('videoconfig')
      console.log(videoConfig)
      console.log(workerNum);
      if(++workerNum === 2){
        console.log('in demux worker')
        console.log(videoConfig);
        console.log(audioConfig)
      self.postMessage({
        type: 'initialize-done',
        webm_stats_interval: 1000,
        webm_metadata: {
          max_cluster_duration: BigInt(2000000000),
          video: videoConfig,
          audio: audioConfig
        }});
      }
      break;
    case 'error':
      self.postMessage({
        type: 'error',
        err: msg.err
      })
      break;
    case 'exit':
      console.log('decode worker: get exit from a transcoder');
      if(++exitNum == 2){
        video_Worker.terminate();
        audio_Worker.terminate();
        self.postMessage(msg);
      }
      break;
    case 'video-data':
      //这里是有插件冲突，报错：(message: any, targetOrigin: string, transfer?: Transferable[] | undefined)
      //@ts-ignore
      self.postMessage(msg, [msg.data])
      break;
    case 'audio-data':
      //@ts-ignore
      self.postMessage(msg, [msg.data])
      break;
  }

}

//这里一整块的作用是创建videotranscoder，由于下面已经再worker中尝试创建，所以这里先注释了
// (async () => {
//   let videoImport = import('./video_transcoder.js');
//   videoImport.then((vi) =>{
//     videoTranscoder = new vi.VideoTranscoder();
//     console.log(videoTranscoder);
//     moduleLoadedResolver();
//     moduleLoadedResolver = null;
//     console.log('worker imported')
//   });
  
// })();

self.addEventListener('message', async function(e: MessageEvent) {
  // await modulesReady;
  const msg = e.data;
  switch (msg.type) {
    case 'initialize':
      //在transcoder中执行initialize
      video_Worker.postMessage({
        type: 'initialize',
        buffer: msg.buffer
      });
      audio_Worker.postMessage({
        type: 'initialize',
        buffer: msg.buffer
      })
      // let videoReady = videoTranscoder.initialize(videoDemuxer, e.data.canvas, muxer);
      // await videoReady;
      console.log("demux_worker: videoTranscoder initialize begin")
      console.log("demux_worker: audioTranscoder initialize begin")
      // console.log('initialize done');
      // this.postMessage({command: 'initialize-done'})
      break;
    case 'start-transcode':
      //这里目前只有一个video_worker，还有一个audio_worker等待添加
      video_Worker.postMessage({
        type: 'start-transcode'
      });
      audio_Worker.postMessage({
        type: 'start-transcode'
      })
      break;
      //这里总是会监听到metamask的信息，很怪？？？
      //这里先整体注释了
    // default:
    //   console.log('current demux_decode_worker')
    //   console.log(e.data)
    //   console.error(`Worker bad message: ${e.data}`);
    //   break;
  }
})

export default 0;
