import {
    SnapshotSObjectType,
    SnapshotRecord,
    symbtablesnap__Symbol_Table_Snapshot__c,
    SObjectSnapshotRecord,
    SnapshotRecordFields,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Method__c
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
import { Selector } from '../data/selector.js';
import { SnapshotData } from '../data/snapshotData.js';

type Relationship = {
    record: SnapshotRecord;
    relatedToField: string;
    relatedTo: SObjectSnapshotRecord;
};

const sObjectOrder: SnapshotSObjectType[] = [
    'symbtablesnap__Symbol_Table_Snapshot__c',
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
    verbose: boolean = false;
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
    relationships: Relationship[] = [];
    recordsByKey: { [key in SnapshotSObjectType]: SnapshotRecord } = {};

    constructor(metadataContainerId: string, targetConn: Connection, snapshotConn: Connection) {
        this.metadataContainerId = metadataContainerId;
        this.snapshot = newSnapshot();
        this.targetConn = targetConn;
        this.conn = snapshotConn;
        for (let sObjectType of sObjectOrder) {
            this.toUpsert[sObjectType] = [];
        }
        this.relationships = [];
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
        this.relationships.push({
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
            for (let key of Object.keys(record)) {
                // @ts-ignore
                const value = record[key];
                if (value !== undefined) {
                    this.recordsByKey[key] = value;
                }
            }
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
                this.resolveRelationships();
                const res = await this.conn.sobject(sObjectType).upsertBulk(records, 'symbtablesnap__Snapshot_Key__c');
                res.forEach((it, idx) => {
                    if (it.success) {
                        records[idx].Id = it.id || undefined;
                    } else {
                        console.log(records[idx]);
                        console.error(it);
                        throw it.errors[0];
                    }
                });
                this.toUpsert[sObjectType] = [];
            }
        }
    }

    private resolveRelationships() {
        for (let rel of this.relationships) {
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
    context.snapshot.symbtablesnap__Is_Latest__c = true;
    context.registerUpsert(context.snapshot);
    await context.commit();
    await updateLookups(context);
}

async function updateLookups(context: Context) {
    context.verbose = true;
    for (let sObjectType of sObjectOrder) {
        context.toUpsert[sObjectType] = [];
        context.relationships = [];
    }
    context.recordsByKey = {};
    console.log('Updating lookup IDs...');
    const selector = new Selector(context.conn);
    const snapshot = new SnapshotData();
    const snapshotId = context.snapshot.Id!;
    snapshot.apexClasses = await selector.queryApexClasses(snapshotId);
    snapshot.apexTriggers = await selector.queryApexTriggers(snapshotId);
    snapshot.interfaceImplementations = await selector.queryInterfaceImplementations(snapshotId);
    snapshot.methods = await selector.queryMethods(snapshotId);
    snapshot.properties = await selector.queryProperties(snapshotId);
    snapshot.methodReferences = await selector.queryMethodReferences(snapshotId);
    const declaredClasses: Record<string, symbtablesnap__Apex_Class__c> = {};
    const methodsByNames: Record<string, symbtablesnap__Method__c[]> = {};
    for (let apexClass of snapshot.apexClasses) {
        declaredClasses[apexClass.symbtablesnap__Full_Name__c!] = apexClass;
    }
    for (let method of snapshot.methods) {
        if (!methodsByNames.hasOwnProperty(method.symbtablesnap__Method_Name__c!)) {
            methodsByNames[method.symbtablesnap__Method_Name__c!] = [];
        }
        methodsByNames[method.symbtablesnap__Method_Name__c!].push(method);
    }
    for (let apexClass of snapshot.apexClasses) {
        if (
            apexClass.symbtablesnap__Extends_Full_Name__c &&
            declaredClasses.hasOwnProperty(apexClass.symbtablesnap__Extends_Full_Name__c)
        ) {
            // apexClass.symbtablesnap__Extends_Class__c = declaredClasses[apexClass.symbtablesnap__Extends_Full_Name__c].Id;
            // console.log('upsert class', apexClass.symbtablesnap__Snapshot_Key__c);
            context.registerRelationship(
                apexClass,
                'symbtablesnap__Extends_Class__c',
                declaredClasses[apexClass.symbtablesnap__Extends_Full_Name__c]
            );
            context.registerUpsert(apexClass);
        }
        if (
            apexClass.symbtablesnap__Top_Level_Full_Name__c &&
            declaredClasses.hasOwnProperty(apexClass.symbtablesnap__Top_Level_Full_Name__c)
        ) {
            // apexClass.symbtablesnap__Top_Level_Class__c = declaredClasses[apexClass.symbtablesnap__Top_Level_Full_Name__c].Id;
            // console.log('upsert class2', apexClass.symbtablesnap__Snapshot_Key__c);
            context.registerRelationship(
                apexClass,
                'symbtablesnap__Top_Level_Class__c',
                declaredClasses[apexClass.symbtablesnap__Top_Level_Full_Name__c]
            );
            context.registerUpsert(apexClass);
        }
    }
    for (let implementation of snapshot.interfaceImplementations) {
        // implementation.symbtablesnap__Implements_Interface__c = declaredClasses[implementation.symbtablesnap__Implements__c!]?.Id;
        // console.log('upsert impl');
        context.registerRelationship(
            implementation,
            'symbtablesnap__Implements_Interface__c',
            declaredClasses[implementation.symbtablesnap__Implements__c!]
        );
        context.registerUpsert(implementation);
    }
    for (let methodReference of snapshot.methodReferences) {
        const potentialMethods: symbtablesnap__Method__c[] = methodsByNames[methodReference.symbtablesnap__Referenced_Method_Name__c!];
        if (potentialMethods == null) {
            continue;
        }
        for (let potentialMethod of potentialMethods) {
            if (
                potentialMethod.symbtablesnap__Method_Name__c == methodReference.symbtablesnap__Referenced_Method_Name__c &&
                potentialMethod.symbtablesnap__Class__r!.symbtablesnap__Class_Name__c ==
                    methodReference.symbtablesnap__Referenced_Class_Name__c &&
                potentialMethod.symbtablesnap__Class__r!.symbtablesnap__Namespace_Prefix__c ==
                    methodReference.symbtablesnap__Referenced_Namespace__c
            ) {
                // methodReference.symbtablesnap__Referenced_Method__c = potentialMethod.Id;
                // console.log('upsert method ref');
                context.registerRelationship(methodReference, 'symbtablesnap__Referenced_Method__c', potentialMethod);
                context.registerUpsert(methodReference);
            }
        }
    }
    await context.commit();
    await updateMethodToMethodReferences(context, snapshot);
}

async function updateMethodToMethodReferences(context: Context, snapshot: SnapshotData) {
    console.log('Updating method to method reference...');
    // todo update references
    await context.commit();
    await updateReferencesScore(context, snapshot);
}

async function updateReferencesScore(context: Context, snapshot: SnapshotData) {
    console.log('Updating references score...');
    // todo update scores
    await context.commit();
    context.snapshot.symbtablesnap__Is_Latest__c = true;
    context.registerUpsert(context.snapshot);
    await context.commit();
}

async function queryOrganization(conn: Connection): Promise<Organization> {
    const result = await conn.query<Organization>('SELECT Id, NamespacePrefix FROM Organization LIMIT 1');
    return result.records[0];
}
