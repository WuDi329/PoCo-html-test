// import { AUDIO_STREAM_TYPE } from "./pull_demuxer_base.js";
// import { RingBuffer } from "../third_party/ringbufjs/ringbuf.js";

// const DATA_BUFFER_DECODE_TARGET_DURATION = 0.3;
// const DATA_BUFFER_DURATION = 0.6;
// const DECODER_QUEUE_SIZE_MAX = 5;

import { MP4PullDemuxer } from '../tool/mp4_demuxer';
import { WebmMuxer } from '../tool/webm_muxer';
import { SampleLock } from '../tool/SampleLock'
import  {AUDIO_STREAM_TYPE, ENCODER_QUEUE_SIZE_MAX, debugLog} from '../tool/type'

//importScripts在ts环境中不适用，因此先注释，看看会出什么问题再解决
// self.importScripts('../external-js/mp4box.all.min.js');


var frameCount = 0;
var chunkCount = 0;
var rechunkCount = 0;

let audioTranscoder: AudioTranscoder|undefined;

onmessage = async function (e) {
  const msg = e.data;
  console.log('in audio data message...')
  if(!audioTranscoder)
    audioTranscoder = new AudioTranscoder();
  switch (msg.type) {
    case 'initialize':
      console.log('audio transcoder: case initialize is triggered');
      // let demuxer = await import('../tool/mp4_demuxer');
      let audioDemuxer =  new MP4PullDemuxer();
      // console.log('finish audioDemuxer');
      let muxer = new WebmMuxer();
      //这里可能要重写
      //将提取出几个config的方法单独挪出来，直接将config传入initialize
      console.log('audio_worker: waiting for encodeconfig')
      const encodeconfig = await audioTranscoder.initialize(audioDemuxer, muxer, msg.buffer);
      console.log('audio_worker: getting encodeconfig')
      console.log("audio transcoder: audioTranscoder initialize finished");
      console.log('initialize done');
      this.self.postMessage({
        type: 'initialize-done',
        workerType : 'audio',
        config: {
          bit_depth: 0,
          sample_rate: encodeconfig.sampleRate,
          channels: encodeconfig.numberOfChannels,
          codec_id: 'A_OPUS'
        }
      });
      break;
    case 'start-transcode':
      //初始调用fillFrameBuffer
      console.log('audio: transcoder is below')
      console.log(audioTranscoder.encoder);
      console.log(audioTranscoder.decoder);
      console.log('audio: transcoder: case start-transcode is triggered');
      audioTranscoder.fillDataBuffer()
      break;
  }
}


class AudioTranscoder {
  fillInProgress: boolean = false;
  lock: SampleLock | undefined;
  demuxer: MP4PullDemuxer|undefined;
  encoder: AudioEncoder|undefined;
  decoder: AudioDecoder|undefined;
  overaudio: boolean = false;
  sampleRate: number = 0;
  channelCount: number = 0;
  muxer: WebmMuxer|undefined;
  async initialize(demuxer: MP4PullDemuxer, muxer: WebmMuxer, buffer: ArrayBuffer) {
    // console.log('into audiotranscoder init')
    this.fillInProgress = false;
    this.lock = new SampleLock();
    this.demuxer = demuxer;
    this.muxer = muxer;
    this.overaudio = false;

    // console.log('audiotranscoder ready for initialize demuxer')
    await this.demuxer.initialize(AUDIO_STREAM_TYPE, buffer);
    console.log('audiotranscoder finish initialize demuxer')


    this.decoder = new AudioDecoder({
      output: this.bufferAudioData.bind(this),
      error: e => console.error(e)
    });
    // console.log('before audio decode config')
    const decodeconfig: AudioEncoderConfig = <AudioEncoderConfig>this.demuxer.getDecoderConfig();
    // console.log('audio decodeconfig');
    // console.log(decodeconfig)
    //从decoder获得的sampleRate以及numberOfChannels直接赋给了this
    this.sampleRate = decodeconfig.sampleRate;
    this.channelCount = decodeconfig.numberOfChannels;

    console.log('audio decoder below');
    console.log(this.decoder)
    // debugLog(decodeconfig);

    console.assert(AudioDecoder.isConfigSupported(decodeconfig));
    this.decoder.configure(decodeconfig);

    //encoder读取audio data并且将其再次encode
    this.encoder = new AudioEncoder({
      output: this.consumeAudioData.bind(this),
      error: e => console.error(e)
    })
    //当转为webm格式时，音频的config直接写死
    const encodeconfig = {
      codec: 'opus',
      bitrate: 128 * 1000,
      sampleRate: this.sampleRate,
      numberOfChannels: this.channelCount
    }
    console.assert(AudioEncoder.isConfigSupported(encodeconfig));
    this.encoder.configure(encodeconfig);
    return encodeconfig;
  }



  // 作用是确保只有一个能进入这个过程
  async fillDataBuffer() {

    if(this.audioDataFull()){
      console.log('audio data full');
      return;
    }
    // This method is called from multiple places to ensure the buffer stays
    // healthy. Sometimes these calls may overlap, but at any given point only
    // one call is desired.
    if (this.fillInProgress)
      return;

    this.fillInProgress = true;
    // This should be this file's ONLY call to the *Internal() variant of this method.
    // await this.fillDataBufferInternal();
    
    while (this.decoder!.decodeQueueSize < ENCODER_QUEUE_SIZE_MAX && 
      //返回队列中挂起的解码请求数。
        this.encoder!.encodeQueueSize < ENCODER_QUEUE_SIZE_MAX && !this.overaudio) {
          
              //由demuxer来控制是否获取下一个chunk
              // console.log('当前的encodequeuesize');
              // console.log(this.encoder.encodeQueueSize)
              // console.log('当前的decodequeuesize');
              // console.log(this.decoder.decodeQueueSize)
      let chunk = await this.demuxer!.getNextChunk();

      // console.log('get chunk')
      // console.log(chunk);
      if(!chunk){
        this.overaudio = true; 
      }
      else{ 
        chunkCount++;
        console.log('chunk data count');
        console.log(chunkCount);
        this.decoder!.decode(chunk);
      }
    }
    // this.fillInProgress = false;
    this.fillInProgress = false;

    if(!this.overaudio && this.encoder!.encodeQueueSize === 0)
      setTimeout(this.fillDataBuffer.bind(this), 0);




  }

  audioDataFull(){
    return this.encoder!.encodeQueueSize >= ENCODER_QUEUE_SIZE_MAX;
  }


  //这一步是audioDecoder的回调，通过观察控制台输出结果，可以确定的是audio data 和 getNextChunk得到的chunk是一一对应的。
  bufferAudioData(frame: AudioData) {
    frameCount++;
        //暂时去掉
    // console.log('audio data count');
    // console.log(framecount);

    // console.log('audio frame')
    // console.log(frame)
    
    debugLog(`bufferFrame(${frame.timestamp})`);
    // frameCount ++;
    console.log(frameCount);
    this.encoder!.encode(frame);
    //这里注释了，为了暂停bufferframe
    // this.fillFrameBuffer();
    frame.close();
    // this.frameBuffer.push(frame);
  }



  //这是自己写的encoder的回调，完成encode的过程后会自动给主线程发送信息
  async consumeAudioData(chunk: EncodedAudioChunk) {

    const data = new ArrayBuffer(chunk.byteLength);
    chunk.copyTo(data);
    //这里是有插件冲突，报错：(message: any, targetOrigin: string, transfer?: Transferable[] | undefined)
    self.postMessage({
      type: 'audio-data',
      timestamp: chunk.timestamp,
      duration: chunk.duration,
      is_key: true,
      data
        //@ts-ignore
    }, [data])

    await this.lock!.status;
    this.lock!.lock();
    rechunkCount++;
    this.lock!.unlock();

        //暂时去掉
        console.log('rechunk count');
        console.log(rechunkCount)

    if(!this.overaudio && this.encoder!.encodeQueueSize === 0)
        this.fillDataBuffer();
    if(this.encoder!.encodeQueueSize === 0 && this.decoder!.decodeQueueSize === 0){
      if(rechunkCount === 10576){
        self.postMessage({type: 'exit'})
        console.log('current audio')
        console.log('post exit message to self...')
      }
    }
  }

}
