import { Org } from '@salesforce/core';
import { Optional } from '@salesforce/ts-types';
import { loadConfig } from '../../../sfdmu/config.js';
import { csv2yaml as coreCsv2yaml } from '../../../core/data/csv2yaml.js';
import path from 'path';

interface Options {
    preserveExisting: boolean;
    csvDir: string;
    configFile?: string;
    outputDir?: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
}

export async function csv2yaml({ preserveExisting, csvDir, configFile, outputDir, schemaOrg, refreshSchema }: Options) {
    const config = await loadConfig(configFile ?? path.join(csvDir, 'export.json'));
    for (let objectConfig of config.objects) {
        const objectName = objectConfig.query.split(' FROM ')[1].trim().split(' ')[0].trim();
        await coreCsv2yaml({
            preserveExisting,
            externalId: objectConfig.externalId.split(';'),
            csvFile: path.join(csvDir, `${objectName}.csv`),
            objectName,
            outputDir,
            schemaOrg,
            refreshSchema,
            externalValueSeparator: ';'
        });
    }
}
