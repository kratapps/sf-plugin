import { readJson } from '../utils/fs.js';

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

function parseObjectNameFromSoql(soql: string): string {
    return soql.split(' FROM ')[1].trim().split(' ')[0].trim();
}
