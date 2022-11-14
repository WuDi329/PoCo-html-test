export class SampleLock{
    callback: null | ((value: boolean | PromiseLike<boolean>) => void);
    status: Promise<boolean>;
    lock: () => void;
    unlock: () => void;
    constructor(){
      this.callback = null;
      this.status = new Promise((resolve) => resolve(true));
      this.lock = function(){
        this.status = new Promise((resolve) => {this.callback = resolve})
        // console.log('locked')
      }
      this.unlock = function(){
        if(this.callback)
        this.callback(true)
      }
    }
  }