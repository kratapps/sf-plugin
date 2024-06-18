import { Org } from '@salesforce/core';
import { isBoolean, isString, Optional } from '@salesforce/ts-types';
import path from 'path';
import { ensureDir, readFile, writeFile } from '../../../utils/fs.js';
import { generateQuery, mergeGenerateQueryOptions } from '../../query/generate.js';
import { emptyDir } from 'fs-extra';
import { SfdmuConfig, writeConfig } from '../../../sfdmu/config.js';
import { loadBackupConfig } from '../../../sfdmu/configBackup.js';

interface Options {
    sfdmuDir: string;
    sourceDir: string;
    targetOrg?: Optional<Org>;
    refreshSchema: boolean;
}

export async function prepareBackup({ sfdmuDir, sourceDir, targetOrg, refreshSchema }: Options) {
    await ensureDir(sfdmuDir);
    await emptyDir(sfdmuDir);
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
    await writeConfig(sfdmuDir, sfdmuConfig);
}
