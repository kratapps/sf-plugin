import { Org } from '@salesforce/core';
import { has, hasArray, hasBoolean, hasString, isBoolean, isObject, isString, Optional } from '@salesforce/ts-types';
import path from 'path';
import { ensureDir, readFile, readYaml, writeFile } from '../../../utils/fs.js';
import { isPlainObject } from '@salesforce/ts-types/lib/narrowing/is.js';
import { generateQuery } from '../../query/generate.js';
import { emptyDir } from 'fs-extra';
import { SfdmuConfig, writeConfig } from '../../../sfdmu/config.js';

interface Options {
    sfdmuDir: string;
    sourceDir: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
}

interface BackupConfig {
    objects: BackupObjectConfig[];
}

function isBackupConfig(obj: unknown): obj is BackupConfig {
    return isObject(obj) && hasArray(obj, 'objects') && obj.objects.every(isBackupObjectConfig);
}

interface BackupObjectConfig {
    objectName: string;
    queryFile?: boolean | string;
}

function isBackupObjectConfig(obj: unknown): obj is BackupObjectConfig {
    return (
        isPlainObject(obj) &&
        hasString(obj, 'objectName') &&
        (!has(obj, 'queryFile') || hasBoolean(obj, 'queryFile') || hasString(obj, 'queryFile'))
    );
}

async function loadBackupConfig(sourceDir: string): Promise<BackupConfig> {
    const config = await readYaml(path.join(sourceDir, 'backup.yaml'));
    if (!isBackupConfig(config)) {
        throw Error('Invalid backup config.');
    }
    return config;
}

export async function prepareBackup({ sfdmuDir, sourceDir, schemaOrg, refreshSchema }: Options) {
    await ensureDir(sfdmuDir);
    const backupConfig = await loadBackupConfig(sourceDir);
    const sfdmuConfig: SfdmuConfig = {
        objects: []
    };
    const conn = schemaOrg ? schemaOrg.getConnection() : null;
    for (let { objectName, queryFile: configQueryFile } of backupConfig.objects) {
        const objectDir = path.join(sourceDir, objectName);
        const queryFile = isString(configQueryFile) ? configQueryFile : path.join(objectDir, 'query.soql');
        let queryString;
        if ((isBoolean(configQueryFile) && configQueryFile) || isString(configQueryFile)) {
            queryString = await readFile(queryFile);
        } else if (!configQueryFile) {
            if (!conn) {
                throw Error('Flag --schema-org needs to be set to generate queries dynamically.');
            }
            const query = await generateQuery(
                conn,
                objectName,
                sourceDir,
                {
                    byDefault: 'all',
                    nameIsNot: ['IsDeleted', 'LastActivityDate', 'LastViewedDate', 'LastReferencedDate'],
                    addParentField: [
                        { relationshipName: 'Owner', field: 'Username' },
                        { relationshipName: 'LastModifiedBy', field: 'Username' }
                    ],
                    isNotCalculated: true,
                    isNotEncrypted: true
                },
                refreshSchema
            );
            queryString = query.toQueryString({ pretty: true });
            await writeFile(path.join(objectDir, 'query.soql'), queryString);
        } else {
            throw Error(`Either set --schema-org to generate the query dynamically or create a query file: ${queryFile}`);
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
