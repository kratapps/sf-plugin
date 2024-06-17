import type { CreateNodeOptions, DocumentOptions, ParseOptions, SchemaOptions, ToStringOptions } from 'yaml';
import yaml from 'yaml';
import fs from 'fs-extra';
import { parse as parseCsv } from 'csv-parse';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import path from 'path';
import { AnyJson } from '@salesforce/ts-types';
import sanitize = require('sanitize-filename');

export function fileExistsSync(file: string): boolean {
    try {
        return fs.statSync(file).isFile();
    } catch {
        return false;
    }
}

export async function fileExists(file: string): Promise<boolean> {
    try {
        return (await fs.stat(file)).isFile();
    } catch {
        return false;
    }
}

export async function dirExists(dir: string): Promise<boolean> {
    try {
        return (await fs.stat(dir)).isDirectory();
    } catch {
        return false;
    }
}

export async function ensureDir(dir: string): Promise<void> {
    return fs.ensureDir(dir);
}

export async function readYamlAs<T>(file: string): Promise<T> {
    return yaml.parse(await readFile(file)) as T;
}

export async function readYaml(file: string): Promise<AnyJson> {
    return readYamlAs<AnyJson>(file);
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

export function readFileSync(file: string): string {
    return fs.readFileSync(file, 'utf8');
}

export async function writeFile(file: string, data: string): Promise<void> {
    await fs.ensureFile(file);
    return fs.writeFile(file, data, 'utf-8');
}

export async function readJsonAs<T>(file: string): Promise<T> {
    return fs.readJson(file);
}

export async function readJson(file: string): Promise<AnyJson> {
    return readJsonAs<AnyJson>(file);
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

export async function writeCsv(file: string, obj: string[][]): Promise<void> {
    return writeFile(file, stringifyCsv(obj));
}

export async function walkFiles(dir: string): Promise<{ path: string; name: string }[]> {
    return walk(dir).then((it) => it.filter((it) => it.isFile));
}

export async function walkDirectories(dir: string): Promise<{ path: string; name: string }[]> {
    return walk(dir).then((it) => it.filter((it) => it.isDirectory));
}

export async function walk(dir: string): Promise<{ path: string; name: string; isFile: boolean; isDirectory: boolean }[]> {
    const files = await fs.readdir(dir);
    const onlyFilePaths: { path: string; name: string; isFile: boolean; isDirectory: boolean }[] = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await fs.stat(filePath);
        onlyFilePaths.push({
            path: filePath,
            name: file,
            isFile: fileStat.isFile(),
            isDirectory: fileStat.isDirectory()
        });
    }
    return onlyFilePaths;
}
