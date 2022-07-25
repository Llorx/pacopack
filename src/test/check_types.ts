import { PacoPack, Serializables } from "..";

let serializer = new PacoPack();

interface Test {
    value:Serializables;
    equals?(a:Serializables, b:Serializables):boolean;
}

let tests:Test[] = [{
    value: 0
}, {
    value: 1
}, {
    value: -1
}, {
    value: 0.1
}, {
    value: -0.1
}, {
    value: Number.MAX_SAFE_INTEGER
}, {
    value: -Number.MAX_SAFE_INTEGER
}, {
    value: 123n
}, {
    value: -123n
}, {
    value: 123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123n
}, {
    value: -123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123n
}, {
    value: ""
}, {
    value: "asd\r\n"
}, {
    value: Buffer.allocUnsafe(1024).toString()
}, {
    value: new Map([["asd", 123], ["asd2", 1], ["asd3", 2]]),
    equals: (a:Map<Serializables, Serializables>, b:Map<Serializables, Serializables>) => JSON.stringify(Array.from(a)) === JSON.stringify(Array.from(b))
}, {
    value: new Set(["asd", 123, {ok:123}]),
    equals: (a:Set<Serializables>, b:Set<Serializables>) => JSON.stringify(Array.from(a)) === JSON.stringify(Array.from(b))
}, {
    value: "asd"
}, {
    value: "😀"
}, {
    value: "😀😀😀"
}, {
    value: Buffer.allocUnsafe(123),
    equals: (a:Buffer, b:Buffer) => a.equals(b)
}, {
    value: /asd/g,
    equals: (a:RegExp, b:RegExp) => String(a) === String(b)
}, {
    value: /asd2/i,
    equals: (a:RegExp, b:RegExp) => String(a) === String(b)
}, {
    value: /(asd|asd2)/gsi,
    equals: (a:RegExp, b:RegExp) => String(a) === String(b)
}, {
    value: /(asd|asd2)/mi,
    equals: (a:RegExp, b:RegExp) => String(a) === String(b)
}, {
    value: new Date(),
    equals: (a:Date, b:Date) => a.getTime() === b.getTime()
}, {
    value: new Date(123),
    equals: (a:Date, b:Date) => a.getTime() === b.getTime()
}, {
    value: null
}, {
    value: undefined
}, {
    value: true
}, {
    value: false
}, {
    value: [],
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
}, {
    value: [1,2,1],
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
}, {
    value: ["asd"],
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
}, {
    value: {},
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
}, {
    value: {
        key: {
            arr: [{
                pos: 123
            }],
            arr2: [123]
        },
        key2: -123.1
    },
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
}];

for (let test of tests) {
    let b = serializer.serialize(test.value);
    let d = serializer.deserialize(b) as Serializables;
    if (test.equals ? !test.equals(test.value, d) : test.value !== d) {
        console.error(test.value, "!==", d);
        throw new Error(`${test.value} !== ${d}`);
    }
}
console.log("Types ok");