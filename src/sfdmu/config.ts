import { fileExistsSync, readJson, writeJson } from '../utils/fs.js';
import path from 'path';
import { ensure, has, hasArray, hasString, isAnyJson, isBoolean, isJsonMap, isString, Optional } from '@salesforce/ts-types';

export interface SfdmuConfig {
    excludeIdsFromCSVFiles?: boolean;
    objects: SfdmuObjectConfig[];
    [value: string]: unknown;
}

export function ensureSfdmuConfig(value: unknown): SfdmuConfig {
    return ensure(asSfdmuConfig(value), 'Not a valid SFDMU config.');
}

export function asSfdmuConfig(value: unknown): Optional<SfdmuConfig> {
    return isSfdmuConfig(value) ? value : undefined;
}

export function isSfdmuConfig(value: unknown): value is SfdmuConfig {
    return (
        isAnyJson(value) &&
        isJsonMap(value) &&
        (!has(value, 'excludeIdsFromCSVFiles') || isBoolean(value.excludeIdsFromCSVFiles)) &&
        hasArray(value, 'objects') &&
        value.objects.every(isSfdmuObjectConfig)
    );
}

export interface SfdmuObjectConfig {
    query: string;
    operation: SfdmuOperation;
    externalId: string;
    [value: string]: unknown;
}

export function isSfdmuObjectConfig(value: unknown): value is SfdmuObjectConfig {
    return (
        isAnyJson(value) &&
        isJsonMap(value) &&
        hasString(value, 'query') &&
        hasString(value, 'operation') &&
        isSfdmuOperation(value.operation) &&
        hasString(value, 'externalId')
    );
}

export type SfdmuOperation = 'Insert' | 'Update' | 'Upsert' | 'Readonly' | 'Delete' | 'HardDelete' | 'DeleteSource' | 'DeleteHierarchy';

export function isSfdmuOperation(value: unknown): value is SfdmuOperation {
    return (
        isString(value) &&
        ['Insert', 'Update', 'Upsert', 'Readonly', 'Delete', 'HardDelete', 'DeleteSource', 'DeleteHierarchy'].includes(value)
    );
}

export function hasConfig(sfdmuDir: string): boolean {
    return fileExistsSync(path.join(sfdmuDir, 'export.json'));
}

export async function loadConfig(sfdmuDir: string): Promise<SfdmuConfig> {
    return ensureSfdmuConfig(await readJson(path.join(sfdmuDir, 'export.json')));
}

export async function writeConfig(sfdmuDir: string, config: SfdmuConfig) {
    const exportJson = path.join(sfdmuDir, 'export.json');
    console.log('Writing SFDMU config:', exportJson);
    await writeJson(exportJson, config);
}
