import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { compile } from '../../../../../utils/apexCompile.js';
import { Context, generateSnapshot } from '../../../../../symbtablesnap/generators/generator.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'symbol.table.snapshot.generate');

export type Result = {};

const exclusiveCompileFlags = ['compile', 'container-id'];

export default class SymbolTableSnapshotGenerate extends SfCommand<Result> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'target-org': Flags.requiredOrg({
            char: 'o',
            description: messages.getMessage('flags.target-org.description'),
            summary: messages.getMessage('flags.target-org.summary'),
            required: true
        }),
        'snapshot-org': Flags.optionalOrg({
            description: messages.getMessage('flags.snapshot-org.description'),
            summary: messages.getMessage('flags.snapshot-org.summary')
        }),
        compile: Flags.boolean({
            char: 'c',
            description: messages.getMessage('flags.compile.description'),
            summary: messages.getMessage('flags.compile.summary'),
            exclusive: exclusiveCompileFlags.filter((f) => f !== 'compile')
        }),
        'container-id': Flags.string({
            description: messages.getMessage('flags.compile.description'),
            summary: messages.getMessage('flags.compile.summary'),
            exclusive: exclusiveCompileFlags.filter((f) => f !== 'container-id')
        }),
        namespace: Flags.string({
            description: messages.getMessage('flags.compile.description'),
            summary: messages.getMessage('flags.compile.summary')
        })
    };

    public async run(): Promise<Result> {
        const { flags } = await this.parse(SymbolTableSnapshotGenerate);
        const targetOrg = flags['target-org'];
        const snapshotOrg = flags['snapshot-org'] || targetOrg;
        const containerIdFlag = flags['container-id'];
        const targetConn = targetOrg.getConnection();
        const conn = snapshotOrg.getConnection();
        const containerId = containerIdFlag ? containerIdFlag : (await compile(snapshotOrg.getConnection('40.0'))).containerId;
        await generateSnapshot(new Context(containerId, targetConn, conn));
        return {};
    }
}
