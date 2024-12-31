type Serialize = {
    value: string
    dataType: "bigint" | "date" | "regex" | "simple" | "unknown"
}

type Regex = {
    flags: string, 
    innerPattern: string,
}

export function serialize<T>(data: T) {
    const serializableData: Serialize = {
        value: "",
        dataType: "unknown"
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
    } else {
        serializableData.value = JSON.stringify(data);
        serializableData.dataType = "simple";
    }

    return JSON.stringify(serializableData);
}

export function deserialize<T>(data: string): T {
    const serializableData: Serialize = JSON.parse(data);

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
        case "unknown":
            throw new Error("Error: Unsupported type.");

    }
}