export function localeCompareIgnoreCase(a: string, b: string) {
    return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}
