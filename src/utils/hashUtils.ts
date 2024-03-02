import { isArray, isNumber, isString } from '@salesforce/ts-types';

type Hashable = string | number | undefined | null;

export function hashCode(value: Hashable | Hashable[]): number {
    let hash = 7;
    if (value === undefined || value === null) {
        return hash;
    }
    if (isNumber(value)) {
        return value;
    }
    if (isString(value)) {
        for (let i = 0; i < value.length; i++) {
            let code = value.charCodeAt(i);
            hash = (hash << 5) - hash + code;
            hash = hash & hash;
        }
    }
    if (isArray(value)) {
        for (let nestedValue of value) {
            hash = 31 * hash + hashCode(nestedValue);
        }
    }
    return hash;
}
