import path from 'path';
import fs from 'fs-extra';
import { isString } from '@salesforce/ts-types';

export class QueryLoader {
    private readonly queryDir;
    private readonly queriesByName = new Map<string, string>();

    constructor(queryDir: string) {
        this.queryDir = queryDir;
    }

    async loadQuery(name: string, params: { [name: string]: string | null } = {}): Promise<string> {
        if (!this.queriesByName.has(name)) {
            const query = await fs.readFile(path.join(this.queryDir, name), 'utf-8');
            this.queriesByName.set(name, query);
        }
        let query = this.queriesByName.get(name);
        if (!isString(query)) {
            throw Error('Query is empty.');
        }
        const paramsRequired = query.match(/\$\{.+}/g)?.map((it) => it.substring(2, it.length - 1));
        const paramsProvided = Object.keys(params);
        if (!paramsRequired || paramsRequired.length === 0) {
            if (paramsProvided.length > 0) {
                throw Error('Query expects no params.');
            }
            return query;
        }
        for (let it of paramsRequired) {
            if (!params.hasOwnProperty(it)) {
                throw Error(`Param not provided: ${it}`);
            }
        }
        for (let it of paramsProvided) {
            if (!paramsRequired.includes(it)) {
                throw Error(`Unknown param: ${it}`);
            }
            const value = params[it];
            if (value !== null && value.includes("'")) {
                throw Error('Query parameter includes invalid characters.');
            }
            query = query.replace(`'\${${it}}'`, isString(value) ? `'${value}'` : 'NULL');
        }
        return query;
    }
}
