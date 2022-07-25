import type { Worker as NodeWorker } from "worker_threads";

export function getWorker(script:string, messageCb:(...args:any) => void) {
    return getNodeWorker(script, messageCb) || getBrowserWorker(script, messageCb);
}
function getNodeWorker(script:string, messageCb:(...args:any) => void) {
    try {
        const Worker = require("worker_threads").Worker as typeof NodeWorker;
        let worker = new Worker(script, {
            eval: true
        });
        worker.on("message", messageCb);
        return worker;
    } catch (e) {}
}
function getBrowserWorker(script:string, messageCb:(...args:any) => void) {
    let blob = new Blob([script], {type: "text/javascript"});
    let worker = new Worker(URL.createObjectURL(blob));
    worker.addEventListener("message", event => {
        messageCb(event.data);
    });
    return worker;
}