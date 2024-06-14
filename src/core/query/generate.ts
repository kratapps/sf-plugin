import { describeObject } from '../../utils/describe.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { localeCompareIgnoreCase } from '../../utils/string.js';
import { isPlainObject } from '@salesforce/ts-types/lib/narrowing/is.js';
import { ensure, has, hasArray, hasBoolean, hasString, isString, Optional } from '@salesforce/ts-types';

interface Query {
    fields: string[];
    toQueryString({ pretty }: { pretty?: boolean }): string;
}

export interface GenerateQueryOptions {
    byDefault?: 'all' | 'none';
    typeIs?: string[];
    typeIsNot?: string[];
    nameIs?: string[];
    nameIsNot?: string[];
    relationshipNameIs?: string[];
    relationshipNameIsNot?: string[];
    isAutoNumber?: boolean;
    isNotAutoNumber?: boolean;
    isCalculated?: boolean;
    isNotCalculated?: boolean;
    isCreateable?: boolean;
    isNotCreateable?: boolean;
    isCustom?: boolean;
    isNotCustom?: boolean;
    isEncrypted?: boolean;
    isNotEncrypted?: boolean;
    isExternalId?: boolean;
    isNotExternalId?: boolean;
    isNameField?: boolean;
    isNotNameField?: boolean;
    isNillable?: boolean;
    isNotNillable?: boolean;
    isUnique?: boolean;
    isNotUnique?: boolean;
    isUpdateable?: boolean;
    isNotUpdateable?: boolean;
    addParentField?: {
        relationshipName: string;
        field: string;
    }[];
    addRefField?: {
        referenceTo: string;
        field: string;
    }[];
}

export function ensureGenerateQueryOptions(value: unknown, message?: string): Optional<GenerateQueryOptions> {
    return ensure(asGenerateQueryOptions(value), message ?? 'Not a valid config.');
}

export function asGenerateQueryOptions(value: unknown, defaultValue?: GenerateQueryOptions): Optional<GenerateQueryOptions> {
    return isGenerateQueryOptions(value) ? value : defaultValue;
}

export function isGenerateQueryOptions(value: unknown): value is GenerateQueryOptions {
    return (
        isPlainObject(value) &&
        (!has(value, 'byDefault') || (hasString(value, 'byDefault') && ['all', 'none'].includes(value.byDefault))) &&
        (!has(value, 'typeIs') || (hasArray(value, 'typeIs') && value.typeIs.every(isString))) &&
        (!has(value, 'typeIsNot') || (hasArray(value, 'typeIsNot') && value.typeIsNot.every(isString))) &&
        (!has(value, 'nameIs') || (hasArray(value, 'nameIs') && value.nameIs.every(isString))) &&
        (!has(value, 'nameIsNot') || (hasArray(value, 'nameIsNot') && value.nameIsNot.every(isString))) &&
        (!has(value, 'relationshipNameIs') || (hasArray(value, 'relationshipNameIs') && value.relationshipNameIs.every(isString))) &&
        (!has(value, 'relationshipNameIsNot') ||
            (hasArray(value, 'relationshipNameIsNot') && value.relationshipNameIsNot.every(isString))) &&
        (!has(value, 'isAutoNumber') || hasBoolean(value, 'isAutoNumber')) &&
        (!has(value, 'isNotAutoNumber') || hasBoolean(value, 'isNotAutoNumber')) &&
        (!has(value, 'isCalculated') || hasBoolean(value, 'isCalculated')) &&
        (!has(value, 'isNotCalculated') || hasBoolean(value, 'isNotCalculated')) &&
        (!has(value, 'isCreateable') || hasBoolean(value, 'isCreateable')) &&
        (!has(value, 'isNotCreateable') || hasBoolean(value, 'isNotCreateable')) &&
        (!has(value, 'isCustom') || hasBoolean(value, 'isCustom')) &&
        (!has(value, 'isNotCustom') || hasBoolean(value, 'isNotCustom')) &&
        (!has(value, 'isEncrypted') || hasBoolean(value, 'isEncrypted')) &&
        (!has(value, 'isNotEncrypted') || hasBoolean(value, 'isNotEncrypted')) &&
        (!has(value, 'isExternalId') || hasBoolean(value, 'isExternalId')) &&
        (!has(value, 'isNotExternalId') || hasBoolean(value, 'isNotExternalId')) &&
        (!has(value, 'isNameField') || hasBoolean(value, 'isNameField')) &&
        (!has(value, 'isNotNameField') || hasBoolean(value, 'isNotNameField')) &&
        (!has(value, 'isNillable') || hasBoolean(value, 'isNillable')) &&
        (!has(value, 'isNotNillable') || hasBoolean(value, 'isNotNillable')) &&
        (!has(value, 'isUnique') || hasBoolean(value, 'isUnique')) &&
        (!has(value, 'isNotUnique') || hasBoolean(value, 'isNotUnique')) &&
        (!has(value, 'isUpdateable') || hasBoolean(value, 'isUpdateable')) &&
        (!has(value, 'isNotUpdateable') || hasBoolean(value, 'isNotUpdateable')) &&
        (!has(value, 'addParentField') ||
            (hasArray(value, 'addParentField') &&
                value.addParentField.every((it) => hasString(it, 'relationshipName') && hasString(it, 'field')))) &&
        (!has(value, 'addRefField') ||
            (hasArray(value, 'addRefField') && value.addRefField.every((it) => hasString(it, 'referenceTo') && hasString(it, 'field'))))
    );
}

export function mergeGenerateQueryOptions(opts1: GenerateQueryOptions = {}, opts2: GenerateQueryOptions = {}): GenerateQueryOptions {
    function mergeArrays(arr1: Optional<any[]>, arr2: Optional<any[]>) {
        return [...(arr1 ?? []), ...(arr2 ?? [])];
    }
    const copy = JSON.parse(JSON.stringify(opts1)) as GenerateQueryOptions;
    if (opts2.byDefault) {
        copy.byDefault = opts2.byDefault;
    }
    copy.typeIs = mergeArrays(copy.typeIs, opts2.typeIs);
    copy.typeIsNot = mergeArrays(copy.typeIsNot, opts2.typeIsNot);
    copy.nameIs = mergeArrays(copy.nameIs, opts2.nameIs);
    copy.nameIsNot = mergeArrays(copy.nameIsNot, opts2.nameIsNot);
    copy.relationshipNameIs = mergeArrays(copy.relationshipNameIs, opts2.relationshipNameIs);
    copy.relationshipNameIsNot = mergeArrays(copy.relationshipNameIsNot, opts2.relationshipNameIsNot);
    copy.isAutoNumber = copy.isAutoNumber || opts2.isAutoNumber;
    copy.isNotAutoNumber = copy.isNotAutoNumber || opts2.isNotAutoNumber;
    copy.isCalculated = copy.isCalculated || opts2.isCalculated;
    copy.isNotCalculated = copy.isNotCalculated || opts2.isNotCalculated;
    copy.isCreateable = copy.isCreateable || opts2.isCreateable;
    copy.isNotCreateable = copy.isNotCreateable || opts2.isNotCreateable;
    copy.isCustom = copy.isCustom || opts2.isCustom;
    copy.isNotCustom = copy.isNotCustom || opts2.isNotCustom;
    copy.isEncrypted = copy.isEncrypted || opts2.isEncrypted;
    copy.isNotEncrypted = copy.isNotEncrypted || opts2.isNotEncrypted;
    copy.isExternalId = copy.isExternalId || opts2.isExternalId;
    copy.isNotExternalId = copy.isNotExternalId || opts2.isNotExternalId;
    copy.isNameField = copy.isNameField || opts2.isNameField;
    copy.isNotNameField = copy.isNotNameField || opts2.isNotNameField;
    copy.isNillable = copy.isNillable || opts2.isNillable;
    copy.isNotNillable = copy.isNotNillable || opts2.isNotNillable;
    copy.isUnique = copy.isUnique || opts2.isUnique;
    copy.isNotUnique = copy.isNotUnique || opts2.isNotUnique;
    copy.isUpdateable = copy.isUpdateable || opts2.isUpdateable;
    copy.isNotUpdateable = copy.isNotUpdateable || opts2.isNotUpdateable;
    copy.addParentField = mergeArrays(copy.addParentField, opts2.addParentField);
    copy.addRefField = mergeArrays(copy.addRefField, opts2.addRefField);
    return copy;
}

export async function generateQuery(
    conn: Connection,
    objectName: string,
    outputDir: string,
    opts: GenerateQueryOptions,
    refreshSchema: boolean
): Promise<Query> {
    const describe = await describeObject(conn, objectName, { outputDir, refreshSchema });
    const fields = describe.fields
        .map((describe) => {
            const result: string[] = [];
            if (
                opts.typeIsNot?.includes(describe.type) ||
                opts.nameIsNot?.includes(describe.name) ||
                (describe.relationshipName && opts.relationshipNameIsNot?.includes(describe.relationshipName)) ||
                (opts.isNotAutoNumber && describe.autoNumber) ||
                (opts.isNotCalculated && describe.calculated) ||
                (opts.isNotCreateable && describe.createable) ||
                (opts.isNotCustom && describe.custom) ||
                (opts.isNotEncrypted && describe.encrypted) ||
                (opts.isNotExternalId && describe.externalId) ||
                (opts.isNotNameField && describe.nameField) ||
                (opts.isNotNillable && describe.nillable) ||
                (opts.isNotUnique && describe.unique) ||
                (opts.isNotUpdateable && describe.updateable)
            ) {
                return result;
            }
            if (
                opts.typeIs?.includes(describe.type) ||
                opts.nameIs?.includes(describe.name) ||
                (describe.relationshipName && opts.nameIs?.includes(describe.name)) ||
                (opts.isAutoNumber && describe.autoNumber) ||
                (opts.isCalculated && describe.calculated) ||
                (opts.isCreateable && describe.createable) ||
                (opts.isCustom && describe.custom) ||
                (opts.isEncrypted && describe.encrypted) ||
                (opts.isExternalId && describe.externalId) ||
                (opts.isNameField && describe.nameField) ||
                (opts.isNillable && describe.nillable) ||
                (opts.isUnique && describe.unique) ||
                (opts.isUpdateable && describe.updateable) ||
                opts.byDefault !== 'none'
            ) {
                result.push(describe.name);
            }
            if (describe.type === 'reference') {
                if (opts.addParentField) {
                    result.push(
                        ...opts.addParentField
                            .filter(
                                ({ relationshipName }) =>
                                    describe.relationshipName && localeCompareIgnoreCase(relationshipName, describe.relationshipName)
                            )
                            .map((parent) => parent.field.split(',').map((field) => `${describe.relationshipName}.${parent.field}`))
                            .flat()
                    );
                }
                if (opts.addRefField) {
                    result.push(
                        ...opts.addRefField
                            .filter(({ referenceTo }) => describe.referenceTo?.some((test) => localeCompareIgnoreCase(test, referenceTo)))
                            .map((parent) => parent.field.split(',').map((field) => `${describe.relationshipName}.${field}`))
                            .flat()
                    );
                }
            }
            return result;
        })
        .flat();
    return {
        fields,
        toQueryString({ pretty } = { pretty: false }) {
            const nl = pretty ? '\n' : '';
            const fieldsString = fields.map((it) => `${pretty ? '    ' : ''}${it}`).join(`,${nl}`);
            return `SELECT${nl}${fieldsString}${nl}FROM ${objectName}${nl}`;
        }
    };
}
