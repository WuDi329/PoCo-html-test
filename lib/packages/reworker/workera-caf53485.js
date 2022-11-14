self.addEventListener('message', async function (e) {
    const type = e.data.type;
    switch (type) {
        case 'hello':
            console.log(e.data.msg);
            self.postMessage('lalalalal i am a');
            break;
    }
});
function logworker() {
    console.log('log : worker');
}

export { logworker };
//# sourceMappingURL=workera-caf53485.js.map
