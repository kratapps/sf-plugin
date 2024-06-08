import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { yaml2csv } from '../../../../core/data/sfdmu/yaml2csv.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'data.sfdmu.yaml2csv');

export type KratappsDataSfdmuYaml2csvResult = {};

export default class KratappsDataSfdmuYaml2csv extends SfCommand<KratappsDataSfdmuYaml2csvResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'source-dir': Flags.string({
            summary: messages.getMessage('flags.source-dir.summary'),
            required: true
        }),
        'config-file': Flags.string({
            summary: messages.getMessage('flags.config-file.summary')
        }),
        'sfdmu-dir': Flags.string({
            summary: messages.getMessage('flags.sfdmu-dir.summary')
        })
    };

    public async run(): Promise<KratappsDataSfdmuYaml2csvResult> {
        const { flags } = await this.parse(KratappsDataSfdmuYaml2csv);
        const sourceDir = flags['source-dir'];
        const sfdmuDir = flags['sfdmu-dir'] ?? 'out';
        const configFile = flags['config-file'];
        await yaml2csv({
            sourceDir,
            configFile,
            sfdmuDir
        });
        return {};
    }
}
