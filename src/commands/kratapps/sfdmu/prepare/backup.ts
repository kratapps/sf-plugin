import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { prepareBackup } from '../../../../core/sfdmu/prepare/backup.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'sfdmu.prepare.backup');

export type KratappsSfdmuBackupPrepareResult = {};

export default class KratappsSfdmuBackupPrepare extends SfCommand<KratappsSfdmuBackupPrepareResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'sfdmu-dir': Flags.directory({
            summary: messages.getMessage('flags.sfdmu-dir.summary'),
            default: 'out'
        }),
        'source-dir': Flags.directory({
            summary: messages.getMessage('flags.source-dir.summary'),
            default: 'data',
            exists: true
        }),
        'schema-org': Flags.optionalOrg({
            summary: messages.getMessage('flags.schema-org.summary'),
            description: messages.getMessage('flags.schema-org.description')
        }),
        'refresh-schema': Flags.boolean({
            summary: messages.getMessage('flags.refresh-schema.summary'),
            default: false
        })
    };

    public async run(): Promise<KratappsSfdmuBackupPrepareResult> {
        const { flags } = await this.parse(KratappsSfdmuBackupPrepare);
        await prepareBackup({
            sfdmuDir: flags['sfdmu-dir'],
            sourceDir: flags['source-dir'],
            schemaOrg: flags['schema-org'],
            refreshSchema: flags['refresh-schema']
        });
        return {};
    }
}
