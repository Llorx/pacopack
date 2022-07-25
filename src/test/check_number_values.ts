import { PacoPack } from "..";

let serializer = new PacoPack();

let values = new Array(64).fill(0).map((n, i) => Math.pow(2, i) - 100);
values.push(123.123);
values.push(-123.123);

let v = serializer.serialize(values);
let d = serializer.deserialize(v);

if (JSON.stringify(values) !== JSON.stringify(d)) {
    console.log("ERROR DESERIALIZING NUMBERS");
}

console.log("Number values ok");