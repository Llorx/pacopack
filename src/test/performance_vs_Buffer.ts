import UTF8 from "../utf8";

let buffer = Buffer.allocUnsafe(128);

let emoji = "manolo";
let codes = new Array(1024);

const NEXT_BYTE = 0b10000000;
const BIT_MASK = 0b01111111;
const BIT_MASK_2 = (BIT_MASK << 7) + BIT_MASK;

const funcs2:((buffer:Buffer, offset:number)=>string)[] = [];
function func2(i:number) {
    let v = `v${i}`;
    return `let ${v} = buffer[offset++];
if (${v} > ${BIT_MASK}) {
    let cp2 = buffer[offset++];
    if (cp2 > ${BIT_MASK}) {
        ${v} = (${v} ^ ${NEXT_BYTE}) + ((cp2 ^ ${NEXT_BYTE}) << 7) + (buffer[offset++] << 14);
    } else {
        ${v} = (${v} ^ ${NEXT_BYTE}) + (cp2 << 7);
    }
}`;
}
function getVars2(i:number) {
    return new Array(i+1).fill(0).map((n, i) => `v${i}`).join(",");
}
function createFunction2(fs:string[], i:number) {
    fs = fs.slice();
    fs.push(`return String.fromCodePoint(${getVars2(i)});`);
    return new Function("buffer", "offset", fs.join("\r\n")) as typeof funcs2[0];
}
function fill_funcs2() {
    let fs:string[] = [];
    for (let i = 0; i < 0xFF; i++) {
        fs.push(func2(i));
        funcs2.push(createFunction2(fs, i));
    }
}
fill_funcs2();

function toCodePointBuffer(str:string, buffer:Buffer, offset:number) {
    let length = str.length;
    for (let i = 0; i < length; i++) {
        let cp = str.charCodeAt(i);
        if (cp > BIT_MASK) {
            if (cp >= 0xD800 && cp <= 0xDBFF) {
                let cp2 = str.charCodeAt(i + 1);
                if (cp2 >= 0xDC00 && cp2 <= 0xDFFF) {
                    i++;
                    cp = (cp - 0xD800) * 0x400 + cp2 - 0xDC00 + 0x10000;
                }
            }
            buffer[offset++] = cp | NEXT_BYTE;
            if (cp > BIT_MASK_2) {
                buffer[offset++] = (cp >> 7) | NEXT_BYTE;
                buffer[offset++] = cp >> 14;
                i++;
            } else {
                buffer[offset++] = cp >> 7;
            }
        } else {
            buffer[offset++] = cp
        }
    }
    return offset;
}
function fromCodePointBuffer(buffer:Buffer, length:number, offset:number) {
    let pos = 0;
    let end = length + offset;
    for (let i = offset; i < end; i++) {
        let cp = buffer[i];
        if (cp > BIT_MASK) {
            let cp2 = buffer[++i];
            if (cp2 > BIT_MASK) {
                cp = (cp ^ NEXT_BYTE) + ((cp2 ^ NEXT_BYTE) << 7) + (buffer[++i] << 14);
            } else {
                cp = (cp ^ NEXT_BYTE) + (cp2 << 7);
            }
        }
        codes[pos++] = cp;
    }
    return String.fromCodePoint(...codes.slice(0, pos));
}

console.time("buffer.write");
for (let i = 0; i < 10000000; i++) {
    let s = buffer.write(emoji);
    buffer[s] = 0xFF;
}
console.timeEnd("buffer.write");
console.time("UTF8.toBuffer");
for (let i = 0; i < 10000000; i++) {
    let s = UTF8.toBuffer(emoji, buffer, 0);
}
console.timeEnd("UTF8.toBuffer");
console.time("toCodePointBuffer");
for (let i = 0; i < 10000000; i++) {
    let s = toCodePointBuffer(emoji, buffer, 0);
}
console.timeEnd("toCodePointBuffer");
let s = UTF8.toBuffer(emoji, buffer, 0);
console.time("buffer.toString");
for (let i = 0; i < 10000000; i++) {
    buffer.toString("utf8", 0, s.size);
}
console.timeEnd("buffer.toString");
console.time("UTF8.toString");
for (let i = 0; i < 10000000; i++) {
    UTF8.toString(buffer, 0, emoji.length, buffer.length);
}
console.timeEnd("UTF8.toString");
let s2 = toCodePointBuffer(emoji, buffer, 0);
console.time("fromCodePointBuffer");
for (let i = 0; i < 10000000; i++) {
    fromCodePointBuffer(buffer, s2, 0);
}
console.timeEnd("fromCodePointBuffer");
console.time("fromCodePointgenerator");
for (let i = 0; i < 10000000; i++) {
    funcs2[emoji.length-1](buffer, 0);
}
console.timeEnd("fromCodePointgenerator");