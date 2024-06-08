import { readJson } from '../utils/file.js';

export interface SfdmuConfig {
    excludeIdsFromCSVFiles?: boolean;
    objects: SfdmuObjectConfig[];
}

export interface SfdmuObjectConfig {
    query: string;
    operation: string;
    externalId: string;
    objectName: string;
}

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
