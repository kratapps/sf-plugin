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
    addRefField?: {
        referenceTo: string;
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

export async function generateQuery(
    conn: Connection,
    objectName: string,
    outputDir: string,
    opts: Options,
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
                opts.byDefault === 'all'
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
                            .map((parent) => `${describe.relationshipName}.${parent.field}`)
                    );
                }
                if (opts.addRefField) {
                    result.push(
                        ...opts.addRefField
                            .filter(({ referenceTo }) => describe.referenceTo?.some((test) => localeCompareIgnoreCase(test, referenceTo)))
                            .map((parent) => `${describe.relationshipName}.${parent.field}`)
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
