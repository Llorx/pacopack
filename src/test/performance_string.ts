import UTF8 from "../utf8";

console.log(Object.entries(UTF8).filter(([name, value]) => typeof value === "number"));
console.time("Time optimizing");
UTF8.optimize(300);
console.timeEnd("Time optimizing");
console.log(Object.entries(UTF8).filter(([name, value]) => typeof value === "number"));