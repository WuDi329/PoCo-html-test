
self.addEventListener('message', async function(e: MessageEvent) {
    // await modulesReady;
    const type = e.data.type;
    switch(type){
      case 'hello':
        console.log(e.data.msg);
        self.postMessage('lalalalal i am a')
      break;
      default:
      break;
    }
  })

export function logworker(){
    console.log('log : worker')
}