
<p align="center">
    <img align="center" src="https://raw.githubusercontent.com/Llorx/pacopack/main/res/logo.png#gh-light-mode-only">
    <img align="center" src="https://raw.githubusercontent.com/Llorx/pacopack/main/res/logo_white.png#gh-dark-mode-only">
</p>

---

Pure JS binary schemaless and dictionary-driven serialization focused on performance, small payloads and `JSON.stringify/parse` easy replacement.

## Motivation
I needed a pure JS and easy library to serialize any object to a `Buffer`, but without the hassle of using `JSON.stringify` and then converting the resulting string to a `Buffer`, as it feels like wasting tons of CPU cycles.

I started to look some schemaless libraries around and they all had different problems, like *MessagePack* not feeling that fast or *sializer* not having a growing `Buffer`.

I ended with `v8.serialize`, which is acceptably fast, but it had a major flaw for me: [Is not deterministic](https://github.com/nodejs/help/issues/2448).

After all this, I created Pac-o-Pack, which features:

- Pure JS.
- Really fast serialization and deserialization with default options. Even faster with some tweaks defined below.
- Optionally deterministic. Will sort any object keys so they are always serialized with the same byte order.
- Outputs to `Buffer`, ready to be sent via sockets or saved on LMDB.
- Compressed output by definition. Will try to use the least number of bytes to serialize your data.
- Along to all primitive types (including differentiated `null` and `undefined`), allows to serialize/deserialize: `Map`, `Set`, `RegExp`, `Buffer` and `Date`.

## Performance
Pac-o-Pack *abuses* JavaScript and includes multiple features to reduce the amount of CPU cycles to both serialize and deserialize the data. **More details in: [peformance.md](peformance.md).**

## Installation
```
npm install pacopack
```
## Example
```typescript
import { PacoPack } from "pacopack";

const serializer = new PacoPack();

const buffer = serializer.serialize({ my: "object" });
const myObject = serializer.deserialize(buffer);
```

## Usage
```typescript
new PacoPack(options?, dictionary?, toJSON?);
```

- `options`: Object:
    - `step`: The amount of bytes to reallocate when the current `Buffer` is full while serializing data. Defaults to **512**.
    - `sortKeys`: Sort the objects keys before serializing them. Used to always have the same output for the same data, regardless of the object key insertion order. Defaults to **false**.
    - `mapKeys`: Save a memory map when serializing object keys. If you always serialize the same kind of object but with different values, for example to send updates to a socket, this will add an alias for each object key, so the next time that you send the object, only the alias will be sent, saving a lot of bytes and CPU cycles. **Boosts performance even more**, but you have to be sure that each serialized data is sent to the counterpart to deserialize, as this data contains the alias information for newly found keys. Defaults to **false**.
- `dictionary`: You can define an array of string keys. This array will be used by the serializer to map object keys to a number when serializing the data, which saves both bytes and CPU cycles. For example, if you are going to usually serialize object updates with this signature `serialize({ timestamp: 123, value: 123, data: "123" })`, you can add a dictionary with `["timestamp", "value", "data"]`. **Boosts performance even more**, but you need to define the same dictionary both on the serializer and the deserializer instances, so the deserializer knows what index is looking for when receiving the data. You can add entries and then deserialize old data, but you can't modify or delete entries as the old data may reference those indexes.
- `toJSON`: If before Pac-o-Pack you had `JSON.stringify/parse` like me, and you were calling `JSON.stringify` over some instances that implemented the `toJSON` method to convert the instance to a serializable JSON object, you can enable this flag to avoid the hassle of modifying the serialization flow and still receive the `toJSON` method result when serializing the data with Pac-o-Pack. **Reduces performance slightly**, avoid if not needed.

```typescript
instance.serialize(data, offset?, slice?);
```
- `data`: Any Serializable: all primitives, `Map`, `Set`, `RegExp`, `Buffer`, `Date` and objects implementing the `toJSON` method if the flag is enabled.
- `offset`: Add extra initial padding to the resulting `Buffer` to write your data and avoid creating another `Buffer` and copying the data. For example to reserve the first 4 bytes to write the size of the `Buffer` before sending it to a socket, or to add your own flags.
- `slice`: By default Pac-o-Pack will copy the internal `Buffer` to a new one, to avoid data corruption if the resulting `Buffer` is accessed after calling `serialize()` again. If you know what you are doing and assure that the `Buffer` is not going to be accessed, you can enable this flag. **Boosts peformance even more**, but do not use under uncontrolably environments, like sending the `Buffer` to a socket, as the data *may* be copied by the SO or NodeJS for the socket to send it, or *may* not until an uncertain future, and you *may* call `serialize()` again, overwriting this `Buffer` before it is actually sent.

```typescript
instance.deserialize(buffer);
```
- `buffer`: The `Buffer` to deserialize.

```typescript
instance.setOptions(options);
```
- `options`: You can update the serializer options using the same definition as the constructor `options` argument.

```typescript
instance.resetStringMap();
```
When `mapKeys` option is enabled, this method will clear the string map both on the serializer and the counterpart on the next `instance.serialize/deserialize` calls. Use when you have dynamic object keys, for example the name of participants as object keys, and the participants list has changed so some old participants are not going to be used anymore. This way you can avoid extra memory consumption.

```typescript
PacoPack.OptimizeStrings(milliseconds?);
```
Pac-o-Pack has some pure JS methods to serialize and deserialize strings that are faster than native `Buffer` ones, but up to a point. It uses one method or another depending on the string length to work with. Pac-o-Pack comes with some generic values for this, but depends on your CPU when is better to use one or another. This method will do a test and update those values so the serializer/deserializer is optimized to squeeze your CPU to the max.
- `milliseconds`: The amount of milliseconds to spend on the optimization. This will block the thread this amount of time. Defaults to **300**.