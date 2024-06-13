import { describeObject } from '../../utils/describe.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { localeCompareIgnoreCase } from '../../utils/string.js';

interface Query {
    fields: string[];
    toQueryString({ pretty }: { pretty?: boolean }): string;
}

interface Options {
    byDefault?: 'all' | 'none';

    typeIs?: string[];
    typeIsNot?: string[];
    nameIs?: string[];
    nameIsNot?: string[];
    relationshipNameIs?: string[];
    relationshipNameIsNot?: string[];

    addParentField?: {
        relationshipName: string;
        field: string;
    }[];

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
}

export async function generateQuery(conn: Connection, objectName: string, outputDir: string, opts: Options): Promise<Query> {
    const describe = await describeObject(conn, objectName, { outputDir, refreshSchema: false });
    const fields = describe.fields
        .map((it) => {
            const result: string[] = [];
            if (
                opts.typeIsNot?.includes(it.type) ||
                opts.nameIsNot?.includes(it.name) ||
                (it.relationshipName && opts.relationshipNameIsNot?.includes(it.relationshipName)) ||
                (opts.isNotAutoNumber && it.autoNumber) ||
                (opts.isNotCalculated && it.calculated) ||
                (opts.isNotCreateable && it.createable) ||
                (opts.isNotCustom && it.custom) ||
                (opts.isNotEncrypted && it.encrypted) ||
                (opts.isNotExternalId && it.externalId) ||
                (opts.isNotNameField && it.nameField) ||
                (opts.isNotNillable && it.nillable) ||
                (opts.isNotUnique && it.unique) ||
                (opts.isNotUpdateable && it.updateable)
            ) {
                return result;
            }
            if (
                opts.typeIs?.includes(it.type) ||
                opts.nameIs?.includes(it.name) ||
                (it.relationshipName && opts.nameIs?.includes(it.name)) ||
                (opts.isAutoNumber && it.autoNumber) ||
                (opts.isCalculated && it.calculated) ||
                (opts.isCreateable && it.createable) ||
                (opts.isCustom && it.custom) ||
                (opts.isEncrypted && it.encrypted) ||
                (opts.isExternalId && it.externalId) ||
                (opts.isNameField && it.nameField) ||
                (opts.isNillable && it.nillable) ||
                (opts.isUnique && it.unique) ||
                (opts.isUpdateable && it.updateable) ||
                opts.byDefault === 'all'
            ) {
                result.push(it.name);
            }
            if (it.type === 'reference' && it.relationshipName && opts.addParentField) {
                result.push(
                    ...opts.addParentField
                        .filter(
                            ({ relationshipName }) => it.relationshipName && localeCompareIgnoreCase(relationshipName, it.relationshipName)
                        )
                        .map((parent) => `${parent.relationshipName}.${parent.field}`)
                );
            }
            return result;
        })
        .flat();
    return {
        fields,
        toQueryString({ pretty } = { pretty: false }) {
            const fieldsString = fields.map((it) => `${pretty ? '    ' : ''}${it}`).join(pretty ? ',\n' : ',');
            return `SELECT${pretty ? '\n' : ''}${fieldsString}${pretty ? '\n' : ''}FROM ${objectName}`;
        }
    };
}
