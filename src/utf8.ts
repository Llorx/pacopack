if (typeof performance === "undefined") {
    performance = require("perf_hooks").performance;
}

export default class UTF8 {
    static MAX_1BYTE_UTF8 = 256 / 4;
    static BYTELENGTH_MAX = 24;
    static TO_STRING_MAX = 24;
    static TO_STRING_FUNCS_MAX = 54;
    static TO_BUFFER_MAX = 54;
    static optimize(ms = 300) {
        optimizeStrings(ms);
    }
    static byteLength(str:string) {
        let s = str.length;
        for (let i = str.length-1; i >= 0; i--) {
            let code = str.charCodeAt(i);
            if (code > 0x7f) {
                if (code < 0x800) {
                    s++;
                } else if (code < 0x10000) {
                    s += 2;
                }
                if (code >= 0xDC00 && code < 0xE000) {
                    i--;
                }
            }
        }
        return s;
    }
    static toBuffer(str:string, buffer:Buffer, offset:number) {
        if (str.length <= UTF8.TO_BUFFER_MAX) {
            return toBuffer(str, buffer, offset);
        }
        let size = buffer.write(str, offset);
        return {
            size: size,
            isQuad: true
        };
    }
    static toString(buffer:Buffer, offset:number, stringLength:number, bufferLength:number) {
        if (stringLength > UTF8.TO_STRING_FUNCS_MAX) {
            if (bufferLength <= UTF8.TO_STRING_MAX) {
                return toString(buffer, offset, offset + bufferLength);
            }
            return buffer.toString("utf8", offset, offset + bufferLength);
        }
        return funcs[stringLength](buffer, offset);
    }
}

const funcs:((buffer:Buffer, offset:number)=>string)[] = [];
function func(i:number) {
    let v = `v${i}`;
    return `let ${v} = buffer[offset++];
if (${v} >= 0x80) {
    if (${v} > 0xBF && ${v} < 0xE0) {
        ${v} = (${v} & 0x1F) << 6 | buffer[offset++] & 0x3F;
    } else {
        ${v} = (${v} & 0x0F) << 12 | (buffer[offset] & 0x3F) << 6 | buffer[offset + 1] & 0x3F;
        offset += 2;
    }
}`;
}
function getVars(i:number) {
    return new Array(i+1).fill(0).map((n, i) => `v${i}`).join(",");
}
function createFunction(fs:string[], i:number) {
    fs = fs.slice();
    fs.push(`return String.fromCharCode(${getVars(i)});`);
    return new Function("buffer", "offset", fs.join("\r\n")) as typeof funcs[0];
}
function fill_funcs() {
    let fs:string[] = [];
    funcs.push(() => "");
    for (let i = 0; i < UTF8.MAX_1BYTE_UTF8; i++) {
        fs.push(func(i));
        funcs.push(createFunction(fs, i));
    }
}
fill_funcs();

let codes = new Array(UTF8.TO_STRING_MAX * 4);
function toString(buffer:Buffer, offset:number, end:number) { // array of bytes
    let pos = 0;
    for (let i = offset; i < end; i++) {
        let value = buffer[i];
        if (value === 0xFF) {
            break;
        } else if (value < 0x80) {
            codes[pos++] = value;
        } else if (value > 0xBF && value < 0xE0) {
            codes[pos++] = (value & 0x1F) << 6 | buffer[i + 1] & 0x3F;
            i += 1;
        } else if (value > 0xDF && value < 0xF0) {
            codes[pos++] = (value & 0x0F) << 12 | (buffer[i + 1] & 0x3F) << 6 | buffer[i + 2] & 0x3F;
            i += 2;
        } else {
            let charCode = ((value & 0x07) << 18 | (buffer[i + 1] & 0x3F) << 12 | (buffer[i + 2] & 0x3F) << 6 | buffer[i + 3] & 0x3F) - 0x010000;
            codes[pos++] = charCode >> 10 | 0xD800;
            codes[pos++] = charCode & 0x03FF | 0xDC00; 
            i += 3;
        }
    }
    return String.fromCharCode(...codes.slice(0, pos));
}
function toBuffer(str:string, buffer:Buffer, offset:number) {
    let quad = false;
    let start = offset;
    for (let i = 0; i < str.length; i++) {
        let charcode = buffer[offset++] = str.charCodeAt(i);
        if (charcode >= 0x80) {
            if (charcode < 0x800) {
                buffer[offset-1] = 0xc0 | (charcode >> 6);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                buffer[offset-1] = 0xe0 | (charcode >> 12);
                buffer[offset++] = 0x80 | ((charcode >> 6) & 0x3f);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            } else {
                i++;
                quad = true;
                charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                buffer[offset-1] = 0xf0 | (charcode >>18);
                buffer[offset++] = 0x80 | ((charcode>>12) & 0x3f);
                buffer[offset++] = 0x80 | ((charcode>>6) & 0x3f);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            }
        }
    }
    return { size: offset - start, isQuad: quad };
}

function iterationOtimizerLoop<T extends any[]>(cb:(...args:T) => void, ...args:T) {
    let totals = 0;
    let iterations = 25;
    for (let i = 0; i < 25; i++) {
        let t = performance.now();
        for (let ii = 0; ii < iterations; ii++) {
            cb(...args);
        }
        let dif = (performance.now() - t) / (iterations/25);
        if (!dif) {
            iterations *= 2;
            i--;
        } else {
            if (totals == 0) {
                totals = dif;
            } else {
                totals = (totals + dif) / 2;
            }
        }
    }
    return totals;
}
function iterationOtimizer<T extends any[]>(cb1:(...args:T) => void, cb2:(...args:T) => void, ...args:T):1|2 {
    let totals1 = iterationOtimizerLoop(cb1, ...args);
    let totals2 = iterationOtimizerLoop(cb2, ...args);
    return totals1 > totals2 ? 1 : 2;
}
function stringIterationOtimizer<T>(cbPrepare:(str:string) => T, cb1:(str:string, arg2:T) => void, cb2:(str:string, arg2:T) => void, ms:number, maxLength = Infinity) {
    let counter = 4;
    let totals = -1;
    let start = performance.now();
    while(true) {
        let str = Buffer.allocUnsafe(counter).fill(100).toString();
        let longer = iterationOtimizer(cb1, cb2, str, cbPrepare(str));
        if (longer === 2) {
            counter -= 4;
        }
        if (longer === 2 || counter >= maxLength) {
            if (totals == -1) {
                totals = counter;
            } else {
                totals = (totals + counter) / 2;
            }
            counter = 0;
        }
        counter += 4;
        if ((performance.now() - start > ms)) {
            break;
        }
    }
    return totals > -1 ? Math.round(totals) : Infinity;
}
function optimizeStrings(ms = 300) {
    ms /= 3;
    UTF8.BYTELENGTH_MAX = stringIterationOtimizer(() => {}, str => {
        Buffer.byteLength(str);
    }, str => {
        UTF8.byteLength(str);
    }, ms);
    UTF8.TO_STRING_MAX = stringIterationOtimizer(str => {
        return Buffer.from(str);
    }, (str, buffer) => {
        buffer.toString("utf8", 0);
    }, (str, buffer) => {
        toString(buffer, 0, buffer.length);
    }, ms);
    codes = new Array(UTF8.TO_STRING_MAX * 4);
    UTF8.TO_STRING_FUNCS_MAX = stringIterationOtimizer(str => {
        return Buffer.from(str);
    }, (str, buffer) => {
        str.length <= UTF8.TO_STRING_MAX ? toString(buffer, 0, buffer.length) : buffer.toString("utf8", 0);
    }, (str, buffer) => {
        funcs[str.length-1](buffer, 0);
    }, ms, funcs.length);
    UTF8.TO_BUFFER_MAX = stringIterationOtimizer(str => {
        return Buffer.allocUnsafe(str.length * 4);
    }, (str, buffer) => {
        buffer.write(str, 0);
    }, (str, buffer) => {
        UTF8.toBuffer(str, buffer, 0);
    }, ms);
}