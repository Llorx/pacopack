const functions = {
    8: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0];
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUint8(0);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint8(0);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUint8(v, 0);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint8(0, v);
            }
        }
    },
    16: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0] + (buf[1] << 8);
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUint16LE(0);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint16(0, true);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
                buf[1] = v >> 8;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUint16LE(v, 0);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint16(0, v, true);
            }
        }
    },
    24: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0] + (buf[1] << 8) + (buf[2] << 16);
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUintLE(0, 3);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint16(0, true) + dv.getUint8(2);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUintLE(v, 0, 3);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint16(0, v, true);
                dv.setUint8(2, v >> 16);
            }
        }
    },
    32: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24 >>> 0);
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUint32LE(0);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint32(0, true);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
                buf[3] = v >>> 24;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUint32LE(v, 0);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint32(0, v, true);
            }
        }
    },
    40: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24 >>> 0) + (0x100000000 * buf[4]);
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUintLE(0, 5);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint32(0, true) + (dv.getUint8(4) * 0x100000000);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
                buf[3] = v >>> 24;
                buf[4] = v / 0x100000000;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUintLE(v, 0, 5);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint32(0, v, true);
                dv.setUint8(4, v / 0x100000000);
            }
        }
    },
    48: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24 >>> 0) + (0x100000000 * (buf[4] + (buf[5] << 8)));
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readUintLE(0, 6);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint32(0, true) + (dv.getUint16(4, true) * 0x100000000);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
                buf[3] = v >>> 24;
                v = v / 0x100000000;
                buf[4] = v;
                buf[5] = v >> 8;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeUintLE(v, 0, 6);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint32(0, v, true);
                dv.setUint16(4, v / 0x100000000, true);
            }
        }
    },
    56: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                // probably bad
                return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24 >>> 0) + (0x100000000 * (buf[4] + (buf[5] << 8) + (buf[6] << 16)));
            },
            native: function(dv:DataView, buf:Buffer) {
                //return buf.readUintLE(0, 7); // 8 is not implemented
                return 0;
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getUint32(0, true) + (0x100000000 * (dv.getUint16(4, true) + (dv.getUint8(6) << 16)));
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                // probably bad
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
                buf[3] = v >>> 24;
                v = v / 0x100000000;
                buf[4] = v;
                buf[5] = v >> 8;
                buf[6] = v >> 16;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                //buf.writeUintLE(v, 0, 7); // 7 is not implemented
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setUint32(0, v, true);
                v = v / 0x100000000;
                dv.setUint16(4, v, true);
                dv.setUint8(6, v >> 16);
            }
        }
    },
    64: {
        read: {
            bitwise: function(dv:DataView, buf:Buffer) {
                 // Probably bad
                return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24 >>> 0) + (0x100000000 * (buf[4] + (buf[5] << 8) + (buf[6] << 16) + (buf[6] << 24 >> 0)));
            },
            native: function(dv:DataView, buf:Buffer) {
                return buf.readDoubleLE(0);
            },
            dataview: function(dv:DataView, buf:Buffer) {
                return dv.getFloat64(0, true);
            }
        },
        write: {
            bitwise: function(dv:DataView, buf:Buffer, v:number) {
                 // Probably bad
                buf[0] = v;
                buf[1] = v >> 8;
                buf[2] = v >> 16;
                buf[3] = v >>> 24;
                v = v / 0x100000000;
                buf[4] = v;
                buf[5] = v >> 8;
                buf[6] = v >> 16;
                buf[7] = v >>> 24;
            },
            native: function(dv:DataView, buf:Buffer, v:number) {
                buf.writeDoubleLE(v, 0);
            },
            dataview: function(dv:DataView, buf:Buffer, v:number) {
                dv.setFloat64(0, v, true);
            }
        }
    }
} as const;

const valuessize = 1000000;
const valuesmultiplier = 1000;
let bits:8|16|24|32|40|48|56|64;
let values:number[];
let type:"bitwise"|"native"|"dataview";
let wf:(dv:DataView, buf:Buffer, v:number) => void;
let rf:(dv:DataView, buf:Buffer) => number;
let buf:Buffer;
let dv:DataView;

bits = 8;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 16;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 24;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 32;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 40;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 48;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 56;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);

bits = 64;
console.log("- Write", bits, "bits");
values = [];
for (let i = 0; i < valuessize; i++) {
    values.push(Math.floor(Math.random()*Math.pow(2, bits)));
}
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "native";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);
type = "dataview";
wf = functions[bits].write[type];
console.time("write" + bits + type);
for (let i = 0; i < values.length*valuesmultiplier; i++) {
    wf(dv, buf, values[i % values.length]);
}
console.timeEnd("write" + bits + type);



console.log(" ### ");



bits = 8;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 16;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 24;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 32;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 40;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 48;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 56;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);

bits = 64;
console.log("- Read", bits, "bits");
buf = Buffer.allocUnsafe(bits/8);
dv = new DataView(new ArrayBuffer(bits/8));
for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random()*0x100);
    dv.setUint8(i, Math.floor(Math.random()*0x100));
}
type = "bitwise";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "native";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);
type = "dataview";
rf = functions[bits].read[type];
console.time("read" + bits + type);
for (let i = 0; i < valuessize*valuesmultiplier; i++) {
    rf(dv, buf);
}
console.timeEnd("read" + bits + type);