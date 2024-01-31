import fs from 'fs-extra';
import { join } from 'path';
import { dirSync } from 'tmp';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Lifecycle, Messages, Org, SfError, SfProject } from '@salesforce/core';
import { isString, Optional, isArray, hasString } from '@salesforce/ts-types';
import { rimraf } from 'rimraf';
import {
    acceptHeader,
    getRepositoryContent,
    isRepositoryContent,
    RepositoryContent,
    StructuredFileLocation
} from '../../../../utils/github.js';
import { ProjectJson } from '@salesforce/core/lib/sfProject.js';
import { getTypeInfo, MetadataTypeInfo } from '../../../../utils/metadataTypeInfos.js';
import { executeDeploy, resolveApi } from '../../../../plugin-deploy-retrieve/deploy.js';
import { DeployProgress } from '../../../../plugin-deploy-retrieve/progressBar.js';
import { DeployVersionData } from '@salesforce/source-deploy-retrieve';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@kratapps/sf-plugin', 'remote.deploy.start');

export type KratappsRemoteDeployStartResult = {
    // path: string;
};

const exclusiveFlags = ['manifest', 'source-dir', 'metadata', 'metadata-dir'];

export default class KratappsRemoteDeployStart extends SfCommand<KratappsRemoteDeployStartResult> {
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
        'repo-owner': Flags.string({
            description: messages.getMessage('flags.repo-owner.description'),
            summary: messages.getMessage('flags.repo-owner.summary'),
            required: true
        }),
        'repo-name': Flags.string({
            description: messages.getMessage('flags.repo-name.description'),
            summary: messages.getMessage('flags.repo-name.summary'),
            required: true
        }),
        'repo-ref': Flags.string({
            description: messages.getMessage('flags.repo-ref.description'),
            summary: messages.getMessage('flags.repo-ref.summary')
        }),
        'source-dir': Flags.string({
            char: 'd',
            description: messages.getMessage('flags.source-dir.description'),
            summary: messages.getMessage('flags.source-dir.summary'),
            multiple: true,
            exclusive: exclusiveFlags.filter((f) => f !== 'source-dir')
        }),
        metadata: Flags.string({
            char: 'm',
            description: messages.getMessage('flags.metadata.description'),
            summary: messages.getMessage('flags.metadata.summary'),
            multiple: true,
            exclusive: exclusiveFlags.filter((f) => f !== 'metadata')
        }),
        token: Flags.string({
            description: messages.getMessage('flags.token.description'),
            summary: messages.getMessage('flags.token.summary')
        })
    };

    public async run(): Promise<KratappsRemoteDeployStartResult> {
        const startDir = process.cwd();
        try {
            const { flags } = await this.parse(KratappsRemoteDeployStart);
            const targetOrg = flags['target-org'];
            const repoOwner = flags['repo-owner'];
            const repoName = flags['repo-name'];
            const repoRef = flags['repo-ref'];
            const sourceDirs = flags['source-dir'];
            const metadata = flags['metadata'];
            const token = flags['token'];
            let { name: projectDir } = dirSync();
            process.chdir(projectDir);
            fs.outputJSONSync(`${projectDir}/sfdx-project.json`, createSfdxProjectJsonData());
            const project = await SfProject.resolve(projectDir);
            this.log(`Downloading source from github.com/${repoOwner}/${repoName}${repoRef ? `:${repoRef}` : '/'}`);
            if (sourceDirs?.length) {
                await Promise.all(
                    sourceDirs.map((sourceDir) =>
                        this.saveFileFromGithubRecursive(
                            projectDir,
                            {
                                owner: repoOwner,
                                repo: repoName,
                                path: sourceDir,
                                ref: repoRef
                            },
                            token
                        )
                    )
                );
            } else if (metadata?.length) {
                const requestedMetadata: RequestedMetadata[] = metadata.map(describeRequestedMetadata);
                await this.saveMetadataFromGithubRecursive(
                    projectDir,
                    requestedMetadata,
                    {
                        owner: repoOwner,
                        repo: repoName,
                        path: '/',
                        ref: repoRef
                    },
                    token
                );
            } else {
                throw new SfError('Nothing specified to deploy.');
            }
            // eslint-disable-next-line @typescript-eslint/require-await
            Lifecycle.getInstance().on('apiVersionDeploy', async (apiData: DeployVersionData) => {
                this.log(
                    messages.getMessage('apiVersionMsgDetailed', [
                        'Deploying',
                        flags['metadata-dir'] ? '<version specified in manifest>' : `v${apiData.manifestVersion}`,
                        targetOrg.getUsername(),
                        apiData.apiVersion,
                        apiData.webService
                    ])
                );
            });
            await this.deploy({
                project,
                targetOrg,
                sourceDirs,
                metadata
            });
            rimraf.sync(project.getPath());
        } catch (e) {
            throw e;
        } finally {
            process.chdir(startDir);
        }
        return {};
    }

    private async deploy({
        project,
        targetOrg,
        sourceDirs,
        metadata
    }: {
        project: SfProject;
        targetOrg: Org;
        sourceDirs: Optional<string[]>;
        metadata: Optional<string[]>;
    }): Promise<void> {
        const api = await resolveApi(this.configAggregator);
        const { deploy } = await executeDeploy(
            {
                'source-dir': sourceDirs ? sourceDirs.map((it) => `src/${it}`) : undefined,
                metadata,
                'target-org': targetOrg.getUsername(),
                'ignore-conflicts': true,
                api
            },
            this.config.bin,
            project
        );
        if (!deploy.id) {
            throw new SfError('The deploy id is not available.');
        }
        this.log(`Deploy ID: ${deploy.id}`);
        new DeployProgress(deploy, this.jsonEnabled()).start();
        try {
            await deploy.pollStatus();
        } catch (e: unknown) {
            if (!hasString(e, 'stack') || !e.stack.includes('SourceTracking.updateLocalTracking')) {
                throw e;
            }
        }
    }

    private async saveMetadataFromGithubRecursive(
        srcDir: string,
        metadata: RequestedMetadata[],
        target: StructuredFileLocation | string,
        token: Optional<string>
    ): Promise<void> {
        const promises = [];
        const content = await getRepositoryContent({
            target,
            accept: acceptHeader.json,
            token
        });
        if (isRepositoryContent(content)) {
            promises.push(this.visitMetadataFromGithubToSave(srcDir, metadata, content, token));
        } else if (isArray<RepositoryContent>(content)) {
            for (const item of content) {
                promises.push(this.visitMetadataFromGithubToSave(srcDir, metadata, item, token));
            }
        }
        await Promise.all(promises);
    }

    private async saveFileFromGithubRecursive(
        projectDir: string,
        target: StructuredFileLocation | string,
        token: Optional<string>
    ): Promise<void> {
        const promises = [];
        const content = await getRepositoryContent({
            target,
            accept: acceptHeader.json,
            token
        });
        if (isRepositoryContent(content)) {
            promises.push(this.visitFileFromGithubToSave(projectDir, content, token));
        } else if (isArray<RepositoryContent>(content)) {
            for (const item of content) {
                promises.push(this.visitFileFromGithubToSave(projectDir, item, token));
            }
        }
        await Promise.all(promises);
    }

    private async visitMetadataFromGithubToSave(
        projectDir: string,
        metadata: RequestedMetadata[],
        content: RepositoryContent,
        token: Optional<string>
    ): Promise<void> {
        const { type, path, name, url, download_url: downloadUrl } = content;
        if (type === 'file' && downloadUrl) {
            if (name.includes('.')) {
                const fileNameWithoutExt = name.split('.')[0];
                if (fileNameWithoutExt?.length) {
                    const pathParts = path.split('/');
                    const mdt = metadata.find(
                        (it) =>
                            (it.name === fileNameWithoutExt || pathParts.includes(it.name)) &&
                            pathParts.includes(it.info.directoryName) &&
                            (!it.info.parent || pathParts.includes(it.info.parent.directoryName))
                    );
                    if (mdt) {
                        this.info(path);
                        return saveFileFromGithub(join(projectDir, 'src', path), downloadUrl, token);
                    }
                }
            }
            return Promise.resolve();
        } else if (type === 'dir' && name !== 'node_modules') {
            return this.saveMetadataFromGithubRecursive(projectDir, metadata, url, token);
        }
    }

    private async visitFileFromGithubToSave(projectDir: string, content: RepositoryContent, token: Optional<string>): Promise<void> {
        const { type, path, url, download_url: downloadUrl } = content;
        if (type === 'file' && downloadUrl) {
            this.info(path);
            return saveFileFromGithub(join(projectDir, 'src', path), downloadUrl, token);
        } else if (type === 'dir') {
            return this.saveFileFromGithubRecursive(projectDir, url, token);
        }
    }
}

type RequestedMetadata = {
    info: MetadataTypeInfo;
    name: string;
};

function describeRequestedMetadata(metadataArg: string): RequestedMetadata {
    if (!metadataArg.includes(':')) {
        throw new SfError(`Invalid metadata: ${metadataArg}`);
    }
    const [metadataName, componentName] = metadataArg.split(':');
    const info = getTypeInfo(metadataName);
    if (!info?.metadataName) {
        throw new SfError(`Invalid metadata: ${metadataArg}`);
    } else if (!componentName.length) {
        throw new SfError(`Invalid metadata: ${metadataArg}`);
    }
    return {
        info,
        name: componentName
    };
}

async function saveFileFromGithub(path: string, target: string, token: Optional<string>): Promise<void> {
    const data = await getRepositoryContent({
        target,
        accept: acceptHeader.raw,
        token
    });
    if (isString(data)) {
        fs.outputFileSync(path, data);
    }
}

function createSfdxProjectJsonData(): ProjectJson {
    return {
        packageDirectories: [
            {
                path: 'src/',
                default: true
            }
        ],
        namespace: '',
        sfdcLoginUrl: 'https://login.salesforce.com',
        sourceApiVersion: '57.0'
    };
}
