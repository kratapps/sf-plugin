import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { csv2yaml } from '../../../../core/data/sfdmu/csv2yaml.js';
import { Operation } from '../../../../sfdmu/config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'data.sfdmu.csv2yaml');

export type KratappsDataSfdmuCsv2yamlResult = {};

const defaultOperations: Operation[] = ['Insert', 'Update', 'Upsert'];

export default class KratappsDataSfdmuCsv2yaml extends SfCommand<KratappsDataSfdmuCsv2yamlResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'preserve-existing': Flags.boolean({
            summary: messages.getMessage('flags.preserve-existing.summary'),
            default: false
        }),
        'sfdmu-dir': Flags.string({
            summary: messages.getMessage('flags.sfdmu-dir.summary'),
            required: true
        }),
        'config-file': Flags.string({
            summary: messages.getMessage('flags.config-file.summary')
        }),
        'source-dir': Flags.string({
            summary: messages.getMessage('flags.source-dir.summary')
        }),
        'schema-org': Flags.optionalOrg({
            summary: messages.getMessage('flags.schema-org.summary'),
            description: messages.getMessage('flags.schema-org.description')
        }),
        'refresh-schema': Flags.boolean({
            summary: messages.getMessage('flags.refresh-schema.summary'),
            default: false
        }),
        operations: Flags.string({
            summary: messages.getMessage('flags.operations.summary'),
            default: defaultOperations.join(';')
        })
    };

    public async run(): Promise<KratappsDataSfdmuCsv2yamlResult> {
        const { flags } = await this.parse(KratappsDataSfdmuCsv2yaml);
        const preserveExisting = flags['preserve-existing'];
        const sfdmuDir = flags['sfdmu-dir'];
        const configFile = flags['config-file'];
        const sourceDir = flags['source-dir'];
        const schemaOrg = flags['schema-org'];
        const refreshSchema = flags['refresh-schema'];
        const operations = flags['operations'].split(';') as Operation[];
        await csv2yaml({
            preserveExisting,
            sfdmuDir,
            configFile,
            sourceDir,
            schemaOrg,
            refreshSchema,
            operations
        });
        return {};
    }
}
