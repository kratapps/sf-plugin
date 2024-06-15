import { Org } from '@salesforce/core';
import { ensure, has, hasArray, hasBoolean, hasString, isBoolean, isObject, isString, Optional } from '@salesforce/ts-types';
import path from 'path';
import { ensureDir, readFile, readYaml, writeFile } from '../../../utils/fs.js';
import { isPlainObject } from '@salesforce/ts-types/lib/narrowing/is.js';
import { generateQuery, isGenerateQueryOptions, mergeGenerateQueryOptions } from '../../query/generate.js';
import { emptyDir } from 'fs-extra';
import { SfdmuConfig, writeConfig } from '../../../sfdmu/config.js';
import { GenerateQueryOptions } from '../../query/generate.js';

interface Options {
    sfdmuDir: string;
    sourceDir: string;
    targetOrg?: Optional<Org>;
    refreshSchema: boolean;
}

interface BackupConfig {
    objects: BackupObjectConfig[];
    queryOptions?: GenerateQueryOptions;
}

function ensureBackupConfig(value: unknown, message?: string): BackupConfig {
    return ensure(asBackupConfig(value), message ?? 'Not a valid backup config.');
}

function asBackupConfig(value: unknown): Optional<BackupConfig> {
    return isBackupConfig(value) ? value : undefined;
}

function isBackupConfig(value: unknown): value is BackupConfig {
    return (
        isObject(value) &&
        hasArray(value, 'objects') &&
        value.objects.every(isBackupObjectConfig) &&
        (!has(value, 'queryOptions') || isGenerateQueryOptions(value.queryOptions))
    );
}

interface BackupObjectConfig {
    objectName: string;
    queryFile?: boolean | string;
    queryOptions?: GenerateQueryOptions;
}

function isBackupObjectConfig(value: unknown): value is BackupObjectConfig {
    return (
        isPlainObject(value) &&
        hasString(value, 'objectName') &&
        (!has(value, 'queryFile') || hasBoolean(value, 'queryFile') || hasString(value, 'queryFile')) &&
        (!has(value, 'queryOptions') || isGenerateQueryOptions(value.queryOptions))
    );
}

async function loadBackupConfig(sourceDir: string): Promise<BackupConfig> {
    const config = await readYaml(path.join(sourceDir, 'backup.yaml'));
    return ensureBackupConfig(config);
}

export async function prepareBackup({ sfdmuDir, sourceDir, targetOrg, refreshSchema }: Options) {
    await ensureDir(sfdmuDir);
    const backupConfig = await loadBackupConfig(sourceDir);
    const sfdmuConfig: SfdmuConfig = {
        objects: []
    };
    const conn = targetOrg?.getConnection();
    for (let objectConfig of backupConfig.objects) {
        const { objectName, queryFile: configQueryFile } = objectConfig;
        const objectDir = path.join(sourceDir, objectName);
        const queryFile = isString(configQueryFile) ? configQueryFile : path.join(objectDir, 'query.soql');
        let queryString;
        if ((isBoolean(configQueryFile) && configQueryFile) || isString(configQueryFile)) {
            queryString = await readFile(queryFile);
        } else if (!configQueryFile) {
            if (!conn) {
                throw Error('Flag --target-org needs to be set to generate queries dynamically.');
            }
            const query = await generateQuery(
                conn,
                objectName,
                sourceDir,
                mergeGenerateQueryOptions(backupConfig.queryOptions, objectConfig.queryOptions),
                refreshSchema
            );
            queryString = query.toQueryString({ pretty: true });
            await writeFile(path.join(objectDir, 'query.soql'), queryString);
        } else {
            throw Error(`Either set --target-org to generate the query dynamically or create a query file: ${queryFile}`);
        }
        sfdmuConfig.objects.push({
            objectName,
            query: queryString.replace(/\s+/g, ' '),
            operation: 'Readonly',
            externalId: 'Id'
        });
    }
    await emptyDir(sfdmuDir);
    await writeConfig(sfdmuDir, sfdmuConfig);
}
