import UTF8 from "./utf8";
export { UTF8 };

const enum REGEXP_FLAGS {
    g = 0b00000001,
    m = 0b00000010,
    s = 0b00000100,
    i = 0b00001000,
    u = 0b00010000
}
const enum OPCODES {
    null,
    undefined,
    true,
    false,
    array_start,
    array_end,
    object_start,
    object_end,
    map_start,
    map_end,
    set_start,
    set_end,
    string_map_do_not_reset,
    strkey_single,
    string_single,
    regexp,
    utf8_quad = 0b10000000,
    utf8_quad_reverse = 0b01111111,

    number      = 0b10000000, // 1 bit (number) + 3 bits (opcode) + 1 bit (negative) + 3 bits (bytes)
    bigint      = 0b11000000,
    full_bigint = 0b10100000,
    string      = 0b11100000,
    static      = 0b10010000,
    date        = 0b11010000,
    buffer      = 0b10110000,
    strkey      = 0b11110000,
}
const enum NUMBER_MASKS {
    OPCODE   = 0b11110000,
    NEGATIVE = 0b00001000,
    BYTES    = 0b00000111
}
const NUMBER = Symbol();

export type Dictionary = {
    words:{[key:string]:{[NUMBER:symbol]:number}};
    total:number;
    dictionary:{[index:number]:string};
};

type SerializableObject<TO_JSON extends boolean = false> = {[key:string]:Serializables<TO_JSON>};
export type Serializables<TO_JSON extends boolean = false> = boolean|string|number|bigint|RegExp|Date|undefined|Map<Serializables<TO_JSON>, Serializables<TO_JSON>>|Set<Serializables<TO_JSON>>|Buffer|Uint8Array|null|Serializables<TO_JSON>[]|(TO_JSON extends true ? SerializableObject<TO_JSON>|{toJSON?():Serializables<TO_JSON>} : SerializableObject<TO_JSON>);

export type PacoPackOptions = {
    step?:number;
    sortKeys?:boolean;
    mapKeys?:boolean;
};

export class PacoPack<TO_JSON extends boolean = false> {
    private static _B64 = 0b1111111111111111111111111111111111111111111111111111111111111111n;
    private _buffer = Buffer.allocUnsafe(0);
    private _dataView = new DataView(this._buffer.buffer);
    private _bufferArray:Uint8Array[] = [];
    private _totalBuffer = 0;
    private _pos = 0;
    private _size = 0;
    private _strIndex = 0;
    private _strMap:{[key:string]:{[NUMBER:symbol]:number}} = {};
    //private _strMap = new Map<string, number>();
    private _dirtyStringMap = true;
    private _receiveStrMap:{[index:number]:string} = {};
    //private _receiveStrMap = new Map<number, string>();
    private _receiveStrMapIndex = 0;
    private _receivePos = 0;
    dictionary:Dictionary|null = null;
    options:PacoPackOptions = {
        step: 512
    };
    constructor(options?:PacoPackOptions|null, dictionary?:string[]|Dictionary|null, readonly toJSON?:TO_JSON|null) {
        options && this.setOptions(options);
        if (dictionary) {
            this._setDictionary(dictionary);
            this.resetStringMap();
            this._resetReceiveStringMap();
        }
    }
    private static _BigInt64BlocksCount(n:bigint) {
        let count = 0;
        while(n > 0n) {
            n = n >> 64n;
            count++;
        }
        return count;
    }
    private static _WriteBigUint(buffer:Buffer, offset:number, n:bigint) {
        while(n > 0n) {
            let f64 = n & this._B64;
            n = n >> 64n;
            buffer.writeBigUInt64LE(f64, offset);
            offset += 8;
        }
    }
    private static _WriteBigUintDataView(dataView:DataView, offset:number, n:bigint) {
        while(n > 0n) {
            let f64 = n & this._B64;
            n = n >> 64n;
            dataView.setBigUint64(offset, f64, true);
            offset += 8;
        }
    }
    private static _ReadBigUint(buffer:Buffer, offset:number, blocks:number) {
        let n = 0n;
        let count = 0n;
        let blocksb = BigInt(blocks);
        while(count < blocksb) {
            let b = buffer.readBigUInt64LE(offset); // More performant using DataView. Create global DataView only if there's bigints to deserialize
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
    private _setDictionary(dictionary:string[]|Dictionary) {
        if (Array.isArray(dictionary)) {
            let dicObj:Dictionary = {
                words: {},
                total: dictionary.length,
                dictionary: {}
            };
            for (let i = 0; i < dictionary.length; i++) {
                let w = dictionary[i];
                dicObj.words[w] = {[NUMBER]:i};
                dicObj.dictionary[i] = dictionary[i];
            }
            dictionary = dicObj;
        }
        return this.dictionary = dictionary;
    }
    private _resetReceiveStringMap() {
        if (this.dictionary) {
            this._receiveStrMap = {...this.dictionary.dictionary}; // Numeric keys is better to spread than Object.create
            this._receiveStrMapIndex = this.dictionary.total;
        } else {
            this._receiveStrMap = {};
            this._receiveStrMapIndex = 0;
        }
    }
    private _read<T extends Serializables>(buffer:Buffer):T {
        let opcode = buffer[this._receivePos++];
        if ((opcode & OPCODES.number) === OPCODES.number) {
            let bytes = opcode & NUMBER_MASKS.BYTES;
            let n = 0;
            switch(bytes) {
                case 1: {
                    n = buffer[this._receivePos++];
                    break;
                }
                case 2: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8);
                    //n = buffer.readUInt16LE(this._receivePos);
                    this._receivePos += 2;
                    break;
                }
                case 3: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16);
                    //n = buffer.readUIntLE(this._receivePos, 3);
                    this._receivePos += 3;
                    break;
                }
                case 4: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0);
                    //n = buffer.readUInt32LE(this._receivePos);
                    this._receivePos += 4;
                    break;
                }
                case 5: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0) + (0x100000000 * buffer[this._receivePos + 4]);
                    //n = buffer.readUIntLE(this._receivePos, 5);
                    this._receivePos += 5;
                    break;
                }
                case 6: {
                    n = buffer[this._receivePos] + (buffer[this._receivePos + 1] << 8) + (buffer[this._receivePos + 2] << 16) + (buffer[this._receivePos + 3] << 24 >>> 0) + (0x100000000 * (buffer[this._receivePos + 4] + (buffer[this._receivePos + 5] << 8)));
                    //n = buffer.readUIntLE(this._receivePos, 6);
                    this._receivePos += 6;
                    break;
                }
                case 7: {
                    n = buffer.readDoubleLE(this._receivePos);
                    this._receivePos += 8;
                    break;
                }
            }
            let type = opcode & NUMBER_MASKS.OPCODE;
            switch (type) {
                case OPCODES.static: {
                    //return this._receiveStrMap.get(n) as T;
                    return this._receiveStrMap[n] as T;
                }
                case OPCODES.string: {
                    return buffer.toString("utf8", this._receivePos, this._receivePos += n) as T;
                }
                case OPCODES.strkey: {
                    /*let str = buffer.toString("utf8", this._receivePos, this._receivePos += n);
                    this._receiveStrMap.set(this._receiveStrMapIndex++, str);
                    return str as T;*/
                    return (this._receiveStrMap[this._receiveStrMapIndex++] = buffer.toString("utf8", this._receivePos, this._receivePos += n)) as T;
                }
                case OPCODES.number: {
                    return ((opcode & NUMBER_MASKS.NEGATIVE) === NUMBER_MASKS.NEGATIVE ? -n : n) as T; // Duplicated to avoid methods or checking negative when not needed
                }
                case OPCODES.bigint: {
                    return BigInt((opcode & NUMBER_MASKS.NEGATIVE) === NUMBER_MASKS.NEGATIVE ? -n : n) as T;
                }
                case OPCODES.full_bigint: {
                    let blocks = buffer[this._receivePos];
                    let r = PacoPack._ReadBigUint(buffer, this._receivePos + 1, blocks);
                    this._receivePos += 1 + (blocks * 8);
                    return ((opcode & NUMBER_MASKS.NEGATIVE) === NUMBER_MASKS.NEGATIVE ? -r : r) as T;
                }
                case OPCODES.date: {
                    return new Date(n) as T;
                }
                case OPCODES.buffer: {
                    return buffer.slice(this._receivePos, this._receivePos += n) as T;
                }
            }
        } else {
            switch (opcode) {
                case OPCODES.string_single: {
                    let size = buffer[this._receivePos];
                    let n = buffer[this._receivePos + 1];
                    let isQuad = size & OPCODES.utf8_quad;
                    size &= OPCODES.utf8_quad_reverse;
                    const str = UTF8.toString(buffer, this._receivePos + 2, size, n, isQuad);
                    this._receivePos += 2 + n;
                    return str as T;
                }
                case OPCODES.strkey_single: { // Almost duplicated to avoid branches
                    let size = buffer[this._receivePos];
                    let n = buffer[this._receivePos + 1];
                    let isQuad = size & OPCODES.utf8_quad;
                    size &= OPCODES.utf8_quad_reverse;
                    const str = this._receiveStrMap[this._receiveStrMapIndex++] = UTF8.toString(buffer, this._receivePos + 2, size, n, isQuad);
                    //this._receiveStrMap.set(this._receiveStrMapIndex++, str);
                    this._receivePos += 2 + n;
                    return str as T;
                }
                case OPCODES.null: {
                    return null as T;
                }
                case OPCODES.undefined: {
                    return undefined as T;
                }
                case OPCODES.true: {
                    return true as T;
                }
                case OPCODES.false: {
                    return false as T;
                }
                case OPCODES.regexp: {
                    let r = this._read<string>(buffer);
                    let flags = buffer[this._receivePos++];
                    let f = flags & REGEXP_FLAGS.g ? "g" : "";
                    if (flags & REGEXP_FLAGS.m) {
                        f += "m";
                    }
                    if (flags & REGEXP_FLAGS.s) {
                        f += "s";
                    }
                    if (flags & REGEXP_FLAGS.i) {
                        f += "i";
                    }
                    if (flags & REGEXP_FLAGS.u) {
                        f += "u";
                    }
                    return new RegExp(r, f) as T;
                }
                case OPCODES.array_start: {
                    let arr:Serializables[] = [];
                    while(buffer[this._receivePos] !== OPCODES.array_end) {
                        arr.push(this._read(buffer));
                    }
                    this._receivePos++;
                    return arr as T;
                }
                case OPCODES.object_start: {
                    let obj:{[key:string]:Serializables} = {};
                    while(buffer[this._receivePos] !== OPCODES.object_end) {
                        let k = this._read<string>(buffer);
                        obj[k] = this._read(buffer);
                    }
                    this._receivePos++;
                    return obj as T;
                }
                case OPCODES.set_start: {
                    let set = new Set<Serializables>();
                    while(buffer[this._receivePos] !== OPCODES.set_end) {
                        set.add(this._read(buffer));
                    }
                    this._receivePos++;
                    return set as T;
                }
                case OPCODES.map_start: {
                    let map = new Map<Serializables, Serializables>();
                    while(buffer[this._receivePos] !== OPCODES.map_end) {
                        let k = this._read(buffer);
                        map.set(k, this._read(buffer));
                    }
                    this._receivePos++;
                    return map as T;
                }
            }
        }
        throw new Error("Invalid buffer");
    }
    private _write(d:Serializables<TO_JSON>) {
        switch (typeof d) {
            case "object": {
                // Having a _writeObject had a small performance hit. Inlining it here.
                if (d === null) {
                    this._checkSize(1);
                    this._buffer[this._pos++] = OPCODES.null;
                } else if (d instanceof Uint8Array) {
                    this._writeInteger(d.length, OPCODES.buffer, 0);
                    this._slice();
                    this._bufferArray.push(d);
                    this._totalBuffer += d.length;
                } else if (Array.isArray(d)) {
                    this._checkSize(2 + (d.length * 2)); // Assume 2 bytes per element
                    this._buffer[this._pos++] = OPCODES.array_start;
                    for (let v of d) {
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = OPCODES.array_end;
                } else if (d instanceof Set) {
                    this._checkSize(2 + (d.size * 2)); // Assume 2 bytes per element
                    this._buffer[this._pos++] = OPCODES.set_start;
                    for (let v of d) {
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = OPCODES.set_end;
                } else if (d instanceof Map) {
                    this._checkSize(2 + (d.size * 5)); // Assume 5 bytes per element
                    this._buffer[this._pos++] = OPCODES.map_start;
                    for (let [k, v] of d) {
                        this._write(k);
                        this._write(v);
                    }
                    this._checkSize(1);
                    this._buffer[this._pos++] = OPCODES.map_end;
                } else if (d instanceof RegExp) {
                    this._checkSize(2 + d.source.length + d.flags.length);
                    this._buffer[this._pos++] = OPCODES.regexp;
                    this._writeString(d.source, false);
                    this._checkSize(1);
                    // "as any as number" to avoid explicitly converting to a number, as performance degrades 20x when doing so.
                    this._buffer[this._pos++] = (d.global as any as number * REGEXP_FLAGS.g) + (d.multiline as any as number * REGEXP_FLAGS.m) + (d.dotAll as any as number * REGEXP_FLAGS.s) + (d.ignoreCase as any as number * REGEXP_FLAGS.i) + (d.unicode as any as number * REGEXP_FLAGS.u);
                } else if (d instanceof Date) {
                    this._writeInteger(d.getTime(), OPCODES.date, 0);
                } else {
                    if (this.toJSON && typeof d.toJSON === "function") {
                        this._write(d.toJSON() as Serializables<TO_JSON>);
                    } else {
                        if (this.options.sortKeys) {
                            let keys = Object.keys(d);
                            keys.sort();
                            this._checkSize(2 + (keys.length * 5)); // Assume 5 bytes per element
                            this._buffer[this._pos++] = OPCODES.object_start;
                            for (let k of keys) {
                                this._writeString(k, true);
                                this._write((d as SerializableObject<TO_JSON>)[k]);
                            }
                        } else {
                            // Better performance
                            this._checkSize(2);
                            this._buffer[this._pos++] = OPCODES.object_start;
                            for (let k in d) {
                                this._writeString(k, true);
                                this._write((d as SerializableObject<TO_JSON>)[k]);
                            }
                        }
                        this._checkSize(1);
                        this._buffer[this._pos++] = OPCODES.object_end;
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
                    negativeFlag = NUMBER_MASKS.NEGATIVE;
                    d = -d;
                }
                if (Number.isInteger(d)) {
                    this._writeInteger(d, OPCODES.number + negativeFlag, 0);
                } else {
                    this._writeDouble(d, OPCODES.number + negativeFlag, 0);
                }
                break;
            }
            case "bigint": {
                let negativeFlag = 0;
                if (d < 0n) {
                    negativeFlag = NUMBER_MASKS.NEGATIVE;
                    d = -d;
                }
                if (d <= 0xFFFFFFFFFFFFn) {
                    this._writeInteger(Number(d), OPCODES.bigint + negativeFlag, 0);
                } else {
                    let blocks = PacoPack._BigInt64BlocksCount(d);
                    let bytecount = blocks * 8;
                    this._checkSize(2 + bytecount);
                    this._buffer[this._pos] = OPCODES.full_bigint + negativeFlag;
                    this._buffer[this._pos + 1] = blocks;
                    PacoPack._WriteBigUintDataView(this._dataView, this._pos + 2, d);
                    //PacoPack.WriteBigUint(this._buffer, this._pos + 2, d);
                    this._pos += 2 + bytecount;
                }
                break;
            }
            case "boolean": {
                this._checkSize(1);
                this._buffer[this._pos++] = d ? OPCODES.true : OPCODES.false;
                break;
            }
            case "undefined": {
                this._checkSize(1);
                this._buffer[this._pos++] = OPCODES.undefined;
                break;
            }
        }
    }
    private _checkSize(bytes:number) {
        if (this._pos + bytes > this._size) {
            if (this._pos > 0) {
                this._bufferArray.push(this._buffer.slice(0, this._pos));
                this._totalBuffer += this._pos;
            }
            this._buffer = Buffer.allocUnsafe(this._size = Math.max(this.options.step!, bytes));
            this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
            this._pos = 0;
        }
    }
    private _slice() {
        if (this._pos > 0) {
            this._bufferArray.push(this._buffer.slice(0, this._pos));
            this._totalBuffer += this._pos;
        }
        this._buffer = Buffer.allocUnsafe(this._size = this.options.step!);
        this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
        this._pos = 0;
    }
    private _writeString(str:string, key:boolean) {
        let n = this._strMap[str];
        if (n && n[NUMBER] > -1) { // Avoid hasOwnProperty/Map for performance reasons. On hit, obj is faster than Map.
            this._writeInteger(n[NUMBER], OPCODES.static, 0);
        } else if (str.length <= UTF8.MAX_1BYTE_UTF8) {
            let size = str.length;
            this._checkSize(3 + (size * 4));
            if (key) {
                this._strMap[str] = {[NUMBER]:this._strIndex++};
                this._buffer[this._pos] = OPCODES.strkey_single;
            } else {
                this._buffer[this._pos] = OPCODES.string_single;
            }
            let res = UTF8.toBuffer(str, this._buffer, this._pos + 3);
            if (res.isQuad) {
                size += OPCODES.utf8_quad;
            }
            this._buffer[this._pos + 1] = size;
            this._buffer[this._pos + 2] = res.size;
            this._pos += 3 + res.size;
        } else {
            let size = UTF8.byteLength(str);
            if (key) {
                this._strMap[str] = {[NUMBER]:this._strIndex++};
                this._writeInteger(size, OPCODES.strkey, size);
            } else {
                this._writeInteger(size, OPCODES.string, size);
            }
            this._buffer.write(str, this._pos);
            this._pos += size;
        }
    }
    private _writeInteger(n:number, opcode:number, extrasize:number) {
        if (n === 0) {
            this._checkSize(1 + extrasize);
            this._buffer[this._pos++] = opcode;
        } else if (n <= 0xFF) {
            this._checkSize(2 + extrasize);
            this._buffer[this._pos] = opcode + 1;
            this._buffer[this._pos + 1] = n;
            this._pos += 2;
        } else if (n <= 0xFFFF) {
            this._checkSize(3 + extrasize);
            this._buffer[this._pos] = opcode + 2;
            //this._buffer.writeUInt16LE(n, this._pos + 1);
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >> 8;
            //this._dataView.setUint16(this._pos + 1, n, true);
            this._pos += 3;
        } else if (n <= 0xFFFFFF) {
            this._checkSize(4 + extrasize);
            this._buffer[this._pos] = opcode + 3;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >> 8;
            this._buffer[this._pos + 3] = n >> 16;
            //this._buffer.writeUIntLE(n, this._pos + 1, 3);
            this._pos += 4;
        } else if (n <= 0xFFFFFFFF) {
            this._checkSize(5 + extrasize);
            this._buffer[this._pos] = opcode + 4;
            //this._dataView.setUint32(this._pos + 1, n, true);
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            //this._buffer.writeUInt32LE(n, this._pos + 1);
            this._pos += 5;
        } else if (n <= 0xFFFFFFFFFF) {
            this._checkSize(6 + extrasize);
            this._buffer[this._pos] = opcode + 5;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            this._buffer[this._pos + 5] = n / 0x100000000;
            //this._buffer.writeUIntLE(n, this._pos + 1, 5);
            this._pos += 6;
        } else if (n <= 0xFFFFFFFFFFFF) {
            this._checkSize(7 + extrasize);
            this._buffer[this._pos] = opcode + 6;
            this._buffer[this._pos + 1] = n;
            this._buffer[this._pos + 2] = n >>> 8;
            this._buffer[this._pos + 3] = n >>> 16;
            this._buffer[this._pos + 4] = n >>> 24;
            n = n / 0x100000000;
            this._buffer[this._pos + 5] = n;
            this._buffer[this._pos + 6] = n >> 8;
            //this._buffer.writeUIntLE(n, this._pos + 1, 6);
            this._pos += 7;
        } else {
            this._writeDouble(n, opcode, extrasize);
        }
    }
    private _writeDouble(n:number, opcode:number, extrasize:number) {
        this._checkSize(9 + extrasize);
        this._buffer[this._pos] = opcode + 7;
        this._dataView.setFloat64(this._pos + 1, n, true);
        //this._buffer.writeDoubleLE(n, this._pos + 1);
        this._pos += 9;
    }
    private _get(slice:boolean) {
        let buffer:Buffer;
        if (this._bufferArray.length === 0) {
            buffer = this._buffer.slice(0, this._pos);
            if (!slice) {
                buffer = Buffer.from(buffer);
            }
        } else {
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
        } else {
            this._strMap = {};
            this._strIndex = 0;
        }
        this._dirtyStringMap = true;
    }
    setOptions(options:PacoPackOptions) {
        this.options = {step: 512, ...options};
    }
    serialize(data:Serializables<TO_JSON>, offset = 0, slice = false) {
        this._pos = offset;
        if (this._size === 0 || this._size < this._pos) {
            this._buffer = Buffer.allocUnsafe(this._size = this.options.step!);
            this._dataView = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
        }
        if (!this.options.mapKeys) {
            this.resetStringMap();
        }
        if (this._dirtyStringMap) {
            this._dirtyStringMap = false;
        } else {
            this._buffer[this._pos++] = OPCODES.string_map_do_not_reset;
        }
        this._write(data);
        return this._get(slice);
    }
    deserialize(buffer:Buffer):unknown {
        this._receivePos = 0;
        if (buffer[this._receivePos] !== OPCODES.string_map_do_not_reset) {
            this._resetReceiveStringMap();
        } else {
            this._receivePos++;
        }
        return this._read(buffer);
    }
}