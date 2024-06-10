import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { csv2yaml } from '../../../core/data/csv2yaml.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'data.csv2yaml');

export type KratappsDataCsv2yamlResult = {};

export default class KratappsDataCsv2yaml extends SfCommand<KratappsDataCsv2yamlResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'preserve-existing': Flags.boolean({
            summary: messages.getMessage('flags.preserve-existing.summary'),
            default: false
        }),
        'external-id': Flags.string({
            summary: messages.getMessage('flags.external-id.summary'),
            description: messages.getMessage('flags.external-id.description'),
            required: true
        }),
        'csv-file': Flags.string({
            summary: messages.getMessage('flags.csv-file.summary'),
            required: true
        }),
        'object-name': Flags.string({
            summary: messages.getMessage('flags.object-name.summary'),
            description: messages.getMessage('flags.object-name.description')
        }),
        'output-dir': Flags.string({
            summary: messages.getMessage('flags.output-dir.summary')
        }),
        'schema-org': Flags.optionalOrg({
            summary: messages.getMessage('flags.schema-org.summary'),
            description: messages.getMessage('flags.schema-org.description')
        }),
        'refresh-schema': Flags.boolean({
            summary: messages.getMessage('flags.refresh-schema.summary'),
            default: false
        }),
        'external-id-separator': Flags.string({
            summary: messages.getMessage('flags.external-id-separator.summary'),
            default: ';'
        }),
        'external-value-separator': Flags.string({
            summary: messages.getMessage('flags.external-value-separator.summary'),
            default: ';'
        })
    };

    public async run(): Promise<KratappsDataCsv2yamlResult> {
        const { flags } = await this.parse(KratappsDataCsv2yaml);
        const preserveExisting = flags['preserve-existing'];
        const externalId = flags['external-id'];
        const csvFile = flags['csv-file'];
        const objectName = flags['object-name'];
        const sourceDir = flags['source-dir'];
        const schemaOrg = flags['schema-org'];
        const refreshSchema = flags['refresh-schema'];
        const externalIdSeparator = flags['external-id-separator'];
        const externalValueSeparator = flags['external-value-separator'];
        await csv2yaml({
            externalValueSeparator,
            preserveExisting,
            externalId: externalId.split(externalIdSeparator),
            csvFile,
            objectName,
            sourceDir,
            schemaOrg,
            refreshSchema
        });
        return {};
    }
}
