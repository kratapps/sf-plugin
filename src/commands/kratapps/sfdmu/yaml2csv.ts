import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { yaml2csv } from '../../../core/sfdmu/yaml2csv.js';
import { Operation } from '../../../sfdmu/config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'sfdmu.yaml2csv');

export type KratappsSfdmuYaml2csvResult = {};

const defaultOperations: Operation[] = ['Insert', 'Update', 'Upsert'];

export default class KratappsSfdmuYaml2csv extends SfCommand<KratappsSfdmuYaml2csvResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'source-dir': Flags.directory({
            summary: messages.getMessage('flags.source-dir.summary'),
            default: 'data',
            exists: true
        }),
        'sfdmu-dir': Flags.directory({
            summary: messages.getMessage('flags.sfdmu-dir.summary'),
            default: 'out'
        }),
        operations: Flags.string({
            summary: messages.getMessage('flags.operations.summary'),
            default: defaultOperations.join(';')
        })
    };

    public async run(): Promise<KratappsSfdmuYaml2csvResult> {
        const { flags } = await this.parse(KratappsSfdmuYaml2csv);
        const sourceDir = flags['source-dir'];
        const sfdmuDir = flags['sfdmu-dir'];
        const operations = flags['operations'].split(';') as Operation[];
        await yaml2csv({
            sourceDir,
            sfdmuDir,
            operations
        });
        return {};
    }
}
