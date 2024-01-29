import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('kratapps', 'kratapps.remote.deploy.start');

export type KratappsRemoteDeployStartResult = {
  path: string;
};

export default class KratappsRemoteDeployStart extends SfCommand<KratappsRemoteDeployStartResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    name: Flags.string({
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      char: 'n',
      required: false,
    }),
  };

  public async run(): Promise<KratappsRemoteDeployStartResult> {
    const { flags } = await this.parse(KratappsRemoteDeployStart);

    const name = flags.name ?? 'world';
    this.log(`hello ${name} from /Users/okratochvil/projects/sfdx-plugin/src/commands/kratapps/remote/deploy/start.ts`);
    return {
      path: '/Users/okratochvil/projects/sfdx-plugin/src/commands/kratapps/remote/deploy/start.ts',
    };
  }
}
