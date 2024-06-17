import { Org } from '@salesforce/core';
import { hasString, Optional } from '@salesforce/ts-types';
import { hasConfig, loadConfig, SfdmuConfig, SfdmuOperation } from '../../sfdmu/config.js';
import { csv2yaml as coreCsv2yaml } from '../data/csv2yaml.js';
import path from 'path';
import {
    getDecomposeConfig,
    getObjectName,
    hasConfigExtended,
    loadConfigExtended,
    SfdmuConfigExtended
} from '../../sfdmu/configExtended.js';
import { ConfigBackup, hasConfigBackup, loadBackupConfig } from '../../sfdmu/configBackup.js';

interface Options {
    preserveExisting: boolean;
    sfdmuDir: string;
    sourceDir: string;
    targetOrg?: Optional<Org>;
    refreshSchema: boolean;
    operations: SfdmuOperation[];
}

export async function csv2yaml({ preserveExisting, sfdmuDir, sourceDir, targetOrg, refreshSchema, operations }: Options) {
    let config: SfdmuConfig | SfdmuConfigExtended | ConfigBackup;
    if (hasConfigBackup(sourceDir)) {
        config = await loadBackupConfig(sourceDir);
    } else if (hasConfigExtended(sourceDir)) {
        config = await loadConfigExtended(sourceDir);
    } else if (hasConfig(sfdmuDir)) {
        config = await loadConfig(sfdmuDir);
    } else {
        throw Error(`Config not found.`);
    }
    for (let objectConfig of config.objects) {
        const externalId = hasString(objectConfig, 'externalId') ? objectConfig.externalId : 'Id';
        const operation = hasString(objectConfig, 'operation') ? (objectConfig.operation as SfdmuOperation) : 'Readonly';
        const objectName = getObjectName(objectConfig);
        if (operations.includes(operation)) {
            await coreCsv2yaml({
                preserveExisting,
                externalId: externalId.split(';'),
                csvFile: path.join(sfdmuDir, `${objectName}.csv`),
                objectName,
                sourceDir,
                targetOrg,
                refreshSchema,
                externalValueSeparator: ';',
                decompose: getDecomposeConfig(objectConfig)
            });
        } else {
            console.log(`Operation "${operation}" not configured for convert. Target ignored: ${objectName}`);
        }
    }
}
