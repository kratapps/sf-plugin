import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ensureDir } from '../../../../utils/fs.js';
import { emptyDir } from 'fs-extra';
import { SfdmuConfig, writeConfig } from '../../../../sfdmu/config.js';
import { convertToSfdmuConfig, loadConfigExtended } from '../../../../sfdmu/configExtended.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'sfdmu.prepare.export');

export type KratappsSfdmuPrepareExportResult = {};

export default class KratappsSfdmuPrepareExport extends SfCommand<KratappsSfdmuPrepareExportResult> {
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
        })
    };

    public async run(): Promise<KratappsSfdmuPrepareExportResult> {
        const { flags } = await this.parse(KratappsSfdmuPrepareExport);
        const sfdmuDir = flags['sfdmu-dir'];
        const sourceDir = flags['source-dir'];
        await ensureDir(sfdmuDir);
        await emptyDir(sfdmuDir);
        const configExtended = await loadConfigExtended(sourceDir);
        const sfdmuConfig: SfdmuConfig = await convertToSfdmuConfig(sourceDir, configExtended);
        await writeConfig(sfdmuDir, sfdmuConfig);
        return {};
    }
}
