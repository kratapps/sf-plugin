import { readJson } from '../utils/file.js';

export interface SfdmuConfig {
    excludeIdsFromCSVFiles?: boolean;
    objects: SfdmuObjectConfig[];
}

export interface SfdmuObjectConfig {
    query: string;
    operation: string;
    externalId: string;
}

export async function loadConfig(exportFile: string): Promise<SfdmuConfig> {
    return readJson(exportFile);
}
