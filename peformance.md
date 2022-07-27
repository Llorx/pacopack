
## Performance details
Here I'm going to explain in detail what performance methods/workarounds Pac-o-Pack is using, so you can benefit for your project and/or you know what is happening under the hood.

---
[1.- String map](#1--string-map)  
[2.- Map optimization](#1--map-optimization)  
**[...] WIP**

---
### 1.- String map
One of the worse CPU consuming operations when serializing and deserializing data in JavaScript is strings processing. Pac-o-Pack contains a string map for object keys, so when a string happens more than once in the same serialization, the first time is aliased to a number and the next times only the number alias is used. With this, the resulting `Buffer` and also the amount of CPU cycles to retrieve the string are considerably reduced.

If you enable the `mapKeys` option, this behaviour is held between serializations, so only the first time that an object is serialized the object keys are processed as strings, and the next times only the aliases are serialized. You can prepopulate this internal map with the constructor's `dictionary` argument.

To optimize the internal string-alias map, Pac-o-Pack uses a workaround described in the point 2.

### 2.- Map optimization
In JavaScript there are some ways to create a key-value map. The old-school one is to create an object and fill it with key-values, so you can ask for keys in the future:
```javascript
const map = {};
function set(key, value) {
    map[key] = value;
}
function get(key) {
    return map[key];
}

set("pepe", "manolo");
let pepe = get("pepe"); // "manolo"
let paco = get("paco"); // undefined
let toString = get("toString"); // ???
```
The problem with this code comes when you are requesting a key that do not exists in the `map` object but is part of the `map` prototype. For example, if you ask for the key `"toString"` you are going to receive a value, instead of `undefined`, because is part of `Object` which `map` inherits. For this, you have to check if the key that you are requesting is part of the object itself. There's a method named `hasOwnProperty` which we are going to add to the `get` function:
```javascript
[...]
function get(key) {
    if (Object.hasOwnProperty.call(map, key)) {
        return map[key];
    }
}
let toString = get("toString"); // undefined
[...]
```
With this, only keys that the `map` object directly contains are going to be returned. We call the `Object.hasOwnProperty` over `map` to avoid the case where a key named `"hasOwnProperty"` has been explicitly added to the `map` object.

Now **this adds a performance problem**. Each time you are requesting a key, you need to check for the key inside the object property table, and after that you need to access the property table again to extract the value of that key. To avoid this, the ECMAScript 2015 spec added a new object that fits this use case: `Map`. `Map` has specific methods to set keys and values and check for keys existence. (Also has a method to delete keys, which is a huge performance problem in plain objects but not in `Map`, but in Pac-o-Pack we do not delete keys so I'm not going to write about it):
```javascript
const map = new Map();

map.set("pepe", "manolo");
let pepe = map.get("pepe"); // "manolo"
let paco = map.get("paco"); // undefined
let toString = map.get("toString"); // undefined
```
This is faster that doing the double `hasOwnProperty` and `map[key]` over a plain object. Perfect. Problem solved.

NO.

There's a way to have a slightly faster key query in plain objects than `Map` while still avoiding the prototype. The drawback is that requires an extra `if`, and branching is also a performance hit, but this workaround is still faster than `Map` itself.

Plain objects in V8 are faster than `Map` when accessing keys for some detailed reasons (hidden classes and such), so we are going to abuse this. In objects you can set as key strings, numbers (which are converted to strings) and `Symbol`s. `Symbol`s are unique and cannot be replicated in the entire JavaScript engine if you don't allow for it, so is impossible that the prototype of a plain object contains a specific `Symbol` of your property.

With this we can do a thing. Instead of asking an object for the key 2 times (one with `hasOwnProperty` and the other when requesting the value), we can set a specific object which has a specific `Symbol`, so we can check for that `Symbol` directly. If there's no `Symbol`, you will receive `undefined`. Exactly the same as `Map` does. Here's the code:
```javascript
const S = Symbol();
const map = {};
function set(key, value) {
    map[key] = {
        [S]: value // We are creating a plain object with our `Symbol` as the key which points to the value.
    };
}
function get(key) {
    return map[key]?.[S]; // Use the optional chaining operator (?) for easy of read. But is the same as checking for an undefined value. This is the extra "if".
}
set("pepe", "manolo");
let pepe = get("pepe"); // "manolo"
let paco = get("paco"); // undefined
let toString = get("toString"); // undefined
```
This is slightly faster than `Map`. You can check this test (requires to `npm install benchmark`):
```javascript
const Benchmark = require("benchmark");

const S = Symbol();

const objectMap = {};
const map = new Map();
const objectMapSymbol = {};

const keys = [];

for (let i = 0; i < 100; i++) { // About 100 keys indexed
    // "k" to avoid JavaScript key ordering. Yes, is a thing:
    // https://dev.to/frehner/the-order-of-js-object-keys-458d
    let key = "k" + i;
    const value = "k" + Math.floor(Math.random() * 9999999);
    objectMap[key] = value;
    map.set(key, value);
    objectMapSymbol[key] = {
        [S]: value
    };
    if (Math.random() < 0.10) { // 10% of misses.
        key += "_";
    }
    keys.push(key);
}

const suite = new Benchmark.Suite();
suite.add("objectMap", () => {
    const res = {}; // Simulate an object being recreated using a dictionary
    for (const key of keys) {
        if (objectMap.hasOwnProperty(key)) {
            const value = objectMap[key];
            res[value] = true;
        }
    }
}).add("map", () => {
    const res = {};
    for (const key of keys) {
        const value = map.get(key);
        if (value !== undefined) {
            res[value] = true;
        }
    }
}).add("map.has", () => {
    const res = {};
    for (const key of keys) {
        if (map.has(key)) {
            const value = map.get(key);
            res[value] = true;
        }
    }
}).add("objectMapSymbol", () => {
    const res = {};
    for (const key of keys) {
        const value = objectMapSymbol[key]?.[S];
        if (value !== undefined) {
            res[value] = true;
        }
    }
}).on("cycle", (event) => {
    console.log(String(event.target));
}).run({ "async": true });
```
After a run missing 1 of each 10 queries (10%), I got:
> map x 533,613 ops/sec ±0.29% (95 runs sampled)
> map.has x 344,309 ops/sec ±0.17% (95 runs sampled)
> objectMap x 242,727 ops/sec ±0.19% (90 runs sampled)
> objectMapSymbol x 566,064 ops/sec ±0.25% (98 runs sampled)

_objectMapSymbol_ performs slightly better than _map_, but this depends a lot on the amounts of hits or misses. If you increase the amount of misses up to 1 of each 3 queries (33%) the results vary:
> map x 532,144 ops/sec ±0.27% (97 runs sampled)
> map.has x 376,795 ops/sec ±0.07% (95 runs sampled)
> objectMap x 230,244 ops/sec ±0.35% (97 runs sampled)
> objectMapSymbol x 532,465 ops/sec ±0.21% (97 runs sampled)

They start to equalize, but with Pac-o-Pack the objective is to have near 0 misses, using dictionaries (almost mandatory) and/or the `mapKey` option (depending on your use case), so I'm keeping my _objectMapSymbol_ method.

**[...] WIP**