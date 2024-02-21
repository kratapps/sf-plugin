import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { compile } from '../../../utils/apexCompile.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'apex.compile');

export type KratappsApexCompileResult = {
    containerId: string;
};

export default class KratappsApexCompile extends SfCommand<KratappsApexCompileResult> {
    public static readonly summary = messages.getMessage('summary');
    public static readonly description = messages.getMessage('description');
    public static readonly examples = messages.getMessages('examples');

    public static readonly flags = {
        'target-org': Flags.requiredOrg({
            char: 'o',
            description: messages.getMessage('flags.target-org.description'),
            summary: messages.getMessage('flags.target-org.summary'),
            required: true
        })
    };

    public async run(): Promise<KratappsApexCompileResult> {
        const { flags } = await this.parse(KratappsApexCompile);
        const targetOrg = flags['target-org'];
        const { containerId } = await compile(targetOrg);
        return {
            containerId
        };
    }
}
