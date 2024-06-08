import { loadConfig } from '../../../sfdmu/config.js';
import path from 'path';
import { yaml2csv as coreYaml2csv } from '../../../core/data/yaml2csv.js';

interface Options {
    sourceDir: string;
    configFile?: string;
    sfdmuDir: string;
}

export async function yaml2csv({ sourceDir, configFile, sfdmuDir }: Options) {
    const config = await loadConfig(configFile ?? path.join(sfdmuDir, 'export.json'));
    for (let { objectName, operation } of config.objects) {
        if (operation === 'Readonly' || operation === 'DeleteSource') {
            continue;
        }
        const csvFile = path.join(sfdmuDir, `${objectName}.csv`);
        console.log(`Generating ${csvFile}`);
        await coreYaml2csv({
            csvFile,
            yamlDir: path.join(sourceDir, objectName, 'records')
        });
    }
}
