import { Connection } from '@salesforce/core/lib/org/connection.js';
import { SaveResult, QueryResult, SObjectRecord } from 'jsforce';
import { queryAllTooling } from './salesforce.js';

type MetadataContainer = {
    Id: string;
};

type MemberType = 'ApexClassMember' | 'ApexTriggerMember';

type MemberRecord = {
    Id: string;
    Body: string;
    State: string;
};

type ContainerAsyncRequestRecord = SObjectRecord<any, any>;

type CreateApexClassMemberResult = {
    success: boolean;
    totalFailed: number;
    ids: string[];
};

export type CompileOptions = {
    apiVersion?: string;
};

export type CompileResult = {
    containerId: string;
};

async function createCleanContainer(conn: Connection, containerName: string): Promise<string> {
    const q = `SELECT Id FROM MetadataContainer WHERE Name = '${containerName}' AND IsDeleted = false`;
    const result: QueryResult<MetadataContainer> = await conn.tooling.query(q);
    if (result.records.length !== 0) {
        console.log(`Deleting MetadataContainer: ${result.records[0].Id}`);
        await conn.tooling.sobject('MetadataContainer').delete(result.records[0].Id);
    }
    const container = await conn.tooling.sobject('MetadataContainer').create({
        Name: containerName
    });
    if (!container.id) {
        throw Error('Container not created.');
    }
    console.log(`MetadataContainer created: ${container.id}`);
    return container.id;
}

function chunks<T>(arr: T[], chunkSize: number = 50): T[][] {
    const result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
    }
    return result;
}

async function createApexClassMember(
    conn: Connection,
    containerId: string,
    apexClasses: MemberRecord[],
    memberType: MemberType
): Promise<CreateApexClassMemberResult> {
    const result: CreateApexClassMemberResult = {
        success: true,
        totalFailed: 0,
        ids: []
    };
    if (apexClasses.length === 0) {
        return result;
    }
    let chunkedMembers = chunks(
        apexClasses.map((it) => ({
            Body: it.Body,
            ContentEntityId: it.Id,
            MetadataContainerId: containerId
        }))
    );
    for (let members of chunkedMembers) {
        const createResult: SaveResult[] = await conn.tooling.sobject(memberType).create(members, {
            allowRecursive: true
        });
        createResult.forEach((it: SaveResult) => {
            if (it.success) {
                result.ids.push(it.id);
            } else {
                result.success = false;
                result.totalFailed += 1;
                console.error(it.errors);
            }
        });
        if (!result.success) {
            throw new Error(`Compilation failed.`);
        }
    }
    return result;
}

async function compileClasses(conn: Connection, containerId: string, query: string, memberType: MemberType) {
    console.log(`Querying ${memberType === 'ApexClassMember' ? 'classes' : 'triggers'} to compile...`);
    await queryAllTooling<MemberRecord>(conn, query, async (result) => {
        await createApexClassMember(conn, containerId, result.records, memberType);
        console.log(`Compiled ${result.currentSize}/${result.totalSize}...`);
    });
}

async function validate(conn: Connection, containerId: string) {
    const asyncResult = await conn.tooling.sobject('ContainerAsyncRequest').create({
        MetadataContainerId: containerId,
        IsCheckOnly: true
    });
    if (!asyncResult.success) {
        console.error(asyncResult.errors);
        throw new Error(`Compilation failed.`);
    }
    return asyncResult.id;
}

async function getValidationStatus(conn: Connection, requestId: string) {
    const retrieveResult: ContainerAsyncRequestRecord = await conn.tooling.sobject('ContainerAsyncRequest').retrieve(requestId);
    return retrieveResult.State;
}

async function waitForValidationCompleted(conn: Connection, requestId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let waitValidationCompleted = setInterval(async () => {
            const state = await getValidationStatus(conn, requestId);
            if (state === 'Queued') {
                return;
            }
            clearInterval(waitValidationCompleted);
            if (state === 'Completed') {
                resolve();
            }
            reject(state);
        }, 2000);
    });
}

export async function compile(conn: Connection, options?: CompileOptions): Promise<CompileResult> {
    const containerId = await createCleanContainer(conn, 'KratappsSymbolTableSnapshot');
    const query =
        "SELECT Id, Body FROM ApexClass WHERE NamespacePrefix = null OR NamespacePrefix = 'symbtablesnap' ORDER BY CreatedDate DESC";
    await compileClasses(conn, containerId, query, 'ApexClassMember');
    const query2 =
        "SELECT Id, Body FROM ApexTrigger WHERE NamespacePrefix = null OR NamespacePrefix = 'symbtablesnap' ORDER BY CreatedDate DESC";
    await compileClasses(conn, containerId, query2, 'ApexTriggerMember');
    const requestId = await validate(conn, containerId);
    console.log(`Validation prepared ${requestId}, validating...`);
    await waitForValidationCompleted(conn, requestId);
    console.log('Validation successful.');
    return {
        containerId
    };
}
