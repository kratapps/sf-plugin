import { ensure, has, hasArray, hasBoolean, hasString, isAnyJson, isBoolean, isJsonMap, Optional } from '@salesforce/ts-types';
import { isSfdmuOperation, SfdmuObjectConfig, SfdmuOperation } from './config.js';
import { fileExistsSync, readJson, readYaml } from '../utils/fs.js';
import path from 'path';
import { DecomposeConfig, isDecomposeConfig } from './decomposition.js';
import { BackupObjectConfig } from './configBackup.js';

export interface SfdmuConfigExtended {
    objects: SfdmuObjectConfigExtended[];
    [value: string]: unknown;
}

export function ensureSfdmuConfigExtended(value: unknown): SfdmuConfigExtended {
    return ensure(asSfdmuConfigExtended(value), 'Not a valid SFDMU config.');
}

export function asSfdmuConfigExtended(value: unknown): Optional<SfdmuConfigExtended> {
    return isSfdmuConfigExtended(value) ? value : undefined;
}

export function isSfdmuConfigExtended(value: unknown): value is SfdmuConfigExtended {
    return isAnyJson(value) && isJsonMap(value) && hasArray(value, 'objects') && value.objects.every(isSfdmuObjectConfigExtended);
}

export interface SfdmuObjectConfigExtended {
    objectName: string;
    operation: SfdmuOperation;
    externalId: string;
    useDecomposition?: boolean;
    decompose?: DecomposeConfig;
    [value: string]: unknown;
}

export function isSfdmuObjectConfigExtended(value: unknown): value is SfdmuObjectConfigExtended {
    return (
        isAnyJson(value) &&
        isJsonMap(value) &&
        hasString(value, 'objectName') &&
        hasString(value, 'operation') &&
        isSfdmuOperation(value.operation) &&
        hasString(value, 'externalId') &&
        (!has(value, 'useDecomposition') || isBoolean(value.useDecomposition)) &&
        (!has(value, 'decompose') || isDecomposeConfig(value.decompose))
    );
}

export function hasConfigExtended(sourceDir: string): boolean {
    return fileExistsSync(path.join(sourceDir, 'export.yaml')) || fileExistsSync(path.join(sourceDir, 'export.json'));
}

export async function loadConfigExtended(sourceDir: string): Promise<SfdmuConfigExtended> {
    const yamlFile = path.join(sourceDir, 'export.yaml');
    const jsonFile = path.join(sourceDir, 'export.json');
    if (fileExistsSync(yamlFile)) {
        return ensureSfdmuConfigExtended(await readYaml(yamlFile));
    } else if (fileExistsSync(jsonFile)) {
        return ensureSfdmuConfigExtended(await readJson(jsonFile));
    }
    throw Error(`Config file not found: ${yamlFile}`);
}

export function getObjectName(config: SfdmuObjectConfig | SfdmuObjectConfigExtended | BackupObjectConfig): string {
    if (hasString(config, 'objectName')) {
        return config.objectName;
    } else if (hasString(config, 'query')) {
        return config.query.split(' FROM ')[1].trim().split(' ')[0].trim();
    }
    throw Error('Object Name not defined.');
}

export function getDecomposeConfig(config: SfdmuObjectConfig | SfdmuObjectConfigExtended | BackupObjectConfig): Optional<DecomposeConfig> {
    if (hasBoolean(config, 'useDecomposition') && config.useDecomposition && has(config, 'decompose')) {
        return config.decompose as DecomposeConfig;
    }
    return undefined;
}
