import { readJson, writeJson } from '../utils/fs.js';
import path from 'path';

export interface SfdmuConfig {
    excludeIdsFromCSVFiles?: boolean;
    objects: SfdmuObjectConfig[];
}

export interface SfdmuObjectConfig {
    query: string;
    operation: Operation;
    externalId: string;
    objectName: string;
}

export type Operation = 'Insert' | 'Update' | 'Upsert' | 'Readonly' | 'Delete' | 'HardDelete' | 'DeleteSource' | 'DeleteHierarchy';

export async function loadConfig(exportFile: string): Promise<SfdmuConfig> {
    const config = await readJson<SfdmuConfig>(exportFile);
    for (let objectConfig of config.objects) {
        objectConfig.objectName = parseObjectNameFromSoql(objectConfig.query);
    }
    return config;
}

export async function writeConfig(sfdmuDir: string, config: SfdmuConfig) {
    const exportJson = path.join(sfdmuDir, 'export.json');
    console.log('Writing SFDMU config: ', exportJson);
    console.log(JSON.stringify(config, null, 2));
    await writeJson(exportJson, config);
}

function parseObjectNameFromSoql(soql: string): string {
    return soql.split(' FROM ')[1].trim().split(' ')[0].trim();
}
