import { Org } from '@salesforce/core';
import { Optional } from '@salesforce/ts-types';
import { emptyDir } from 'fs-extra';
import { Field } from 'jsforce';
import path from 'path';
import { ensureDir, readCsvStream, sanitizeFile, writeYaml } from '../../utils/fs.js';
import { deepFieldDescribe, describeObject, FieldDeepDescribe } from '../../utils/describe.js';
import { describeFieldsMeta, FieldsMeta } from './meta/describeFieldsMeta.js';

interface Options {
    projectDir?: string;
    preserveExisting: boolean;
    externalId: string[];
    csvFile: string;
    objectName?: string;
    sourceDir?: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
    externalValueSeparator: string;
}

export async function csv2yaml({
    preserveExisting,
    externalId,
    csvFile,
    objectName,
    sourceDir,
    schemaOrg,
    refreshSchema,
    externalValueSeparator
}: Options) {
    const csvFileBaseName = path.basename(csvFile, path.extname(csvFile));
    let sObjectName = objectName ?? csvFileBaseName;
    const dir = sourceDir ?? 'data';
    const objectDir = path.join(dir, sObjectName);
    const recordsDir = path.join(objectDir, 'records');
    await ensureDir(recordsDir);
    if (!preserveExisting) {
        await emptyDir(recordsDir);
    }
    const describe = schemaOrg ? await describeObject(schemaOrg?.getConnection(), sObjectName, { outputDir: dir, refreshSchema }) : null;
    const fileNamesCounter = new Map<string, number>();
    let headers: string[] | undefined;
    let externalIndexes: number[] = [];
    let size = 0;

    let fieldRecursive: { [key: string]: FieldDeepDescribe | null } = {};
    let headersMeta: FieldsMeta = {};

    await readCsvStream(csvFile, async (row: string[]) => {
        if (!headers) {
            headers = row;
            externalIndexes = externalId.map((it) => headers?.indexOf(it) ?? -1).filter((it) => it !== -1);
            if (externalId.length !== externalIndexes.length) {
                throw Error('Some external IDs not found in the CSV.');
            }
            if (schemaOrg) {
                for (let field of headers) {
                    fieldRecursive[field] = await deepFieldDescribe(schemaOrg.getConnection(), sObjectName ?? csvFileBaseName, field, {
                        outputDir: dir,
                        refreshSchema
                    });
                }
                headersMeta = await describeFieldsMeta(fieldRecursive);
                await writeYaml(path.join(objectDir, 'fields.yaml'), headersMeta);
            }
        } else if (externalIndexes && externalId && sObjectName) {
            size += 1;
            const externalValue = externalIndexes.map((it) => row[it]).join(externalValueSeparator);
            if (!externalValue) {
                console.error(`External value not found on row ${size}. Record ignored.`);
                return;
            }
            let fileName = sanitizeFile(externalValue.replace(/\s+/g, '_'));
            const count = fileNamesCounter.get(fileName) ?? 0;
            fileNamesCounter.set(fileName, count + 1);
            if (count > 0) {
                // Duplicate file name.
                console.warn(`File name conflict: ${externalValue}`);
                fileName += `_(${count})`;
            }
            const record: Record<string, any> = Object.fromEntries(
                headers.map((field, headerIdx) => {
                    let fieldDescribe: Optional<Field>;
                    if (field.includes('.')) {
                        const relationshipName = field.split('.')[0];
                        fieldDescribe = describe?.fields?.find((it) => it.relationshipName === relationshipName);
                    } else {
                        fieldDescribe = describe?.fields?.find((it) => it.name === field);
                    }
                    let value: string | boolean | number = row[headerIdx];
                    if (fieldDescribe?.type === 'boolean') {
                        value = value === 'true' ? true : value === 'false' ? false : value;
                    } else if (fieldDescribe && ['int'].includes(fieldDescribe.type)) {
                        value = value ? parseInt(value) : value;
                    } else if (fieldDescribe && ['double', 'currency', 'percent'].includes(fieldDescribe.type)) {
                        value = value ? parseFloat(value) : value;
                    }
                    return [field, value];
                })
            );
            await writeYaml(path.join(recordsDir, `${fileName}.yaml`), record);
        }
    });
}
