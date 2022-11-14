
const worker = new Worker(new URL("worker/workera.ts", import.meta.url), {
    type: "module"
  });

export function lallala(){
    console.log(12313123);
}

function startworker(){
    worker.postMessage({type: 'hello', msg: 'world'});
}

worker.onmessage = ev => {
    console.log(ev.data);
}

startworker();