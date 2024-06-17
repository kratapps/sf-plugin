import { hasConfig, loadConfig, SfdmuConfig, SfdmuObjectConfig, SfdmuOperation, writeConfig } from '../../sfdmu/config.js';
import path from 'path';
import { dirExists, readFileSync, readYaml, readYamlAs, walkDirectories, walkFiles, writeCsv } from '../../utils/fs.js';
import {
    getDecomposeConfig,
    getObjectName,
    hasConfigExtended,
    loadConfigExtended,
    SfdmuConfigExtended
} from '../../sfdmu/configExtended.js';
import { Dictionary, has, isJsonMap } from '@salesforce/ts-types';
import { JsonPrimitive } from '@salesforce/ts-types/lib/types/json.js';

interface Options {
    sourceDir: string;
    sfdmuDir: string;
    operations: SfdmuOperation[];
}

export async function yaml2csv({ sourceDir, sfdmuDir, operations }: Options) {
    let config: SfdmuConfig | SfdmuConfigExtended;
    if (hasConfigExtended(sourceDir)) {
        const configExtended = await loadConfigExtended(sourceDir);
        config = configExtended;
        const newSfdmuConfig: SfdmuConfig = {
            ...configExtended,
            objects: configExtended.objects.map((it) => {
                const queryString = readFileSync(path.join(sourceDir, getObjectName(it), 'query.soql'));
                const objectConfig: SfdmuObjectConfig = {
                    ...it,
                    query: queryString.replace(/\s+/g, ' ')
                };
                delete objectConfig.useDecomposition;
                delete objectConfig.decompose;
                return objectConfig;
            })
        };
        await writeConfig(sfdmuDir, newSfdmuConfig);
    } else if (hasConfig(sfdmuDir)) {
        config = await loadConfig(sfdmuDir);
    } else {
        throw Error(`Config not found.`);
    }
    for (let objectConfig of config.objects) {
        const { operation, useDecomposition } = objectConfig;
        const objectName = getObjectName(objectConfig);
        const decompose = getDecomposeConfig(objectConfig);
        if (operations.includes(operation)) {
            const objectDir = path.join(sourceDir, objectName);
            const recordsDir = path.join(objectDir, 'records');
            if (await dirExists(recordsDir)) {
                const fields = await readYaml(path.join(objectDir, 'fields.yaml'));
                if (!isJsonMap(fields)) {
                    throw Error(`Corrupted file: fields.yaml`);
                }
                const headers = Object.keys(fields);
                const rows: string[][] = [headers];
                const csvFile = path.join(sfdmuDir, `${objectName}.csv`);
                console.log(`Generating ${csvFile}`);
                if (useDecomposition && decompose) {
                    for await (const recordDir of await walkDirectories(recordsDir)) {
                        if (recordDir.name.startsWith('.')) {
                            continue;
                        }
                        const baseRecord = await readYamlAs<Dictionary<JsonPrimitive>>(path.join(recordDir.path, '_record.yaml'));
                        rows.push(
                            headers.map((it) => {
                                if (decompose && has(decompose, it)) {
                                    return readFileSync(path.join(recordDir.path, `${it}.${decompose[it].ext}`)) ?? '';
                                }
                                return `${baseRecord[it]}`;
                            })
                        );
                    }
                } else {
                    for await (const recordFile of await walkFiles(recordsDir)) {
                        if (recordFile.name.startsWith('.')) {
                            continue;
                        }
                        const record = await readYamlAs<Dictionary<JsonPrimitive>>(recordFile.path);
                        rows.push(headers.map((it) => `${record[it]}`));
                    }
                }
                await writeCsv(csvFile, rows);
            } else {
                throw Error(`Source directory doesn't exist: ${recordsDir}`);
            }
        } else {
            console.log(`Operation "${operation}" not configured for convert. Target ignored: ${objectName}`);
        }
    }
}
