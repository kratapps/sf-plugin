import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { csv2yaml } from '../../../core/sfdmu/csv2yaml.js';
import { Operation } from '../../../sfdmu/config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'sfdmu.csv2yaml');

export type KratappsSfdmuCsv2yamlResult = {};

const defaultOperations: Operation[] = ['Insert', 'Update', 'Upsert'];

export default class KratappsSfdmuCsv2yaml extends SfCommand<KratappsSfdmuCsv2yamlResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'preserve-existing': Flags.boolean({
            summary: messages.getMessage('flags.preserve-existing.summary'),
            default: false
        }),
        'sfdmu-dir': Flags.directory({
            summary: messages.getMessage('flags.sfdmu-dir.summary'),
            default: 'out',
            exists: true
        }),
        'source-dir': Flags.directory({
            summary: messages.getMessage('flags.source-dir.summary'),
            default: 'data'
        }),
        'target-org': Flags.optionalOrg({
            summary: messages.getMessage('flags.target-org.summary'),
            description: messages.getMessage('flags.target-org.description')
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

    public async run(): Promise<KratappsSfdmuCsv2yamlResult> {
        const { flags } = await this.parse(KratappsSfdmuCsv2yaml);
        const preserveExisting = flags['preserve-existing'];
        const sfdmuDir = flags['sfdmu-dir'];
        const sourceDir = flags['source-dir'];
        const targetOrg = flags['target-org'];
        const refreshSchema = flags['refresh-schema'];
        const operations = flags['operations'].split(';') as Operation[];
        await csv2yaml({
            preserveExisting,
            sfdmuDir,
            sourceDir,
            targetOrg,
            refreshSchema,
            operations
        });
        return {};
    }
}
