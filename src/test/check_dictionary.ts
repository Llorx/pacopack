import { PacoPack } from "..";

let serializer = new PacoPack(null, ["ok", "ok3"]);

const obj = {
    ok: "ok",
    ok2: "test"
};

let r = serializer.deserialize(serializer.serialize(obj));

if (JSON.stringify(r) !== JSON.stringify(obj)) {
    console.log("ERROR DESERIALIZING WITH DICTIONARY");
}
console.log("Dictionary check ok");