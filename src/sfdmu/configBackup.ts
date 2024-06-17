import { ensure, has, hasArray, hasBoolean, hasString, isAnyJson, isBoolean, isJsonMap, Optional } from '@salesforce/ts-types';
import path from 'path';
import { fileExistsSync, readJson, readYaml } from '../utils/fs.js';
import { GenerateQueryOptions, isGenerateQueryOptions } from '../core/query/generate.js';
import { DecomposeConfig, isDecomposeConfig } from './decomposition.js';

export interface ConfigBackup {
    objects: BackupObjectConfig[];
    queryOptions?: GenerateQueryOptions;
}

function ensureBackupConfig(value: unknown, message?: string): ConfigBackup {
    return ensure(asBackupConfig(value), message ?? 'Not a valid backup config.');
}

function asBackupConfig(value: unknown): Optional<ConfigBackup> {
    return isBackupConfig(value) ? value : undefined;
}

function isBackupConfig(value: unknown): value is ConfigBackup {
    return (
        isAnyJson(value) &&
        isJsonMap(value) &&
        hasArray(value, 'objects') &&
        value.objects.every(isBackupObjectConfig) &&
        (!has(value, 'queryOptions') || isGenerateQueryOptions(value.queryOptions))
    );
}

export interface BackupObjectConfig {
    objectName: string;
    useDecomposition?: boolean;
    decompose?: DecomposeConfig;
    queryFile?: boolean | string; // todo boolean?
    queryOptions?: GenerateQueryOptions;
}

function isBackupObjectConfig(value: unknown): value is BackupObjectConfig {
    return (
        isAnyJson(value) &&
        isJsonMap(value) &&
        hasString(value, 'objectName') &&
        (!has(value, 'useDecomposition') || isBoolean(value.useDecomposition)) &&
        (!has(value, 'decompose') || isDecomposeConfig(value.decompose)) &&
        (!has(value, 'queryFile') || hasBoolean(value, 'queryFile') || hasString(value, 'queryFile')) &&
        (!has(value, 'queryOptions') || isGenerateQueryOptions(value.queryOptions))
    );
}

export function hasConfigBackup(sourceDir: string): boolean {
    return fileExistsSync(path.join(sourceDir, 'backup.yaml')) || fileExistsSync(path.join(sourceDir, 'backup.json'));
}

export async function loadBackupConfig(sourceDir: string): Promise<ConfigBackup> {
    const yamlFile = path.join(sourceDir, 'backup.yaml');
    const jsonFile = path.join(sourceDir, 'backup.json');
    if (fileExistsSync(yamlFile)) {
        return ensureBackupConfig(await readYaml(yamlFile));
    } else if (fileExistsSync(jsonFile)) {
        return ensureBackupConfig(await readJson(jsonFile));
    }
    throw Error(`Config file not found: ${yamlFile}`);
}
