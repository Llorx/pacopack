import { performance } from 'perf_hooks';

class UTF8 {
    static MAX_1BYTE_UTF8 = 256 / 4;
    static BYTELENGTH_MAX = 24;
    static TO_STRING_MAX = 24;
    static TO_STRING_FUNCS_MAX = 54;
    static TO_BUFFER_MAX = 54;
    static optimize(ms = 300) {
        optimizeStrings(ms);
    }
    static byteLength(str) {
        return byteLength(str);
    }
    static toBuffer(str, buffer, offset) {
        if (str.length <= UTF8.TO_BUFFER_MAX) {
            return toBuffer(str, buffer, offset);
        }
        let size = buffer.write(str, offset);
        return {
            size: size,
            isQuad: true
        };
    }
    static toString(buffer, offset, stringLength, bufferLength, isQuad) {
        if (isQuad || stringLength > UTF8.TO_STRING_FUNCS_MAX) {
            if (stringLength <= UTF8.TO_STRING_MAX) {
                return toString(buffer, offset, offset + bufferLength);
            }
            return buffer.toString("utf8", offset, offset + bufferLength);
        }
        return funcs[stringLength](buffer, offset);
    }
}
const funcs = [];
function func(i) {
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
function getVars(i) {
    return new Array(i + 1).fill(0).map((n, i) => `v${i}`).join(",");
}
function createFunction(fs, i) {
    fs = fs.slice();
    fs.push(`return String.fromCharCode(${getVars(i)});`);
    return new Function("buffer", "offset", fs.join("\r\n"));
}
function fill_funcs() {
    let fs = [];
    funcs.push(() => "");
    for (let i = 0; i < UTF8.MAX_1BYTE_UTF8; i++) {
        fs.push(func(i));
        funcs.push(createFunction(fs, i));
    }
}
fill_funcs();
let codes = new Array(UTF8.TO_STRING_MAX * 4);
function toString(buffer, offset, end) {
    let pos = 0;
    for (let i = offset; i < end; i++) {
        let value = buffer[i];
        if (value === 0xFF) {
            break;
        }
        else if (value < 0x80) {
            codes[pos++] = value;
        }
        else if (value > 0xBF && value < 0xE0) {
            codes[pos++] = (value & 0x1F) << 6 | buffer[i + 1] & 0x3F;
            i += 1;
        }
        else if (value > 0xDF && value < 0xF0) {
            codes[pos++] = (value & 0x0F) << 12 | (buffer[i + 1] & 0x3F) << 6 | buffer[i + 2] & 0x3F;
            i += 2;
        }
        else {
            let charCode = ((value & 0x07) << 18 | (buffer[i + 1] & 0x3F) << 12 | (buffer[i + 2] & 0x3F) << 6 | buffer[i + 3] & 0x3F) - 0x010000;
            codes[pos++] = charCode >> 10 | 0xD800;
            codes[pos++] = charCode & 0x03FF | 0xDC00;
            i += 3;
        }
    }
    return String.fromCharCode(...codes.slice(0, pos));
}
function toBuffer(str, buffer, offset) {
    let quad = false;
    let start = offset;
    for (let i = 0; i < str.length; i++) {
        let charcode = buffer[offset++] = str.charCodeAt(i);
        if (charcode >= 0x80) {
            if (charcode < 0x800) {
                buffer[offset - 1] = 0xc0 | (charcode >> 6);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                buffer[offset - 1] = 0xe0 | (charcode >> 12);
                buffer[offset++] = 0x80 | ((charcode >> 6) & 0x3f);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            }
            else {
                i++;
                quad = true;
                charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                buffer[offset - 1] = 0xf0 | (charcode >> 18);
                buffer[offset++] = 0x80 | ((charcode >> 12) & 0x3f);
                buffer[offset++] = 0x80 | ((charcode >> 6) & 0x3f);
                buffer[offset++] = 0x80 | (charcode & 0x3f);
            }
        }
    }
    return { size: offset - start, isQuad: quad };
}
function byteLength(str) {
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
        let code = str.charCodeAt(i);
        if (code > 0x7f) {
            if (code < 0x800) {
                s++;
            }
            else if (code < 0x10000) {
                s += 2;
            }
            if (code >= 0xDC00 && code < 0xE000) {
                i--;
            }
        }
    }
    return s;
}
function iterationOtimizerLoop(cb, ...args) {
    let totals = 0;
    let iterations = 25;
    for (let i = 0; i < 25; i++) {
        let t = performance.now();
        for (let ii = 0; ii < iterations; ii++) {
            cb(...args);
        }
        let dif = (performance.now() - t) / (iterations / 25);
        if (!dif) {
            iterations *= 2;
            i--;
        }
        else {
            if (totals == 0) {
                totals = dif;
            }
            else {
                totals = (totals + dif) / 2;
            }
        }
    }
    return totals;
}
function iterationOtimizer(cb1, cb2, ...args) {
    let totals1 = iterationOtimizerLoop(cb1, ...args);
    let totals2 = iterationOtimizerLoop(cb2, ...args);
    return totals1 > totals2 ? 1 : 2;
}
function stringIterationOtimizer(cbPrepare, cb1, cb2, ms, maxLength = Infinity) {
    let counter = 4;
    let totals = -1;
    let start = performance.now();
    while (true) {
        let str = Buffer.allocUnsafe(counter).fill(100).toString();
        let longer = iterationOtimizer(cb1, cb2, str, cbPrepare(str));
        if (longer === 2) {
            counter -= 4;
        }
        if (longer === 2 || counter >= maxLength) {
            if (totals == -1) {
                totals = counter;
            }
            else {
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
    UTF8.BYTELENGTH_MAX = stringIterationOtimizer(() => { }, str => {
        Buffer.byteLength(str);
    }, str => {
        byteLength(str);
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
        funcs[str.length - 1](buffer, 0);
    }, ms, funcs.length);
    UTF8.TO_BUFFER_MAX = stringIterationOtimizer(str => {
        return Buffer.allocUnsafe(str.length * 4);
    }, (str, buffer) => {
        buffer.write(str, 0);
    }, (str, buffer) => {
        UTF8.toBuffer(str, buffer, 0);
    }, ms);
}

const NUMBER = Symbol();
class PacoPack {
    toJSON;
    static _B64 = 18446744073709551615n;
    _buffer = Buffer.allocUnsafe(0);
    _dataView = new DataView(this._buffer.buffer);
    _bufferArray = [];
    _totalBuffer = 0;
    _pos = 0;
    _size = 0;
    _strIndex = 0;
    _strMap = {};
    _dirtyStringMap = true;
    _receiveStrMap = {};
    _receiveStrMapIndex = 0;
    _receivePos = 0;
    dictionary = null;
    options = {
        step: 512
    };
    constructor(options, dictionary, toJSON) {
        this.toJSON = toJSON;
        options && this.setOptions(options);
        if (dictionary) {
            this._setDictionary(dictionary);
            this.resetStringMap();
            this._resetReceiveStringMap();
        }
    }
    static _BigInt64BlocksCount(n) {
        let count = 0;
        while (n > 0n) {
            n = n >> 64n;
            count++;
        }
        return count;
    }
    static _WriteBigUint(buffer, offset, n) {
        while (n > 0n) {
            let f64 = n & this._B64;
            n = n >> 64n;
            buffer.writeBigUInt64LE(f64, offset);
            offset += 8;
        }
    }
    static _WriteBigUintDataView(dataView, offset, n) {
        while (n > 0n) {
            let f64 = n & this._B64;
            n = n >> 64n;
            dataView.setBigUint64(offset, f64, true);
            offset += 8;
        }
    }
    static _ReadBigUint(buffer, offset, blocks) {
        let n = 0n;
        let count = 0n;
        let blocksb = BigInt(blocks);
        while (count < blocksb) {
            let b = buffer.readBigUInt64LE(offset);
            offset += 8;
            n += b << (64n * count);
            count++;
        }
        return n;
    }
    static OptimizeStrings(ms = 300) {
        UTF8.optimize(ms);
        return UTF8;
    }
    _setDictionary(dictionary) {
        if (Array.isArray(dictionary)) {
            let dicObj = {
                words: {},
                total: dictionary.length,
                dictionary: {}
            };
            for (let i = 0; i < dictionary.length; i++) {
                let w = dictionary[i];
                dicObj.words[w] = { [NUMBER]: i };
                dicObj.dictionary[i] = dictionary[i];
            }
            dictionary = dicObj;
        }
        return this.dictionary = dictionary;
    }
    _resetReceiveStringMap() {
        if (this.dictionary) {
            this._receiveStrMap = { ...this.dictionary.dictionary };
            this._receiveStrMapIndex = this.dictionary.total;
        }
        else {
            this._receiveStrMap = {};
            this._receiveStrMapIndex = 0;
        }
    }
    _read(buffer) {
        let opcode = buffer[this._receivePos++];
        if ((opcode & 128) === 128) {
            let bytes = opcode & 7;
            let n = 0;
            switch (bytes) {
                case 1: {
                    n = buffer[this._receivePos++];
                    break;
                }
                case 2: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8);
                    this._receivePos += 2;
                    break;
                }
                case 3: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16);
                    this._receivePos += 3;
                    break;
                }
                case 4: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0);
                    this._receivePos += 4;
                    break;
                }
                case 5: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0) + (0x100000000 * buffer[this._receivePos + 4]);
                    this._receivePos += 5;
                    break;
                }
                case 6: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0) + (0x100000000 * (buffer[this._receivePos + 4] + (buffer[this._receivePos + 5] << 8)));
                    this._receivePos += 6;
                    break;
                }
                case 7: {
                    n = buffer.readDoubleLE(this._receivePos);
                    this._receivePos += 8;
                    break;
                }
            }
            let type = opcode & 240;
            switch (type) {
                case 144: {
                    return this._receiveStrMap[n];
                }
                case 224: {
                    return buffer.toString("utf8", this._receivePos, this._receivePos += n);
                }
                case 240: {
                    return (this._receiveStrMap[this._receiveStrMapIndex++] = buffer.toString("utf8", this._receivePos, this._receivePos += n));
                }
                case 128: {
                    return ((opcode & 8) === 8 ? -n : n);
                }
                case 192: {
                    return BigInt((opcode & 8) === 8 ? -n : n);
                }
                case 160: {
                    let blocks = buffer[this._receivePos];
                    let r = PacoPack._ReadBigUint(buffer, this._receivePos + 1, blocks);
                    this._receivePos += 1 + (blocks * 8);
                    return ((opcode & 8) === 8 ? -r : r);
                }
                case 208: {
                    return new Date(n);
                }
                case 176: {
                    return buffer.slice(this._receivePos, this._receivePos += n);
                }
            }
        }
        else {
            switch (opcode) {
                case 14: {
                    let size = buffer[this._receivePos];
                    let n = buffer[this._receivePos + 1];
                    let isQuad = size & 128;
                    size &= 127;
                    const str = UTF8.toString(buffer, this._receivePos + 2, size, n, isQuad);
                    this._receivePos += 2 + n;
                    return str;
                }
                case 13: {
                    let size = buffer[this._receivePos];
                    let n = buffer[this._receivePos + 1];
                    let isQuad = size & 128;
                    size &= 127;
                    const str = this._receiveStrMap[this._receiveStrMapIndex++] = UTF8.toString(buffer, this._receivePos + 2, size, n, isQuad);
                    this._receivePos += 2 + n;
                    return str;
                }
                case 0: {
                    return null;
                }
                case 1: {
                    return undefined;
                }
                case 2: {
                    return true;
                }
                case 3: {
                    return false;
                }
                case 15: {
                    let r = this._read(buffer);
                    let flags = buffer[this._receivePos++];
                    let f = flags & 1 ? "g" : "";
                    if (flags & 2) {
                        f += "m";
                    }
                    if (flags & 4) {
                        f += "s";
                    }
                    if (flags & 8) {
                        f += "i";
                    }
                    if (flags & 16) {
                        f += "u";
                    }
                    return new RegExp(r, f);
                }
                case 4: {
                    let arr = [];
                    while (buffer[this._receivePos] !== 5) {
                        arr.push(this._read(buffer));
                    }
                    this._receivePos++;
                    return arr;
                }
                case 6: {
                    let obj = {};
                    while (buffer[this._receivePos] !== 7) {
                        let k = this._read(buffer);
                        obj[k] = this._read(buffer);
                    }
                    this._receivePos++;
                    return obj;
                }
                case 10: {
                    let set = new Set();
                    while (buffer[this._receivePos] !== 11) {
                        set.add(this._read(buffer));
                    }
                    this._receivePos++;
                    return set;
                }
                case 8: {
                    let map = new Map();
                    while (buffer[this._receivePos] !== 9) {
                        let k = this._read(buffer);
                        map.set(k, this._read(buffer));
                    }
                    this._receivePos++;
                    return map;
                }
            }
        }
        throw new Error("Invalid buffer");
    }
    _write(d) {
        switch (typeof d) {
            case "object": {
                if (d === null) {
                    this._checkSize(1);
                    this._buffer[this._pos++] = 0;
                }
                else if (d instanceof Uint8Array) {
                    this._writeInteger(d.length, 176, 0);
                    this._slice();
                    this._bufferArray.push(d);
                    this._totalBuffer += d.length;
                }
                else if (Array.isArray(d)) {
                    this._checkSize(2 + (d.length * 2));
                    this._buffer[this._pos++] = 4;
                    for (let v of d) {
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = 5;
                }
                else if (d instanceof Set) {
                    this._checkSize(2 + (d.size * 2));
                    this._buffer[this._pos++] = 10;
                    for (let v of d) {
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = 11;
                }
                else if (d instanceof Map) {
                    this._checkSize(2 + (d.size * 5));
                    this._buffer[this._pos++] = 8;
                    for (let [k, v] of d) {
                        this._write(k);
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = 9;
                }
                else if (d instanceof RegExp) {
                    this._checkSize(2 + d.source.length + d.flags.length);
                    this._buffer[this._pos++] = 15;
                    this._writeString(d.source, false);
                    this._checkSize(1);
                    this._buffer[this._pos++] = (d.global * 1) + (d.multiline * 2) + (d.dotAll * 4) + (d.ignoreCase * 8) + (d.unicode * 16);
                }
                else if (d instanceof Date) {
                    this._writeInteger(d.getTime(), 208, 0);
                }
                else {
                    if (this.toJSON && typeof d.toJSON === "function") {
                        this._write(d.toJSON());
                    }
                    else {
                        if (this.options.sortKeys) {
                            let keys = Object.keys(d);
                            keys.sort();
                            this._checkSize(2 + (keys.length * 5));
                            this._buffer[this._pos++] = 6;
                            for (let k of keys) {
                                this._writeString(k, true);
                                this._write(d[k]);
                            }
                        }
                        else {
                            this._checkSize(2);
                            this._buffer[this._pos++] = 6;
                            for (let k in d) {
                                this._writeString(k, true);
                                this._write(d[k]);
                            }
                        }
                        this._checkSize(1);
                        this._buffer[this._pos++] = 7;
                    }
                }
                break;
            }
            case "string": {
                this._writeString(d, false);
                break;
            }
            case "number": {
                let negativeFlag = 0;
                if (d < 0) {
                    negativeFlag = 8;
                    d = -d;
                }
                if (Number.isInteger(d)) {
                    this._writeInteger(d, 128 + negativeFlag, 0);
                }
                else {
                    this._writeDouble(d, 128 + negativeFlag, 0);
                }
                break;
            }
            case "bigint": {
                let negativeFlag = 0;
                if (d < 0n) {
                    negativeFlag = 8;
                    d = -d;
                }
                if (d <= 0xffffffffffffn) {
                    this._writeInteger(Number(d), 192 + negativeFlag, 0);
                }
                else {
                    let blocks = PacoPack._BigInt64BlocksCount(d);
                    let bytecount = blocks * 8;
                    this._checkSize(2 + bytecount);
                    this._buffer[this._pos] = 160 + negativeFlag;
                    this._buffer[this._pos + 1] = blocks;
                    PacoPack._WriteBigUintDataView(this._dataView, this._pos + 2, d);
                    this._pos += 2 + bytecount;
                }
                break;
            }
            case "boolean": {
                this._checkSize(1);
                this._buffer[this._pos++] = d ? 2 : 3;
                break;
            }
            case "undefined": {
                this._checkSize(1);
                this._buffer[this._pos++] = 1;
                break;
            }
        }
    }
    _checkSize(bytes) {
        if (this._pos + bytes > this._size) {
            if (this._pos > 0) {
                this._bufferArray.push(this._buffer.slice(0, this._pos));
                this._totalBuffer += this._pos;
            }
            this._buffer = Buffer.allocUnsafe(this._size = Math.max(this.options.step, bytes));
            this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
            this._pos = 0;
        }
    }
    _slice() {
        if (this._pos > 0) {
            this._bufferArray.push(this._buffer.slice(0, this._pos));
            this._totalBuffer += this._pos;
        }
        this._buffer = Buffer.allocUnsafe(this._size = this.options.step);
        this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
        this._pos = 0;
    }
    _writeString(str, key) {
        let n = this._strMap[str];
        if (n && n[NUMBER] > -1) {
            this._writeInteger(n[NUMBER], 144, 0);
        }
        else if (str.length <= UTF8.MAX_1BYTE_UTF8) {
            let size = str.length;
            this._checkSize(3 + (size * 4));
            if (key) {
                this._strMap[str] = { [NUMBER]: this._strIndex++ };
                this._buffer[this._pos] = 13;
            }
            else {
                this._buffer[this._pos] = 14;
            }
            let res = UTF8.toBuffer(str, this._buffer, this._pos + 3);
            if (res.isQuad) {
                size += 128;
            }
            this._buffer[this._pos + 1] = size;
            this._buffer[this._pos + 2] = res.size;
            this._pos += 3 + res.size;
        }
        else {
            let size = UTF8.byteLength(str);
            if (key) {
                this._strMap[str] = { [NUMBER]: this._strIndex++ };
                this._writeInteger(size, 240, size);
            }
            else {
                this._writeInteger(size, 224, size);
            }
            this._buffer.write(str, this._pos);
            this._pos += size;
        }
    }
    _writeInteger(n, opcode, extrasize) {
        if (n === 0) {
            this._checkSize(1 + extrasize);
            this._buffer[this._pos++] = opcode;
        }
        else if (n <= 0xFF) {
            this._checkSize(2 + extrasize);
            this._buffer[this._pos] = opcode + 1;
            this._buffer[this._pos + 1] = n;
            this._pos += 2;
        }
        else if (n <= 0xFFFF) {
            this._checkSize(3 + extrasize);
            this._buffer[this._pos] = opcode + 2;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >> 8;
            this._pos += 3;
        }
        else if (n <= 0xFFFFFF) {
            this._checkSize(4 + extrasize);
            this._buffer[this._pos] = opcode + 3;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >> 8;
            this._buffer[this._pos + 3] = n >> 16;
            this._pos += 4;
        }
        else if (n <= 0xFFFFFFFF) {
            this._checkSize(5 + extrasize);
            this._buffer[this._pos] = opcode + 4;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            this._pos += 5;
        }
        else if (n <= 0xFFFFFFFFFF) {
            this._checkSize(6 + extrasize);
            this._buffer[this._pos] = opcode + 5;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            this._buffer[this._pos + 5] = n / 0x100000000;
            this._pos += 6;
        }
        else if (n <= 0xFFFFFFFFFFFF) {
            this._checkSize(7 + extrasize);
            this._buffer[this._pos] = opcode + 6;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            n = n / 0x100000000;
            this._buffer[this._pos + 5] = n;
            this._buffer[this._pos + 6] = n >> 8;
            this._pos += 7;
        }
        else {
            this._writeDouble(n, opcode, extrasize);
        }
    }
    _writeDouble(n, opcode, extrasize) {
        this._checkSize(9 + extrasize);
        this._buffer[this._pos] = opcode + 7;
        this._dataView.setFloat64(this._pos + 1, n, true);
        this._pos += 9;
    }
    _get(slice) {
        let buffer;
        if (this._bufferArray.length === 0) {
            buffer = this._buffer.slice(0, this._pos);
            if (!slice) {
                buffer = Buffer.from(buffer);
            }
        }
        else {
            if (this._pos > 0) {
                this._bufferArray.push(this._buffer.slice(0, this._pos));
                this._totalBuffer += this._pos;
            }
            buffer = Buffer.concat(this._bufferArray, this._totalBuffer);
            this._bufferArray = [];
            this._totalBuffer = 0;
        }
        return buffer;
    }
    resetStringMap() {
        if (this.dictionary) {
            this._strMap = Object.create(this.dictionary.words);
            this._strIndex = this.dictionary.total;
        }
        else {
            this._strMap = {};
            this._strIndex = 0;
        }
        this._dirtyStringMap = true;
    }
    setOptions(options) {
        this.options = { step: 512, ...options };
    }
    serialize(data, offset = 0, slice = false) {
        this._pos = offset;
        if (this._size === 0 || this._size < this._pos) {
            this._buffer = Buffer.allocUnsafe(this._size = this.options.step);
            this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
        }
        if (!this.options.mapKeys) {
            this.resetStringMap();
        }
        if (this._dirtyStringMap) {
            this._dirtyStringMap = false;
        }
        else {
            this._buffer[this._pos++] = 12;
        }
        this._write(data);
        return this._get(slice);
    }
    deserialize(buffer) {
        this._receivePos = 0;
        if (buffer[this._receivePos] !== 12) {
            this._resetReceiveStringMap();
        }
        else {
            this._receivePos++;
        }
        return this._read(buffer);
    }
}

export { PacoPack, UTF8 };
//# sourceMappingURL=pacopack.mjs.map
