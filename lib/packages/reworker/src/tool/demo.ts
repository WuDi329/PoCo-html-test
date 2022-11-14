import { MyAudioContext } from "./audiocontext";
import { WebMWriter } from "./webm-writer";

//dom操作元素
//   window.$ = document.querySelector.bind(document);

//确实返回了，逻辑上只能从一个地方return
//@ts-ignore
export class Transcoder{
  demuxDecodeWorker: Worker;
  webm_worker: Worker;
  writer: WebMWriter;
  finalBuffer: ArrayBuffer|undefined;
  buffer: ArrayBuffer;
  wait_for_reslut: ((value: ArrayBuffer) => void) | null | undefined;
  status: Promise<ArrayBuffer>;

  constructor(buffer: ArrayBuffer){
    //在init中创建worker
    this.demuxDecodeWorker = new Worker(new URL("../worker/demux_decode_worker.ts", import.meta.url), {
      type: "module"
    });

    this.webm_worker = new Worker(new URL("../worker/webm-worker.ts", import.meta.url), {
      type: "module"
    });

    this.demuxDecodeWorker.onmessage = this.demuxWorkerCallback;

    this.demuxDecodeWorker.onerror = this.onerror;

    this.webm_worker.onerror = this.onerror;

    this.webm_worker.onmessage = this.webmWorkerCallback;

    this.writer = new WebMWriter();

    

    this.status = new Promise((resolve) => this.wait_for_reslut = resolve)

    

    this.buffer = buffer;
    
  }

  onerror(e: any) {
    console.error(e);
  }

  async start(): Promise<ArrayBuffer> {
    this.demuxDecodeWorker.postMessage({type: 'initialize', buffer: this.buffer});
    return this.status;
  }

  async webmWorkerCallback(e: MessageEvent){
    const msg = e.data;
    switch (msg.type) {
        //原本的exit由外部事件触发，在这里应该是根据demux_decode_worker的事件触发
        case 'exit':
            //这个是最后一步执行的
            console.log('demo: exit')
            if (msg.code !== 0) {
                this.onerror(`muxer exited with status ${msg.code}`);
            }
            //本方法并不会等待 worker 去完成它剩余的操作；worker 将会被立刻停止
            this.webm_worker.terminate();
            console.log('demo: webm_worker terminated')
        
                const r = await this.writer.finish();
                // console.log(r);
                console.log(`Finished: Duration ${this.writer.duration}ms, Size ${this.writer.size} bytes`);
                // if (inmem_el.checked) {

                  const blob = new Blob(r, { type: 'video/webm' });
                  console.log('blob finished')
                  this.finalBuffer = await blob.arrayBuffer();
                  this.wait_for_reslut!(this.finalBuffer);
                  this.wait_for_reslut = null;
                  // console.log('get finalbuffer')
                  // return Promise.resolve(this.finalBuffer);
                    // const blob = new Blob(r, { type: 'video/webm' });
                    // const a = document.createElement('a');
                    // const filename = 'video-transcode.webm';
                    // a.textContent = filename;
                    // a.href = URL.createObjectURL(blob);
                    // a.download = filename;
                    // //这里可能会有问题，因为要直接操作document
                    // document.body.appendChild(a);
                    // a.click();
                    // document.body.removeChild(a);
                // } else {
                //     rec_info.innerText += `, Filename ${writer.name}, Cues at ${r ? 'start' : 'end'}`;
                // }
            // }

            //按钮全部不需要，因此注释
            // start_el.disabled = false;
            // record_el.disabled = false;
            // pcm_el.disabled = !record_el.checked;
            // inmem_el.disabled = !record_el.checked;
            // demuxDecodeWorker.postMessage({type: 'terminate'});
            break;

        case 'start-stream':
            //第八步：主线程接受到webm_worker的start stream信号
            console.log('demo: start stream')
            //webm_muxer.js和我的目前一个显著区别在于：
            //webm_muxer的decodeconfig和encodeconfig等是在主线程获得的，
            //而我目前的东西都是在transcoder中获得的
            //哪个更好还不确定？
            this.demuxDecodeWorker.postMessage({type: 'start-transcode'})

            break;

        case 'muxed-data':
            //理论上来说，获得muxed-data时，就代表一个encodedchunkdata经过了decode-encode再mux的过程了
            console.log('demo: muxed-data')
            //默认要记录，因此checked注释
            // if (record_el.checked) {
            await this.writer.write(msg.data);
            console.log(`Recorded ${this.writer.size} bytes`);
            break;

        case 'stats':
            // console.log('demo: stats')
            console.log(msg.data);
            break;

        case 'error':
            console.log('demo: error')
            this.onerror(msg.detail);
            break;
    }
};
  

  async demuxWorkerCallback(e: MessageEvent){
    const msg = e.data;
    switch (msg.type){
    case 'initialize-done':
      console.log('demo: initialize-done')
      //这里使用无名式的初始化方法
      await this.writer.start();
      // console.log('writer open over')
      //audiotext应该是播放的时候，校准时间的，这里似乎用处不大，先注释
      // myAudioContext.initialize();
    // audioController.initialize(e.data.sampleRate, e.data.channelCount,
    //                     e.data.sharedArrayBuffer);
      initResolver!();
      initResolver = null;
      this.webm_worker.postMessage({
        type: 'start',
        webm_stats_interval: msg.webm_stats_interval,
        webm_metadata: msg.webm_metadata
      })
      //转码时间得切换一下
      // demuxDecodeWorker.postMessage({type: 'start-transcode'});
      break;
    case 'error':
      this.onerror(msg.err);
      break;
    case 'exit':
      console.log('index: get message exit from demux decoder');
      this.webm_worker.postMessage({type: 'end'});
      break;
    case 'terminate':
      console.log('index: terminate触发')
      this.demuxDecodeWorker.terminate();
      break;
    default:
      this.webm_worker.postMessage(msg, [msg.data]);
      break;
  }
  }


}

  
  





  let initResolver : null|((value?: unknown) =>void);
  let initDone = new Promise(resolver => (initResolver = resolver));  
  //这里目前没用
  //@ts-ignore
  let myAudioContext = new MyAudioContext();
//   let num_exit = 0;

  
  await initDone;



