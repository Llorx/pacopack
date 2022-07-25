import { PacoPack } from "..";


let pacopack = new PacoPack({});

let obj = {
    juan: {
        pepe: {
            manolo: {
                juan: 1.1
            }
        }
    }
};

function flag(flag:number) {
    if (flag & 0b10) {
        return true;
    }
    return false;
}
function objectFlag(obj:{flag:number}) {
    if (obj.flag & 0b10) {
        return true;
    }
    return false;
}
function object(obj:{options:{flag:boolean}}) {
    if (obj.options.flag) {
        return true;
    }
    return false;
}

let flagnumber = 0b100;
console.time("flag");
for (let i = 0; i < 1000000000; i++) {
    flag(flagnumber);
}
console.timeEnd("flag");
let flagobj = {
    flag: 0b100
};
console.time("objectFlag");
for (let i = 0; i < 1000000000; i++) {
    objectFlag(flagobj);
}
console.timeEnd("objectFlag");
let flagoptobj = {
    options: {
        flag: true
    }
};
console.time("object");
for (let i = 0; i < 1000000000; i++) {
    object(flagoptobj);
}
console.timeEnd("object");

console.time("JSON.stringify");
for (let i = 0; i < 500000; i++) {
    Buffer.from(JSON.stringify(obj));
}
console.timeEnd("JSON.stringify");
let b = Buffer.from(JSON.stringify(obj));
console.time("JSON.parse");
for (let i = 0; i < 500000; i++) {
    JSON.parse(b.toString());
}
console.timeEnd("JSON.parse");
console.time("paco serialize");
for (let i = 0; i < 500000; i++) {
    pacopack.serialize(obj);
}
console.timeEnd("paco serialize");
console.time("paco serialize slice");
for (let i = 0; i < 500000; i++) {
    pacopack.serialize(obj, 0, true);
}
console.timeEnd("paco serialize slice");
let buffer = pacopack.serialize(obj);
console.time("paco deserialize");
for (let i = 0; i < 500000; i++) {
    pacopack.deserialize(buffer);
}
console.timeEnd("paco deserialize");