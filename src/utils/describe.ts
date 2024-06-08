import { Connection } from '@salesforce/core/lib/org/connection.js';
import { DescribeSObjectResult } from 'jsforce/src/types/index.js';
import { readJson, writeJson } from './fs.js';
import { Optional } from '@salesforce/ts-types';
import { Field } from 'jsforce';
import path from 'path';

const describeByObjectName = new Map<string, DescribeSObjectResult>();

export async function describeObject(
    conn: Connection,
    objectName: string,
    opts: { outputDir: string; refreshSchema: boolean }
): Promise<DescribeSObjectResult> {
    return describeByObjectName.get(objectName) ?? describeObjectCall(conn, objectName, opts);
}

async function describeObjectCall(
    conn: Connection,
    objectName: string,
    { outputDir, refreshSchema }: { outputDir: string; refreshSchema?: boolean }
): Promise<DescribeSObjectResult> {
    const file = path.join(outputDir, objectName, `meta/describe.json`);
    async function reload() {
        const describe = await conn.describe(objectName);
        await writeJson(file, describe);
        console.log(`${objectName} described and saved in file:`, file);
        describeByObjectName.set(objectName, describe);
        return describe;
    }
    if (refreshSchema) {
        return reload();
    }
    try {
        const describe = await readJson<DescribeSObjectResult>(file);
        describeByObjectName.set(objectName, describe);
        return describe;
    } catch (e) {
        return reload();
    }
}

export interface FieldDeepDescribe {
    objectName?: string;
    field: string;
    path: string;
    describe: Field;
    parent?: FieldDeepDescribe | null;
}

export async function deepFieldDescribe(
    conn: Connection,
    objectName: string,
    fieldPath: string,
    opts: { outputDir: string; refreshSchema?: boolean },
    parent?: FieldDeepDescribe
): Promise<FieldDeepDescribe | null> {
    let fieldDescribe: Optional<Field>;
    const describe = await describeObject(conn, objectName, {
        outputDir: opts.outputDir,
        refreshSchema: (parent && opts.refreshSchema) ?? false
    });
    if (fieldPath.includes('.')) {
        const fieldParts = fieldPath.split('.');
        const relationshipName = fieldParts[0];
        const fieldPathRest = fieldParts.slice(1).join('.');
        fieldDescribe = describe?.fields?.find((it) => it.relationshipName === relationshipName);
        if (fieldDescribe && fieldDescribe.relationshipName && fieldDescribe.referenceTo) {
            const newField: FieldDeepDescribe = {
                objectName: fieldDescribe.referenceTo[0],
                describe: fieldDescribe,
                field: fieldPath,
                path: `${parent?.path ? parent.path + '.' : ''}${relationshipName}`
            };
            if (parent) {
                parent.parent = newField;
            }
            await deepFieldDescribe(conn, fieldDescribe.referenceTo[0], fieldPathRest, opts, newField);
            return newField;
        }
    } else {
        fieldDescribe = describe?.fields?.find((it) => it.name === fieldPath);
        if (fieldDescribe) {
            const newField: FieldDeepDescribe = {
                describe: fieldDescribe,
                field: fieldPath,
                path: `${parent?.path ? parent.path + '.' : ''}${fieldPath}`
            };
            if (parent) {
                parent.parent = newField;
            }
            return newField;
        }
    }
    return null;
}
