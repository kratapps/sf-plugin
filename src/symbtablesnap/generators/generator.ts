import {
    SnapshotSObjectType,
    SnapshotRecord,
    symbtablesnap__Symbol_Table_Snapshot__c,
    SObjectSnapshotRecord,
    SnapshotRecordFields
} from '../../types/symbtalesnap.js';
import { AsyncApexJob, Organization } from '../../types/standard.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { queryAllTooling } from '../../utils/salesforce.js';
import { ApexClassGenerator } from './apexClassGenerator.js';
import { ApexTriggerGenerator } from './apexTriggerGenerator.js';
import { ApexClassMember, ApexTriggerMember } from '../../types/tooling.js';
import { newSnapshot } from '../factory/sObjectFactory.js';
import { InnerClassGenerator } from './innerClassGenerator.js';
import { InterfaceImplGenerator } from './interfaceImplGenerator.js';
import { MethodGenerator } from './methodGenerator.js';
import { PropertyGenerator } from './propertyGenerator.js';
import { MethodReferenceGenerator } from './methodReferenceGenerator.js';
import { MethodLocalReferenceGenerator } from './methodLocalReferenceGenerator.js';
import { MethodDeclarationGenerator } from './methodDeclarationGenerator.js';
import { hashCode } from '../../utils/hashUtils.js';

type Relationship = {
    record: SnapshotRecord;
    relatedToField: string;
    relatedTo: SObjectSnapshotRecord;
};

const sObjectOrder: SnapshotSObjectType[] = [
    'symbtablesnap__Apex_Class__c',
    'symbtablesnap__Apex_Trigger__c',
    'symbtablesnap__Method__c',
    'symbtablesnap__Property__c',
    'symbtablesnap__Interface_Implementation__c',
    'symbtablesnap__Method_Reference__c',
    'symbtablesnap__Declaration__c',
    'symbtablesnap__Method_Declaration__c'
];

export class Context {
    metadataContainerId: string;
    snapshot: symbtablesnap__Symbol_Table_Snapshot__c;
    targetConn: Connection;
    conn: Connection;
    enqueuedApexClassIds = new Set<string>();
    apexClassGenerator = new ApexClassGenerator(this);
    apexTriggerGenerator = new ApexTriggerGenerator(this);
    innerClassGenerator = new InnerClassGenerator(this);
    interfaceImplGenerator = new InterfaceImplGenerator(this);
    methodDeclarationGenerator = new MethodDeclarationGenerator(this);
    methodGenerator = new MethodGenerator(this);
    methodLocalReferenceGenerator = new MethodLocalReferenceGenerator(this);
    methodReferenceGenerator = new MethodReferenceGenerator(this);
    propertyGenerator = new PropertyGenerator(this);

    toUpsert: { [key: SnapshotSObjectType]: SnapshotRecord[] } = {};
    relationshipsByType: { [key in SnapshotSObjectType]: Relationship[] } = {};
    recordsByKey: { [key in SnapshotSObjectType]: SnapshotRecord } = {};

    constructor(metadataContainerId: string, targetConn: Connection, snapshotConn: Connection) {
        this.metadataContainerId = metadataContainerId;
        this.snapshot = newSnapshot();
        this.targetConn = targetConn;
        this.conn = snapshotConn;
        for (let sObjectType of sObjectOrder) {
            this.toUpsert[sObjectType] = [];
            this.relationshipsByType[sObjectType] = [];
        }
    }

    async markClassesAsEnqueued(): Promise<void> {
        const q =
            "SELECT ApexClassId FROM AsyncApexJob WHERE JobType = 'ScheduledApex' AND ApexClass.NamespacePrefix = null AND CronTriggerId IN (SELECT Id FROM CronTrigger WHERE CronJobDetail.JobType = '7' AND NextFireTime != NULL)";
        const jobs = await this.targetConn.query<AsyncApexJob>(q);
        for (let job of jobs.records) {
            this.enqueuedApexClassIds.add(job.ApexClassId);
        }
    }

    registerRelationship(record: SnapshotRecord, relatedToField: SnapshotRecordFields, relatedTo: SnapshotRecord) {
        this.relationshipsByType[record.attributes.type].push({
            record,
            relatedToField,
            relatedTo
        });
    }

    registerUpsert<T extends SnapshotRecord>(record: T): T {
        const key = record.symbtablesnap__Snapshot_Key__c;
        if (!key) {
            throw Error('Record without a key cannot be registered for upsert.');
        }
        if (this.recordsByKey.hasOwnProperty(key)) {
            Object.assign(this.recordsByKey[key], record);
        } else {
            this.toUpsert[record.attributes.type].push(record);
            this.recordsByKey[key] = record;
        }
        return this.recordsByKey[key] as T;
    }

    async commit() {
        for (let sObjectType of sObjectOrder) {
            const records = this.toUpsert[sObjectType];
            if (records.length > 0) {
                console.log('upsert', sObjectType, records.length);
                this.resolveRelationships(sObjectType);
                await this.conn.sobject(sObjectType).upsertBulk(records, 'symbtablesnap__Snapshot_Key__c');
                this.toUpsert[sObjectType] = [];
            }
        }
    }

    private resolveRelationships(sObjectType: SnapshotSObjectType) {
        const relationships = this.relationshipsByType[sObjectType];
        for (let rel of relationships) {
            const { record, relatedToField, relatedTo } = rel;
            // @ts-ignore
            record[relatedToField] = relatedTo.Id;
        }
    }
}

export async function generateSnapshot(context: Context): Promise<void> {
    const org = await queryOrganization(context.targetConn);
    context.snapshot = newSnapshot({
        symbtablesnap__Snapshot_Key__c: `${hashCode(new Date().toISOString())}`,
        symbtablesnap__Is_Latest__c: false,
        symbtablesnap__Org_ID__c: org.Id,
        symbtablesnap__Org_Namespace_Prefix__c: org.NamespacePrefix
    });
    const saveResult = await context.conn.sobject('symbtablesnap__Symbol_Table_Snapshot__c').create(context.snapshot);
    context.snapshot.Id = saveResult.id;
    console.log(`Snapshot record created: ${context.snapshot.Id}`);
    console.log('Querying AsyncApexJob to search for scheduled apex classes...');
    await context.markClassesAsEnqueued();
    console.log(`Using Metadata Container with ID ${context.metadataContainerId} to retrieve symbol table.`);
    const classQuery = `SELECT FullName, ContentEntityId, ContentEntity.Name, ContentEntity.NamespacePrefix, SymbolTable FROM ApexClassMember WHERE IsDeleted = FALSE AND (ContentEntity.NamespacePrefix = '${context.snapshot.symbtablesnap__Org_Namespace_Prefix__c}') AND MetadataContainerId = '${context.metadataContainerId}'`;
    const triggerQuery = `SELECT FullName, ContentEntityId, ContentEntity.Name, ContentEntity.NamespacePrefix, ContentEntity.Status, SymbolTable FROM ApexTriggerMember WHERE IsDeleted = FALSE AND (ContentEntity.NamespacePrefix = '${context.snapshot.symbtablesnap__Org_Namespace_Prefix__c}') AND MetadataContainerId = '${context.metadataContainerId}'`;
    await queryAllTooling<ApexClassMember>(context.targetConn, classQuery, async (result) => {
        await context.apexClassGenerator.generate(result.records);
    });
    await queryAllTooling<ApexTriggerMember>(context.targetConn, triggerQuery, async (result) => {
        await context.apexTriggerGenerator.generate(result.records);
    });
}

async function queryOrganization(conn: Connection): Promise<Organization> {
    const result = await conn.query<Organization>('SELECT Id, NamespacePrefix FROM Organization LIMIT 1');
    return result.records[0];
}
