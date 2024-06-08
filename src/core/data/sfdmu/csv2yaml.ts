import { Org } from '@salesforce/core';
import { Optional } from '@salesforce/ts-types';
import { loadConfig } from '../../../sfdmu/config.js';
import { csv2yaml as coreCsv2yaml } from '../../../core/data/csv2yaml.js';
import path from 'path';

interface Options {
    preserveExisting: boolean;
    sfdmuDir: string;
    configFile?: string;
    outputDir?: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
}

export async function csv2yaml({ preserveExisting, sfdmuDir, configFile, outputDir, schemaOrg, refreshSchema }: Options) {
    const config = await loadConfig(configFile ?? path.join(sfdmuDir, 'export.json'));
    for (let objectConfig of config.objects) {
        const objectName = objectConfig.objectName;
        await coreCsv2yaml({
            preserveExisting,
            externalId: objectConfig.externalId.split(';'),
            csvFile: path.join(sfdmuDir, `${objectName}.csv`),
            objectName,
            outputDir,
            schemaOrg,
            refreshSchema,
            externalValueSeparator: ';'
        });
    }
}
