import {
    SnapshotRecord,
    SnapshotSObjectTypeName,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Interface_Implementation__c,
    symbtablesnap__Method__c,
    symbtablesnap__Method_Reference__c,
    symbtablesnap__Property__c,
    symbtablesnap__Symbol_Table_Snapshot__c
} from '../../types/symbtalesnap.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { ApexClassGenerator } from './apexClassGenerator.js';
import { ApexTriggerGenerator } from './apexTriggerGenerator.js';
import { InnerClassGenerator } from './innerClassGenerator.js';
import { InterfaceImplGenerator } from './interfaceImplGenerator.js';
import { MethodGenerator } from './methodGenerator.js';
import { PropertyGenerator } from './propertyGenerator.js';
import { MethodReferenceGenerator } from './methodReferenceGenerator.js';
import { MethodLocalReferenceGenerator } from './methodLocalReferenceGenerator.js';
import { MethodDeclarationGenerator } from './methodDeclarationGenerator.js';
import { hashCode } from '../../utils/hashUtils.js';
import { Selector } from '../data/selector.js';
import { ClassItem, classItemSorter, getClassItemsByEntityIds } from '../data/snapshotData.js';
import { buildGraph } from '../graph/buildGraph.js';
import { isString, Optional } from '@salesforce/ts-types';

type Relationship = {
    record: SnapshotRecord;
    relatedToField: string;
    relatedTo: SnapshotRecord;
};

const sObjectOrder: SnapshotSObjectTypeName[] = [
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

export async function newContext(metadataContainerId: string, targetConn: Connection, snapshotConn: Connection): Promise<Context> {
    const org = await new Selector(targetConn).queryOrganization();
    const snapshot: symbtablesnap__Symbol_Table_Snapshot__c = {
        attributes: {
            type: 'symbtablesnap__Symbol_Table_Snapshot__c',
            url: ''
        },
        symbtablesnap__Snapshot_Key__c: `${hashCode(new Date().toISOString())}`,
        symbtablesnap__Is_Latest__c: false,
        symbtablesnap__Org_ID__c: org.Id,
        symbtablesnap__Org_Namespace_Prefix__c: org.NamespacePrefix
    };
    return new Context(snapshot, metadataContainerId, targetConn, snapshotConn);
}

export class Context {
    verbose: boolean = false;
    metadataContainerId: string;
    snapshot: symbtablesnap__Symbol_Table_Snapshot__c;
    targetConn: Connection;
    conn: Connection;
    targetSelector: Selector;
    selector: Selector;
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

    toUpsert: { [key: SnapshotSObjectTypeName]: SnapshotRecord[] } = {};
    relationships: Relationship[] = [];
    recordsByKey: { [key in SnapshotSObjectTypeName]: SnapshotRecord } = {};
    recordsByType: { [key in SnapshotSObjectTypeName]: SnapshotRecord[] } = {};

    constructor(
        snapshot: symbtablesnap__Symbol_Table_Snapshot__c,
        metadataContainerId: string,
        targetConn: Connection,
        snapshotConn: Connection
    ) {
        this.snapshot = snapshot;
        this.metadataContainerId = metadataContainerId;
        this.targetConn = targetConn;
        this.conn = snapshotConn;
        this.targetSelector = new Selector(targetConn);
        this.selector = new Selector(snapshotConn);
        this.conn.bulk.pollInterval = 5000;
        this.conn.bulk.pollTimeout = 120000;
        this.clear();
    }

    clear() {
        for (let sObjectType of sObjectOrder) {
            this.toUpsert[sObjectType] = [];
            this.recordsByType[sObjectType] = [];
        }
        this.relationships = [];
    }

    apexClasses(): symbtablesnap__Apex_Class__c[] {
        return (this.recordsByType['symbtablesnap__Apex_Class__c'] || []) as symbtablesnap__Apex_Class__c[];
    }

    apexTriggers(): symbtablesnap__Apex_Trigger__c[] {
        return (this.recordsByType['symbtablesnap__Apex_Trigger__c'] || []) as symbtablesnap__Apex_Trigger__c[];
    }

    methods(): symbtablesnap__Method__c[] {
        return (this.recordsByType['symbtablesnap__Method__c'] || []) as symbtablesnap__Method__c[];
    }

    interfaceImplementations(): symbtablesnap__Interface_Implementation__c[] {
        return (this.recordsByType['symbtablesnap__Interface_Implementation__c'] || []) as symbtablesnap__Interface_Implementation__c[];
    }

    methodReferences(): symbtablesnap__Method_Reference__c[] {
        return (this.recordsByType['symbtablesnap__Method_Reference__c'] || []) as symbtablesnap__Method_Reference__c[];
    }

    properties(): symbtablesnap__Property__c[] {
        return (this.recordsByType['symbtablesnap__Property__c'] || []) as symbtablesnap__Property__c[];
    }

    async markClassesAsEnqueued(): Promise<void> {
        this.enqueuedApexClassIds = await this.targetSelector.queryEnqueuedJobIds();
    }

    registerRelationship(record: SnapshotRecord, relatedToField: string, relatedTo: SnapshotRecord) {
        if (!relatedTo) {
            throw Error('ups');
        }
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
        if (isString(record.Name)) {
            record.Name = record.Name.substring(0, 80);
        }
        if (this.recordsByKey.hasOwnProperty(key)) {
            for (let field of Object.keys(record)) {
                const value = record[field];
                if (value !== undefined) {
                    this.recordsByKey[key][field] = value;
                }
            }
        } else {
            const type = record?.attributes?.type;
            if (!isString(type) || !sObjectOrder.includes(type)) {
                console.error(record);
                throw Error('Unsupported sobject.');
            }

            this.toUpsert[type].push(record);
            this.recordsByKey[key] = record;
            this.recordsByType[type].push(record);
        }
        return this.recordsByKey[key] as T;
    }

    async commit() {
        for (let sObjectType of sObjectOrder) {
            const records = this.toUpsert[sObjectType];
            if (records && records.length > 0) {
                console.log('Upsert', sObjectType, records.length);
                this.resolveRelationships();
                const toUpsert = records.map((it) => {
                    let rec = {};
                    for (let fieldName of Object.keys(it)) {
                        if (!fieldName.endsWith('__r')) {
                            // @ts-ignore
                            rec[fieldName] = it[fieldName];
                        }
                    }
                    return rec;
                });
                const res = await this.conn.sobject(sObjectType).upsertBulk(toUpsert, 'symbtablesnap__Snapshot_Key__c');
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
            // @ts-ignore
            record[relatedToField.replace('__c', '__r')] = relatedTo;
        }
    }
}

export async function generateSnapshot(context: Context): Promise<void> {
    const saveResult = await context.conn.sobject('symbtablesnap__Symbol_Table_Snapshot__c').create(context.snapshot);
    context.snapshot.Id = saveResult.id!;
    console.log(`Snapshot record created: ${context.snapshot.Id}`);
    console.log('Querying AsyncApexJob to search for scheduled apex classes...');
    await context.markClassesAsEnqueued();
    console.log(`Using Metadata Container with ID ${context.metadataContainerId} to retrieve symbol table.`);
    const orgsNamespace = context.snapshot.symbtablesnap__Org_Namespace_Prefix__c || null;
    await context.targetSelector.queryApexClassMembers(context.metadataContainerId, orgsNamespace, async (members) => {
        await context.apexClassGenerator.generate(members);
    });
    await context.targetSelector.queryApexTriggerMembers(context.metadataContainerId, orgsNamespace, async (members) => {
        await context.apexTriggerGenerator.generate(members);
    });
    context.registerUpsert(context.snapshot);
    await context.commit();
    await updateLookups(context);
}

async function updateLookups(context: Context) {
    console.log('Trying to match and update lookups...');
    context.clear();
    await querySnapshotData(context);
    // const snapshot = context.snapshotData;
    const declaredClasses: Record<string, symbtablesnap__Apex_Class__c> = {};
    const methodsByNames: Record<string, symbtablesnap__Method__c[]> = {};
    for (let apexClass of context.apexClasses()) {
        declaredClasses[apexClass.symbtablesnap__Full_Name__c] = apexClass;
    }
    for (let method of context.methods()) {
        if (!methodsByNames.hasOwnProperty(method.symbtablesnap__Method_Name__c!)) {
            methodsByNames[method.symbtablesnap__Method_Name__c] = [];
        }
        methodsByNames[method.symbtablesnap__Method_Name__c].push(method);
    }
    for (let apexClass of context.apexClasses()) {
        if (
            apexClass.symbtablesnap__Extends_Full_Name__c &&
            declaredClasses.hasOwnProperty(apexClass.symbtablesnap__Extends_Full_Name__c)
        ) {
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
            context.registerRelationship(
                apexClass,
                'symbtablesnap__Top_Level_Class__c',
                declaredClasses[apexClass.symbtablesnap__Top_Level_Full_Name__c]
            );
            context.registerUpsert(apexClass);
        }
    }
    for (let implementation of context.interfaceImplementations()) {
        if (declaredClasses[implementation.symbtablesnap__Implements__c]) {
            context.registerRelationship(
                implementation,
                'symbtablesnap__Implements_Interface__c',
                declaredClasses[implementation.symbtablesnap__Implements__c]
            );
            context.registerUpsert(implementation);
        }
    }
    for (let methodReference of context.methodReferences()) {
        const potentialMethods: symbtablesnap__Method__c[] = methodsByNames[methodReference.symbtablesnap__Referenced_Method_Name__c];
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
                context.registerRelationship(methodReference, 'symbtablesnap__Referenced_Method__c', potentialMethod);
                context.registerUpsert(methodReference);
            }
        }
    }
    await context.commit();
    await updateMethodToMethodReferences(context);
}

async function updateMethodToMethodReferences(context: Context) {
    console.log('Updating method to method references...');
    function findItem(items: ClassItem[], lineNumber: number, type: 'method' | 'property'): Optional<ClassItem> {
        let foundItem: Optional<ClassItem> = undefined;
        for (let i = 0; items && i < items.length; i++) {
            const item = items[i];
            if (item.getLine() < lineNumber && ((type === 'method' && item.isMethod()) || (type === 'property' && item.isProperty()))) {
                foundItem = item;
            } else if (item.getLine() > lineNumber) {
                return foundItem;
            }
        }
        return foundItem;
    }

    const classItemsByEntityIds = getClassItemsByEntityIds(context);
    for (let entityId of Object.keys(classItemsByEntityIds)) {
        const items = classItemsByEntityIds[entityId];
        items.sort(classItemSorter);
    }

    // TODO query:Method_Reference__c => Used_By_Class__c != null => look at references
    // find and populate Used_By_Method__c,

    // TODO in GraphBuilder => addRelationship for Used_By_Method__c to Referenced_Method__c

    for (let methodRef of context.methodReferences()) {
        if (methodRef.symbtablesnap__Used_By_Class__c && methodRef.symbtablesnap__Reference_Line__c) {
            const line = methodRef.symbtablesnap__Reference_Line__c;
            const usedByItems = classItemsByEntityIds[methodRef.symbtablesnap__Used_By_Class__r?.symbtablesnap__Class_ID__c!];
            const usedByMethod = findItem(usedByItems, line, 'method');
            if (usedByMethod) {
                if (methodRef.symbtablesnap__Referenced_Method_Name__c === 'isNotNull') {
                    // console.log(methodRef, usedByMethod.getMethod());
                }
                context.registerRelationship(methodRef, 'symbtablesnap__Used_By_Method__c', usedByMethod.getMethod());
                context.registerUpsert(methodRef);
            }
            // if (methodRef.symbtablesnap__Referenced_Method_Name__c == null) {
            //                    methodRef.Referenced_Method_Name__c = todo
            // }
        }
    }
    await context.commit();
    await updateReferencesScore(context);
}

async function updateReferencesScore(context: Context) {
    console.log('Calculating and updating reference scores...');
    const graph = buildGraph(context);
    for (let apexTrigger of context.apexTriggers()) {
        if (apexTrigger.symbtablesnap__Is_Active__c) {
            graph.getNode(apexTrigger).addToScore(100, 100);
            context.registerUpsert(apexTrigger);
        }
    }
    for (let apexClass of context.apexClasses()) {
        if (apexClass.symbtablesnap__Is_Test__c) {
            graph.getNode(apexClass).addToScore(100, 0.01);
        }
        if (apexClass.symbtablesnap__Access_Modifier__c === 'global' && apexClass.symbtablesnap__Namespace_Prefix__c) {
            graph.getNode(apexClass).addToScore(100, 100);
        }
        context.registerUpsert(apexClass);
    }
    for (let method of context.methods()) {
        if (method.symbtablesnap__Signature__c === 'generate(Id): Id') {
            graph.getNode(method).addToScore(100, 100);
        }
        if (method.symbtablesnap__Is_Test__c) {
            graph.getNode(method).addToScore(100, 0.01);
        }
        if (
            method.symbtablesnap__Class__r!.symbtablesnap__Is_Apex_Job_Enqueued__c &&
            method.symbtablesnap__Method_Name__c === 'execute' &&
            method.symbtablesnap__Signature__c === 'execute(QueueableContext): void'
        ) {
            graph.getNode(method).addToScore(100, 100);
        }
        if (method.symbtablesnap__Access_Modifier__c === 'global' && method.symbtablesnap__Class__r?.symbtablesnap__Namespace_Prefix__c) {
            graph.getNode(method).addToScore(100, 100);
        }
        context.registerUpsert(method);
    }

    // new fields on Method: "Location Line" and "End Location Line" for all constructors+methods+properties.
    // need to check for inner classes (tableDeclaration.location.{line,column}
    // probably comparable(line, column) and sort all constructors+methods+properties from a class including inner classes
    // after sorted: next element's {line, column} is the end position
    // do we need methods from an inner class to be hooked up to the parent class as well?
    // i.e. the list to sort for each class needs to include all method where the class is (symbtablesnap__Class__c or symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__c)

    // new relationships:
    // references[]:{line,column} => map to externalReference:name(+namespace)
    // methods:references[]:{line,column} => map to externalReference:name(+namespace)
    // externalReference:references[]:{line,column} => map to externalReference:name(+namespace)
    // externalReference:methods:references[]:{line,column} => map to externalReference:name(+namespace)

    // propagate rules:
    // trigger => method references, variable references
    // Schedulable
    // method referenced => method references, variable references
    // class referenced => methods that return those classes
    // interface method => method implementations

    // Apex Class score is max(class score, methods score)
    for (let method of context.methods()) {
        const apexClassNode = graph.getNodeByKey(method.symbtablesnap__Class__r!.symbtablesnap__Snapshot_Key__c!);
        const apexClass = apexClassNode.getRecord() as symbtablesnap__Apex_Class__c;
        apexClass.symbtablesnap__Is_Referenced_Score__c = Math.max(
            apexClass.symbtablesnap__Is_Referenced_Score__c!,
            method.symbtablesnap__Is_Referenced_Score__c!
        );
        context.registerUpsert(apexClass);
    }
    await context.commit();
    context.snapshot.symbtablesnap__Is_Latest__c = true;
    context.registerUpsert(context.snapshot);
    await context.commit();
}

async function querySnapshotData(context: Context): Promise<void> {
    context.recordsByKey = {};
    const selector = new Selector(context.conn);
    const snapshotId = context.snapshot.Id!;
    context.recordsByType['symbtablesnap__Apex_Class__c'] = await selector.queryApexClasses(snapshotId);
    context.recordsByType['symbtablesnap__Apex_Trigger__c'] = await selector.queryApexTriggers(snapshotId);
    context.recordsByType['symbtablesnap__Interface_Implementation__c'] = await selector.queryInterfaceImplementations(snapshotId);
    context.recordsByType['symbtablesnap__Method__c'] = await selector.queryMethods(snapshotId);
    context.recordsByType['symbtablesnap__Property__c'] = await selector.queryProperties(snapshotId);
    context.recordsByType['symbtablesnap__Method_Reference__c'] = await selector.queryMethodReferences(snapshotId);
}
