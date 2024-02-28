import { Optional, isNumber } from '@salesforce/ts-types';

export function hashCode(value: Optional<string> | number | null): number {
    let hash = 0;
    if (!value) {
        return hash;
    }
    if (isNumber(value)) {
        return hash;
    }
    for (let i = 0; i < value.length; i++) {
        let code = value.charCodeAt(i);
        hash = (hash << 5) - hash + code;
        hash = hash & hash;
    }
    return hash;
}
