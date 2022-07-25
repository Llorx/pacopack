import type * as worker_threads from "worker_threads";

function worker() {
    function onMessage(cb:(...args:any) => void) {
        return onNodeMessage(cb) || onBrowserMessage(cb);
    }
    function onNodeMessage(cb:(...args:any) => void) {
        try {
            const { parentPort } = require("worker_threads") as typeof worker_threads;
            if (parentPort) {
                parentPort.on("message", cb);
                return parentPort;
            }
        } catch (e) {}
        return false;
    }
    function onBrowserMessage(cb:(...args:any) => void) {
        self.addEventListener("message", event => {
            cb(event.data);
        });
        return self;
    }
    const parent = onMessage(event => {
        console.log(event);
        parent.postMessage("testreturn");
    });
}
function getFunction() {
    let str = worker.toString();
    let index1 = str.indexOf("{");
    let index2 = str.lastIndexOf("}");
    return str.substring(index1 + 1, index2);
}

export default getFunction();