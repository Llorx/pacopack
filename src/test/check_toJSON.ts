import { PacoPack } from "..";

let serializer = new PacoPack(null, null, true);

const json = {
    ok: "ok",
    ok2: "test"
};

const obj = {
    toJSON: () => json
};

let r = serializer.deserialize(serializer.serialize(obj));

if (JSON.stringify(r) !== JSON.stringify(json)) {
    console.log("ERROR DESERIALIZING toJSON");
}
console.log("toJSON check ok");