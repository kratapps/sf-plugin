import { FieldDeepDescribe } from '../../../utils/describe.js';

export type FieldsMeta = { [key: string]: FieldMeta | null };

export interface FieldMeta {
    type: string;
    soapType: string;
    referencePath?: string;
}

export async function describeFieldsMeta(fieldRecursive: { [key: string]: FieldDeepDescribe | null }): Promise<FieldsMeta> {
    const headersMeta: FieldsMeta = {};
    for (let f of Object.values(fieldRecursive)
        .filter((it) => !!it)
        .sort((a, b) => a!.field.localeCompare(b!.field))) {
        if (!f?.describe) {
            continue;
        }
        let leaf = f;
        const referenceTo = [];
        while (leaf.parent) {
            referenceTo.push(`[${(leaf.describe.referenceTo ?? []).join('|')}]`);
            leaf = leaf.parent;
        }
        const meta: FieldMeta = {
            type: leaf.describe.type,
            soapType: leaf.describe.soapType
        };
        if (referenceTo.length) {
            meta.referencePath = referenceTo.join('.') + '.' + leaf.describe.name;
        }
        headersMeta[f.field] = meta;
    }
    return headersMeta;
}
