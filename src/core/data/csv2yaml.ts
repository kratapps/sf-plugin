import { Org } from '@salesforce/core';
import { has, Optional } from '@salesforce/ts-types';
import { emptyDir } from 'fs-extra';
import { Field } from 'jsforce';
import path from 'path';
import { ensureDir, readCsvStream, sanitizeFile, writeYaml, writeFile } from '../../utils/fs.js';
import { deepFieldDescribe, describeObject, FieldDeepDescribe } from '../../utils/describe.js';
import { describeFieldsMeta, FieldsMeta } from './meta/describeFieldsMeta.js';
import { DecomposeConfig } from '../../sfdmu/decomposition.js';
import { localeCompareIgnoreCase } from '../../utils/string.js';

interface Options {
    projectDir?: string;
    preserveExisting: boolean;
    externalId: string[];
    csvFile: string;
    objectName?: string;
    sourceDir?: string;
    targetOrg?: Optional<Org>;
    refreshSchema: boolean;
    externalValueSeparator: string;
    decompose?: DecomposeConfig;
}

export async function csv2yaml({
    preserveExisting,
    externalId,
    csvFile,
    objectName,
    sourceDir = 'data',
    targetOrg,
    refreshSchema,
    externalValueSeparator,
    decompose = {}
}: Options) {
    const csvFileBaseName = path.basename(csvFile, path.extname(csvFile));
    let sObjectName = objectName ?? csvFileBaseName;
    const objectDir = path.join(sourceDir, sObjectName);
    const recordsDir = path.join(objectDir, 'records');
    await ensureDir(recordsDir);
    if (!preserveExisting) {
        await emptyDir(recordsDir);
    }
    const describe = targetOrg
        ? await describeObject(targetOrg?.getConnection(), sObjectName, { outputDir: sourceDir, refreshSchema })
        : null;
    const fileNamesCounter = new Map<string, number>();
    let headers: string[] | undefined;
    let externalIndexes: number[] = [];
    let size = 0;

    let fieldRecursive: { [key: string]: FieldDeepDescribe | null } = {};
    let headersMeta: FieldsMeta = {};
    const reportedDecomposedNotFoundFields: string[] = [];

    await readCsvStream(csvFile, async (row: string[]) => {
        if (!headers) {
            headers = row;
            externalIndexes = externalId.map((it) => headers?.indexOf(it) ?? -1).filter((it) => it !== -1);
            if (externalId.length !== externalIndexes.length) {
                throw Error('Some external IDs not found in the CSV.');
            }
            if (targetOrg) {
                for (let field of headers) {
                    fieldRecursive[field] = await deepFieldDescribe(targetOrg.getConnection(), sObjectName ?? csvFileBaseName, field, {
                        outputDir: sourceDir,
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
                headers
                    .map((field, headerIdx) => {
                        let fieldDescribe: Optional<Field>;
                        if (field.includes('.')) {
                            const relationshipName = field.split('.')[0];
                            fieldDescribe = describe?.fields?.find(
                                (it) => it.relationshipName && localeCompareIgnoreCase(it.relationshipName, relationshipName)
                            );
                        } else {
                            fieldDescribe = describe?.fields?.find((it) => localeCompareIgnoreCase(it.name, field));
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
                    .filter(([field]) => !has(decompose, `${field}`))
            );
            if (Object.keys(decompose).length) {
                const recordDir = path.join(recordsDir, fileName);
                await ensureDir(recordDir);
                for (const [field, objectDecomposeConfig] of Object.entries(decompose)) {
                    const fieldDescribe: Optional<Field> = describe?.fields?.find((it) => localeCompareIgnoreCase(it.name, field));
                    if (fieldDescribe) {
                        await writeFile(
                            path.join(recordDir, `${fieldDescribe.name}.${objectDecomposeConfig.ext}`),
                            row[headers.findIndex((it) => it === fieldDescribe.name)] ?? ''
                        );
                    } else if (!reportedDecomposedNotFoundFields.includes(field)) {
                        reportedDecomposedNotFoundFields.push(field);
                        console.error('Decomposed field not found or target org not provided:', field);
                    }
                }
                await writeYaml(path.join(recordDir, `_record.yaml`), record);
            } else {
                await writeYaml(path.join(recordsDir, `${fileName}.yaml`), record);
            }
        }
    });
}
