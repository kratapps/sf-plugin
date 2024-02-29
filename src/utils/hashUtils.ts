import { isNumber } from '@salesforce/ts-types';

export function hashCode(value: string | number | undefined | null): number {
    let hash = 0;
    if (value === undefined || value === null) {
        return hash;
    }
    if (isNumber(value)) {
        return value;
    }
    for (let i = 0; i < value.length; i++) {
        let code = value.charCodeAt(i);
        hash = (hash << 5) - hash + code;
        hash = hash & hash;
    }
    return hash;
}
