import {
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Interface_Implementation__c,
    symbtablesnap__Method__c,
    symbtablesnap__Method_Reference__c,
    symbtablesnap__Property__c
} from '../../types/symbtalesnap.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { queryAll, queryAllTooling } from '../../utils/salesforce.js';
import { AsyncApexJob, Organization } from '../../types/standard.js';
import { ApexClassMember, ApexTriggerMember } from '../../types/tooling.js';
import { QueryLoader } from '../../utils/queryLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Selector {
    conn: Connection;
    queryLoader: QueryLoader;

    constructor(conn: Connection) {
        this.conn = conn;
        this.queryLoader = new QueryLoader(path.join(__dirname, '../../queries/'));
    }

    async queryOrganization(): Promise<Organization> {
        const query = await this.queryLoader.loadQuery('organization.soql');
        const result = await this.conn.query<Organization>(query);
        return result.records[0];
    }

    async queryApexClassMembers(
        metadataContainerId: string,
        namespace: string | null,
        callback: (members: ApexClassMember[]) => Promise<void>
    ): Promise<void> {
        const query = await this.queryLoader.loadQuery('apexClassMembers.soql', {
            namespace,
            metadataContainerId
        });
        await queryAllTooling<ApexClassMember>(this.conn, query, async (result) => {
            await callback(result.records);
        });
    }

    async queryApexTriggerMembers(
        metadataContainerId: string,
        namespace: string | null,
        callback: (members: ApexTriggerMember[]) => Promise<void>
    ): Promise<void> {
        const query = await this.queryLoader.loadQuery('apexTriggerMembers.soql', {
            namespace,
            metadataContainerId
        });
        await queryAllTooling<ApexTriggerMember>(this.conn, query, async (result) => {
            await callback(result.records);
        });
    }

    async queryEnqueuedJobIds(): Promise<Set<string>> {
        const query = await this.queryLoader.loadQuery('enqueuedJobs.soql');
        const jobs = await this.conn.query<AsyncApexJob>(query);
        return new Set(jobs.records.map((it) => it.ApexClassId));
    }

    async queryApexClasses(snapshotId: string): Promise<symbtablesnap__Apex_Class__c[]> {
        const query = await this.queryLoader.loadQuery('apexClasses.soql', {
            snapshotId
        });
        const records: symbtablesnap__Apex_Class__c[] = [];
        await queryAll<symbtablesnap__Apex_Class__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryApexTriggers(snapshotId: string): Promise<symbtablesnap__Apex_Trigger__c[]> {
        const query = await this.queryLoader.loadQuery('apexTriggers.soql', {
            snapshotId
        });
        const records: symbtablesnap__Apex_Trigger__c[] = [];
        await queryAll<symbtablesnap__Apex_Trigger__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryInterfaceImplementations(snapshotId: string): Promise<symbtablesnap__Interface_Implementation__c[]> {
        const query = await this.queryLoader.loadQuery('interfaceImplementations.soql', {
            snapshotId
        });
        const records: symbtablesnap__Interface_Implementation__c[] = [];
        await queryAll<symbtablesnap__Interface_Implementation__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryMethods(snapshotId: string): Promise<symbtablesnap__Method__c[]> {
        const query = await this.queryLoader.loadQuery('methods.soql', {
            snapshotId
        });
        const records: symbtablesnap__Method__c[] = [];
        await queryAll<symbtablesnap__Method__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryProperties(snapshotId: string): Promise<symbtablesnap__Property__c[]> {
        const query = await this.queryLoader.loadQuery('properties.soql', {
            snapshotId
        });
        const records: symbtablesnap__Property__c[] = [];
        await queryAll<symbtablesnap__Property__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryMethodReferences(snapshotId: string): Promise<symbtablesnap__Method_Reference__c[]> {
        const query = await this.queryLoader.loadQuery('methodReferences.soql', {
            snapshotId
        });
        const records: symbtablesnap__Method_Reference__c[] = [];
        await queryAll<symbtablesnap__Method_Reference__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }
}
