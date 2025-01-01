type Serialize = {
    value: string
    dataType: 
            "date"          | 
            "bigint"        | 
            "regex"         | 
            "symbol"        | 
            "simple"        |
            "map"           | 
            "set"           |
            "unknown"
}

type Regex = {
    flags: string, 
    innerPattern: string,
}

const UnsupportedTypes = new Set([
    "WeakMap",
    "WeakSet",
    "Promise",
    "Error",
    "EvalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError",
    "Proxy",
    "Reflect",
    "WeakRef"
]);

export function serialize<T>(data: T) {
    const serializableData: Serialize = {
        value: "",
        dataType: "unknown"
    }

    if(
        data && 
        typeof data === 'object' &&
        UnsupportedTypes.has(Object.getPrototypeOf(data).constructor.name)
    ) {
        throw new Error("Error: Unsupported Type");
    }

    if(typeof data === "bigint") {
        serializableData.value = data.toString();
        serializableData.dataType = "bigint";
    } else if(data instanceof Date) {
        serializableData.value = data.toUTCString();
        serializableData.dataType = "date";
    } else if(data instanceof RegExp) {
        const flags = data.flags;
        const innerPattern = data.source;
        const regex: Regex = {
            innerPattern,
            flags
        }
        serializableData.value = JSON.stringify(regex);
        serializableData.dataType = "regex";
    } else if(data instanceof Symbol) {
        const extractSymbolDescription = new RegExp(/\((.+)\)/);
        const symbolDescription = data.toString().match(extractSymbolDescription)?.[1];
        if(!symbolDescription)
            throw new Error("Error: Unable to parse Symbol Description");

        serializableData.value = symbolDescription;
        serializableData.dataType = "symbol";
    } else if(data instanceof Map) {
        const entries = Array.from(data.entries());
        serializableData.dataType = "map";
        serializableData.value = JSON.stringify(entries);
    } else if(data instanceof Set) {
        const array = Array.from(data);
        serializableData.dataType = "set";
        serializableData.value = JSON.stringify(array);
    } else {
        serializableData.value = JSON.stringify(data);
        serializableData.dataType = "simple";
    }

    return JSON.stringify(serializableData);
}

export function deserialize<T>(data: string): T {
    const serializableData: Serialize = JSON.parse(data);
    try {

        switch(serializableData.dataType) {
            case "bigint":
                return BigInt(serializableData.value) as T;
            case "date":
                return new Date(serializableData.value) as T;
            case "regex":
                const regex = JSON.parse(serializableData.value) as Regex;
                return new RegExp(regex.innerPattern, regex.flags) as T;
            case "simple":
                return JSON.parse(serializableData.value) as T;
            case "symbol":
                return Symbol.for(serializableData.value) as T;
            case "map":
                const entries = JSON.parse(serializableData.value);
                return new Map(entries) as T;
            case "set":
                const array = JSON.parse(serializableData.value);
                return new Set(array) as T;
            case "unknown":
                throw new Error("Error: Unsupported type.");
            }
    } catch {
        throw new Error("Error: Unsupported type.");
    }
}

export class StoreState {
    public static currentSize: number = 0;
    public static sizeLimit: number = 5242880;
}