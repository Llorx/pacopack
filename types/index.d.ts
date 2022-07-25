declare class UTF8 {
    static MAX_1BYTE_UTF8: number;
    static BYTELENGTH_MAX: number;
    static TO_STRING_MAX: number;
    static TO_STRING_FUNCS_MAX: number;
    static TO_BUFFER_MAX: number;
    static optimize(ms?: number): void;
    static byteLength(str: string): number;
    static toBuffer(str: string, buffer: Buffer, offset: number): {
        size: number;
        isQuad: boolean;
    };
    static toString(buffer: Buffer, offset: number, stringLength: number, bufferLength: number, isQuad: boolean | number): string;
}

declare type Dictionary = {
    words: {
        [key: string]: {
            [NUMBER: symbol]: number;
        };
    };
    total: number;
    dictionary: {
        [index: number]: string;
    };
};
declare type SerializableObject<TO_JSON extends boolean = false> = {
    [key: string]: Serializables<TO_JSON>;
};
declare type Serializables<TO_JSON extends boolean = false> = boolean | string | number | bigint | RegExp | Date | undefined | Map<Serializables<TO_JSON>, Serializables<TO_JSON>> | Set<Serializables<TO_JSON>> | Buffer | Uint8Array | null | Serializables<TO_JSON>[] | (TO_JSON extends true ? SerializableObject<TO_JSON> | {
    toJSON?(): Serializables<TO_JSON>;
} : SerializableObject<TO_JSON>);
declare type PacoPackOptions = {
    step?: number;
    sortKeys?: boolean;
    mapKeys?: boolean;
};
declare class PacoPack<TO_JSON extends boolean = false> {
    readonly toJSON?: TO_JSON | null | undefined;
    private static _B64;
    private _buffer;
    private _dataView;
    private _bufferArray;
    private _totalBuffer;
    private _pos;
    private _size;
    private _strIndex;
    private _strMap;
    private _dirtyStringMap;
    private _receiveStrMap;
    private _receiveStrMapIndex;
    private _receivePos;
    dictionary: Dictionary | null;
    options: PacoPackOptions;
    constructor(options?: PacoPackOptions | null, dictionary?: string[] | Dictionary | null, toJSON?: TO_JSON | null | undefined);
    private static _BigInt64BlocksCount;
    private static _WriteBigUint;
    private static _WriteBigUintDataView;
    private static _ReadBigUint;
    static OptimizeStrings(ms?: number): typeof UTF8;
    private _setDictionary;
    private _resetReceiveStringMap;
    private _read;
    private _write;
    private _checkSize;
    private _slice;
    private _writeString;
    private _writeInteger;
    private _writeDouble;
    private _get;
    resetStringMap(): void;
    setOptions(options: PacoPackOptions): void;
    serialize(data: Serializables<TO_JSON>, offset?: number, slice?: boolean): Buffer;
    deserialize(buffer: Buffer): unknown;
}

export { Dictionary, PacoPack, PacoPackOptions, Serializables, UTF8 };
