import { Org } from '@salesforce/core';
import { Optional } from '@salesforce/ts-types';
import { emptyDir } from 'fs-extra';
import { Field } from 'jsforce';
import path from 'path';
import { readCsvStream, sanitizeFile, writeYaml } from '../../utils/file.js';
import { deepFieldDescribe, describeObject, FieldDeepDescribe } from '../../utils/describe.js';
import { describeFieldsMeta, FieldsMeta } from './meta/describeFieldsMeta.js';

interface Options {
    projectDir?: string;
    preserveExisting: boolean;
    externalId: string[];
    csvFile: string;
    objectName?: string;
    outputDir?: string;
    schemaOrg?: Optional<Org>;
    refreshSchema: boolean;
    externalValueSeparator: string;
}

export async function csv2yaml({
    preserveExisting,
    externalId,
    csvFile,
    objectName,
    outputDir,
    schemaOrg,
    refreshSchema,
    externalValueSeparator
}: Options) {
    const csvFileBaseName = path.basename(csvFile, path.extname(csvFile));
    let sObjectName = objectName ?? csvFileBaseName;
    const dir = outputDir ?? 'src';
    const recordsDir = path.join(dir, sObjectName, 'records');
    const metaDir = path.join(dir, sObjectName, 'meta');
    if (!preserveExisting) {
        await emptyDir(recordsDir);
    }
    const describe = schemaOrg ? await describeObject(schemaOrg?.getConnection(), sObjectName, { outputDir: dir, refreshSchema }) : null;
    const allExternalValues = new Set<string>();
    const allFileNames = new Set<string>();
    let headers: string[] | undefined;
    let externalIndexes: number[] = [];
    let size = 0;

    let fieldRecursive: { [key: string]: FieldDeepDescribe | null } = {};
    let headersMeta: FieldsMeta = {};

    if (schemaOrg) {
        await writeYaml(
            path.join(metaDir, 'tmp.yaml'),
            await describeFieldsMeta({
                Description: await deepFieldDescribe(schemaOrg.getConnection(), 'Contact', 'Description', { outputDir: dir }),
                'Account.Owner.CreatedBy.Name': await deepFieldDescribe(
                    schemaOrg.getConnection(),
                    'Contact',
                    'Account.Owner.CreatedBy.Name',
                    { outputDir: dir }
                ),
                'Account.Owner.Alias': await deepFieldDescribe(schemaOrg.getConnection(), 'Contact', 'Account.Owner.Alias', {
                    outputDir: dir
                }),
                'Account.OwnerId': await deepFieldDescribe(schemaOrg.getConnection(), 'Contact', 'Account.OwnerId', { outputDir: dir }),
                'Account.Owner.CreatedBy.Email': await deepFieldDescribe(
                    schemaOrg.getConnection(),
                    'Contact',
                    'Account.Owner.CreatedBy.Email',
                    { outputDir: dir }
                ),
                'Account.Owner.FirstName': await deepFieldDescribe(schemaOrg.getConnection(), 'Contact', 'Account.Owner.FirstName', {
                    outputDir: dir
                }),
                AccountId: await deepFieldDescribe(schemaOrg.getConnection(), 'Contact', 'AccountId', { outputDir: dir })
            })
        );
    }

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
            }
            await writeYaml(path.join(metaDir, 'fields.yaml'), headersMeta);
        } else if (externalIndexes && externalId && sObjectName) {
            size += 1;
            const externalValue = externalIndexes.map((it) => row[it]).join(externalValueSeparator);
            if (!externalValue) {
                console.error(`External value not found on row ${size}. Record ignored.`);
                return;
            }
            if (allExternalValues.has(externalValue)) {
                console.error(
                    `Duplicate external value "${externalValue}" on "${sObjectName}.${externalId}" on row ${size}. Record ignored.`
                );
                return;
            }
            allExternalValues.add(externalValue);
            const fileName = `${sanitizeFile(externalValue.replace(/\s+/g, '_'))}.yaml`;
            if (allFileNames.has(fileName)) {
                console.error(
                    `Duplicate file name for record where ${sObjectName}.${externalId} is "${externalValue}" on row ${size}. Record ignored.`
                );
                return;
            }
            allFileNames.add(fileName);
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
            await writeYaml(path.join(recordsDir, fileName), record);
        }
    });
}
