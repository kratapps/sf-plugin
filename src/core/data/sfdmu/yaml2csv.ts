import { loadConfig, Operation } from '../../../sfdmu/config.js';
import path from 'path';
import { yaml2csv as coreYaml2csv } from '../../../core/data/yaml2csv.js';
import { dirExists } from '../../../utils/fs.js';

interface Options {
    sourceDir: string;
    sfdmuDir: string;
    operations: Operation[];
}

export async function yaml2csv({ sourceDir, sfdmuDir, operations }: Options) {
    const config = await loadConfig(path.join(sfdmuDir, 'export.json'));
    for (let { objectName, operation } of config.objects) {
        if (operations.includes(operation)) {
            const yamlDir = path.join(sourceDir, objectName, 'records');
            if (await dirExists(yamlDir)) {
                const csvFile = path.join(sfdmuDir, `${objectName}.csv`);
                console.log(`Generating ${csvFile}`);
                await coreYaml2csv({
                    csvFile,
                    yamlDir
                });
            } else {
                console.error(`Source directory doesn't exist: ${yamlDir}`);
            }
        } else {
            console.log(`Operation "${operation}" not configured for convert. Target ignored: ${objectName}`);
        }
    }
}
