import { ensure, hasString, isAnyJson, isJsonMap, Optional } from '@salesforce/ts-types';

export interface DecomposeConfig {
    [field: string]: ObjectDecomposeConfig;
}

export function decompose(value: unknown, message?: string): DecomposeConfig {
    return ensure(asDecomposeConfig(value), message ?? 'Not a valid decomposition config.');
}

export function asDecomposeConfig(value: unknown): Optional<DecomposeConfig> {
    return isDecomposeConfig(value) ? value : undefined;
}

export function isDecomposeConfig(value: unknown): value is DecomposeConfig {
    return isAnyJson(value) && isJsonMap(value) && Object.values(value).every(isObjectDecomposeConfig);
}

export interface ObjectDecomposeConfig {
    ext: string;
}

export function isObjectDecomposeConfig(value: unknown): value is ObjectDecomposeConfig {
    return isAnyJson(value) && isJsonMap(value) && hasString(value, 'ext');
}
