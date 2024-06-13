import { Org } from '@salesforce/core';
import { Optional } from '@salesforce/ts-types';
import { loadConfig, Operation } from '../../../sfdmu/config.js';
import { csv2yaml as coreCsv2yaml } from '../../../core/data/csv2yaml.js';
import path from 'path';

interface Options {
    preserveExisting: boolean;
    sfdmuDir: string;
    configFile?: string;
    sourceDir?: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
    operations: Operation[];
}

export async function csv2yaml({ preserveExisting, sfdmuDir, configFile, sourceDir, schemaOrg, refreshSchema, operations }: Options) {
    const config = await loadConfig(configFile ?? path.join(sfdmuDir, 'export.json'));
    for (let { objectName, externalId, operation } of config.objects) {
        if (operations.includes(operation)) {
            await coreCsv2yaml({
                preserveExisting,
                externalId: externalId.split(';'),
                csvFile: path.join(sfdmuDir, `${objectName}.csv`),
                objectName,
                sourceDir,
                schemaOrg,
                refreshSchema,
                externalValueSeparator: ';'
            });
        } else {
            console.log(`Operation "${operation}" not configured for convert. Target ignored: ${objectName}`);
        }
    }
}
