import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import path from 'path';
import { writeFile } from '../../../utils/fs.js';
import { generateQuery } from '../../../core/query/generate.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'query.generate');

export type KratappsQueryGenerateResult = {
    fields: string[];
    query: string;
};

export default class KratappsQueryGenerate extends SfCommand<KratappsQueryGenerateResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'target-org': Flags.requiredOrg({
            summary: messages.getMessage('flags.target-org.summary')
        }),
        'object-name': Flags.string({
            summary: messages.getMessage('flags.object-name.summary'),
            required: true
        }),
        'by-default': Flags.string({
            summary: messages.getMessage('flags.by-default.summary'),
            default: 'all',
            options: ['all', 'none']
        }),
        'type-is': Flags.string({
            summary: messages.getMessage('flags.type-is.summary'),
            multiple: true
        }),
        'type-is-not': Flags.string({
            summary: messages.getMessage('flags.type-is-not.summary'),
            multiple: true
        }),
        'name-is': Flags.string({
            summary: messages.getMessage('flags.name-is.summary'),
            multiple: true
        }),
        'name-is-not': Flags.string({
            summary: messages.getMessage('flags.name-is-not.summary'),
            multiple: true
        }),
        'relationship-name-is': Flags.string({
            summary: messages.getMessage('flags.relationship-name-is.summary'),
            multiple: true
        }),
        'relationship-name-is-not': Flags.string({
            summary: messages.getMessage('flags.relationship-name-is-not.summary'),
            multiple: true
        }),
        'is-auto-number': Flags.boolean({
            summary: messages.getMessage('flags.is-auto-number.summary')
        }),
        'is-not-auto-number': Flags.boolean({
            summary: messages.getMessage('flags.is-not-auto-number.summary')
        }),
        'is-calculated': Flags.boolean({
            summary: messages.getMessage('flags.is-calculated.summary')
        }),
        'is-not-calculate': Flags.boolean({
            summary: messages.getMessage('flags.is-not-calculate.summary')
        }),
        'is-createable': Flags.boolean({
            summary: messages.getMessage('flags.is-createable.summary')
        }),
        'is-not-createable': Flags.boolean({
            summary: messages.getMessage('flags.is-not-createable.summary')
        }),
        'is-custom': Flags.boolean({
            summary: messages.getMessage('flags.is-custom.summary')
        }),
        'is-not-custom': Flags.boolean({
            summary: messages.getMessage('flags.is-not-custom.summary')
        }),
        'is-encrypted': Flags.boolean({
            summary: messages.getMessage('flags.is-encrypted.summary')
        }),
        'is-not-encrypted': Flags.boolean({
            summary: messages.getMessage('flags.is-not-encrypted.summary')
        }),
        'is-external-id': Flags.boolean({
            summary: messages.getMessage('flags.is-external-id.summary')
        }),
        'is-not-external-id': Flags.boolean({
            summary: messages.getMessage('flags.is-not-external-id.summary')
        }),
        'is-name-field': Flags.boolean({
            summary: messages.getMessage('flags.is-name-field.summary')
        }),
        'is-not-name-field': Flags.boolean({
            summary: messages.getMessage('flags.is-not-name-field.summary')
        }),
        'is-nillable': Flags.boolean({
            summary: messages.getMessage('flags.is-nillable.summary')
        }),
        'is-not-nillable': Flags.boolean({
            summary: messages.getMessage('flags.is-not-nillable.summary')
        }),
        'is-unique': Flags.boolean({
            summary: messages.getMessage('flags.is-unique.summary')
        }),
        'is-not-unique': Flags.boolean({
            summary: messages.getMessage('flags.is-not-unique.summary')
        }),
        'is-updateable': Flags.boolean({
            summary: messages.getMessage('flags.is-updateable.summary')
        }),
        'is-not-updateable': Flags.boolean({
            summary: messages.getMessage('flags.is-not-updateable.summary')
        }),
        'add-parent-field': Flags.string({
            summary: messages.getMessage('flags.add-parent-field.summary'),
            description: messages.getMessage('flags.add-parent-field.description'),
            multiple: true
        }),
        'add-ref-field': Flags.string({
            summary: messages.getMessage('flags.add-ref-field.summary'),
            description: messages.getMessage('flags.add-ref-field.description'),
            multiple: true
        })
    };

    public async run(): Promise<KratappsQueryGenerateResult> {
        const { flags } = await this.parse(KratappsQueryGenerate);
        const outputDir = 'data';
        const targetOrg = flags['target-org'];
        const objectName = flags['object-name'];
        const query = await generateQuery(
            targetOrg.getConnection(),
            objectName,
            outputDir,
            {
                byDefault: flags['by-default'] === 'all' ? 'all' : 'none',
                typeIs: flags['type-is'],
                typeIsNot: flags['type-is-not'],
                nameIs: flags['name-is'],
                nameIsNot: flags['name-is-not'],
                relationshipNameIs: flags['relationship-name-is'],
                relationshipNameIsNot: flags['relationship-name-is-not'],
                addParentField: parseParentField(flags['add-parent-field']),
                addRefField: parseRefField(flags['add-ref-field']),
                isAutoNumber: flags['is-auto-number'],
                isNotAutoNumber: flags['is-not-auto-number'],
                isCalculated: flags['is-calculated'],
                isNotCalculated: flags['is-not-calculated'],
                isCreateable: flags['is-createable'],
                isNotCreateable: flags['is-not-createable'],
                isCustom: flags['is-custom'],
                isNotCustom: flags['is-not-custom'],
                isEncrypted: flags['is-encrypted'],
                isNotEncrypted: flags['is-not-encrypted'],
                isExternalId: flags['is-external-id'],
                isNotExternalId: flags['is-not-external-id'],
                isNameField: flags['is-name-field'],
                isNotNameField: flags['is-not-name-field'],
                isNillable: flags['is-nillable'],
                isNotNillable: flags['is-not-nillable'],
                isUnique: flags['is-unique'],
                isNotUnique: flags['is-not-unique'],
                isUpdateable: flags['is-updateable'],
                isNotUpdateable: flags['is-not-updateable']
            },
            false
        );
        const queryString = query.toQueryString({ pretty: true });
        await writeFile(path.join(outputDir, objectName, 'query.soql'), queryString);
        return {
            fields: query.fields,
            query: queryString
        };
    }
}

function parseParentField(values?: string[]) {
    const splitter = '.';
    return (values ?? []).map((it) => {
        if (!it.includes(splitter)) {
            throw Error(`Value for --add-parent-field must be as <relationshipName>${splitter}<parentFieldName>`);
        }
        const [relationshipName, field] = it.split(splitter);
        return {
            relationshipName,
            field
        };
    });
}

function parseRefField(values?: string[]) {
    const splitter = ':';
    return (values ?? []).map((it) => {
        if (!it.includes(splitter)) {
            throw Error(`Value for --add-ref-field must be as <referenceTo>${splitter}<parentFieldName>`);
        }
        const [referenceTo, field] = it.split(splitter);
        return {
            referenceTo,
            field
        };
    });
}
