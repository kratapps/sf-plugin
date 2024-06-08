import yaml from 'yaml';
import type { CreateNodeOptions, DocumentOptions, ParseOptions, SchemaOptions, ToStringOptions } from 'yaml';
import fs from 'fs-extra';
import sanitize = require('sanitize-filename');
import { parse as parseCsv } from 'csv-parse';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import path from 'path';

export async function fileExists(file: string): Promise<boolean> {
    try {
        return (await fs.stat(file)).isFile();
    } catch {
        return false;
    }
}

export async function dirExists(file: string): Promise<boolean> {
    try {
        return (await fs.stat(file)).isDirectory();
    } catch {
        return false;
    }
}

export async function readYaml(file: string): Promise<any> {
    return yaml.parse(await readFile(file));
}

export async function writeYaml(
    file: string,
    data: any,
    options?: DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions & ToStringOptions
): Promise<void> {
    await fs.ensureFile(file);
    return fs.writeFile(file, yaml.stringify(data, { aliasDuplicateObjects: false, ...(options ?? {}) }));
}

export function sanitizeFile(file: string): string {
    return sanitize(file);
}

export async function readFile(file: string): Promise<string> {
    return fs.readFile(file, 'utf8');
}

export async function writeFile(file: string, data: string): Promise<void> {
    await fs.ensureFile(file);
    return fs.writeFile(file, data, 'utf-8');
}

export async function readJson<T>(file: string): Promise<T> {
    return fs.readJson(file);
}

export async function writeJson(file: string, obj: any): Promise<void> {
    await fs.ensureFile(file);
    await fs.writeJson(file, obj, { spaces: 2 });
}

export async function readCsvHeader(file: string): Promise<string[]> {
    return new Promise((resolve) => {
        fs.createReadStream(file)
            .pipe(parseCsv({ columns: false, trim: true }))
            .on('headers', (headers) => {
                resolve(headers);
            });
    });
}

export async function readCsvStream(file: string, on: (row: string[]) => void): Promise<void> {
    return new Promise((resolve) => {
        fs.createReadStream(file)
            .pipe(parseCsv({ columns: false, trim: true }))
            .on('data', function (row) {
                on(row);
            })
            .on('end', function () {
                resolve();
            })
            .on('error', function (error) {
                console.error(error);
            });
    });
}

export async function writeCsv(file: string, obj: any): Promise<void> {
    return writeFile(file, stringifyCsv(obj));
}

export async function walkFiles(dir: string): Promise<{ path: string; name: string }[]> {
    const files = await fs.readdir(dir);
    const onlyFilePaths: { path: string; name: string }[] = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await fs.stat(filePath);
        if (fileStat.isFile()) {
            onlyFilePaths.push({
                path: filePath,
                name: file
            });
        }
    }
    return onlyFilePaths;
}
